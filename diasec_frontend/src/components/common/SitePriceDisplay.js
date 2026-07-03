import { usePartner } from '../../context/PartnerContext';
import { getSiteDiscountPercent, getDiscountedUnitPrice, getTotalDiscountPercent } from '../../utils/siteDiscount';

/** 공통 가격 텍스트 크기 — import 해서 neutralClassName 등에 재사용 */
export const SITE_PRICE_TEXT =
    'lg:text-[14.5px] text-[clamp(13px,1.417vw,14.5px)]';

/** 취소선 정가 — 할인가보다 약 1~2pt(≈2px) 작게 */
export const SITE_PRICE_STRIKE_TEXT =
    'text-[12px]';

export function SitePriceRow({
    unitPrice,
    quantity = 1,
    suffix = '',
    className = '',
    neutralClassName = `${SITE_PRICE_TEXT} font-semibold text-[#a67a3e]`,
    strikeClassName = `${SITE_PRICE_STRIKE_TEXT} text-gray-500 line-through`,
    saleClassName = `${SITE_PRICE_TEXT} font-bold text-[#45b035]`,
}) {
    const { partnerDiscount } = usePartner();
    const originalU = Math.round(Number(unitPrice) || 0);
    const qty = Math.max(0, Number(quantity) || 0);
    const originalTotal = originalU * qty;
    const pct = getTotalDiscountPercent(partnerDiscount);

    if (pct <= 0) {
        return (
            <span className={`${neutralClassName} ${className}`.trim()}>
                {originalTotal.toLocaleString()}원{suffix}
            </span>
        );
    }

    const saleTotal = getDiscountedUnitPrice(originalU, partnerDiscount) * qty;

    return (
        <span className={`inline-flex items-baseline gap-1 flex-wrap ${className}`.trim()}>
            <span className={strikeClassName}>
                {originalTotal.toLocaleString()}원{suffix}
            </span>
            <span className={saleClassName}>
                {saleTotal.toLocaleString()}원{suffix}
            </span>
        </span>
    );
}

export function SitePriceTotal({
    original,
    discounted,
    className = '',
    strikeClassName = `${SITE_PRICE_STRIKE_TEXT} text-gray-500 line-through`,
    saleClassName = `${SITE_PRICE_TEXT} font-bold text-[#45b035]`,
}) {
    const { partnerDiscount } = usePartner();
    const o = Math.round(Number(original) || 0);
    const pct = getTotalDiscountPercent(partnerDiscount);
    if (pct <= 0) {
        return <span className={className}>{o.toLocaleString()}원</span>;
    }
    const s =
        discounted != null ? Math.round(Number(discounted) || 0) : o;
    return (
        <span className={`inline-flex items-baseline gap-2 flex-wrap ${className}`.trim()}>
            <span className={strikeClassName}>{o.toLocaleString()}원</span>
            <span className={saleClassName}>{s.toLocaleString()}원</span>
        </span>
    );
}
