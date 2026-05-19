package com.diasec.diasec_backend.service;

/**
 * [배포·동기화 주의] 나이스페이 API 승인·취소·가상계좌 핵심 로직입니다. application.properties(nicepay.*)와 세트입니다.
 * 로컬에서 복붙으로 덮어쓰면 운영 결제가 중단될 수 있습니다.
 */

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.diasec.diasec_backend.config.NicepayProperties;
import com.diasec.diasec_backend.util.ImageUtil;
import com.diasec.diasec_backend.vo.OrderVo;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class NicepayService {

    private static final String DRAFT_KEY_PREFIX = "payment:draft:";
    private static final long DRAFT_TTL_MINUTES = 30;
    
    private final NicepayProperties nicepayProperties;
    private final org.springframework.data.redis.core.StringRedisTemplate redisTemplate;
    private final OrderService orderService;
    private final ObjectMapper objectMapper;
    private final ImageUtil imageUtil;
    private final PasswordEncoder passwordEncoder;

    @Value("${custom.cors.origin}")
    private String frontendUrl;

    // 나이스페이 date 변환
    private static final DateTimeFormatter MYSQL_DATETIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final DateTimeFormatter VBANK_EXP_NICEPAY = 
        DateTimeFormatter.ofPattern("uuuu-MM-dd'T'HH:mm:ss.SSSXX");

    private static String toMysqlDateTimeFromNicepayVbankExp(Object raw) {
        if (raw == null) return null;
        String s = String.valueOf(raw).trim();
        if (s.isEmpty()) return null;
        try {
            return OffsetDateTime.parse(s, VBANK_EXP_NICEPAY).format(MYSQL_DATETIME);
        } catch (DateTimeParseException ignored) {
            try {
                return OffsetDateTime.parse(s).format(MYSQL_DATETIME);
            } catch (Exception ignored2) {
                return null;
            }
        }
    }

    public Map<String, Object> requestVBank(OrderVo order) {
        String url = nicepayProperties.getApiUrl() + "/v1/payments";

        String auth = nicepayProperties.getClientKey() + ":" + nicepayProperties.getSecretKey();
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Basic " + encodedAuth);

        Map<String, Object> body = new HashMap<>();
        body.put("amount", order.getFinalPrice());
        body.put("goodsName", buildGoodsName(order));
        String orderId = order.getOrderId() != null && !order.getOrderId().isBlank()
            ? order.getOrderId()
            : (order.getNicepayOrderId() != null && !order.getNicepayOrderId().isBlank()
                ? order.getNicepayOrderId()
                : String.valueOf(order.getOid()));
        body.put("orderId", orderId);        body.put("buyerName", order.getOrdererName());
        body.put("buyerTel", order.getOrdererPhone());
        body.put("buyerEmail", order.getEmail());
        body.put("returnUrl", nicepayProperties.getReturnUrl());
        body.put("webhookUrl", nicepayProperties.getWebhookUrl() != null ? nicepayProperties.getWebhookVbankUrl() : nicepayProperties.getWebhookUrl());
        // body.put("method", "virtual_account");
        
        System.out.println("orderId : " + orderId);

        String expiredAt = LocalDateTime.now()
                .plusDays(7)
                .format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        body.put("vbankExpDate", expiredAt);

        if (order.getReceiptType() != null && order.getReceiptInfo() != null && !order.getReceiptInfo().isBlank()) {
            if ("개인".equals(order.getReceiptType())) {
                body.put("cashReceiptType", "1");
            } else if ("사업자".equals(order.getReceiptType())) {
                body.put("cashReceiptType", "2");
            }
            body.put("cashReceiptNo", order.getReceiptInfo().replaceAll("-", ""));
        }

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        RestTemplate restTemplate = new RestTemplate();
        Map<String, Object> result = restTemplate.postForObject(url, request, Map.class);
        System.out.println("nicepay raw result = " + result);
        return result;
    }

    private String buildGoodsName(OrderVo order) {
        if (order.getItems() == null || order.getItems().isEmpty()) {
            return "주문상품";
        }
        if (order.getItems().size() == 1) {
            return order.getItems().get(0).getTitle();
        }
        return order.getItems().get(0).getTitle() + " 외 " + (order.getItems().size() - 1) + "건";
    }

    // 카드 결제: 임시 저장
    public String saveDraft(OrderVo orderVo) {
        String orderId = UUID.randomUUID().toString().replace("-", "");
        orderVo.getItems().forEach(item -> item.setOrderStatus("결제완료"));
        try {
            String json = objectMapper.writeValueAsString(orderVo);
            redisTemplate.opsForValue().set(DRAFT_KEY_PREFIX + orderId, json, DRAFT_TTL_MINUTES, TimeUnit.MINUTES);
        } catch (Exception e) {
            throw new RuntimeException("결제 준비 저장 실패", e);
        }
        return orderId;
    }

    public OrderVo getDraft(String orderId) {
        String json = redisTemplate.opsForValue().get(DRAFT_KEY_PREFIX + orderId);
        if (json == null) return null;
        try {
            return objectMapper.readValue(json, OrderVo.class);
        } catch (Exception e) {
            return null;
        }
    }

    public void removeDraft(String orderId) {
        redisTemplate.delete(DRAFT_KEY_PREFIX + orderId);
    }

    /** U112 또는 draft null 시, 선행 요청의 insert 커밋 대기 후 oid 재조회 (최대 2회, 간격 400ms) */
    private Long getOidByNicepayOrderIdWithRetry(String orderId) {
        Long oid = orderService.getOidByNicepayOrderId(orderId);
        if (oid != null) return oid;
        try {
            Thread.sleep(400);
            oid = orderService.getOidByNicepayOrderId(orderId);
            if (oid != null) return oid;
            Thread.sleep(400);
            return orderService.getOidByNicepayOrderId(orderId);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return orderService.getOidByNicepayOrderId(orderId);
        }
    }

    private String orderFormFailRedirect(String paymentFail) {
        return frontendUrl + "/orderForm?paymentFail=" + paymentFail;
    }

    private boolean isBcryptHash(String value) {
        if (value == null) return false;
        return value.startsWith("$2a$") || value.startsWith("$2b$") || value.startsWith("$2y$");
    }

    private void encodeGuestPasswordIfNeeded(OrderVo draft) {
        if (draft == null) return;
        String pw = draft.getGuestPassword();
        if (pw == null || pw.isBlank()) return;
        if (isBcryptHash(pw)) return; // 중복 암호화 방지
        draft.setGuestPassword(passwordEncoder.encode(pw));
    }

    // 나이스페이 승인 API (POST /v1/payments/{tid})
    @SuppressWarnings("unchecked")
    public Map<String, Object> approvePayment(String tid, int amount) {
        String url = nicepayProperties.getApiUrl() + "/v1/payments/" + tid;
        String auth = nicepayProperties.getClientKey() + ":" + nicepayProperties.getSecretKey();
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Basic " + encodedAuth);

        Map<String, Object> body = new HashMap<>();
        body.put("amount", amount);
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        RestTemplate restTemplate = new RestTemplate();

        try {
            ResponseEntity<Map> res = restTemplate.postForEntity(url, request, Map.class);
            return res.getBody() != null ? res.getBody() : new HashMap<>();
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            Map<String, Object> error = new HashMap<>();
            error.put("resultCode", "HTTP_" + e.getStatusCode().value());
            error.put("resultMsg", "HTTP error from NICEPAY: " + e.getStatusCode());
            return error;
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("resultCode", "ERROR");
            error.put("resultMsg", e.getMessage());
            return error;
        }
    }

    // 카드 결제 return 처리: 인증 파라미터 검증 -> 승인 API -> 주문 생성 -> 리다이렉트 URL 반환
    public String handleCardReturn(Map<String ,String> params) {
        String authResultCode = params.get("authResultCode");
        String tid = params.get("tid");
        String orderId = params.get("orderId");
        String amountStr = params.get("amount");

        if (orderId == null || orderId.isBlank()) {
            return orderFormFailRedirect("card");
        }
        if (!"0000".equals(authResultCode)) {
            removeDraft(orderId);
            return orderFormFailRedirect("card");
        }
        
        int amount;
        try { 
            amount = Integer.parseInt(amountStr != null ? amountStr : "0");
        } catch (NumberFormatException e) {
            return orderFormFailRedirect("card");
        }

        Map<String, Object> approveResult = approvePayment(tid, amount);
        String resultCode = approveResult != null ? String.valueOf(approveResult.get("resultCode")) : null;
        if (!"0000".equals(resultCode)) {
            // U112: 이미 사용된 OrderId (return 중복 호출 등) → 이미 저장된 주문으로 리다이렉트
            if ("U112".equals(resultCode)) {
                Long oid = getOidByNicepayOrderIdWithRetry(orderId);
                if (oid != null) {
                    return frontendUrl + "/orderComplete?oid=" + oid;
                }
            }
            return orderFormFailRedirect("card");
        }

        OrderVo draft = getDraft(orderId);
        if (draft == null) {
            // Redis draft 소멸됐지만 승인은 이미 됐을 수 있음 (이전 요청에서 처리)
            Long oid = getOidByNicepayOrderIdWithRetry(orderId);
            if (oid != null) {
                return frontendUrl + "/orderComplete?oid=" + oid;
            }
            return orderFormFailRedirect("card");
        }
        draft.setPaymentMethod("카드결제");
        draft.setNicepayTid(tid);
        draft.setNicepayOrderId(orderId);
        draft.setPayMethodCode("CARD");
        if (draft.getItems() != null) {
            draft.getItems().forEach(item -> item.setOrderStatus("결제완료"));
        }

        // 결제 성공 시점: 맞춤액자 tmp URL -> final URL로 커밋
        if (draft.getItems() != null) {
            for (var item : draft.getItems()) {
                if ("customFrames".equals(item.getCategory())) {
                    try {
                        String committed = imageUtil.commitTmpCustomFrameUrl(item.getThumbnail());
                        if (committed == null || committed.isBlank()) {
                            return frontendUrl + "/orderComplete?error=customframes_image_commit_failed";
                        }
                        item.setThumbnail(committed);
                    } catch (Exception e) {
                        return frontendUrl + "/orderComplete?error=customframes_image_commit_failed";
                    }
                }
            }
        } 

        // 비회원 주문조회 비밀번호가 평문 상태로 저장되지 않도록 보정
        encodeGuestPasswordIfNeeded(draft);
        orderService.insertOrder(draft);

        // 카드 결제 완료 알림 SMS
        orderService.sendAdminOrderPaidSms(draft.getOid(), "카드결제");

        removeDraft(orderId);
        return frontendUrl + "/orderComplete?oid=" + draft.getOid();
    }

    // 가상계좌 결제
    public String handleVBankReturn(Map<String, String> params) {
        String authResultCode = params.get("authResultCode");
        String tid = params.get("tid");
        String orderId = params.get("orderId");
        String amountStr = params.get("amount");
    
        if (orderId == null || orderId.isBlank()) {
            return orderFormFailRedirect("vbank");
        }
        if (!"0000".equals(authResultCode)) {
            removeDraft(orderId);
            return orderFormFailRedirect("vbank");
        }
    
        int amount;
        try {
            amount = Integer.parseInt(amountStr != null ? amountStr : "0");
        } catch (NumberFormatException e) {
            return orderFormFailRedirect("vbank");
        }
    
        Map<String, Object> approveResult = approvePayment(tid, amount);

        String resultCode = approveResult != null ? String.valueOf(approveResult.get("resultCode")) : null;
        if (!"0000".equals(resultCode)) {
            if ("U112".equals(resultCode)) {
                Long oid = getOidByNicepayOrderIdWithRetry(orderId);
                if (oid != null) {
                    return frontendUrl + "/orderComplete?oid=" + oid;
                }
            }
            return orderFormFailRedirect("vbank");
        }
    
        // vbank 정보 추출
        Map<String, Object> vbank = approveResult != null ? (Map<String, Object>) approveResult.get("vbank") : null;
    
        OrderVo draft = getDraft(orderId);
        if (draft == null) {
            Long oid = getOidByNicepayOrderIdWithRetry(orderId);
            if (oid != null) {
                return frontendUrl + "/orderComplete?oid=" + oid;
            }
            return orderFormFailRedirect("vbank");
        }
    
        draft.setPaymentMethod("가상계좌");
        draft.setNicepayTid(tid);
        draft.setNicepayOrderId(orderId);
        draft.setPayMethodCode("VBANK");
    
        if (vbank != null) {
            draft.setVbankCode((String) vbank.get("vbankCode"));
            draft.setVbankName((String) vbank.get("vbankName"));
            draft.setVbankAccount((String) vbank.get("vbankNumber"));
            draft.setVbankHolder((String) vbank.get("vbankHolder"));
            draft.setVbankDueDate(toMysqlDateTimeFromNicepayVbankExp(vbank.get("vbankExpDate")));
        }

        draft.setWebhookLastStatus("READY");
    
        if (draft.getItems() != null) {
            draft.getItems().forEach(item -> item.setOrderStatus("입금대기"));
        }

        // 결제 성공 시점: 맞춤액자 tmp URL -> final URL로 커밋
        if (draft.getItems() != null) {
            for (var item: draft.getItems()) {
                if ("customFrames".equals(item.getCategory())) {
                    try {
                        String committed = imageUtil.commitTmpCustomFrameUrl(item.getThumbnail());
                        if (committed == null || committed.isBlank()) {
                            return frontendUrl + "/orderComplete?error=customframes_image_commit_failed";
                        }
                        item.setThumbnail(committed);
                    } catch (Exception e) {
                        return frontendUrl + "/orderComplete?error=customframes_image_commit_failed";
                    }
                }
            }
        }
        
        // 비회원 주문조회 비밀번호가 평문 상태로 저장되지 않도록 보정
        encodeGuestPasswordIfNeeded(draft);
        orderService.insertOrder(draft);

        removeDraft(orderId);
        return frontendUrl + "/orderComplete?oid=" + draft.getOid();
    }

    /**
     * POST /v1/payments/{tid}/cancel — 카드는 계좌 불필요, 가상계좌(입금 후)는 환불 계좌 필수.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> cancelPayment(
            String tid,
            String reason,
            String cancelMerchantOrderId,
            Integer cancelAmt,
            String refundAccount,
            String refundBankCode,
            String refundHolder) {
        Map<String, Object> error = new HashMap<>();
        if (tid == null || tid.isBlank()) {
            error.put("resultCode", "LOCAL");
            error.put("resultMsg", "tid가 없습니다.");
            return error;
        }
        if (cancelMerchantOrderId == null || cancelMerchantOrderId.isBlank()) {
            error.put("resultCode", "LOCAL");
            error.put("resultMsg", "취소용 orderId가 없습니다.");
            return error;
        }
        String url = nicepayProperties.getApiUrl() + "/v1/payments/" + tid + "/cancel";
        String auth = nicepayProperties.getClientKey() + ":" + nicepayProperties.getSecretKey();
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes(StandardCharsets.UTF_8));
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Basic " + encodedAuth);
        Map<String, Object> body = new HashMap<>();
        body.put("reason", reason != null && !reason.isBlank() ? reason : "고객 환불");
        body.put("orderId", cancelMerchantOrderId);
        if (cancelAmt != null && cancelAmt > 0) {
            body.put("cancelAmt", cancelAmt);
        }
        if (refundAccount != null && !refundAccount.isBlank()) {
            body.put("refundAccount", refundAccount.replaceAll("\\D", ""));
        }
        if (refundBankCode != null && !refundBankCode.isBlank()) {
            body.put("refundBankCode", refundBankCode);
        }
        if (refundHolder != null && !refundHolder.isBlank()) {
            body.put("refundHolder", refundHolder.trim());
        }
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        RestTemplate restTemplate = new RestTemplate();
        try {
            ResponseEntity<Map> res = restTemplate.postForEntity(url, request, Map.class);
            return res.getBody() != null ? res.getBody() : error;
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            error.put("resultCode", "HTTP_" + e.getStatusCode().value());
            error.put("resultMsg", "NICEPAY HTTP 오류: " + e.getStatusCode());
            return error;
        } catch (Exception e) {
            error.put("resultCode", "ERROR");
            error.put("resultMsg", e.getMessage());
            return error;
        }
    }
}