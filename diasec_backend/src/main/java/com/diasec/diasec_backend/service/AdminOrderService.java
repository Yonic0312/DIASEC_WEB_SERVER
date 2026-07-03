package com.diasec.diasec_backend.service;

import java.util.HashMap;

/**
 * [배포·동기화 주의] 환불완료 시 나이스페이 취소 API를 호출합니다. 로컬과 운영이 다를 수 있으니 통째 복붙 주의.
 */

import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.diasec.diasec_backend.dao.AdminOrderMapper;
import com.diasec.diasec_backend.dao.OrderMapper;
import com.diasec.diasec_backend.util.ImageUtil;
import com.diasec.diasec_backend.util.NicepayBankCodeResolver;
import com.diasec.diasec_backend.vo.CreditVo;
import com.diasec.diasec_backend.vo.OrderItemsVo;
import com.diasec.diasec_backend.vo.OrderVo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminOrderService {
    
    private final AdminOrderMapper adminOrderMapper;
    private final OrderMapper orderMapper;
    private final ImageUtil imageUtil;
    private final OrderService orderService;
    private final CreditService creditService;
    private final NicepayService nicepayService;
    private final SolapiService solapiService;
    
    // 상태별 주문 리스트 조회
    public List<OrderItemsVo> getOrderItemsByStatus(String status, String startDate, String endDate, String keyword, String category) {
        return adminOrderMapper.selectOrderItemsByStatus(status, startDate, endDate, keyword, category);
    }

    // 상태 변경
    public boolean updateOrderItemStatus(Long itemId, String orderStatus) {
        return adminOrderMapper.updateOrderItemStatus(itemId, orderStatus) > 0;
    }

    // 상세 정보에서 배송 정보 업데이트
    public boolean updateOrderDetail(Long itemId, String trackingCompany, String trackingNumber,
                                    String bankName, String accountNumber, String accountHolder) {
        return adminOrderMapper.updateOrderDetail(itemId, trackingCompany, trackingNumber, bankName, accountNumber, accountHolder);
    }

    @Transactional
    public Map<String, Object> updateOrderDetailWithNotification(
        Long itemId,
        String trackingCompany,
        String trackingNumber,
        String bankName,
        String accountNumber,
        String accountHolder
    ) {
        boolean success = updateOrderDetail(itemId, trackingCompany, trackingNumber, bankName, accountNumber, accountHolder);
        if (!success) {
            return Map.of("success", false, "smsTried", false, "smsSent", false);
        }

        Map<String, Object> target = adminOrderMapper.selectShippingNotificationTarget(itemId);
        if (target == null || target.isEmpty()) {
            return Map.of(
                "success", true,
                "smsTried", false,
                "smsSent", false,
                "smsMessage", "알림 대상 주문 정보를 찾지 못했습니다."
            );
        }

        String status = valueOf(target.get("orderStatus"));
        if (!"배송중".equals(status) && !"교환배송중".equals(status)) {
            return Map.of("success", true, "smsTried", false, "smsSent", false);
        }

        String to = firstNonBlank(valueOf(target.get("recipientPhone")), valueOf(target.get("ordererPhone")));
        if (to.isBlank()) {
            return Map.of(
                "success", true,
                "smsTried", true,
                "smsSent", false,
                "smsMessage", "수신자 연락처가 없어 배송 알림을 보내지 못했습니다."
            );
        }

        String recipient = valueOf(target.get("recipient"));
        String oid = valueOf(target.get("oid"));
        String tCompany = valueOf(target.get("trackingCompany"));
        String tNumber = valueOf(target.get("trackingNumber"));
        String shipmentLabel = "교환배송중".equals(status) ? "교환 상품이 " : "상품이 ";

        String message = String.format(
            "[DIASEC KOREA] %s님,%n주문하신 %s 발송되었습니다.%n주문번호: %s%n택배사: %s%n운송장: %s%n감사합니다.",
            recipient.isBlank() ? "고객" : recipient,
            shipmentLabel,
            oid,
            tCompany,
            tNumber
        );

        try {
            solapiService.send(to, message);
            return Map.of("success", true, "smsTried", true, "smsSent", true);
        } catch (Exception e) {
            return Map.of(
                "success", true,
                "smsTried", true,
                "smsSent", false,
                "smsMessage", e.getMessage()
            );
        }
    }

    // 보정 프리뷰 업로드 완료 시 고객 안내 문자
    public Map<String, Object> sendRetouchPreviewReadySms(Long itemId) {
        Map<String, Object> target = adminOrderMapper.selectShippingNotificationTarget(itemId);
        if (target == null || target.isEmpty()) {
            return Map.of(
                "smsTried", false,
                "smsSent", false,
                "smsMessage", "알림 대상 주문 정보를 찾지 못했습니다."
            );
        }

        String to = firstNonBlank(valueOf(target.get("recipientPhone")), valueOf(target.get("ordererPhone")));
        if (to.isBlank()) {
            return Map.of(
                "smsTried", true,
                "smsSent", false,
                "smsMessage", "수신자 연락처가 없어 안내 문자를 보내지 못했습니다."
            );
        }

        String memberId = valueOf(target.get("memberId"));
        boolean isMember = !memberId.isBlank();
        String message = isMember ? RETOUCH_PREVIEW_SMS_MEMBER : RETOUCH_PREVIEW_SMS_GUEST;

        try {
            solapiService.send(to, message);
            return Map.of(
                "smsTried", true,
                "smsSent", true,
                "smsRecipientType", isMember ? "MEMBER" : "GUEST"
            );
        } catch (Exception e) {
            return Map.of(
                "smsTried", true,
                "smsSent", false,
                "smsMessage", e.getMessage() != null ? e.getMessage() : "문자 발송 실패"
            );
        }
    }

    private static final String RETOUCH_PREVIEW_SMS_MEMBER =
        "[DIASEC KOREA]\n\n"
        + "요청하신 이미지 보정이 완료되었습니다.\n\n"
        + "마이페이지 > 보정내역 조회에서 보정 결과를 확인해 주시고,\n"
        + "승인해 주시면 제작을 진행하겠습니다.\n\n"
        + "감사합니다.";

    private static final String RETOUCH_PREVIEW_SMS_GUEST =
        "[DIASEC KOREA]\n\n"
        + "요청하신 이미지 보정이 완료되었습니다.\n\n"
        + "로그인 > 비회원 주문조회에서 보정 결과를 확인해 주시고,\n"
        + "승인해 주시면 제작을 진행하겠습니다.\n\n"
        + "감사합니다.";

    private String valueOf(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private String firstNonBlank(String... values) {
        if (values == null) return "";
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return "";
    }

    // 리스 정보 수정
    public void updateLeasePeriod(Long itemId, String leaseStart, String leaseEnd) {
        adminOrderMapper.updateLeasePeriod(itemId, leaseStart, leaseEnd);
    }

    // 어드민페이지 맞춤액자 이미지 삭제
    public boolean deleteCustomImage(Long itemId) {
        // itemId로 thumbnail 조회
        String thumbnail = adminOrderMapper.selectThumbnailByItemId(itemId);

        // thumbnail이 없으면 이미 삭제된 상태로 처리
        if (thumbnail == null || thumbnail.isBlank()) {
            // DB도 확실히 NULL로 맞춰주고 true 반환 (멱등)
            adminOrderMapper.clearThumbnail(itemId);
            return true;
        }

        // 실제 파일 삭제
        imageUtil.deleteImage(thumbnail);

        //  DB thumbnail Null 처리
         return adminOrderMapper.clearThumbnail(itemId) > 0;
    }

    @Transactional
    public Map<String, Object> updateStatusWithSideEffects(Long itemId, String newStatus, String id, int usedCredit, Long oid) {
        
        if ("환불완료".equals(newStatus) && oid != null) {
            Map<String, Object> pgBlock = tryNicepayRefundBeforeRefundComplete(itemId, oid);
            if (pgBlock != null) {
                return pgBlock;
            }
        }

        boolean success = updateOrderItemStatus(itemId, newStatus);
        if (!success) return Map.of("success", false);

        int deletedCustomFrameOriginal = 0;

        // 맞춤액자: 배송완료 시 원본(고해상) 파일 삭제 + 배송완료 시각 기록(썸네일 30일 자동삭제 기준)
        if ("배송완료".equals(newStatus)) {
            OrderItemsVo row = orderMapper.selectOrderItemById(itemId);
            if (row != null && "customFrames".equals(row.getCategory())) {
                adminOrderMapper.updateCustomFrameDeliveredAtIfNull(itemId);
                String th = row.getThumbnail();
                if (th != null && !th.isBlank()) {
                    imageUtil.deleteImage(th);
                    if (adminOrderMapper.clearThumbnail(itemId) > 0) {
                        deletedCustomFrameOriginal = 1;
                    }
                }
            }
        }

        if ("결제완료".equals(newStatus) && oid != null) {
            orderService.sendAdminOrderPaidSms(oid, "입금확인");
        }

        int refundedAmount = 0;
        int deletedClaimFiles = 0;

        // 완료 상태에서 클레임 이미지 삭제
        if ("교환완료".equals(newStatus) || "환불완료".equals(newStatus)) {
            deletedClaimFiles = orderService.deleteClaimFiles(itemId);
        }

        // 취소/환불완료일때 사용 적립금 반환 (중복 반환 방지)
        if (("환불완료".equals(newStatus) || "취소".equals(newStatus)) 
            && usedCredit > 0 && id != null && oid != null) {
            int updated = adminOrderMapper.markCreditRefundedIfNotYet(itemId);

            if (updated == 1) {
                CreditVo creditVo = new CreditVo();
                creditVo.setId(id);
                creditVo.setAmount(usedCredit);
                creditVo.setType("적립");
                creditVo.setDescription(newStatus);
                creditVo.setOid(oid);
                creditService.insertCreditHistory(creditVo);
                refundedAmount = usedCredit;
            }
        }

        Map<String, Object> out = new HashMap<>();
        out.put("success", true);
        out.put("refundedAmount", refundedAmount);
        out.put("deletedClaimFiles", deletedClaimFiles);
        out.put("deletedCustomFrameOriginal", deletedCustomFrameOriginal);
        return out;
    }

    // 맞춤액자 150px 썸네일만 삭제 (파일 + DB)
    @Transactional
    public boolean deleteCustomThumbnailPreview(Long itemId) {
        OrderItemsVo row = orderMapper.selectOrderItemById(itemId);
        if (row == null || !"customFrames".equals(row.getCategory())) {
            return false;
        }
        String preview = row.getThumbnailPreview();
        if (preview == null || preview.isBlank()) {
            orderMapper.clearThumbnailPreview(itemId);
            return true;
        }
        imageUtil.deleteImage(preview);
        return orderMapper.clearThumbnailPreview(itemId) > 0;
    }

    /**
     * 환불완료 직전 나이스페이 취소·환불. 카드는 계좌 없음, 가상계좌는 order_items 환불 계좌 필요.
     * tid 없으면 PG 생략. null 반환 = 진행 OK, Map 반환 = 실패 응답.
     */
    private Map<String, Object> tryNicepayRefundBeforeRefundComplete(Long itemId, Long oid) {
        OrderVo order = orderService.selectOrderByOid(oid);
        if (order == null || order.getItems() == null) {
            return Map.of("success", false, "message", "주문 정보를 찾을 수 없습니다.");
        }
        OrderItemsVo line = order.getItems().stream()
                .filter(i -> Objects.equals(i.getItemId(), itemId))
                .findFirst()
                .orElse(null);
        if (line == null) {
            return Map.of("success", false, "message", "해당 주문 상품을 찾을 수 없습니다.");
        }
        if ("환불완료".equals(line.getOrderStatus())) {
            return null;
        }
        String tid = order.getNicepayTid();
        String merchantOrderId = order.getNicepayOrderId();
        if (tid == null || tid.isBlank()) {
            return null;
        }
        if (merchantOrderId == null || merchantOrderId.isBlank()) {
            return Map.of("success", false, "message", "나이스페이 주문번호(nicepay_order_id)가 없어 PG 환불을 할 수 없습니다.");
        }
        String pm = order.getPaymentMethod() != null ? order.getPaymentMethod() : "";
        boolean isVbank = "가상계좌".equals(pm);
        String refundAccount = null;
        String refundBankCode = null;
        String refundHolder = null;
        if (isVbank) {
            if (line.getAccountNumber() == null || line.getAccountNumber().isBlank()
                    || line.getBankName() == null || line.getBankName().isBlank()
                    || line.getAccountHolder() == null || line.getAccountHolder().isBlank()) {
                return Map.of("success", false,
                        "message", "가상계좌 PG 환불: 환불 계좌(은행·계좌·예금주)가 order_items에 있어야 합니다.");
            }
            refundAccount = line.getAccountNumber().replaceAll("\\D", "");
            refundHolder = line.getAccountHolder().trim();
            refundBankCode = NicepayBankCodeResolver.toCode(line.getBankName().trim());
            if (refundBankCode == null) {
                return Map.of("success", false,
                        "message", "환불 은행명을 코드로 바꿀 수 없습니다: " + line.getBankName()
                                + " (예: 국민은행, 신한은행 또는 3자리 코드)");
            }
        }
        int lineCount = order.getItems().size();
        Integer cancelAmt = (lineCount > 1) ? line.getPrice() * line.getQuantity() : null;
        String cancelOrderId = (cancelAmt != null)
                ? merchantOrderId + "-R-" + itemId
                : merchantOrderId;
        if (cancelOrderId.length() > 64) {
            cancelOrderId = cancelOrderId.substring(0, 64);
        }
        Map<String, Object> res = nicepayService.cancelPayment(
                tid,
                "고객 반품 환불",
                cancelOrderId,
                cancelAmt,
                refundAccount,
                refundBankCode,
                refundHolder);
        String rc = res != null ? String.valueOf(res.get("resultCode")) : "";
        if (!"0000".equals(rc)) {
            String msg = res != null && res.get("resultMsg") != null
                    ? String.valueOf(res.get("resultMsg"))
                    : "알 수 없는 오류";
            return Map.of("success", false, "message", "나이스페이 취소·환불 실패: " + msg + " (코드: " + rc + ")");
        }
        return null;
    }
}
