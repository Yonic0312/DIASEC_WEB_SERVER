import { useEffect,useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from "lucide-react";
import p7 from '../../assets/p7.jpg'
import p7_1 from '../../assets/p7_1.png'
import p8 from '../../assets/p8.jpg'
import p8_1 from '../../assets/p8_1.png'
import p8_2 from '../../assets/p8_2.png'
import p9 from '../../assets/p9.jpg'
import p9_1 from '../../assets/p9_1.png'
import p10 from '../../assets/p10.jpg'
import p10_2 from '../../assets/p10_2.png'

const images = [
    { src: p8, text: p8_1, img:p8_2, },
    { src: p7, text: p7_1,},
    { src: p9, text: p9_1,}, // 9_1
    { src: p10, text: p10_2,},
];

const Main_Image = () => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const intervalRef = useRef(null);

    const DARKEN_DURATION_MS = 3000; // 몇 초 동안 어두워질지
    const TRANSITION_MS = 1000; // 슬라이드 옆으로 이동하는 시간
    const DARKEN_MAX = 0.4;
    const [darkOpacity, setDarkOpacity] = useState(0);
    const [prevIndex, setPrevIndex] = useState(null);
    const [prevHoldOpacity, setPrevHoldOpacity] = useState(0);
    const prevTimeoutRef = useRef(null);
    const darkOpacityRef = useRef(0);
    const isManualRef = useRef(false);
    const overlayRefs = useRef([]);
    const [overlayImgVisible, setOverlayImgVisible] = useState(false);
    const [prevOverlayImgVisible, setPrevOverlayImgVisible] = useState(false);
    const overlayImgTimerRef = useRef(null);
    const overlayImgVisibleRef = useRef(false);

    const goTo = (next) => {
        isManualRef.current = true;

        if (intervalRef.current) clearInterval(intervalRef.current);

        const prevOverlayEl = overlayRefs.current[currentIndex];
        const visibleOpacity = prevOverlayEl
            ? parseFloat(getComputedStyle(prevOverlayEl).opacity) || 0
            : 0;

        setPrevHoldOpacity(visibleOpacity);
        setPrevOverlayImgVisible(overlayImgVisible);

        setPrevIndex(currentIndex);
        setCurrentIndex(next);

        if (prevTimeoutRef.current) clearTimeout(prevTimeoutRef.current);
        prevTimeoutRef.current = setTimeout(() => {
            setPrevIndex(null);
            isManualRef.current = false;
        },TRANSITION_MS);

        startSlider();
    }

    useEffect(() => {
        // 슬라이드 바뀔 때마다 다시 시작
        setDarkOpacity(0);

        const raf = requestAnimationFrame(() => {
            setDarkOpacity(DARKEN_MAX);
        });

        return () => cancelAnimationFrame(raf);
    }, [currentIndex]);

    // 2번 이미지 바뀔때 이미지 등장 타이머 관리
    useEffect(() => {
        if (overlayImgTimerRef.current) {
            clearTimeout(overlayImgTimerRef.current);
        }

        setOverlayImgVisible(false);

        if (images[currentIndex]?.img) {
            overlayImgTimerRef.current = setTimeout(() => {
                setOverlayImgVisible(true);
            }, 1800);
        }

        return () => {
            if (overlayImgTimerRef.current) {
                clearTimeout(overlayImgTimerRef.current);
            }
        };
    }, [currentIndex]);

    useEffect(() => {
        overlayImgVisibleRef.current = overlayImgVisible;
    }, [overlayImgVisible]);

    useEffect(() => {
        darkOpacityRef.current = darkOpacity;
    }, [darkOpacity]);

    const startSlider = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);

        intervalRef.current = setInterval(() => {
            isManualRef.current = false;

            setCurrentIndex((prev) => {
                setPrevIndex(prev);

                // 자동일 때는 항상 최대 어두움으로 "이전 슬라이드" 고정
                setPrevHoldOpacity(DARKEN_MAX);
                setPrevOverlayImgVisible(overlayImgVisibleRef.current);
            
                const next = (prev + 1) % images.length;

                if (prevTimeoutRef.current) clearTimeout(prevTimeoutRef.current);
                prevTimeoutRef.current = setTimeout(() => {
                    setPrevIndex(null);
                    setPrevOverlayImgVisible(false);
                }, TRANSITION_MS);

                return next;
            });
        }, 6000); // 한 슬라이드 머무는 총 시간
    };

    useEffect(() => {
        startSlider();
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    const handleIndicatorClick = (index) => goTo(index);

    // 좌우 버튼
    const handlePrev = () => {
        const next = (currentIndex - 1 + images.length) % images.length;
        goTo(next);
    };

    const handleNext = () => {
        const next = (currentIndex + 1) % images.length;
        goTo(next);
    }

    return (
        <div className="relative w-full aspect-[1300/600] xl:aspect-auto h-auto xl:h-[600px] overflow-hidden flex justify-center">
            {/* 슬라이더 wrapper */}
            <div className="relative w-full h-full overflow-hidden">
                <div className="flex w-full h-full justify-center transition-transform duration-[1100ms] absolute" // ms부분 수정하면 속도 조절 가능
                    style={{ 
                        transform: `translateX(-${currentIndex * 25}%)`, 
                        width: `${images.length * 100}%` }}
                >   

                        {/* 이미지 ☆ */}
                        {images.map((img, idx) => {
                            const isActive = idx === currentIndex;
                            const isPrev = idx === prevIndex;

                            const isNoDarkSlide = idx === 0;
                            // const isNoDarkSlide = idx === 0;

                            const overlayOpacity = isNoDarkSlide
                                ? 0
                                : isActive
                                    ? darkOpacity
                                    : isPrev
                                        ? prevHoldOpacity
                                        : 0;
                             const overlayImgOpacity =
                                isActive
                                    ? (overlayImgVisible ? 1 : 0)
                                    : isPrev
                                        ? (prevOverlayImgVisible ? 1 : 0)
                                        : 0;

                            return(
                                <div key = {idx} className="relative flex w-full h-full justify-center">
                                    {/* 배경 이미지 */}
                                    <img 
                                        src = {img.src}
                                        className="w-auto h-full object-cover mx-auto"
                                        alt=""
                                    />
                                    
                                    {/* 이미지 나타나는 것 (희원님) */}
                                    {img.img && (
                                        <img
                                            src = {img.img}
                                            className="absolute w-auto h-full object-cover mx-auto"
                                            alt=""
                                            style={{
                                                opacity: overlayImgOpacity,
                                                transition: isActive
                                                    ? 'opacity 2500ms ease'
                                                    : isPrev
                                                        ? 'none'
                                                        : 'opacity 300ms ease',
                                            }}
                                        />
                                    )}

                                    {/* 어두워지는 오버레이 */}
                                    <div
                                        ref={(el) => (overlayRefs.current[idx] = el)}
                                        className="absolute inset-0 pointer-events-none"
                                        style={{
                                            background: "black",
                                            opacity: overlayOpacity,
                                            transition: isNoDarkSlide 
                                                ? "none" 
                                                : isActive
                                                    ? `opacity ${DARKEN_DURATION_MS}ms linear` 
                                                    : "none",
                                        }}
                                    />

                                    <img 
                                        src={img.text}
                                        alt=""
                                        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                                    />
                                </div>
                            )
                        })}
                </div>

                {/* 텍스트 오버레이 (현재 이미지에만 표시됨) */}
                {/* <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-white text-center px-4 pointer-events-none whitespace-pre-line">
                    <h2
                        key={currentIndex + '-title'}
                        className="
                        lg:text-[44px] md:text-[clamp(38px,2.6vw,44px)] sm:text-[clamp(30px,5.084vw,39px)] text-[clamp(16px,4.694vw,30px)]
                        font-bold opacity-0 animate-fadeIn"
                        style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.6)' }}
                        >
                        {images[currentIndex].title}
                    </h2>

                    <p
                        key={currentIndex + '-desc'}
                        className="xl:mt-4 lg:mt-3 md:mt-2
                        lg:text-[22px] md:text-[clamp(20px,2.15vw,22px)] sm:text-[clamp(17px,2.607vw,20px)] text-[clamp(9px,2.66vw,17px)]
                        font-bold opacity-0 animate-fadeIn delay-200"
                        style={{ textShadow: '2px 2px 5px rgba(0, 0, 0, 0.95)' }}
                        >
                        {images[currentIndex].desc}
                    </p>
                </div> */}
            </div> 

            {/* 버튼 */}
            <button
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20
                            flex items-center justify-center
                            xl:w-12 lg:w-11 md:w-10 w-8
                            xl:h-12 lg:h-11 md:h-10 h-8
                            rounded-full bg-black/30 
                            md:hover:bg-black/70 active:bg-black/80
                            text-white shadow-lg transition"
            >
                <ChevronLeft className="w-6 h-6 md:w-8 md:h-8"/>
            </button>

            <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20
                            flex items-center justify-center
                            xl:w-12 lg:w-11 md:w-9 w-7
                            xl:h-12 lg:h-11 md:h-9 h-7
                            rounded-full bg-black/30 
                            md:hover:bg-black/70 active:bg-black/80
                            text-white shadow-lg transition"
            >
                <ChevronRight className="w-6 h-6 md:w-8 md:h-8"/>
            </button>

            {/* 하단 인디케이터*/}
            <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex lg:gap-2 gap-[6px]">
                {images.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => handleIndicatorClick(i)}
                        className={`
                            xl:w-[18px] lg:w-[16px] w-[12px]
                            xl:h-[18px] lg:h-[16px] h-[12px]
                            rounded-full ${i === currentIndex ? 'bg-white' : 'bg-gray-400'} transition-all duration-300`}
                    />
                ))}
            </div>
        </div>
    );
};

export default Main_Image;