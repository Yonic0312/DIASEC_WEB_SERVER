package com.diasec.diasec_backend.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.diasec.diasec_backend.service.SiteSettingService;
import com.diasec.diasec_backend.vo.MainBlogItemVo;

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

    /** 공개: 메인에 표시할 판매 액자 수 (사이트 판매 + 관리자 추가분) */
    @GetMapping("/site-setting/sold-frames")
    public ResponseEntity<Map<String, Long>> getSoldFrames() {
        return ResponseEntity.ok(Map.of(
            "totalCount", siteSettingService.getSoldFrameTotal()
        ));
    }

    /** 관리자: 사이트 판매 수량, 외부 추가 수량 메모 */
    @GetMapping("/admin/site-setting/sold-frames")
    public ResponseEntity<Map<String, Object>> getSoldFramesAdmin() {
        return ResponseEntity.ok(siteSettingService.getSoldFrameAdminView());
    }

    /** 관리자: 사이트 외 주문 수량과 메모 저장 */   
    @PostMapping("/admin/site-setting/sold-frames")
    public ResponseEntity<Map<String, Object>> updateSoldFrames(@RequestBody Map<String, Object> body) {
        Object raw = body != null ? body.get("extraCount") : null;
        if (raw == null) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "추가 수량을 입력해 주세요."
            ));
        }
        long extraCount;
        try {
            extraCount = Long.parseLong(String.valueOf(raw).trim());
        } catch (NumberFormatException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", "추가 수량은 숫자로 입력해 주세요."
            ));
        }
        String memo = body.get("memo") == null ? "" : String.valueOf(body.get("memo"));
        try {
            Map<String, Object> saved = siteSettingService.updateSoldFramesExtra(extraCount, memo);
            Map<String, Object> response = new LinkedHashMap<>(saved);
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        }
    }
 
    // 공개: 메인 홈 블로그 목록
    @GetMapping("/site-setting/main-blogs")
    public ResponseEntity<List<MainBlogItemVo>> getMainBlogs() {
        return ResponseEntity.ok(siteSettingService.getMainHomeBlogs());
    }

    // 관리자: 메인 홈 블로그 목록 저장
    @PostMapping("/admin/site-setting/main-blogs")
    public ResponseEntity<Map<String, Object>> updateMainBlogs(@RequestBody Map<String, List<MainBlogItemVo>> body) {
        List<MainBlogItemVo> items = body != null ? body.get("items") : null;
        List<MainBlogItemVo> saved = siteSettingService.updateMainHomeBlogs(items);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "items", saved
        ));
    }
}
