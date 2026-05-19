import { useEffect, useRef, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import axios from 'axios';
import { getMinFrameConfigByRatio } from '../../utils/customFramePrice';
import { SitePriceRow, SITE_PRICE_TEXT } from '../common/SitePriceDisplay';
import MainEventPopup from './MainEventPopup';

// 배너
import customFrame from '../../assets/banner/customFrame.png';
import aboutBanner from '../../assets/images/introduce.png';

// 보정
// import faceDot_1 from '../../assets/custom_Frames/faceDot_1.jpg';
// import faceDot_2 from '../../assets/custom_Frames/faceDot_2.jpg';
// import faceENM_1 from '../../assets/custom_Frames/faceENM_1.jpg';
// import faceENM_2 from '../../assets/custom_Frames/faceENM_2.jpg';
// import portrait_1 from '../../assets/custom_Frames/portrait_1.jpg';
// import portrait_2 from '../../assets/custom_Frames/portrait_2.jpg';
// import backlight_1 from '../../assets/custom_Frames/backlight_1.jpg';
// import backlight_2 from '../../assets/custom_Frames/backlight_2.jpg';
// import bg_1 from '../../assets/custom_Frames/bg_1.jpg';
// import bg_2 from '../../assets/custom_Frames/bg_2.jpg';
// import blur_1 from '../../assets/custom_Frames/blur_1.jpg';
// import blur_2 from '../../assets/custom_Frames/blur_2.jpg';


// 공통 axios get helper
const getData = async (API, url,config = {}) => {
    const res = await axios.get(`${API}${url}`, config);
    return res.data;
}

// 인기작품, 신규작품 포함
const Main = () => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();
    const [bestCategory, setBestCategory] = useState('masterPiece'); // 인기상품 선택된 카테고리
    const [newCategory, setNewCategory] = useState('masterPiece'); // 신규상품 선택된 카테고리
    const [best_Items, setBest_Items] = useState([]);
    const [new_Items, setNew_Items] = useState([]);
    const [categoryList, setCategoryList] = useState([]);
    const [bestPriceMap, setBestPriceMap] = useState({});
    const [newPriceMap, setNewPriceMap] = useState({});
    

    // 올라오는 효과
    const [hasScrolled, setHasScrolled] = useState(false);
    const newSectionRef = useRef(null);
    const reviewSectionRef = useRef(null);
    const aboutSectionRef = useRef(null);

    const [visibleSections, setVisibleSections] = useState({
        new: false,
        review: false,
        about: false,
    });

    // 스크롤 감지
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 10) {
                setHasScrolled(true);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const refs = [
            { key: 'new', ref: newSectionRef },
            { key: 'review', ref: reviewSectionRef },
            { key: 'about', ref: aboutSectionRef },
        ];

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    const targetKey = entry.target.dataset.section;
                    if (!targetKey) return;

                    // 신규작품은 실제 스크롤 이후에만 애니메이션
                    if (targetKey === 'new' && !hasScrolled) return;

                    if (entry.isIntersecting) {
                        setVisibleSections((prev) => {
                            if (prev[targetKey]) return prev;

                            return {
                                ...prev,
                                [targetKey]: true,
                            };
                        });
                    }
                });
            },
            {
                threshold: 0.08,
                rootMargin: '0px 0px -6% 0px',
            }
        );

        refs.forEach(({ key, ref }) => {
            if (ref.current) {
                ref.current.dataset.section = key;
                observer.observe(ref.current);
            }
        });

        return () => observer.disconnect();
    }, [hasScrolled]);

    useEffect(() => {
        const sectionMap = [
            { key: 'review', ref: reviewSectionRef },
            { key: 'about', ref: aboutSectionRef },
        ];

        const nextVisible = {};

        sectionMap.forEach(({ key, ref }) => {
            const el = ref.current;
            if (!el) {
                nextVisible[key] = false;
                return;
            }

            const rect = el.getBoundingClientRect();
            const isInitiallyVisible = 
                rect.top < window.innerHeight * 0.95 && rect.bottom > 0;

            nextVisible[key] = isInitiallyVisible;
        });

        setVisibleSections((prev) => ({
            ...prev,
            ...nextVisible,
        }));
    }, []);

    // 올라오는 효과 //

    // 작가 카테고리는 빼기
    const filteredCategoryList = categoryList.filter(c => c.name !== 'authorCollection');
    const [reviewIndex, setReviewIndex] = useState(0); // 리뷰 슬라이드

    const [reviewVisibleCount, setReviewVisibleCount] = useState(3);
    useEffect(() => {
        const calc = () => setReviewVisibleCount(window.innerWidth < 768 ? 2 : 3);
        calc();
        window.addEventListener('resize', calc);
        return () => window.removeEventListener('resize', calc);
    }, []);

    // 마우스 호버 상태 저장(img)
    const [bestHoveredPid, setBestHoveredPid] = useState(null);
    const [newHoveredPid, setNewHoveredPid] = useState(null);

    // [BEST 목록] 가져오기
    useEffect(() => {
        const controller = new AbortController();
        
        (async () => {
            try {
                const data = await getData(API, "/product/best", {
                    params: { category : bestCategory },
                    signal: controller.signal,
                });
                setBest_Items(data ?? []);
            } catch (err) {
                if (err?.name === "CanceledError") return;
                console.error("BEST 로딩 실패:", err);
                setBest_Items([]);
            }
        })();

        return () => controller.abort();
    }, [API, bestCategory]);

    // [New 목록] 가져오기
    useEffect(() => {
        const controller = new AbortController();
        
        (async () => {
            try {
                const data = await getData(API, "/product/new", {
                    params: { category : newCategory },
                    signal: controller.signal,
                });
                setNew_Items(data ?? []);
            } catch (err) {
                if (err?.name === "CanceledError") return;
                console.error("NEW 로딩 실패:", err);
                setNew_Items([]);
            }
        })();

        return () => controller.abort();
    }, [API, newCategory]);

    // 컬렉션 가져오기
    useEffect(() => {
        const controller = new AbortController();

        (async () => {
            try {
                const data = await getData(API, "/collections", { signal: controller.signal });
                setCategoryList(data ?? []);
            } catch (err) {
                if (err?.name === "CanceledError") return;
                console.error("카테고리 로딩 실패:", err);
                setCategoryList([]);
            }
        })();

        return () => controller.abort();
    }, [API]);

    // 이미지 실제 크기 읽는 함수
    const loadImageSize = (src) => {
        return new Promise((resolve, reject) => {
            if (!src) {
                reject(new Error("이미지 URL 없음"));
                return;
            }

            const img = new Image();
            img.onload = () => resolve({ width: img.width, height: img.height });
            img.onerror = reject;
            img.src = src;
        })
    }

    // 인기 상품 가격 계산
    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            try {
                const entries = await Promise.all(
                    best_Items.map(async (item) => {
                        try {
                            const { width, height } = await loadImageSize(item.imageUrl);
                            const ratio = width / height;
                            const cfg = getMinFrameConfigByRatio(ratio);
                            return [item.pid, cfg.price];
                        } catch (e) {
                            console.error("인기작품 가격 map 생성 실패:", item.pid, e);
                            return [item.pid, null];
                        }
                    })
                );

                if (cancelled) return;
                setBestPriceMap(Object.fromEntries(entries));
            } catch (e) {
                console.error("인기작품 가격 map 생성 실패:", e);
                if (!cancelled) setBestPriceMap({});
            }
        };

        if (best_Items.length > 0) {
            run();
        } else {
            setBestPriceMap({});
        }

        return () => {
            cancelled = true;
        };
    }, [best_Items]);

    // 신규 상품 가격 계산
    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            try {
                const entries = await Promise.all(
                    new_Items.map(async (item) => {
                        try {
                            const { width, height } = await loadImageSize(item.imageUrl);
                            const ratio = width / height;
                            const cfg = getMinFrameConfigByRatio(ratio);
                            return [item.pid, cfg.price];
                        } catch (e) {
                            console.error("신규작품 가격 map 생성 실패:", item.pid, e);
                            return [item.pid, null];
                        }
                    })
                );

                if (cancelled) return;
                setNewPriceMap(Object.fromEntries(entries));
            } catch (e) {
                console.error("신규작품 가격 map 생성 실패:", e);
                if (!cancelled) setNewPriceMap({});
            }
        };

        if (new_Items.length > 0) {
            run();
        } else {
            setNewPriceMap({});
        }

        return () => {
            cancelled = true;
        };
    }, [new_Items]);
    
    // [보정] 사진 befor / after
    // const beforeAfterData = [
    //     { title: '피부 보정', before: faceDot_1, after: faceDot_2},
    //     { title: '얼굴 디테일 보정', before: faceENM_1, after: faceENM_2},
    //     { title: '얼굴 라인·피부 결 리터칭', before: portrait_1, after: portrait_2},
    //     { title: '이미지 역광 및 색감보정', before: backlight_1, after: backlight_2},
    //     { title: '불필요한 배경 삭제 및 변경', before: bg_1, after: bg_2},
    //     { title: '업스케일링 (흐릿한 사진 선명보정)', before: blur_1, after: blur_2},
    // ]

    const [activeIndex, setActiveIndex] = useState(0);
    const [showAfter, setShowAfter] = useState(false);

    // const current = beforeAfterData[activeIndex];


    // [리뷰] 상단 리뷰 슬라이더
    const [topThumbnailReviews, setTopThumbnailReviews] = useState([]);
    const [selectedReview, setSelectedReview] = useState(null);

    // 화면 데이터에 맞게 reviewIndex 범위 클렘프
    useEffect(() => {
        const maxIndex = Math.max(0, topThumbnailReviews.length - reviewVisibleCount);
        setReviewIndex((prev) => Math.min(prev, maxIndex));
    }, [reviewVisibleCount, topThumbnailReviews.length]);

    // 리뷰 상세 페이지 이미지 슬라이드
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // 최근 리뷰 가져오기
    useEffect(() => {
        const controller = new AbortController();

        (async () => {
            try {
                const data = await getData(API, "/review/recent", {
                    params: { limit: 20 },
                    withCredentials: true,
                    signal: controller.signal,    
                });
                setTopThumbnailReviews(data ?? []);
            } catch (err) {
                if (err?.name === "CanceledError") return;
                console.error("리뷰 로딩 실패:", err);
                setTopThumbnailReviews([]);
            }
        })();

        return () => controller.abort();
    }, [API]);

    // [이벤트] 
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const controller = new AbortController();

        (async () => {
            try {
                const data = await getData(API, "/event", {
                    params: { status: "ongoing" },
                    signal: controller.signal,    
                });
                setEvents(data ?? []);
            } catch (err) {
                if (err?.name === "CanceledError") return;
                console.error("이벤트 로딩 실패:", err);
                setEvents([]);
            }
        })();

        return () => controller.abort();
    }, [API]);

    const [currentIndex, setCurrentIndex] = useState(0); // 이벤트 슬라이더


    return (
        <div className='
            flex flex-col w-full h-fit 
            xl:gap-36
            lg:gap-32
            md:gap-28
            gap-24'>
            {/* 인기작품 */}
            <div>
                <div className='
                    lg:mb-4 mb-2
                    text-center'>
                    <span className='
                        md:text-3xl text-[clamp(18px,3.911vw,30px)]
                        font-bold tracking-wide text-black inline-block'
                    >
                        인기작품
                    </span>
                    {/* <p className='
                        md:text-base text-[clamp(11px,2.086vw,16px)]
                        xl:mt-3 lg:mt-2 mt-1 
                        text-gray-600'>
                        현재 가장 주목받는 인기작품을 만나보세요.
                    </p> */}
                </div>
                
                <div className='flex flex-wrap justify-center items-center 
                    xl:gap-4 lg:gap-3 md:gap-2 gap-[2px]'>
                    {filteredCategoryList.map((item) => {
                        const isActive = bestCategory === item.name;
                        return (
                            <div
                                className={`hover:text-[#a67a3e] cursor-pointer`}
                                key={item.id}
                                onClick={() => setBestCategory(item.name)}
                            >
                                <span className={`
                                    md:text-base text-[clamp(12px,2.2vw,16px)]
                                    relative px-4 py-1 rounded-full transition-all duration-300 font-medium
                                    ${isActive
                                        ? 'text-white bg-[#d0ac88]'
                                        : 'text-gray-700 hover:text-[#d0ac88] hover:bg-gray-100'}
                                    `}
                                >
                                    <span className='relative inline-block'>
                                        {item.displayName}
                                    </span>
                                </span>
                            </div>
                        )
                    })}
                </div>

                <div className="grid md:grid-cols-4 grid-cols-2 md:gap-y-10 md:gap-x-[0.1%] gap-x-[5%] gap-y-8 mt-5 px-4">
                    {best_Items.map((item) => {
                        const isHoverd = bestHoveredPid === item.pid;

                        return(
                            <div
                                key={item.pid}
                                className="flex flex-col 
                                    lg:px-4 md:px-2 px-[2px]
                                    w-full/4
                                    h-auto md:mb-10 mb-2 cursor-pointer"
                                onMouseEnter={() => setBestHoveredPid(item.pid)}
                                onMouseLeave={() => setBestHoveredPid(null)}
                                onClick={() => navigate(`/none_custom_detail?pid=${item.pid}&category=${item.category}`)}
                            >   
                                {/* 기본 이미지 */}
                                <div className="
                                        flex justify-center items-center w-full aspect-[292/292] overflow-hidden 
                                        bg-white">
                                    <div className="w-full h-full">
                                        <img 
                                            className="h-[100%] w-[100%] object-contain"
                                            style={{ boxShadow: '8px 8px 10px rgba(0,0,0,0.2)'}} 
                                            src={isHoverd ? item.hoverImageUrl : item.imageUrl} 
                                            alt={item.title} 
                                        />
                                    </div>
                                </div>

                                <span className="
                                    lg:text-[18px] text-[clamp(16px,1.759vw,18px)]
                                    line-clamp-1
                                    font-bold mt-4">{item.title}</span>
                                <span className="
                                    lg:text-[14px] text-[clamp(13.5px,1.368vw,14px)]
                                    line-clamp-1
                                    font-bold text-[#CDC9C3]">
                                        {item.author}
                                </span>

                                <span className="mt-[2px] font-semibold text-[#d0ac88]">
                                    {bestPriceMap[item.pid] != null ? (
                                        <SitePriceRow
                                            unitPrice={bestPriceMap[item.pid]}
                                            quantity={1}
                                            suffix="~"
                                            neutralClassName={`${SITE_PRICE_TEXT} font-semibold text-[#d0ac88]`}
                                        />
                                    ) : (
                                        ''
                                    )}
                                </span>
                                <hr className="my-1" />
                            </div>
                        )
                    })}
                </div>
            </div>
           {/* /인기작품 */}

           {/* 신규작품 */}
            <div
                ref={newSectionRef}
                className={`transition-all duration-700 ease-out ${
                    visibleSections.new
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-6'
                }`}
            >
                <div className='
                    lg:mb-4 mb-2
                    text-center'>

                    {/* text-[#d0ac88] */}
                    <span className='
                        md:text-3xl text-[clamp(18px,3.911vw,30px)]
                        font-bold tracking-wide text-black inline-block'>
                        신규작품
                    </span>
                    {/* <p className='
                        md:text-base text-[clamp(11px,2.086vw,16px)]
                        xl:mt-3 lg:mt-2 mt-1 
                        text-gray-600'>
                        새롭게 등록된 최신 작품들을 확인해보세요.
                    </p> */}
                </div>
                
                <div className='flex flex-wrap justify-center items-center 
                xl:gap-4 lg:gap-3 md:gap-2 gap-[2px]'>
                    {filteredCategoryList.map((item) => {
                        const isActive = newCategory === item.name;
                        return (
                            <div
                                className={`hover:text-[#a67a3e] cursor-pointer`}
                                key={item.id}
                                onClick={() => setNewCategory(item.name)}
                            >
                                <span className={`
                                    md:text-base text-[clamp(12px,2.2vw,16px)]
                                    relative px-4 py-1 rounded-full transition-all duration-300 font-medium
                                    ${isActive
                                        ? 'text-white bg-[#d0ac88]'
                                        : 'text-gray-700 hover:text-[#a67a3e] hover:bg-gray-100'}
                                    `}
                                >
                                    <span className='relative inline-block'>
                                        {item.displayName}
                                    </span>
                                </span>
                            </div>
                        )
                    })}
                </div>

                <div className="grid md:grid-cols-4 grid-cols-2 md:gap-y-10 md:gap-x-[0.1%] gap-x-[5%] gap-y-8 mt-5 px-4">
                    {new_Items.map((item) => {
                        const isHoverd = newHoveredPid === item.pid;

                        return(
                            <div
                                key={item.pid}
                                className="flex flex-col 
                                    lg:px-4 md:px-2 px-[2px]
                                    w-full/4
                                    h-auto mb-10 cursor-pointer"
                                onMouseEnter={() => setNewHoveredPid(item.pid)}
                                onMouseLeave={() => setNewHoveredPid(null)}
                                onClick={() => navigate(`/none_custom_detail?pid=${item.pid}&category=${item.category}`)}
                            >   
                                {/* 기본 이미지 */}
                                <div className="
                                        flex justify-center items-center w-full aspect-[292/292] overflow-hidden
                                        bg-white">
                                    <div className="w-full h-full">
                                        <img 
                                            className="h-[100%] w-[100%] object-contain"
                                            style={{ boxShadow: '8px 8px 10px rgba(0,0,0,0.2)'}} 
                                            src={isHoverd ? item.hoverImageUrl : item.imageUrl} 
                                            alt={item.title} 
                                        />
                                    </div>
                                </div>

                                <span className="
                                    lg:text-[18px] text-[clamp(16px,1.759vw,18px)]
                                    line-clamp-1
                                    font-bold mt-4">{item.title}</span>

                                <span className="
                                    lg:text-[14px] text-[clamp(13.5px,1.368vw,14px)]
                                    font-bold text-[#CDC9C3]">
                                    {item.author}
                                </span>

                                <span className="mt-[2px] font-semibold text-[#d0ac88]">
                                    {newPriceMap[item.pid] != null ? (
                                        <SitePriceRow
                                            unitPrice={newPriceMap[item.pid]}
                                            quantity={1}
                                            suffix="~"
                                            neutralClassName={`${SITE_PRICE_TEXT} font-semibold text-[#d0ac88]`}
                                        />
                                    ) : (
                                        ''
                                    )}
                                </span>

                                <hr className="my-1" />
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* 🔶 리뷰 썸네일 슬라이더 영역 */}
            <div
                ref={reviewSectionRef}
                className={`transition-all duration-700 ease-out ${
                    visibleSections.review
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-6'
                }`}
            >
                <h2 className='
                    md:text-[30px] sm:text-[clamp(24px,3.911vw,30px)] text-[clamp(18px,3.755vw,24px)]
                    font-bold mb-2 text-center'>고객 리뷰</h2>
                <p className="
                    md:text-base text-[clamp(11px,2.086vw,16px)]
                    text-center text-gray-600 ">
                    실제 고객님들의 생생한 후기를 확인해보세요.
                </p>
                <div className="relative overflow-hidden mt-3">
                    <div className="flex transition-transform duration-500 ease-in-out"
                        style={{ transform: `translateX(-${reviewIndex * (100 / reviewVisibleCount)}%)` }} // 4등분(25%)씩 이동
                    >
                        {topThumbnailReviews.map((review, i) => (
                            <div key={i} className="w-1/2 md:w-1/3 flex-shrink-0 px-3 cursor-pointer"
                                onClick={() => setSelectedReview(review)}
                            >
                                <img
                                    src={review.images?.[0]}
                                    alt="리뷰 이미지"
                                    className="w-full aspect-[300/240] object-cover"
                                />
                                <div className="py-2">
                                    <div className="
                                        md:text-base text-[clamp(14px,2.085vw,16px)]
                                        text-orange-400 mb-1">
                                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                    </div>
                                    <div className="
                                        md:text-lg text-[clamp(15px,2.3455vw,18px)]
                                        font-semibold truncate mb-0.5">
                                        {review.title}
                                    </div>
                                    <div className="
                                        md:text-base text-[clamp(12px,2.085vw,16px)]
                                        text-gray-500 truncate">
                                        {review.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {topThumbnailReviews.length > reviewVisibleCount && (
                        <div className="absolute top-1/3 -translate-y-1/2 w-full flex justify-between px-2 z-10">
                            <button
                                onClick={() => {
                                        const maxIndex = Math.max(0, topThumbnailReviews.length - reviewVisibleCount);
                                        setReviewIndex((prev) => (prev === 0 ? maxIndex : prev -1 ));
                                    }
                                }
                                className="
                                xl:w-10 lg:w-9 md:w-8 w-7
                                xl:h-10 lg:h-9 md:h-8 h-7
                                text-[12px]
                                bg-white shadow-md rounded-full  
                                flex justify-center items-center font-bold hover:bg-gray-100"
                            >
                                <ChevronLeft className="w-full h-full" />
                            </button>
                            <button
                                onClick={() => {
                                        const maxIndex = Math.max(0, topThumbnailReviews.length - reviewVisibleCount);
                                        setReviewIndex((prev) => (prev === maxIndex ? 0 : prev +1 ));
                                    }
                                }
                                className="
                                xl:w-10 lg:w-9 md:w-8 w-7
                                xl:h-10 lg:h-9 md:h-8 h-7
                                text-[12px]
                                bg-white shadow-md rounded-full 
                                flex justify-center items-center font-bold hover:bg-gray-100"
                            >
                                <ChevronRight className="w-full h-full" />
                            </button>
                        </div>
                    )}
                </div>

                <button className="
                    md:text-base text-[clamp(13px,2.085vw,16px)]
                    lg:px-6 md:px-4 px-3
                    lg:py-2 py-1
                    flex mt-2 mx-auto font-semibold text-white bg-[#303030] rounded hover:bg-opacity-80"
                    onClick={() => navigate('/reviewBoard')}
                >
                    리뷰 더보기
                </button>
            </div>
            
            {/* 리뷰 선택 모달창 */}
            {selectedReview && (
                <div
                    className="fixed inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center px-4 py-6 z-[10000]"
                    onClick={() => {
                        setSelectedReview(null);
                        setSelectedImageIndex(0);
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="
                            relative flex flex-col w-full max-w-[620px]
                            max-h-[88vh] overflow-hidden
                            rounded-2xl bg-white shadow-2xl
                            border border-gray-100
                        "
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 헤더 */}
                        <div className="flex shrink-0 items-center justify-between px-3 md:px-2 md:py-2 bg-white/95 backdrop-blur border-gray-100">
                            <p className="text-[14px] md:text-[16px] font-semibold text-gray-900">
                                리뷰 상세보기
                            </p>
                            <button
                                aria-label="모달 닫기"
                                className="w-8 h-8 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
                                onClick={() => {
                                    setSelectedReview(null);
                                    setSelectedImageIndex(0);
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 md:px-5 md:pb-5">
                            {/* 메인 이미지 */}
                            <div className="w-full aspect-[4/3] rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                                <img
                                    src={selectedReview.images?.[selectedImageIndex]}
                                    alt={`상세 이미지 ${selectedImageIndex + 1}`}
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>

                            {/* 썸네일 */}
                            <div className="mt-2 md:mt-3 flex flex-wrap justify-center gap-2">
                                {selectedReview.images?.map((img, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        className={`
                                            w-[58px] h-[58px] rounded-lg overflow-hidden border transition
                                            ${idx === selectedImageIndex
                                                ? "border-gray-900 ring-2 ring-gray-900/20"
                                                : "border-gray-200 hover:border-gray-400"}
                                        `}
                                        onClick={() => setSelectedImageIndex(idx)}
                                    >
                                        <img
                                            src={img}
                                            alt={`썸네일 ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>

                            {/* 텍스트 정보 */}
                            <div className="mt-5">
                                <h2 className="text-[18px] md:text-[20px] font-bold text-gray-900 leading-snug">
                                    {selectedReview.title}
                                </h2>

                                <div className="flex flex-col items-start">
                                    <span className="
                                        inline-flex items-center rounded-full text-orange-400 py-1 mb-1
                                        text-[12px] md:text-[14px] font-semibold"
                                    >
                                        {'★'.repeat(selectedReview.rating)}{'☆'.repeat(5 - selectedReview.rating)}
                                    </span>
                                </div>

                                <p className=" text-[14px] md:text-[16px] text-gray-700 leading-relaxed whitespace-pre-line">
                                    {selectedReview.content}
                                </p>

                                <div className="mt-4 pt-3 border-t border-gray-100 text-[12px] text-gray-500 flex justify-between">
                                    작성자: {selectedReview.id?.slice(0, 2)}***
                                    <span className="text-[12px] text-gray-500">
                                        {selectedReview.createdAt?.slice(0, 10)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* /🔶 리뷰 썸네일 슬라이더 영역 */}

            {/* 회사 소개 및 디아섹이란 배너 (사진 배경형) */}
            <div
                ref={aboutSectionRef}
                className={`w-full aspect-[600/200] md:aspect-[1300/280] bg-cover bg-center relative flex items-center justify-center transition-all duration-700 ease-out ${
                    visibleSections.about
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-10'
                }`}
                style={{
                    backgroundImage: `url(${aboutBanner})`
                }}
            >
                <div className="absolute inset-0 bg-black bg-opacity-40" /> {/* 어두운 오버레이 */}
                
                <div className="flex flex-col items-center justify-center w-full z-10 text-center text-white md:gap-3 gap-[5px]">
                    <div>
                        <h2 className="
                            text-[clamp(18px,3.5vw,30px)] md:text-3xl 
                            font-bold tracking-tight">
                            디아섹에 대해 더 알고 싶으신가요?
                        </h2>
                        <p className="text-white/80 text-[12.5px] md:text-[17px]">
                            디아섹의 제작 방식과 브랜드 스토리를 확인해보세요
                        </p>
                    </div>

                    <div className="flex justify-center gap-3">

                        {/* 회사소개 */}
                        <button
                            onClick={() => navigate('/main_CompanyProfile')}
                            className="
                                text-[clamp(12px,2.085vw,16px)] md:text-base
                                lg:px-6 md:px-4 px-2
                                lg:py-2 py-[2px]
                                rounded-full
                                bg-white text-[#222]
                                font-semibold
                                shadow-md
                                hover:bg-gray-100
                                hover:scale-105
                                transition-all duration-300
                            "
                        >
                            회사 소개
                        </button>

                        {/* 디아섹이란 */}
                        <button
                            onClick={() => navigate('/introduce')}
                            className="
                            text-[clamp(12px,2.085vw,16px)] md:text-base
                                lg:px-6 md:px-4 px-2
                                lg:py-2 py-[2px]
                                rounded-full
                                border border-white
                                text-white
                                font-semibold
                                backdrop-blur-sm
                                hover:bg-white hover:text-[#222]
                                hover:scale-105
                                transition-all duration-300
                            "
                        >
                            디아섹이란?
                        </button>
                    </div>
                </div>
            </div>
            {/* /회사 소개, 디아섹이란 */}

            {/* 이벤트 팝업창 */}
            <MainEventPopup events={events} />
        </div>
    );
};

export default Main;