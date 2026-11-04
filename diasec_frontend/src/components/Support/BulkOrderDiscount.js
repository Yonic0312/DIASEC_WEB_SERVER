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
        // const sitePart = sitePct > 0 ? `오픈기념 ${sitePct}% + 대량 ${option.bulkPct}%` : `대량주문 ${option.bulkPct}%`;
        const sitePart = `대량주문 ${option.bulkPct}%`;
        window.alert(
            `${option.label}\n대량주문 할인: ${option.bulkPct}%\n적용 예상 할인율: ${total}%\n(${sitePart})`
        );
    };

    return (
        <div className="w-full px-4 mt-20 mb-16 break-keep">
            <div className="max-w-4xl mx-auto space-y-8">
                <header className="text-center space-y-3">
                    <h1 className="text-[28px] md:text-4xl font-bold">
                        대량주문할인
                    </h1>
                    <div className="space-y-1 text-sm md:text-base leading-relaxed">
                        <p>아래와 같이 주문 금액에 따라 할인이 적용됩니다.</p>
                    </div>
                </header>

                <section>
                    <div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                            {BUDGET_OPTIONS.map((option) => {
                                const checked = selectedId === option.id;
                                return (
                                    <button
                                        key={option.id}
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
                                            
                                            {option.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    
                    <div>
                        {/* <p className="text-sm md:text-base">
                            {totalPct == null
                                ? `할인율 : 구매 예정 금액을 체크해 주세요 (오픈기념 ${sitePct}% + 대량할인 0%)`
                                : `할인율 : ${totalPct}% (오픈기념 ${sitePct}% + 대량 ${selected.bulkPct}%)`
                            }
                        </p> */}
                    </div>
                </section>
                <section className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-6 space-y-4 text-sm md:text-base leading-relaxed">
                    <div className="space-y-1">
                        <p className="text-gray-700">
                            - 이미지 파일과 규격을 이메일로 보내주시면 견적서를 보내드립니다.
                        </p>
                        <p className="text-gray-700">
                            - 납기일은 제품 사이즈와 수량에 따라 5일에서 10일 정도 소요됩니다.
                        </p>
                        <p className="text-gray-700">
                            - 납품은 화물 무료배송으로 진행되오며 도서산간 제주도는 제외입니다.
                        </p>
                        <p className="text-gray-700">
                            - 사업자 등록증을 보내주시면, 입금 확인 후 세금계산서를 발급해 드립니다.
                        </p>
                        <p className="text-gray-700">
                            - 결제는 무통장입금으로만 가능합니다
                        </p>
                    </div>

                    <div className="border-t border-gray-200 pt-4 space-y-1">
                        
                        <p className="text-gray-800">
                            <span className="font-semibold">문의</span>{' '} : 010-4231-5879
                        </p>
                        <p className="text-gray-800">
                            <span className="font-semibold">이메일</span>{' '} : d2one@naver.com
                        </p>
                        <p className="text-gray-800">
                            <span className="font-semibold">입금계좌</span>{' '}
                            신한은행 110-117-372730 / 예금주: 임정원디아섹코리아
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default BulkOrderDiscount;