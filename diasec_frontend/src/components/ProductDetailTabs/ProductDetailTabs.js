import { useEffect, useRef, useState } from 'react';
import ReviewList from './Review/ReviewList';
import DeliveryReturn from './Delivery/DeliveryReturn';
import ProductDetail from './Detail/ProductDetail';
import InquiryList from './Inquiry/InquiryList';

const TAB_LIST = [
    { key: "상세정보" }, 
    { key: "후기" }, 
    { key: "문의" }, 
    { key: "배송/환불" }
];

const ProductDetailTabs = ({ product }) => {
const [active, setActive] = useState('상세정보');
const [isScrolling, setIsScrolling] = useState(false);

// 각 섹션 ref
const refs = {
    상세정보: useRef(null),
    후기: useRef(null),
    문의: useRef(null),
    '배송/환불': useRef(null),
};

    // 상단 고정 탭바 높이
    const OFFSET = 72; // px

    // 탭 클릭 -> 스무스 스크롤
    const handleClick = (k) => {
        const el = refs[k]?.current;
        if (!el) return;

        //setActive(k);
        setIsScrolling(true);

        const y = el.getBoundingClientRect().top + window.scrollY - OFFSET;
        window.scrollTo({ top: y, behavior: 'smooth' });

        let lastY = window.scrollY;
        const checkScrollEnd = () => {
            if (Math.abs(window.scrollY - lastY) < 2) {
                // 거의 멈췄을 때
                setIsScrolling(false);
                return;
            }
            lastY = window.scrollY;
            requestAnimationFrame(checkScrollEnd);
        };
        requestAnimationFrame(checkScrollEnd);
    };

    // 스크롤 스파이: 현재 보이는 섹션에 맞춰 활성 탭 변경
    useEffect(() => {
        const io = new IntersectionObserver(
            (entries) => {
                if (isScrolling) return;

            const visible = entries.filter((e) => e.isIntersecting);

            if (visible.length > 0) {
                const top = visible.sort(
                (a, b) => a.boundingClientRect.top - b.boundingClientRect.top
                )[0];
                const id = top?.target.getAttribute("data-key");
                if (id) setActive(id);
            }

            // 👇 스크롤이 최상단 근처일 때는 무조건 상세정보로
                if (window.scrollY < 100) {
                    setActive("상세정보");
                }
            },
            {
            root: null,
            rootMargin: `-${OFFSET}px 0px -70% 0px`,
            threshold: 0, // 0%만 보여도 잡히게
            }
        );

        Object.values(refs).forEach((r) => r.current && io.observe(r.current));
        return () => io.disconnect();
    }, [isScrolling]);

    return (
        <div className="w-full">
            <div className="sticky top-0 z-30 bg-white">
                <div className="
                    flex justify-between border-b
                    lg:px-[13%] md:px-[7%] sm:px-[5%]
                    lg:text-[22px] md:text-[clamp(20px,2.15vw,22px)] sm:text-[clamp(17px,2.607vw,20px)] text-[17px]">
                    {TAB_LIST.map(({ key }) => (
                        <button
                            key={key}
                            onClick={() => handleClick(key)}
                            className={`px-2 py-1 relative
                                ${active === key ? 'text-black font-semibold' : 'text-gray-400'}`}
                        >
                            {key}
                            <span 
                                className={`absolute left-0 right-0 -bottom-[1px] h-[2px] transition-opacity ${
                                    active === key ? 'bg-black opacity-100' : 'opacity-0'}`}
                            />
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="px-3">
                {/* 섹션들 한 페이지에 이어서 렌더 */}
                <section
                    ref={refs['상세정보']}
                    data-key="상세정보"
                    className="scroll-mt-[72px] pt-[100px]"
                >
                    <ProductDetail pid={product.pid} />
                </section>

                <section
                    ref={refs['후기']}
                    data-key="후기"
                    className="scroll-mt-[72px] pt-[100px]"
                >
                    <ReviewList pid={product.pid} />
                </section>

                <section
                    ref={refs['문의']}
                    data-key="문의"
                    className="scroll-mt-[72px] pt-[100px]"
                >
                    <InquiryList pid={product.pid} />
                </section>

                <section
                    ref={refs['배송/환불']}
                    data-key="배송/환불"
                    className="scroll-mt-[72px] pt-[100px]"
                >
                    <DeliveryReturn />
                </section>
            </div>
        </div>
    )
}

export default ProductDetailTabs;