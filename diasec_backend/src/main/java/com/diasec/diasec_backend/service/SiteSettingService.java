package com.diasec.diasec_backend.service;

import org.springframework.stereotype.Service;

import com.diasec.diasec_backend.dao.SiteSettingMapper;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SiteSettingService {
    
    public static final String KEY_SITE_DISCOUNT = "site_discount_percent";
    private static final int DEFAULT_DISCOUNT = 20;

    private final SiteSettingMapper siteSettingMapper;

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
}
