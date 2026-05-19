package com.diasec.diasec_backend.controller;

import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.diasec.diasec_backend.service.OrderService;

import lombok.RequiredArgsConstructor;

/**
 * [배포·동기화 주의] 나이스페이 웹훅·승인 콜백용 컨트롤러입니다. 로컬 워크트리에 없을 수 있으며, 운영 전용 설정과 짝입니다.
 * 로컬에서 복사한 다른 컨트롤러로 덮어쓰거나 이 파일을 무시하면 결제 알림이 동작하지 않습니다.
 */
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/payment/nicepay")
public class NicepayWebhookController {

    private final OrderService orderService;

    @GetMapping("/check")
    public ResponseEntity<String> check() {
        return ResponseEntity.ok("nicepay-check-ok");
    }

    @GetMapping("/webhook/vbank")
    public ResponseEntity<String> webhookVbankGet() {
        return ResponseEntity.ok("OK");
    }

    @PostMapping("/webhook/vbank")
    public ResponseEntity<String> webhookVbank(@RequestBody Map<String, Object> payload) {
        try {
            // 1) 필드 꺼내기
            String resultCode = (String) payload.get("resultCode");
            String payMethod = (String) payload.get("payMethod");
            String status = (String) payload.get("status");

            String orderId = (String) payload.get("orderId");
            String tid = (String) payload.get("tid");
            String ediDate = (String)payload.get("ediDate");
            String signature = (String) payload.get("signature");

            Number amountNum = (Number) payload.get("amount");
            int amount = amountNum == null ? 0 : amountNum.intValue();

            // 2) 조건 필터: paid일 때만 처리
            if (!"0000".equals(resultCode) || !"vbank".equals(payMethod) || !"paid".equals(status)) {
                System.out.println("[VBANK] Not paid yet -> skip update. | status = " + status);
                return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body("OK");
            }

            System.out.println("\n========== [VBANK WEBHOOK] ==========");
            System.out.println("[VBANK] resultCode=" + resultCode);
            System.out.println("[VBANK] payMethod=" + payMethod);
            System.out.println("[VBANK] status=" + status);
            System.out.println("[VBANK] orderId=" + orderId);
            System.out.println("[VBANK] tid=" + tid);
            System.out.println("[VBANK] amount=" + amount);
            System.out.println("[VBANK] ediDate=" + ediDate);
            System.out.println("[VBANK] signature=" + signature);
            System.out.println("====================================\n");

            // 3) signature 검증(TODO: nicepay signature 검증 로직 추가 권장)
            
            // 4) oid 조회 + 상태 업데이트
            Long oid = orderService.getOidByNicepayOrderId(orderId);
            System.out.println("[VBANK] matched oid=" + oid);
            
            if (oid != null) {
                System.out.println("[VBANK] updating order_items -> 결제완료");
                orderService.markOrderPaid(oid);

                // 가상결제 입금 확인 알림 SMS
                orderService.sendAdminOrderPaidSms(oid, "가상계좌입금확인");
            }

            // 5) 응답
            return ResponseEntity.ok()
                .contentType(MediaType.TEXT_HTML)
                .body("OK");
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok().contentType(MediaType.TEXT_HTML).body("FAIL");
        }
    }
}