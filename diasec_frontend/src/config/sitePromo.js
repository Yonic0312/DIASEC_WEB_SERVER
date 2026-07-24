// 사이트 기본 할인율 (API 로드 전 폴백 / 기본값)
let siteWideDiscountPercent = 20;

export const getSiteWideDiscountPercent = () => siteWideDiscountPercent;

export const setSiteWideDiscountPercent = (percent) => {
    const p = Number(percent);
    if (!Number.isFinite(p)) return siteWideDiscountPercent;
    siteWideDiscountPercent = Math.max(0, Math.min(100, Math.floor(p)));
    return siteWideDiscountPercent;
};

/** @deprecated 호환용 - getSiteWideDiscountPercent() 사용 권장 */
export const SITE_WIDE_DISCOUNT_PERCENT = 20;