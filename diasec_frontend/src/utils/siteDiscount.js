import { getSiteWideDiscountPercent } from '../config/sitePromo';

// 실제 할인율 계산기
export function getSiteDiscountPercent() {
    const p = Number(getSiteWideDiscountPercent());
    if (!Number.isFinite(p) || p <= 0) return 0;
    return Math.min(100, Math.floor(p));
}

// 정가 합계 기준 대량주문 할인율
export function getBulkDiscountPercent(originalTotal) {
    const amount = Number(originalTotal) || 0;
    if (amount >= 50000000) return 30;
    if (amount >= 20000000) return 25;
    if (amount >= 10000000) return 20;
    if (amount >= 3000000) return 10;
    if (amount >= 1000000) return 5;
    return 0;
}

// 제휴 할인과 대량주문 할인은 중복되지 않고, 높은 쪽만 사용
export function getEffectiveExtraPercent(partnerPercent = 0, originalTotal = 0) {
    const partnerPct = Math.max(0, Number(partnerPercent) || 0);
    const bulkPct = getBulkDiscountPercent(originalTotal);
    return Math.max(partnerPct, bulkPct);
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