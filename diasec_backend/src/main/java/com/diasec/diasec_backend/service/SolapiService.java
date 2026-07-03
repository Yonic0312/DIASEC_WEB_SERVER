package com.diasec.diasec_backend.service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class SolapiService {
    
    @Value("${solapi.apiKey}")
    private String apiKey;

    @Value("${solapi.apiSecret}")
    private String apiSecret;

    @Value("${solapi.from}")
    private String from;

    private final RestTemplate restTemplate = new RestTemplate();

    public static class SmsRateLimitException extends RuntimeException {
        private final long retryAfterSec;

        public SmsRateLimitException(String message, long retryAfterSec) {
            super(message);
            this.retryAfterSec = retryAfterSec;
        }

        public long getRetryAfterSec() {
            return retryAfterSec;
        }
    }

    private static class CodeInfo {
        String code;
        long expireAt;
        boolean verified;
        CodeInfo(String code, long expireAt) {
            this.code = code;
            this.expireAt = expireAt;
            this.verified = false;
        }
    }
    private final ConcurrentHashMap<String, CodeInfo> store = new ConcurrentHashMap<>();
    private static class SendRateInfo {
        long lastSentAt;
        ArrayDeque<Long> sentAtMs = new ArrayDeque<>();
    }
    private final ConcurrentHashMap<String, SendRateInfo> sendRateStore = new ConcurrentHashMap<>();

    private static final long EXPIRE_MS = 5 * 60 * 1000; // 5분
    private static final long MIN_SEND_INTERVAL_MS = 60 * 1000; // 같은 번호 최소 60초 간격
    private static final long WINDOW_MS = 10 * 60 * 1000; // 10분 윈도우
    private static final int MAX_SEND_PER_WINDOW = 3; // 10분 내 최대 3회

    public void sendAuthCode(String to) {
        String phone = normalizePhone(to);
        // 요청 제한 해제: 회원가입/회원수정 모두 SMS 발송 제한 없이 처리
        // applySendRateLimit(phone);

        String code = String.format("%06d", ThreadLocalRandom.current().nextInt(0, 1000000));
        long expireAt = System.currentTimeMillis() + EXPIRE_MS;

        store.put(phone, new CodeInfo(code, expireAt));

        String text = "[DIASEC KOREA] 인증번호는 " + code + " 입니다 (5분 이내 입력)" ;
        send(phone, text);
    }

    private void applySendRateLimit(String phone) {
        if (phone == null || phone.isBlank()) {
            throw new IllegalArgumentException("휴대폰 번호가 비어 있습니다.");
        }

        final long now = System.currentTimeMillis();
        SendRateInfo info = sendRateStore.computeIfAbsent(phone, k -> new SendRateInfo());

        synchronized (info) {
            if (info.lastSentAt > 0) {
                long elapsed = now - info.lastSentAt;
                if (elapsed < MIN_SEND_INTERVAL_MS) {
                    long retrySec = (long) Math.ceil((MIN_SEND_INTERVAL_MS - elapsed) / 1000.0);
                    throw new SmsRateLimitException("인증번호는 60초마다 재요청할 수 있습니다.", retrySec);
                }
            }

            while (!info.sentAtMs.isEmpty() && now - info.sentAtMs.peekFirst() > WINDOW_MS) {
                info.sentAtMs.pollFirst();
            }
            if (info.sentAtMs.size() >= MAX_SEND_PER_WINDOW) {
                long oldest = info.sentAtMs.peekFirst();
                long retrySec = (long) Math.ceil((WINDOW_MS - (now - oldest)) / 1000.0);
                throw new SmsRateLimitException("인증번호 요청 3회 초과로 최대 10분간 제한됩니다.", retrySec);
            }

            info.lastSentAt = now;
            info.sentAtMs.addLast(now);
        }
    }

    // 2. 인증번호 검증
    public boolean verifyAuthCode(String to, String inputCode) {
        String phone = normalizePhone(to);
        CodeInfo info = store.get(phone);
        if (info == null) return false;
        if (System.currentTimeMillis() > info.expireAt) {
            store.remove(phone);
            return false;
        }
        if (inputCode == null) return false;

        boolean ok = info.code.equals(inputCode.trim());
        if (ok) info.verified = true;
        return ok;
    }

    // 3. 회원가입시 최종 검증용
    public boolean isVerified(String to) {
        String phone = normalizePhone(to);
        CodeInfo info = store.get(phone);
        if (info == null) return false;
        if (System.currentTimeMillis() > info.expireAt) {
            store.remove(phone);
            return false;
        }
        return info.verified;
    }

    public void send(String to, String text) {
        // 인증 헤더 만들기
        String path = "/messages/v4/send";

        String date = Instant.now().toString();
        String salt = UUID.randomUUID().toString().replace("-", "");

        String signature = makeSignature(date, salt);

        Map<String, Object> body = new HashMap<>();
        Map<String, Object> message = new HashMap<>();
        message.put("to", normalizePhone(to));
        message.put("from", from);
        message.put("text", text);
        body.put("message", message);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "HMAC-SHA256 apiKey=" + apiKey
            + ", date=" + date
            + ", salt=" + salt
            + ", signature=" + signature);

        // 호출
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        String url = "https://api.solapi.com" + path;

        ResponseEntity<String> res = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

        if (!res.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Solapi send failed: " + res.getBody());
        }
    }

    private String makeSignature(String date, String salt) {
        String data = date + salt;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(apiSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));

            StringBuilder sb = new StringBuilder(rawHmac.length * 2);
            for (byte b : rawHmac) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException("Hmac error", e);
        }
    }

    private String normalizePhone(String p) {
        if (p == null) return "";
        return p.replaceAll("[^0-9]", "");
    }
}
