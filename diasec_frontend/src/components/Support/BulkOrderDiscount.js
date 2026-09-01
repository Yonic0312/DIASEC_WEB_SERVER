import { useState } from 'react';
import { useSitePromo } from '../../context/SitePromoContext';

const BUDGET_OPTIONS = [
    { id: 'under100', label: '100만원 이하', bulkPct: 0 },
    { id: 'over100', label: '100만원 이상', bulkPct: 5 },
    { id: 'over300', label: '300만원 이상', bulkPct: 10 },
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
            </div>
        </div>
    );
};

export default BulkOrderDiscount;