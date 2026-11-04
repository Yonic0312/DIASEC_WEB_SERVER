import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMember } from '../../context/MemberContext';
import { usePartner } from '../../context/PartnerContext';
import { calculateCumulativePrice } from '../../utils/customFramePrice';
import {
    getDiscountedUnitPrice,
    getSiteDiscountPercent,
    getEffectiveExtraPercent,
    getBulkDiscountPercent,
} from '../../utils/siteDiscount';

const PAPER_SIZES_CM = {
    A3: { w: 29.7, h: 42.0 },
    A2: { w: 42.0, h: 59.4 },
    A1: { w: 59.4, h: 84.1 },
    A0: { w: 84.0, h: 119.0 },
};

const PriceQuoteModal = ({ 
    open, 
    onClose,
    initialWidth = '',
    initialHeight = '',
    landscape = false, // true면 A 규격 가로형
}) => {
    const { member } = useMember();
    const { partnerDiscount } = usePartner();
    const [adminQuoteW, setAdminQuoteW] = useState('');
    const [adminQuoteH, setAdminQuoteH] = useState('');
    const [adminQuoteApplyPartnerDiscount, setAdminQuoteApplyPartnerDiscount] = useState(false);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!open) return;
        setAdminQuoteW(initialWidth !== '' && initialWidth != null ? String(Math.round(Number(initialWidth) || 0) || '') : '');
        setAdminQuoteH(initialHeight !== '' && initialHeight != null ? String(Math.round(Number(initialHeight) || 0) || '') : '');
        setAdminQuoteApplyPartnerDiscount(false);
    }, [open, initialWidth, initialHeight]);

    useEffect(() => {
        if (!open) return;

        const scrollY = window.scrollY;
        const prev = {
            position: document.body.style.position,
            top: document.body.style.top,
            left: document.body.style.left,
            right: document.body.style.right,
            width: document.body.style.width,
            overflow: document.body.style.overflow,
        };

        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';

        const onKey = (e) => {
            if (e.key === 'Escape') onCloseRef.current();
        };
        window.addEventListener('keydown', onKey);

        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.position = prev.position;
            document.body.style.top = prev.top;
            document.body.style.left = prev.left;
            document.body.style.right = prev.right;
            document.body.style.width = prev.width;
            document.body.style.overflow = prev.overflow;
            window.scrollTo(0, scrollY);
        };
    }, [open]);

    const applyAdminQuotePaper = (key) => {
        const paper = PAPER_SIZES_CM[key];
        if (!paper) return;
        const w = landscape ? paper.h : paper.w;
        const h = landscape ? paper.w : paper.h;
        setAdminQuoteW(String(Math.round(paper.w)));
        setAdminQuoteH(String(Math.round(paper.h)));
    };

    if (!open) return null;

    return createPortal(
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/45 p-4 overscroll-none"
            role="presentation"
            onTouchMove={(e) => {
                if (e.target === e.currentTarget) e.preventDefault();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="admin-quote-modal-title"
                className="bg-white rounded-xl shadow-xl max-w-[370px] w-full p-6 border border-gray-200"
                onClick={(e) => e.stopPropagation()}
            >
                <p id="admin-quote-modal-title" className="text-[15px] font-medium text-gray-900 mb-8">
                    수치를 입력하면 아래에 가격이 표시됩니다
                </p>
                <div className="flex flex-wrap items-end gap-3 mb-4">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-600 mb-1">가로 (cm)</span>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={adminQuoteW}
                            onChange={(e) => setAdminQuoteW(e.target.value.replace(/[^\d.]/g, ''))}
                            className="w-[100px] md:w-[110px] border border-gray-400 rounded-md px-2 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#D0AC88]"
                        />
                    </div>
                    <span className="text-lg font-semibold text-gray-500 pb-2">x</span>
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-600 mb-1">세로 (cm)</span>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={adminQuoteH}
                            onChange={(e) => setAdminQuoteH(e.target.value.replace(/[^\d.]/g, ''))}
                            className="w-[100px] md:w-[110px] border border-gray-400 rounded-md px-2 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#D0AC88]"
                        />
                    </div>
                </div>
                <div className="w-full flex justify-between gap-2 mb-4">
                    {['A3', 'A2', 'A1', 'A0'].map((k) => (
                        <button
                            key={k}
                            type="button"
                            onClick={() => applyAdminQuotePaper(k)}
                            className="flex-1 h-[34px] rounded-md border text-sm font-semibold bg-white text-gray-500 border-gray-300 hover:bg-[#ecd2af] hover:text-white hover:border-[#ecd2af]"
                        >
                            {k}
                        </button>
                    ))}
                </div>

                {member?.role === 'ADMIN' && (
                    <div className="mb-3 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setAdminQuoteApplyPartnerDiscount((v) => !v)}
                            className={`px-3 py-1.5 rounded-md border text-xs font-semibold transition ${
                                adminQuoteApplyPartnerDiscount
                                    ? 'bg-white text-black border-green-500'
                                    : 'bg-white text-black border-red-500'
                            }`}
                        >
                            파트너 할인 {adminQuoteApplyPartnerDiscount ? '적용' : '미적용'}
                        </button>
                    </div>
                )}

                <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 mb-3 min-h-[88px]">
                    {(() => {
                        const pw = Math.round(parseFloat(String(adminQuoteW).replace(/[^\d.]/g, '')) || 0);
                        const ph = Math.round(parseFloat(String(adminQuoteH).replace(/[^\d.]/g, '')) || 0);
                        if (pw <= 0 || ph <= 0) {
                            return (
                                <p className="text-md font-bold text-gray-500">가격표시</p>
                            );
                        }
                        const area = pw * ph;
                        const original = calculateCumulativePrice(area);
                        const extraPercent = getEffectiveExtraPercent(
                            adminQuoteApplyPartnerDiscount ? partnerDiscount : 0,
                            original
                        );
                        const discounted = getDiscountedUnitPrice(original, extraPercent);
                        const sitePct = getSiteDiscountPercent();
                        const bulkPct = getBulkDiscountPercent(original);
                        const partnerPct = adminQuoteApplyPartnerDiscount
                            ? Math.max(0, Number(partnerDiscount) || 0)
                            : 0;
                        const hasDiscount = discounted < original;
                        const discountLabel = (() => {
                            const parts = [];
                            if (sitePct > 0) parts.push(`사이트 ${sitePct}%`);
                            if (bulkPct > 0 && bulkPct >= partnerPct) parts.push(`대량 ${bulkPct}%`);
                            else if (partnerPct > 0) parts.push(`파트너 ${partnerPct}%`);
                            return parts.length ? `${parts.join(' + ')} 할인 적용` : '';
                        })();
                        return (
                            <div className="space-y-2">
                                {hasDiscount ? (
                                    <div className="text-sm md:text-base">
                                        <p className="text-gray-700">
                                            가격{' '}
                                            <span className="line-through text-gray-500">
                                                {original.toLocaleString()}원
                                            </span>
                                        </p>
                                        <p className="mt-1 font-bold text-[#a67a3e]">
                                            할인가 {discounted.toLocaleString()}원
                                            {discountLabel && (
                                                <>
                                                    <br />
                                                    <span className="font-normal text-xs text-gray-600">
                                                        ({discountLabel})
                                                    </span>
                                                </>
                                            )}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-base font-bold text-gray-900">
                                        가격 {original.toLocaleString()}원
                                    </p>
                                )}
                            </div>
                        );
                    })()}
                </div>
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-3 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default PriceQuoteModal;
