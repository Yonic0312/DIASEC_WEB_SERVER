package com.diasec.diasec_backend.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.diasec.diasec_backend.service.SolapiService;
import com.diasec.diasec_backend.vo.SmsVo;

import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;

@RestController
@RequestMapping("/api/sms")
public class SmsController {
    
    private final SolapiService solapiService;

    @Autowired
    public SmsController(SolapiService solapiService) {
        this.solapiService = solapiService;
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendOrVerify(@RequestBody SmsVo req) {
        try {
            String type = req.getType() == null ? "send" : req.getType();

            if ("send".equalsIgnoreCase(type)) {
                solapiService.sendAuthCode(req.getTo());
                return ResponseEntity.ok(Map.of("ok", true));
            }

            if ("verify".equalsIgnoreCase(type)) {
                boolean ok = solapiService.verifyAuthCode(req.getTo(), req.getCode());
                if (!ok) return ResponseEntity.badRequest().body(Map.of("ok", false, "msg", "인증번호가 올바르지 않습니다."));
                return ResponseEntity.ok(Map.of("ok", true));
            }

            return ResponseEntity.badRequest().body(Map.of("ok", false, "msg", "type은 send 또는 verify 여야 합니다."));
        } catch (SolapiService.SmsRateLimitException e) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(Map.of(
                    "ok", false,
                    "msg", e.getMessage(),
                    "retryAfterSec", e.getRetryAfterSec()
                ));
        } catch ( Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("ok", false, "msg", e.getMessage()));
        }
        
    }

}
