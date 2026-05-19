import { SITE_WIDE_DISCOUNT_PERCENT } from '../config/sitePromo';

/**
 * Site-wide promo: use list (pre-discount) unit price in cart rows and orderItems state.
 * Apply getDiscountedUnitPrice only at checkout UI and when sending final line prices to the API.
 */

// 실제 할인율 계산기
export function getSiteDiscountPercent() {
    const p = Number(SITE_WIDE_DISCOUNT_PERCENT);
    if (!Number.isFinite(p) || p <= 0) return 0;
    return Math.min(100, Math.floor(p));
}

export function getDiscountedUnitPrice(original) {
    const base = Math.round(Number(original) || 0);
    const pct = getSiteDiscountPercent();
    if (pct <= 0) return base;
    return Math.round(base * (1 - pct / 100));
}