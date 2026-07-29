import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { useSitePromo } from '../../context/SitePromoContext';

/** 헤더 상단 고정 - x로 닫기 / 바 높이만큼 스크롤 시  숨김 · 맨 위에서만 다시 표시) */

const SitePromoBar = () => {
    const { siteDiscountPercent } = useSitePromo();
    const pct = Math.max(0, Number(siteDiscountPercent) || 0);
    const label = pct > 0 ? `${pct}% 오픈할인 · 무료배송` : '무료배송';
   
    const [dismissed, setDismissed] = useState(false);
    const [scrollHidden, setScrollHidden] = useState(false);
    const barRef = useRef(null);
    const barHeightRef = useRef(32);

    useLayoutEffect(() => {
        if (dismissed || !barRef.current) return;
        const h = barRef.current.offsetHeight;
        if (h > 0) barHeightRef.current = h;
    }, [dismissed, label]);

    useEffect(() => {
        if (dismissed) return undefined;

        const onScroll = () => {
            const y = window.scrollY || window.pageYOffset || 0;
            const threshold = Math.max(barHeightRef.current, 1);

            // 맨 위까지 올렸을 때만 다시 표시
            if (y <= 0) {
                setScrollHidden(false);
            } else if (y >= threshold) {
                setScrollHidden(true);
            }
        };

        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [dismissed]);

    if (dismissed) return null;

    return (
        <div 
            className={`
                overflow-hidden transition-[max-height,opacity] duration-300 ease-out
                ${scrollHidden ? 'max-h-0 opacity-0' : 'max-h-12 opacity-100'}
            `}
        >
            <div ref={barRef} className="relative w-full bg-[#303030] text-white">
                <div className="max-w-[1300px] mx-auto px-8 md:px-10 py-[6px] flex items-center justify-center text-center">
                    <span className="text-[11px] md:text-[13px] font-semibold tracking-wide">
                        {label}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => setDismissed(false)}
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
        </div>
    );
};

export default SitePromoBar;