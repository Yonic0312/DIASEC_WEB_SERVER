import { useState } from 'react';
import { X } from 'lucide-react';
import { useSitePromo } from '../../context/SitePromoContext';

/** 헤더 상단 고정 - 사티으 할인 · 무료배송 안내 (X로 닫기, 새로고침 시 다시 표시) */

const SitePromoBar = () => {
    const { siteDiscountPercent } = useSitePromo();
    const pct = Math.max(0, Number(siteDiscountPercent) || 0);
    const label = pct > 0 ? `${pct}% 오픈할인 · 무료배송` : '무료배송';
    const [visible, setVisible] = useState(true);

    if (!visible) return null;

    return (
        <div className="relative w-full bg-[#303030] text-white">
            <div className="max-w-[1300px] mx-auto px-8 md:px-10 py-[6px] flex items-center justify-center text-center">
                <span className="text-[11px] md:text-[13px] font-semibold tracking-wide">
                    {label}
                </span>
            </div>
            <button
                type="button"
                onClick={() => setVisible(false)}
                aria-label="프로모션 바 닫기"
                className="
                    absolute right-2 top-1/2 -translate-y-1/2
                    flex items-center justify-center
                    w-6 h-6 rounded-full
                    text-white/80 hover:text-white hover:bg-white/10
                    transition
                "
            >
                <X className="w-3.5 h-3.5" strokeWidth={2.5} />
            </button>
        </div>
    );
};

export default SitePromoBar;