package com.diasec.diasec_backend.controller;

/**
 * [배포·동기화 주의] 운영 서버는 나이스페이(PG) 연동·주문 조회 로직이 포함되어 로컬과 다를 수 있습니다.
 * 로컬 파일로 서버를 덮어쓰지 마세요. OrderMapper.xml 등과 함께 검토 후 병합하세요.
 */

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.server.ResponseStatusException;
import com.diasec.diasec_backend.security.CustomUserDetails;
import com.diasec.diasec_backend.vo.MemberVo;
import com.diasec.diasec_backend.service.MemberService;

import com.diasec.diasec_backend.dao.OrderMapper;
import com.diasec.diasec_backend.service.CartService;
import com.diasec.diasec_backend.service.CreditService;
import com.diasec.diasec_backend.service.OrderService;
import com.diasec.diasec_backend.service.ProductService;
import com.diasec.diasec_backend.util.ImageUtil;
import com.diasec.diasec_backend.vo.CreditVo;
import com.diasec.diasec_backend.vo.OrderItemFileVo;
import com.diasec.diasec_backend.vo.OrderItemsVo;
import com.diasec.diasec_backend.vo.OrderVo;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "${custom.cors.origin}", allowCredentials = "true")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/order")
public class OrderController {
    
    @Value("${file.upload.dir}")
    private String uploadDir;

    @Value("${file.access.url}")
    private String accessUrl;

    private final OrderService orderService;
    private final CartService cartService;
    private final CreditService creditService;
    private final ProductService productService;
    private final MemberService memberService;
    private final ImageUtil imageUtil;
    private final PasswordEncoder passwordEncoder;
    private final OrderMapper orderMapper;
    private final ObjectMapper objectMapper;

    // OrderForm 주문 저장    
    @PostMapping(value = "/insert", consumes = "multipart/form-data")
    public ResponseEntity<?> insertOrder(
        @RequestPart("orderJson") String orderJson,
        @RequestPart(value = "customFrameFiles", required = false) List<MultipartFile> customFrameFiles,
        @RequestPart(value = "customFramePreviewFiles", required = false) List<MultipartFile> customFramePreviewFiles
    ) {
        try {
            OrderVo ordervo = objectMapper.readValue(orderJson, OrderVo.class);

            // 주문 저장 전에 상품 판매량 1 올리기
            // for (int i = 0; i < ordervo.getItems().size(); i++) {
            //     productService.updateProductSales(ordervo.getItems().get(i).getPid());
            // }

            // 맞춤액자 base64 → URL 치환은 OrderService.insertOrder에서 공통 처리

            // 비회원 비밀번호 암호화
            if (ordervo.getGuestPassword() != null && !ordervo.getGuestPassword().isBlank()) {
                String encodedPw = passwordEncoder.encode(ordervo.getGuestPassword());
                ordervo.setGuestPassword(encodedPw);
            }

            orderService.insertOrder(ordervo, customFrameFiles, customFramePreviewFiles);
            boolean isBankTransfer = "무통장입금".equals(ordervo.getPaymentMethod());
            if (!isBankTransfer) {
                orderService.sendAdminOrderPaidSms(ordervo.getOid(), "즉시결제");
            }
            return ResponseEntity.ok(Map.of("success", true,
                                            "oid", ordervo.getOid()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 주문 완료시 유저의 카트 목록 정리
    @PostMapping("/deleteList")
    public  ResponseEntity<?> deleteCartList(@RequestBody Map<String, Object> body) {
        String id = (String) body.get("id");
        List<Integer> cidList = (List<Integer>) body.get("cidList");

        try {
            cartService.deleteCartItems(id, cidList);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 주문내역 조회 리스트 가져오기
    @PostMapping("/list")
    public List<OrderVo> getOrderList(@RequestBody Map<String, String> body) {
        String memberId = resolveLoginMemberId();
        if (memberId == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        
        String id = body.get("id");
        if (!memberId.equals(id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 주문만 조회할 수 있습니다.");
        }

        String startDate = body.get("startDate");
        String endDate = body.get("endDate");
        String status = body.get("status");

        return orderService.selectOrderListWithFilter(id, startDate, endDate, status);
    }

    // 주문내역 상세조회 (개별)
    @GetMapping("detail/{itemId}")
    public ResponseEntity<?> getOrderInfoDetail(
        @PathVariable Long itemId,
        @RequestParam(required = false) String guestPassword
    ) {
        OrderVo order = orderService.selectOrderInfoByItemId(itemId);
        String authError = verifyOrderViewAuth(order, guestPassword);
        if (authError != null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", authError));
        }
        return ResponseEntity.ok(sanitizeOrderForResponse(order));
    }

    // 주문내역 상세조회 (주문별 전체)
    @GetMapping("/detail/oid/{oid}")
    public ResponseEntity<?> getOrderDetail(
        @PathVariable Long oid,
        @RequestParam(required = false) String guestPassword
    ) {
        OrderVo order = orderService.selectOrderByOid(oid);
        String authError = verifyOrderViewAuth(order, guestPassword);
        if (authError != null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", authError));
        }
        return ResponseEntity.ok(sanitizeOrderForResponse(order));
    }

    // 주문내역 전체 취소
    @PostMapping("/cancel")
    public ResponseEntity<?> cancelOrderItem(@RequestBody Map<String, Object> body) {
        try {
            Long oid = Long.parseLong(body.get("oid").toString());
            String id = body.get("id") == null ? null : String.valueOf(body.get("id"));
            int usedCredit = body.get("usedCredit") == null ? 0
                    : Integer.parseInt(String.valueOf(body.get("usedCredit")));

            orderService.cancelAllOrderItems(oid);

            if (usedCredit > 0 && id != null && !"null".equals(id) && !id.isBlank()) {
                CreditVo creditVo = new CreditVo();
                creditVo.setId(id);
                creditVo.setAmount(usedCredit);
                creditVo.setType("적립");
                creditVo.setDescription("주문 취소");
                creditVo.setOid(oid);
                creditService.insertCreditHistory(creditVo);
            }

            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @PostMapping("/cancelRequest")
    public ResponseEntity<?> requestCancelOrder(@RequestBody Map<String, Object> body) {
        Long oid = Long.parseLong(body.get("oid").toString());
        try {
            orderService.requestCancelOrder(oid);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 주문 반품 신청
    @PostMapping(value="/claim", consumes = "multipart/form-data")
    public ResponseEntity<?> claim(
        @RequestParam Long itemId,
        @RequestParam String claimType,
        @RequestParam String reason,
        @RequestParam(required=false) String detail,

        @RequestParam(required=false) String bankName,
        @RequestParam(required=false) String accountNumber,
        @RequestParam(required=false) String accountHolder,

        @RequestPart(required=false) List<MultipartFile> images
    ) {
        Map<String, Object> result = new HashMap<>();
        try {
            OrderItemsVo vo = new OrderItemsVo();
            vo.setItemId(itemId);

            // 상태값 통일
            String status = "반품".equals(claimType) ? "반품신청" : "교환신청";
            vo.setOrderStatus(status);

            vo.setReason(reason);
            vo.setDetail(detail);

            if ("반품".equals(claimType)) {
                vo.setBankName(bankName);
                vo.setAccountNumber(accountNumber);
                vo.setAccountHolder(accountHolder);
            } else {
                vo.setBankName(null);
                vo.setAccountNumber(null);
                vo.setAccountHolder(null);
            }

            boolean success = orderService.processClaim(vo);
            if (!success) {
                return ResponseEntity.ok(Map.of(
                    "success", false,
                    "message", "교환/반품 요청 처리에 실패했습니다."
                ));
            }

            // 이미지 저장(없으면 그냥 통과)
            orderService.saveClaimImages(itemId, images);

            return ResponseEntity.ok(Map.of("success", true));
        }  catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 주문내역 삭제
    @PostMapping("/delete")
    public ResponseEntity<?> deleteOrder(@RequestBody Map<String, Object> body) {
        try {
            Long oid = Long.parseLong(body.get("oid").toString());
            // 관리자 상세는 detail/{itemId} 조회 시 한 줄만 items에 넣으므로,
            // 요청 body의 items만 믿으면 같은 oid의 다른 맞춤액자 이미지가 디스크에 남음 → DB에서 oid 기준 전체 품목으로 삭제
            OrderVo existing = orderService.selectOrderByOid(oid);
            if (existing == null || existing.getItems() == null || existing.getItems().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "message", "주문을 찾을 수 없습니다."));
            }

            for (OrderItemsVo item : existing.getItems()) {
                if (!"customFrames".equals(item.getCategory())) {
                    continue;
                }
                String thumbnail = item.getThumbnail();
                String thumbnailPreview = item.getThumbnailPreview();

                if (thumbnail != null && !thumbnail.isBlank()) {
                    imageUtil.deleteImage(thumbnail);
                }
                if (thumbnailPreview != null && !thumbnailPreview.isBlank()) {
                    imageUtil.deleteImage(thumbnailPreview);
                }
            }

            orderService.deleteOrder(oid);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 비회원 조회
    @PostMapping("/guest-search")
    public ResponseEntity<?> guestSearch(@RequestBody Map<String, String> req) {
        Long oid = Long.valueOf(req.get("oid"));
        String guestPassword = req.get("guestPassword");

        try {
            OrderVo order = orderService.selectOrderByOid(oid);

            if (order == null || order.getGuestPassword() == null) {
                return ResponseEntity.ok(Map.of("success", false, "message", "주문을 찾을 수 없습니다."));
            }

            if (!passwordEncoder.matches(guestPassword, order.getGuestPassword())) {
                return ResponseEntity.ok(Map.of("success", false, "message", "비밀번호가 일치하지 않습니다."));
            }

            return ResponseEntity.ok(Map.of("success", true, "order", sanitizeOrderForResponse(order)));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 비회원 주문 비밀번호 재설정
    @PostMapping("/guest-reset-password")
    public ResponseEntity<?> resetGuestPassword(@RequestBody Map<String, String> req) {
        try {
            Long oid = Long.valueOf(req.get("oid"));
            String phone = req.get("phone");

            // 주문 확인
            OrderVo order = orderService.selectOrderByOid(oid);
            if (order == null || !phone.equals(order.getRecipientPhone())) {
                return ResponseEntity.ok(Map.of("success", false, "message", "주문번호 또는 휴대폰 번호가 일치하지 않습니다."));
            }

            // 임시 비밀번호 생성 (6자리 숫자)
            String newPassword = String.valueOf((int)(Math.random() * 900000) + 100000);

            // 암호화 후 DB 업데이트
            String encodedPw = passwordEncoder.encode(newPassword);
            orderService.updateGuestPassword(oid, encodedPw);

            // 프론트에 전달 (-> 프론트에서 고객 안내 or SMS 발송)
            return ResponseEntity.ok(Map.of("success", true, "newPassword", newPassword));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 맞춤액자 보정정보 수정 (입금대기/결제완료/배송준비중만 허용)
    @PostMapping("/update-retouch")
    public ResponseEntity<?> updateRetouch(@RequestBody Map<String, Object> body) {
        try {
            Long itemId = Long.parseLong(body.get("itemId").toString());
            String guestPassword = body.get("guestPassword") == null ? null : body.get("guestPassword").toString();
            String authError = verifyRetouchDecisionAuth(itemId, guestPassword);
            if (authError != null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("success", false, "message", authError));
            }

            int retouchEnabled = Integer.parseInt(body.get("retouchEnabled").toString());
            String retouchTypes = body.get("retouchTypes") == null ? null : body.get("retouchTypes").toString();
            String retouchNote = body.get("retouchNote") == null ? null : body.get("retouchNote").toString();

            // enabled=0이면 나버지 null  처리
            if (retouchEnabled == 0) {
                retouchTypes = null;
                retouchNote = null;
            }

            boolean success = orderService.updateRetouchInfo(itemId, retouchEnabled, retouchTypes, retouchNote);

            return ResponseEntity.ok(Map.of("success", success));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                    .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    @GetMapping("/admin/count-by-status")
    public ResponseEntity<?> countByStatus() {
        try {
            return ResponseEntity.ok(orderService.selectOrderItemCountsByStatus());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError()
                .body(Map.of("success", false, "message", e.getMessage()));
        }
    }

    // 고객: 승인
    @PostMapping("/retouch/{itemId}/approve")
    public ResponseEntity<?> approveRetouch(
        @PathVariable Long itemId,
        @RequestBody(required = false) Map<String, String> body
    ) {
        String guestPassword = body != null ? body.get("guestPassword") : null;
        String authError = verifyRetouchDecisionAuth(itemId, guestPassword);
        if (authError != null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("success", false, "message", authError));
        }
        orderService.approveRetouch(itemId);
        return ResponseEntity.ok(Map.of("success", true, "itemId", itemId));
    }

    // 고객: 반려
    @PostMapping("/retouch/{itemId}/reject")
    public ResponseEntity<?> rejectRetouch(
        @PathVariable Long itemId,
        @RequestBody Map<String, String> body
    ) {
        String guestPassword = body.get("guestPassword");
        String authError = verifyRetouchDecisionAuth(itemId, guestPassword);
        if (authError != null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of("success", false, "message", authError));
        }
        String feedback = body.getOrDefault("feedback", "");
        orderService.rejectRetouch(itemId, feedback);
        return ResponseEntity.ok(Map.of("success", true, "itemId", itemId));
    }

    private String verifyRetouchDecisionAuth(Long itemId, String guestPassword) {
        Long oid = orderMapper.selectOidByItemId(itemId);
        if (oid == null) return "주문 상품을 찾을 수 없습니다.";

        OrderVo order = orderService.selectOrderByOid(oid);
        return verifyOrderViewAuth(order, guestPassword);
    }
    
    private String verifyOrderViewAuth(OrderVo order, String guestPassword) {
        if (order == null) {
            return "주문을 찾을 수 없습니다.";
        }

        if (isAdminUser()) {
            return null;
        }
        
        String memberId = resolveLoginMemberId();
        if (memberId != null) {
            return memberId.equals(order.getId()) ? null : "본인 주문만 조회할 수 있습니다.";
        }

        if (order.getGuestPassword() == null || order.getGuestPassword().isBlank()) {
            return "로그인이 필요합니다.";
        }
        if (guestPassword == null || guestPassword.isBlank()) {
            return "비회원 조회 비밀번호가 필요합니다.";
        }
        if (!passwordEncoder.matches(guestPassword, order.getGuestPassword())) {
            return "비밀번호가 일치하지 않습니다.";
        }
        return null;
    }

    private boolean isAdminUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
            || "anonymousUser".equals(authentication.getPrincipal())) {
            return false;
        }
        return authentication.getAuthorities().stream()
            .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    private OrderVo sanitizeOrderForResponse(OrderVo order) {
        if (order != null) {
            order.setGuestPassword(null);
        }
        return order;
    }

    private String resolveLoginMemberId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
            || "anonymousUser".equals(authentication.getPrincipal())) {
        return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof CustomUserDetails userDetails) {
            return userDetails.getMember().getId();
        }
        if (principal instanceof OAuth2User oAuth2User) {
            String provider = oAuth2User.getAttribute("provider");
            String providerUid = oAuth2User.getAttribute("providerUid");
            String email = oAuth2User.getAttribute("email");
            MemberVo member = memberService.findByProviderUid(provider, providerUid);
            if (member == null) member = memberService.findWebMemberByEmail(email);
            return member != null ? member.getId() : null;
        }
        return null;
    }

    // 보정 리터치 리스트 (고객)
    @PostMapping("/retouch/list")
    public ResponseEntity<?> myRetouchList(@RequestBody Map<String, String> body) {
        String id = body.get("id");
        return ResponseEntity.ok(Map.of("success", true, "list", orderMapper.selectMyRetouchList(id)));
    }
}