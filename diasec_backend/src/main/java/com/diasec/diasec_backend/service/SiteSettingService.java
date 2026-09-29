package com.diasec.diasec_backend.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.diasec.diasec_backend.dao.OrderMapper;
import com.diasec.diasec_backend.dao.SiteSettingMapper;
import com.diasec.diasec_backend.vo.MainBlogItemVo;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SiteSettingService {
    
    public static final String KEY_SITE_DISCOUNT = "site_discount_percent";
    public static final String KEY_MAIN_HOME_BLOGS = "main_home_blogs";
    public static final String KEY_SOLD_FRAMES_EXTRA = "sold_frames_extra";
    public static final String KEY_SOLD_FRAMES_MEMO = "sold_frames_memo";
    private static final int DEFAULT_DISCOUNT = 20;
    private static final int MAX_SOLD_FRAMES_MEMO = 2000;
    private static final long MAX_SOLD_FRAMES_EXTRA = 9_999_999L;

    private final SiteSettingMapper siteSettingMapper;
    private final OrderMapper orderMapper;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public int getSiteDiscountPercent() {
        String raw = siteSettingMapper.selectValue(KEY_SITE_DISCOUNT);
        if (raw == null || raw.isBlank()) {
            return DEFAULT_DISCOUNT;
        }
        try {
            int p = Integer.parseInt(raw.trim());
            if (p < 0) return 0;
            if (p > 100) return 100;
            return p;
        } catch (NumberFormatException e) {
            return DEFAULT_DISCOUNT;
        }
    }

    @Transactional
    public int updateSiteDiscountPercent(int percent) {
        int safe = Math.max(0, Math.min(100, percent));
        siteSettingMapper.upsertValue(KEY_SITE_DISCOUNT, String.valueOf(safe));
        return safe;
    }

    public long getSoldFramesExtra() {
        String raw = siteSettingMapper.selectValue(KEY_SOLD_FRAMES_EXTRA);
        if (raw == null || raw.isBlank()) return 0L;
        try {
            long n = Long.parseLong(raw.trim());
            if (n < 0) return 0L;
            return Math.min(n, MAX_SOLD_FRAMES_EXTRA);
        } catch (NumberFormatException e) {
            return 0L;
        }
    }

    public String getSoldFramesMemo() {
        String raw = siteSettingMapper.selectValue(KEY_SOLD_FRAMES_MEMO);
        return raw == null ? "" : raw;
    }

    public long getSiteSoldFrameCount() {
        long count = orderMapper.sumSoldFrameQuantity();
        return Math.max(0L, count);
    }

    public long getSoldFrameTotal() {
        return getSiteSoldFrameCount() + getSoldFramesExtra();
    }

    public Map<String, Object> getSoldFrameAdminView() {
        long siteSoldCount = getSiteSoldFrameCount();
        long extraCount = getSoldFramesExtra();
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("siteSoldCount", siteSoldCount);
        body.put("extraCount", extraCount);
        body.put("totalCount", siteSoldCount + extraCount);
        body.put("memo", getSoldFramesMemo());
        return body;
    }

    @Transactional
    public Map<String, Object> updateSoldFramesExtra(long extraCount, String memo) {
        if (extraCount < 0 || extraCount > MAX_SOLD_FRAMES_EXTRA) {
            throw new IllegalArgumentException("추가 수량은 0~9,999,999 사이여야 합니다.");
        }
        String safeMemo = memo == null ? "" : memo.trim();
        if (safeMemo.length() > MAX_SOLD_FRAMES_MEMO) {
            throw new IllegalArgumentException("메모는 2000자 이내로 입력해 주세요.");
        }
        siteSettingMapper.upsertValue(KEY_SOLD_FRAMES_EXTRA, String.valueOf(extraCount));
        siteSettingMapper.upsertValue(KEY_SOLD_FRAMES_MEMO, safeMemo);
        return getSoldFrameAdminView();
    }

    public List<MainBlogItemVo> getMainHomeBlogs() {
        String raw = siteSettingMapper.selectValue(KEY_MAIN_HOME_BLOGS);
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        try {
            List<MainBlogItemVo> list = objectMapper.readValue(
                raw,
                new TypeReference<List<MainBlogItemVo>>() {}
            );
            if (list == null) return List.of();
            return list.stream()
                .filter(item -> item != null && isValidBlogItem(item))
                .toList();
        } catch (Exception e) {
            return List.of();
        }
    }

    @Transactional
    public List<MainBlogItemVo> updateMainHomeBlogs(List<MainBlogItemVo> items) {
        List<MainBlogItemVo> safe = new ArrayList<>();
        if (items != null) {
            for (MainBlogItemVo item : items) {
                if (item == null) continue;
                MainBlogItemVo normalized = normalizeBlogItem(item);
                if (normalized != null) {
                    safe.add(normalized);
                }
            }
        }
        try {
            String json = objectMapper.writeValueAsString(safe);
            siteSettingMapper.upsertValue(KEY_MAIN_HOME_BLOGS, json);
        } catch (Exception e) {
            throw new IllegalArgumentException("블로그 목록 저장에 실패했습니다.", e);
        }
        return safe;
    }

    private boolean isValidBlogItem(MainBlogItemVo item) {
        return item.getTitle() != null && !item.getTitle().isBlank()
            && item.getLinkUrl() != null && !item.getLinkUrl().isBlank()
            && item.getImageUrl() != null && !item.getImageUrl().isBlank();
    }

    private MainBlogItemVo normalizeBlogItem(MainBlogItemVo item) {
        String title = item.getTitle() == null ? "" : item.getTitle().trim();
        String linkUrl = item.getLinkUrl() == null ? "" : item.getLinkUrl().trim();
        String imageUrl = item.getImageUrl() == null ? "" : item.getImageUrl().trim();
        if (title.isEmpty() || linkUrl.isEmpty() || imageUrl.isEmpty()) {
            return null;
        }
        MainBlogItemVo vo = new MainBlogItemVo();
        vo.setTitle(title);
        vo.setLinkUrl(linkUrl);
        vo.setImageUrl(imageUrl);
        return vo;
    }
}
