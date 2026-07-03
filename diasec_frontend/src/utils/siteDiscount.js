import { SITE_WIDE_DISCOUNT_PERCENT } from '../config/sitePromo';

// 실제 할인율 계산기
export function getSiteDiscountPercent() {
    const p = Number(SITE_WIDE_DISCOUNT_PERCENT);
    if (!Number.isFinite(p) || p <= 0) return 0;
    return Math.min(100, Math.floor(p));
}

export function getDiscountedUnitPrice(original, extraPartnerPercent = 0) {
    const base = Math.round(Number(original) || 0);
    const sitePct = getSiteDiscountPercent();
    const partnerPct = Math.max(0, Number(extraPartnerPercent || 0));
    const totalPct = Math.min(50, sitePct + partnerPct);
    if (totalPct <= 0) return base;
    return Math.round(base * (1 - totalPct / 100));
}

// UI 표시용
export function getTotalDiscountPercent(extraPartnerPercent = 0) {
    const sitePct = getSiteDiscountPercent();
    const partnerPct = Math.max(0, Number(extraPartnerPercent) || 0);
    return Math.min(50, sitePct + partnerPct);
}