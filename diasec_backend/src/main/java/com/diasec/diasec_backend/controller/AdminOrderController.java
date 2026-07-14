package com.diasec.diasec_backend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.diasec.diasec_backend.dao.OrderMapper;
import com.diasec.diasec_backend.service.AdminOrderService;
import com.diasec.diasec_backend.service.OrderService;
import com.diasec.diasec_backend.vo.OrderItemsVo;
import com.diasec.diasec_backend.vo.OrderVo;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "${custom.cors.origin}", allowCredentials = "true")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/admin")
public class AdminOrderController {
    
    private final AdminOrderService adminOrderService;
    private final OrderService orderService;
    private final OrderMapper orderMapper;

    // 주문 상태 목록 가져오기
    @PostMapping("/orders")
    public List<OrderItemsVo> getOrdersByStatus(@RequestBody Map<String, String> request) {
        String status = request.get("status");
        String startDate = request.get("startDate");
        String endDate = request.get("endDate");
        String keyword = request.get("keyword");
        String category = request.get("category");
        return adminOrderService.getOrderItemsByStatus(status, startDate, endDate, keyword, category);
    }

    // 목록에서 진행상태 업데이트
    @PostMapping("/order/update-status")
    public Map<String, Object> updateStatus(@RequestBody Map<String, Object> request) {
        Object itemIdObj = request.get("itemId");
        Object statusObj = request.get("orderStatus");
        if (statusObj == null) {
            statusObj = request.get("newStatus");
        }

        if (itemIdObj == null || statusObj == null) {
            return Map.of(
                "success", false,
                "message", "필수값 누락: itemId 또는 newStatus",
                "receivedKeys", request.keySet()
            );
        }
        
        Long itemId = Long.valueOf(String.valueOf(itemIdObj));
        String newStatus = String.valueOf(statusObj);

        String id = request.get("id") == null ? null : String.valueOf(request.get("id"));
        int usedCredit = request.get("usedCredit") == null ? 0 : Integer.valueOf(String.valueOf(request.get("usedCredit")));
        Long oid = request.get("oid") == null ? null : Long.valueOf(String.valueOf(request.get("oid")));
        // Order Detail: skipPgRefund=true -> PG(나이스페이) 환불 생략, 적립금만 반환
        boolean skipPgRefund = Boolean.parseBoolean(String.valueOf(request.getOrDefault("skipPgRefund", false)));

        Map<String, Object> result = adminOrderService.updateStatusWithSideEffects(
            itemId, newStatus, id, usedCredit, oid, skipPgRefund);
        if (Boolean.FALSE.equals(result.get("success"))) {
            System.err.println("[AdminOrderController.updateStatus] failed itemId=" + itemId
                + " oid=" + oid + " newStatus=" + newStatus + " => " + result);
        }
        return result;
    }

    // 상세 정보에서 배송 정보 업데이트
    @PostMapping("/order/update-detail")
    public Map<String, Object> updateOrderDetail(@RequestBody Map<String, Object> request) {
        Long itemId = Long.valueOf(request.get("itemId").toString());
        String trackingCompany = (String) request.get("trackingCompany");
        String trackingNumber = (String) request.get("trackingNumber");

        // 환불 정보는 optional
        String bankName = (String) request.getOrDefault("bankName", null);
        String accountNubmer = (String) request.getOrDefault("accountNubmer", null);
        String accountHolder = (String) request.getOrDefault("accountHolder", null);

        return adminOrderService.updateOrderDetailWithNotification(
            itemId, trackingCompany, trackingNumber, bankName, accountNubmer, accountHolder
        );
    }

    /** 관리자: 배송지·주문자 연락처 등 orders 정보 수정 */
    @PostMapping("/order/update-shipping")
    public Map<String, Object> updateOrderShipping(@RequestBody Map<String, Object> body) {
        try {
            Long itemId = Long.valueOf(String.valueOf(body.get("itemId")));
            OrderVo patch = new OrderVo();
            patch.setOrdererName(strParam(body.get("ordererName")));
            patch.setOrdererPhone(strParam(body.get("ordererPhone")));
            patch.setEmail(strParam(body.get("email")));
            patch.setRecipient(strParam(body.get("recipient")));
            patch.setRecipientPhone(strParam(body.get("recipientPhone")));
            patch.setPostcode(strParam(body.get("postcode")));
            patch.setAddress(strParam(body.get("address")));
            patch.setDetailAddress(strParam(body.get("detailAddress")));
            patch.setDeliveryMessage(strParam(body.get("deliveryMessage")));
            patch.setBuyerRequest(strParam(body.get("buyerRequest")));

            boolean ok = orderService.updateOrderShippingByItemId(itemId, patch);
            if (!ok) {
                return Map.of("success", false, "message", "주문을 찾을 수 없거나 저장에 실패했습니다.");
            }
            return Map.of("success", true, "message", "");
        } catch (Exception e) {
            e.printStackTrace();
            return Map.of("success", false, "message", e.getMessage() != null ? e.getMessage() : "오류");
        }
    }

    private static String strParam(Object o) {
        return o == null ? "" : String.valueOf(o).trim();
    }

    // 리스정보 수정
    @PostMapping("/order/update-lease-period")
    public ResponseEntity<?> updateLeasePeriod(@RequestBody Map<String, Object> body) {
        try {
            Long itemId = Long.parseLong(body.get("itemId").toString());
            String leaseStart = (String) body.get("leaseStart");
            String leaseEnd = (String) body.get("leaseEnd");

            adminOrderService.updateLeasePeriod(itemId, leaseStart, leaseEnd);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/order/delete-custom-image")
    public ResponseEntity<?> deleteCustomImage(@RequestBody Map<String, Object> body) {
        try {
            Long itemId = Long.valueOf(body.get("itemId").toString());

            boolean success = adminOrderService.deleteCustomImage(itemId);

            return ResponseEntity.ok(Map.of("success", success));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    /** 맞춤액자 150px 썸네일만 삭제 */
    @PostMapping("/order/delete-custom-thumbnail")
    public ResponseEntity<?> deleteCustomThumbnailPreview(@RequestBody Map<String, Object> body) {
        try {
            Long itemId = Long.valueOf(body.get("itemId").toString());
            boolean success = adminOrderService.deleteCustomThumbnailPreview(itemId);
            return ResponseEntity.ok(Map.of("success", success));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/order/delete-claim-files")
    public ResponseEntity<?> deleteClaimFiles(@RequestBody Map<String, Object> body) {
        try {
            Long itemId = Long.parseLong(body.get("itemId").toString());
            int deleted = orderService.deleteClaimFiles(itemId);
            return ResponseEntity.ok(Map.of("success", true, "deleted", deleted));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 보정 프리뷰 업로드
    // @PostMapping("/order-items/{itemId}/retouch/preview")
    // public Map<String, Object> uploadRetouchPreview(
    //     @PathVariable Long itemId,
    //     @RequestParam("file") MultipartFile file
    // ) throws Exception {

    //     if (file == null || file.isEmpty()) {
    //         throw new IllegalArgumentException("파일이 없습니다.");
    //     }

    //     // (선택) 이미지 확장자/타입 제한
    //     String ct = file.getContentType();
    //     if (ct == null || !(ct.startsWith("image/"))) {
    //         throw new IllegalArgumentException("이미지 파일만 업로드 가능합니다.");
    //     }

    //     String url = orderService.uploadRetouchPreview(itemId, file);

    //     return Map.of(
    //         "ok", true,
    //         "itemId", itemId,
    //         "fileUrl", url
    //     );
    // }

    @PostMapping("/retouch/list")    
    public ResponseEntity<?> adminRetouchList(@RequestBody Map<String, String> body) {
        String startDate = body.get("startDate");
        String endDate = body.get("endDate");
        String keyword = body.get("keyword");
        String status = body.get("status");
        return ResponseEntity.ok(Map.of(
            "success", true,
            "list", orderMapper.selectAdminRetouchList(startDate, endDate, keyword, status)
        ));
    }

    @PostMapping(value = "/order/retouch/preview-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadRetouchPreview(
        @RequestParam("itemId") Long itemId,
        @RequestPart("file") MultipartFile file
    ) {
        Map<String, Object> result = new HashMap<>();
        try {
            String url = orderService.uploadRetouchPreview(itemId, file);
            Map<String, Object> smsResult = adminOrderService.sendRetouchPreviewReadySms(itemId);
            result.put("success", true);
            result.put("fileUrl", url);
            result.put("previewStatus", "WAITING_CUSTOMER");
            result.putAll(smsResult);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(result);
        }
    }

    @PostMapping("/order/retouch/preview-delete")
    public ResponseEntity<?> deleteRetouchPreview(@RequestBody Map<String, Object> body) {
        try {
            Long itemId = Long.valueOf(String.valueOf(body.get("itemId")));
            orderService.deleteRetouchPreview(itemId);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/order/retouch/approve")
    public ResponseEntity<?> adminApproveRetouch(@RequestBody Map<String, Object> body) {
        try {
            Long itemId = Long.valueOf(String.valueOf(body.get("itemId")));
            orderService.adminApproveRetouch(itemId);
            return ResponseEntity.ok(Map.of("success", true, "itemId", itemId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/order/retouch/clear-request")
    public ResponseEntity<?> clearRetouchRequest(@RequestBody Map<String, Object> body) {
        try {
            Long itemId = Long.valueOf(String.valueOf(body.get("itemId")));
            orderService.clearRetouchRequest(itemId);
            return ResponseEntity.ok(Map.of("success", true, "itemId", itemId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", e.getMessage()));
        }
    }
}
