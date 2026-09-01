package com.diasec.diasec_backend.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

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
    private static final int DEFAULT_DISCOUNT = 20;

    private final SiteSettingMapper siteSettingMapper;
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
