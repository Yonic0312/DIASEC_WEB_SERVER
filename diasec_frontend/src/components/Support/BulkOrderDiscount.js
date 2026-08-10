import { useState } from 'react';
import { useSitePromo } from '../../context/SitePromoContext';
import B1 from '../../assets/bulk/B1.jpg';
import B2 from '../../assets/bulk/B2.jpg';
import B3 from '../../assets/bulk/B3.jpg';
import B4 from '../../assets/bulk/B4.jpg';
import B5 from '../../assets/bulk/B5.jpg';

const BUDGET_OPTIONS = [
    { id: 'under100', label: '100만원 이하', bulkPct: 0 },
    { id: 'over100', label: '100만원 이상', bulkPct: 10 },
    { id: 'over300', label: '300만원 이상', bulkPct: 15 },
    { id: 'over1000', label: '1000만원 이상', bulkPct: 20 },
    { id: 'over2000', label: '2000만원 이상', bulkPct: 25 },
    { id: 'over5000', label: '5000만원 이상', bulkPct: 30 },
];

const BulkOrderDiscount = () => {
    const { siteDiscountPercent } = useSitePromo();
    const sitePct = Math.max(0, Number(siteDiscountPercent) || 0);
    const [selectedId, setSelectedId] = useState(null);

    const selected = BUDGET_OPTIONS.find((o) => o.id === selectedId) || null;
    const totalPct = selected ? Math.min(100, sitePct + selected.bulkPct) : null;

    const handleSelect = (option) => {
        setSelectedId(option.id);
        const total = Math.min(100, sitePct + option.bulkPct);
        const sitePart = sitePct > 0 ? `오픈기념 ${sitePct}% + 대량 ${option.bulkPct}%` : `대량주문 ${option.bulkPct}%`;
        window.alert(
            `${option.label}\n대량주문 할인: ${option.bulkPct}%\n적용 예상 할인율: ${total}%\n(${sitePart})`
        );
    };

    return (
        <div className="w-full px-4 mt-20 mb-16 break-keep">
            <div className="max-w-4xl mx-auto space-y-12">
                <header className="text-center space-y-3">
                    <h1 className="text-[28px] md:text-4xl font-bold">
                        대량주문할인
                    </h1>
                    <div className="space-y-1 text-sm md:text-base leading-relaxed">
                        <p>대량 주문 시 주문 금액에 따라 추가 할인 혜택을 제공합니다.</p>
                        {/* <p>현재 사이트에서 진행 중인 할인과 중복 적용됩니다.</p> */}
                        <p>아래와 같이 주문 금액에 따라 할인이 적용되며 사이트 오픈기념할인 20%와 중복할인이 적용됩니다.</p>
                        <p>제휴 할인과는 중복되지 않으며, 두가지 중 높은 할인율이 적용됩니다.</p>
                    </div>
                </header>

                <section className="border-y border-gray-300 py-8 space-y-6">
                    <div>
                        <p className="font-semibold text-gray-800 mb-4">
                            예산금액 <span className="text-red-500">*</span>
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                            {BUDGET_OPTIONS.map((option) => {
                                const checked = selectedId === option.id;
                                return (
                                    <button
                                        key={option.id}
                                        type="button"
                                        onClick={() => handleSelect(option)}
                                        className={`
                                            flex flex-col items-center gap-2 p-3 rounded-lg border transition
                                            ${checked
                                                ? 'border-blue-600 bg-blue-50'
                                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}
                                        `}
                                    >
                                        <span className="text-sm font-semibold text-gray-800">
                                            {option.bulkPct}%
                                        </span>
                                        <span className="flex items-start gap-1.5 text-left text-[12px] md:text-[13px] text-gray-700">
                                            <span
                                                className={`
                                                    mt-0.5 inline-block w-3.5 h-3.5 shrink-0 rounded-sm border
                                                    ${checked ? 'border-blue-600 bg-blue-600' : 'border-gray-400 bg-white'}
                                                `}
                                                aria-hidden
                                            />
                                            {option.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <p className="text-sm md:text-base">
                            {totalPct == null
                                ? `할인율 : 구매 예정 금액을 체크해 주세요 (오픈기념 ${sitePct}% + 대량할인 0%)`
                                : `할인율 : ${totalPct}% (오픈기념 ${sitePct}% + 대량 ${selected.bulkPct}%)`
                            }
                        </p>
                        <p className="text-sm md:text-base text-gray-500">
                            {totalPct == null
                                ? `구매 예정 금액을 선택하면 예상 할인율이 표시됩니다`
                                : ``
                            }
                        </p>
                    </div>
                </section>

                <section className="space-y-8 text-sm md:text-base leading-relaxed">
                    <div className="space-y-2">
                        <h2 className="text-base md:text-lg font-bold">대량 주문 이용 방법</h2>
                        <div className="flex flex-col pl-5 space-y-1">
                            <span>1. 원하시는 상품을 <strong className="font-semibold text-gray-900">장바구니</strong>에 담아 <strong className="font-semibold text-gray-900">주문서</strong>를 작성합니다.</span>
                            <span><img src={B1} alt="대량 주문 이용 방법 1" className="w-full max-w-sm md:max-w-2xl h-auto rounded border border-gray-200" /></span>
                            <br/>
                            <span>2. <strong className="font-semibold text-gray-900">구매자 요청사항</strong>에 <strong className="font-semibold text-gray-900">“대량주문”</strong>을 기재해 주세요.</span>
                            <span><img src={B2} alt="대량 주문 이용 방법 2" className="w-full max-w-sm md:max-w-2xl h-auto rounded border border-gray-200" /></span>
                            <br/>
                            <span>3. 결제수단은 <strong className="font-semibold text-gray-900">가상계좌</strong>를 선택하고, <strong className="font-semibold text-red-600">입금은 하지 말아 주세요.</strong></span>
                            <span><img src={B3} alt="대량 주문 이용 방법 3" className="w-full max-w-sm md:max-w-2xl h-auto rounded border border-gray-200" /></span>
                            <span><img src={B4} alt="대량 주문 이용 방법 4" className="w-full max-w-sm md:max-w-lg h-auto rounded border border-gray-200" /></span>
                            <br/>
                            <span>4. 담당자가 주문 확인 후, <strong className="font-semibold text-gray-900">할인이 적용된 최종 결제 금액과 입금 계좌를 </strong>문자로 안내해 드립니다.</span>
                            <span>5. <strong className="font-semibold text-gray-900">입금 확인 후</strong> 제작이 진행됩니다.</span>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-base md:text-lg font-bold">맞춤액자 주문 안내</h2>
                        <p>
                            맞춤액자와 다른 카테고리 상품은 <strong className="font-semibold text-gray-900">별도로 주문</strong>해 주세요.
                        </p>
                        <p>
                            각 주문서의 구매자 요청사항에 <strong className="font-semibold text-gray-900">대량주문</strong>을 기재해 주시면,
                            주문 금액을 <strong className="font-semibold text-gray-900">합산하여 할인 적용</strong> 후 결제 금액을 안내드립니다.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default BulkOrderDiscount;
