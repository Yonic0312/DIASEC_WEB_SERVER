package com.diasec.diasec_backend.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.diasec.diasec_backend.service.SiteSettingService;

import lombok.RequiredArgsConstructor;

@CrossOrigin(origins = "${custom.cors.origin}", allowCredentials = "true")
@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
public class SiteSettingController {
    
    private final SiteSettingService siteSettingService;

    // 공개: 사이트 기본 할인율
    @GetMapping("/site-setting/discount")
    public ResponseEntity<Map<String, Integer>> getDiscount() {
        return ResponseEntity.ok(Map.of(
            "siteDiscountPercent", siteSettingService.getSiteDiscountPercent()
        ));
    }

    // 관리자: 사이트 기본 할인율 저장
    @PostMapping("/admin/site-setting/discount")
    public ResponseEntity<Map<String, Object>> updateDiscount(@RequestBody Map<String, Object> body) {
        Object raw = body.get("siteDiscountPercent");
        if (raw == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "siteDiscountPercent가 필요합니다."
            ));
        }
        int percent;
        try {
            percent = Integer.parseInt(String.valueOf(raw).trim());
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "할인율은 숫자로 입력해 주세요."
            ));
        }
        if (percent < 0 || percent > 100) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "할인율은 0~100 사이여야 합니다"
            ));
        }

        int saved = siteSettingService.updateSiteDiscountPercent(percent);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "siteDiscountPercent", saved
        ));
    }

}
