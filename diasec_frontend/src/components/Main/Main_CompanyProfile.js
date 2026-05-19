import { useEffect, useRef, useState } from "react";

import p0 from '../../assets/company/0.jpg'
import p1 from '../../assets/company/1.jpg'
import p2 from '../../assets/company/2.jpg'
import p3 from '../../assets/company/3.jpg'
import p5 from '../../assets/company/5.jpg'
import p6 from '../../assets/company/6.jpg'
import p7 from '../../assets/company/7.jpg'
import i1 from '../../assets/company/i1.jpg'
import i2 from '../../assets/company/i2.png'
import i3 from '../../assets/company/i3.png'
import i4 from '../../assets/company/i4.png'
import logoType from '../../assets/CompanyProfile/logoType.jpg'
import logo from '../../assets/company/logo.png'

import bus from '../../assets/CompanyProfile/bus.jpg'
import car from '../../assets/CompanyProfile/car.jpg'
import time from '../../assets/CompanyProfile/time.jpg'
import subway from '../../assets/CompanyProfile/subway.jpg'

const Main_CompanyProfile = () => {
    // 카카오지도 API
    const KAKAO_KEY = process.env.REACT_APP_KAKAO_JS_KEY;

    // 실제 주소
    const COMPANY = {
        name: "디아섹코리아",
        address: "경기도 고양시 덕양구 통일로 140 삼송 테크노벨리 A동 355호 (10594)",
        phone: "010-4231-5879",
    };

    const mapRef = useRef(null);
    const kakaoLoadedRef = useRef(false);
    const [mapError, setMapError] = useState(null);

    // 카카오 스크립트 로드 함수 (컴포넌트 안에서 끝내기)
    const loadKakaoScript = () => {
        return new Promise((resolve, reject) => {

            // 이미 스크립트 태그가 있음
            const existing = document.querySelector('script[data-kakao-map="true"]');
            if (existing) {
                existing.addEventListener("load", () => resolve(window.kakao));
                existing.addEventListener("error", () => reject(new Error("카카오 지도 로드 실패")));
            }

            const script = document.createElement("script");
            script.async = true;
            script.defer = true;
            script.dataset.kakaoMap = "true";
            script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_KEY}&autoload=false&libraries=services`;

            script.onload = () => resolve(window.kakao);
            script.onerror = () => reject(new Error("카카오 지도 스크립트 로드 실패"));

            document.head.appendChild(script);
        });
    };

    useEffect(() => {
        if (!KAKAO_KEY) {
            setMapError("REACT_APP_KAKAO_JS_KEY가 없습니다 (.env 확인)");
            return;
        }
        if (!mapRef.current) return;
        if (kakaoLoadedRef.current) return;

        let mounted = true;
        let resizeHandler = null;
        let mediaQuery = null;

        (async () => {
            try {
                const kakao = await loadKakaoScript();
                if (!mounted) return;

                // autoload=false라서 load 호출 필요
                kakao.maps.load(() => {
                    if (!mounted) return;

                    kakaoLoadedRef.current = true;

                    // 지도 먼저 생성 (임시 중심)
                    const map = new kakao.maps.Map(mapRef.current, {
                        center: new kakao.maps.LatLng(37.5665, 126.9780),
                        level: 3,
                    });

                    // 주소 -> 좌표 변환
                    const geocoder = new kakao.maps.services.Geocoder();
                    geocoder.addressSearch(COMPANY.address, (result, status) => {
                        if (!mounted) return;

                        if (status !== kakao.maps.services.Status.OK || !result?.[0]) {
                            setMapError("주소를 좌표로 변환하지 못했습니다. 주소를 확인해 주세요.");
                            return;
                        }

                        const {y, x} = result[0];
                        const pos = new kakao.maps.LatLng(37.6486, 126.9036);


                        // 지도 중심을 마커 위치로 이동
                        map.setCenter(pos);

                        const mediaQuery = window.matchMedia("(min-width: 640px)");
                        
                        const updateMapLevel = () => {
                            // 지도 크기 조정
                            map.setLevel(mediaQuery.matches ? 5 : 6);
                        };

                        updateMapLevel();

                        // 마커
                        const marker = new kakao.maps.Marker({ position: pos });
                        marker.setMap(map);

                        const label = document.createElement("span");
                        label.textContent = "디아섹코리아";

                        label.style.setProperty("display", "inline-flex", "important");
                        label.style.setProperty("align-items", "center", "important");
                        label.style.setProperty("justify-content", "center", "important");
                        label.style.setProperty("width", "max-content", "important");
                        label.style.setProperty("max-width", "none", "important");
                        label.style.setProperty("min-width", "0", "important");

                        label.style.height = "22px";
                        label.style.padding = "0 8px";
                        label.style.fontSize = "12px";
                        label.style.fontWeight = "700";
                        label.style.lineHeight = "22px";
                        label.style.whiteSpace = "nowrap";
                        label.style.background = "#fff";
                        label.style.border = "1px solid #3b82f6";
                        label.style.borderRadius = "4px";
                        label.style.boxShadow = "0 1px 4px rgba(0,0,0,0.15)";

                        const overlay = new kakao.maps.CustomOverlay({
                            position: pos,
                            content: label,
                            yAnchor: 2.6,
                        });

                        overlay.setMap(map);

                        resizeHandler = () => {
                            kakao.maps.event.trigger(map, "resize");
                            updateMapLevel();
                            map.setCenter(pos);
                        };

                        mediaQuery.addEventListener("change", resizeHandler);
                    });
                });
            } catch (e) {
                if (!mounted) return;
                setMapError(e?.message || "지도 로딩 실패");
            }
        })();

        return () => {
            mounted = false;
            if (mediaQuery && resizeHandler) {
                mediaQuery.removeEventListener("change", resizeHandler);
            }
        };
    }, [KAKAO_KEY]);

    const history = [
        {
            year: "2007",
            title: "디아섹액자 개발",
            text: 
                `아크릴 헤어핀 공장으로 출발해 자체 생산을 이어가던 당사는
                차별화된 제품을 만들기 위해 아크릴판의 독창적인 무늬 개발에 도전하게 되었습니다. 
                수많은 실험과정을 거쳐 아크릴판과 아크릴판 사이에 인쇄물을 넣어 합지하는 방식을 고안했고,
                이를 통해 독특한 디자인의 헤어핀을 제작하여 큰 매출 향상을 이루게 되었습니다. 
                이 기술이 훗날 디아섹액자 개발의 단초가 되었으며,
                2004년부터 3년간 연구 끝에, 2007년 마침내 디아섹액자 개발에 성공하였습니다`,
            img:p1
        },
        {
            year: "2008",
            title: "화학시험 성적서 인증",
            text: 
                `디아섹 개발이 완료되던 시점, 지인의 소개로 GS홈쇼핑 협력업체를 만나 
                홈쇼핑 판매 제안을 받게 되었습니다.
                GS홈쇼핑 판매을 위해서는 제품 안전성 검증이 필수였기에 
                국가공인 기관인 한국화학시험연구원에서 유해 성분 검출 여부, 본드 성분의 안전성, 
                접합부 박리 강도 등 다양한 항목에 대한 안전성에 대한 인증서를 취득하였습니다. 
                이 과정을 통해 GS홈쇼핑 담당자로부터 판매 승인을 받을 수 있었습니다.`,
            img:p2
        },
        {
            year: "2009",
            title: "GS홈쇼핑 방송",
            text: 
                `2009년 4월 19일 오후 8시, 수많은 우여곡절 끝에 GS홈쇼핑 방송이 성사되었습니다. 
                당시 디아섹액자는 대중에게 매우 생소했지만, 
                마침 클림트 작품이 예술의 전당에서 전시 중이었고 오리지널 원고를 사용한 제품이라는 점에서 주목을 받았습니다. 
                비교적 고가임에도 불구하고 많은 판매 실적을 기록했습니다.`,
            video: "https://www.youtube.com/embed/DGXygPEZsf4"
        },
        {
            year:"2016",
            title:"삼송테크노밸리 아파트형 공장",
            text:
                `오랜 기간 역촌동 지하에서 작업을 이어오던 당사는 
                2016년 6월 고양 삼송테크노밸리 아파트형 공장(약 50평)으로 이전하였습니다. 
                첨단 설비와 쾌적한 환경을 갖춘 새 공간에서 
                보다 안정적이고 고품질의 디아섹액자를 생산할 수 있게 되었습니다.`,
            img:p5
        },
        {
            year:"2023",
            title:"대형 액자 프레임 개발 ",
            text:
                `장기 보존성이 특징인 디아섹액자는 일정 크기 이상으로 커질 경우 
                일반적인 프레임만으로는 장기적인 안정성을 확보하기 어렵습니다. 
                당사는 오랜 제작 경험을 바탕으로 대형 사이즈에서도 안전하게 지탱할 수 있는 
                전용 대형프레임을 자체 개발하였으며, 
                이를 보호하기 위해 실용신안 출원을 추진하고 있습니다
                이를 통해 초대형 작품도 뒤틀림이나 처짐 없이 오래도록 
                견고하게 보존할 수 있습니다`,
            img:p6
        },
        {
            year:"2026",
            title:"쇼핑몰 개설",
            text:
                `보다 많은 고객이 편리하게 디아섹액자를 만나볼 수 있도록 
                2026년 자체 쇼핑몰을 오픈했습니다`,
            img:p7
        }
    ]

    const strengths = [
        {
            icon: <img src={i1} className="w-32 h-32 text-[#a67a3e]" />,
            title:"초간편 멀티 주문시스템",
            desc: 
                `액자 사이즈를 자유로이 볼 수 있으며 동시에 원하는 사이즈와 가격이 실시간으로 함께 표시되어 주문이 간편합니다`
        },
        {
            icon: <img src={i2} className="w-32 h-32 text-[#a67a3e]" />,
            title:"세계명화의 고해상 원본 보유",
            desc:
                `대형 액자로 제작하여도 원본에서 느껴지는 붓 터치의 섬세함까지도 살아있는 선명한 화질을 재현합니다`
        },
        {
            icon: <img src={i3} className="w-32 h-32 text-[#a67a3e]" />,
            title:"품질보증 10년",
            desc: 
                `검증된 자재와 정밀한 압착 공법으로 제작하여 장기 보존과 안전성을 확보했습니다. 다아섹코리아는 이에 대한 책임으로 10년 품질보증을 제공합니다`
        },
        {
            icon: <img src={i4} className="w-32 h-32 text-[#a67a3e]" />,
            title:"홍대 시각디자이너의 감성",
            desc: 
                `2007년 디아섹을 개발한 홍대 시각 디자이너가 운영하는 디아섹코리아입니다`
        },
    ]
    
    return (
        <div className="flex flex-col w-full break-keep">
            
            {/* Hero 배너 */}
            <div className="w-full bg-gray-800 flex items-center justify-center relative">
                <img src={p0} />
            </div>

            <span className="
                md:text-[10px] text-[clamp(7px,1.303vw,10px)]
                text-right opacity-50">
                    *위 사진은 이해를 돕기 위한 이미지입니다.
            </span>

            <h2 className="
                text-[clamp(26px,6.258vw,48px)] md:text-5xl
                text-center text-[#b19376] 
                mt-16 md:mt-24 
                font-bold leading-tight px-4"
            >
                <span>The Standard of Korea, </span><br className="md:hidden"/>
                <span>DIASEC KOREA</span>
            </h2>

            <p className="
                text-center text-gray-500  mt-5 break-keep
                text-[clamp(13px,1.8vw,17px)] px-6
            ">
                19년간 오직 디아섹 공법에만<br className="md:hidden" /> 집중해온 전문 제작 브랜드입니다<br/>
                자체 생산 시스템과 축적된 기술력을 바탕으로<br className="md:hidden" /> 대한민국 디아섹 제작의 기준을 만들어가고 있습니다<br/>
                쇼핑몰 오픈과 함께 디아섹코리아의 브랜드를 소개합니다

                {/* 문구 수정 컨펌 받기@@@@@@@@@@@@@@@@@@@@@@@ */}
                {/* 19년간 오직 디아섹 공법에 집중해온 전문 제작 브랜드
                디아섹코리아입니다.<br/>

                자체 생산 시스템과 축적된 기술력을 바탕으로
                대한민국 디아섹 제작의 기준을 만들어가고 있습니다. */}
            </p>

            <div className="w-full flex justify-center">
                <img className="max-w-6xl w-full" src={logoType} />
            </div>

            {/* <div className="max-w-6xl mx-auto px-6 mt-8">
                <div className="rounded-[32px] bg-[#faf8f5] border border-[#efe7de] px-6 py-8 md:px-10 md:py-12">
                    <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-8 lg:gap-12 items-center">

                        <div className="flex justify-center">
                            <div className="w-full max-w-[500px]">
                                <div className="
                                    relative overflow-hidden
                                    rounded-[28px]
                                    bg-white
                                    border border-[#ede5dc]
                                    shadow-[0_10px_30px_rgba(0,0,0,0.06)]
                                    px-8 py-10 md:px-12 md:py-14
                                ">

                                    <div className="absolute inset-0 bg-gradient-to-br from-[#ffffff] via-[#fcfaf8] to-[#f5efe8]" />

                                    <div className="relative flex items-center justify-center min-h-[260px] md:min-h-[320px]">
                                        <img 
                                        src={logo}
                                            alt="디아섹코리아 로고"
                                            className="w-full max-w-[310px] md:max-w-[360px] h-auto object-contain" 
                                        />
                                    </div>  
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="space-y-4 md:space-y-5">
                                <div className="
                                    rounded-2xl border border-[#e8dfd5] bg-white 
                                    p-5 md:p-6 
                                    shadow-[0_6px_20px_rgba(0,0,0,0.04)]
                                    transition duration-300 hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(0,0,0,0.07)]    
                                ">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-[#b19376] text-white flex items-center justify-center text-sm font-bold shrink-0">
                                            1
                                        </div>
                                        <div>
                                            <h4 className="text-[18px] font-bold text-gray-900">정사각 프레임</h4>
                                            <p className="text-gray-600 leading-relaxed break-keep mt-2 text-[15px]">
                                                작품을 하나의 판재로 완성하는 디아섹 제작 방식의 견고함과 구조감을 상징합니다
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="
                                    rounded-xl border border-[#e8dfd5] bg-white 
                                    p-5 md:p-6 
                                    shadow-[0_6px_20px_rgba(0,0,0,0.04)]
                                    transition duration-300 hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(0,0,0,0.07)]
                                ">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-[#b19376] text-white flex items-center justify-center text-sm font-bold shrink-0">
                                            2
                                        </div>
                                        <div>
                                            <h4 className="text-[18px] font-bold text-gray-900">아크릴 광택 표현</h4>
                                            <p className="text-gray-600 leading-relaxed break-keep mt-2 text-[15px]">
                                                아크릴 표면의 깊이 있는 광택과 디아섹 특유의 선명한 이미지 표현을 시각적으로 담아냈습니다
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="
                                    rounded-xl border border-[#e8dfd5] bg-white 
                                    p-5 md:p-6 
                                    shadow-[0_6px_20px_rgba(0,0,0,0.04)]
                                    transition duration-300 hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(0,0,0,0.07)]
                                ">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-[#b19376] text-white flex items-center justify-center text-sm font-bold shrink-0">
                                            3
                                        </div>
                                        <div>
                                            <h4 className="text-[18px] font-bold text-gray-900">로고 타이포그래피</h4>
                                            <p className="text-gray-600 leading-relaxed break-keep mt-2 text-[15px]">
                                                대한민국 디아섹 제작의 기준이 되고자 하는 의지와 흔들림 없는 기술력을 담았습니다
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div> */}

            <h2 className="
                text-[clamp(24px,6.258vw,48px)] md:text-5xl
                text-center text-[#b19376] mt-32 font-bold"
            >
                DIASEC KOREA HISTORY
            </h2>

            {/* 연혁 타임라인 */}
            <div className="max-w-6xl mx-auto pt-8 md:pt-16 mb-8 md:pb-16 px-6 space-y-20 md:space-y-16">
                {history.map((item, idx) => (
                    <div
                        key={idx}
                        className={`flex flex-col md:flex-row ${
                        idx % 2 === 1 ? "md:flex-row-reverse" : ""
                        } items-center justify-center max-w-4xl gap-8`}
                    >
                    {/* 이미지 자리 */}
                    <div className="
                        sm:w-1/2 w-full
                        flex items-center justify-center h-64">
                        
                        {item.video ? (
                            <iframe
                                src={item.video}
                                title="GS홈쇼핑 방송 영상"
                                frameBorder="0"
                                allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="w-full h-64 rounded-lg"
                                ></iframe>
                        ) : (
                            <img
                                src={item.img}
                                className="w-auto max-h-full rounded-lg object-contain"
                            />
                        )}
                        {/* <img src={item.img} className="w-auto max-h-full rounded-lg object-contain" /> */}
                    </div>

                    {/* 텍스트 */}
                    <div className="w-full md:w-1/2">
                        <span className="
                            text-[#a67a3e] font-bold 
                            md:text-lg text-[clamp(13px,2.346vw,18px)]">
                            {item.year}s
                        </span>
                        <h2 className="
                            text-[clamp(16px,3.128vw,24px)] md:text-2xl 
                            mt-[-4px] font-bold"
                        >
                                {item.title}
                        </h2>
                        <p className="
                            md:text-base text-[clamp(14px,2.085vw,16px)]
                            text-gray-600 break-keep">{item.text}</p>
                    </div>
                </div>
            ))}
        </div>

        <div className="bg-gray-50 py-20">
            <div className="max-w-6xl mx-auto px-6 text-center">
                <h2 className="
                    text-[clamp(22px,4.693vw,36px)] md:text-4xl 
                    font-bold text-gray-800 md:mb-4 mb-1
                    "
                >
                    디아섹코리아 쇼핑몰의 강점
                </h2>
                <hr className="border-[1px] border-[#a67a3e]"/>

                <div className="
                    grid
                    sm:grid-cols-2 grid-cols-1
                    mt-4
                    gap-8">
                    {strengths.map((s, idx) => (
                        <div
                            key={idx}
                            className="bg-white rounded-xl shadow hover:shadow-lg transition p-8 flex flex-col items-center text-center"
                        >
                            <div className="">{s.icon}</div>
                            <h3 className="
                                md:text-xl text-[clamp(16px,2.085vw,20px)] 
                                font-semibold text-gray-800">
                                {s.title}
                            </h3>
                            <p className="
                                text-[clamp(14px,2.085vw,16.5px)] md:text-[16.5px]
                                break-keep
                                text-gray-600 whitespace-pre-line leading-relaxed">{s.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* 미래 비전 */}
        <div className="py-20 text-[#c99561] text-center">
                <h2 className="
                    text-[clamp(19px,4.693vw,36px)] md:text-4xl
                    font-bold break-keep">
                    오직 디아섹액자만을 위한 최선의 노력으로
                </h2>
                <h2 className="
                    text-[clamp(19px,4.693vw,36px)] md:text-4xl 
                    break-keep md:mt-3 mt-[2px] text-3xl font-bold">
                        고객에 만족을 드리고자 합니다
                </h2>
            </div>
            
            {/* 지도 */}
            {/* 회사 위치 / 지도 */}
            <div className="max-w-6xl mx-auto w-full px-6">
                <h2 className="text-left font-bold text-[#4b4b4b] text-[16px] md:text-[18px] mb-3"
                >
                    회사주소 : 경기도 고양시 덕양구 통일로 140 삼송 테크노벨리 A동 355호 (10594)
                </h2>
                
                {/* 지도 */}
                <div className="w-full border bg-white overflow-hidden">
                    <div className="w-full aspect-[1300/520]">
                        <div ref={mapRef} className="w-full h-full" />
                    </div>
                </div>

                {mapError && (
                    <div className="mt-2 text-red-500 text-sm">{mapError}</div>
                )}

                {/* 아래 안내 표 */}
                <div className="mt-8 border-t text-[clamp(11px,1.2vw,14px)]">
                    <div className="grid grid-cols-[110px_1fr] md:grid-cols-[160px_1fr] border-b">
                        <div className="flex items-center py-4 font-semibold text-gray-700">
                            <img src={time} className="w-10 h-10" / >
                            운영 시간
                        </div>
                        <div className="flex flex-col py-4 text-gray-700">
                            <span className="font-semibold text-black">평일 09:00 ~ 18:00 (13:00 ~ 14:00 점심시간) <br/> 토·일요일, 공휴일 휴무</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-[110px_1fr] md:grid-cols-[160px_1fr] border-b">
                        <div className="flex items-center py-4 font-semibold text-gray-700">
                            <img src={car} className="w-10 h-10" / >
                            <span></span>승용차 이용시
                        </div>
                        <div className="flex flex-col py-4 text-gray-700">
                            <span>네비게이션 주소: {COMPANY.address}</span>
                            <span>Tip : 자동차로 3층까지 올라오십시오 (기둥번호 2번) / 주차가능</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-[110px_1fr] md:grid-cols-[160px_1fr] text-[clamp(11px,1.2vw,14px)] border-b">
                    <div className="flex items-center py-4 font-semibold text-gray-700">
                        <img src={bus} className="w-10 h-10" / >
                        <span></span>버스 이용시
                    </div>
                    <div className="py-4 text-gray-700">
                        <div className="font-semibold text-black">정류소명 : 삼송 한국지역난방공사</div>
                        <div className="flex flex-col text-gray-500 mt-1">
                            <span>
                                경기북부(파주·삼송)에서 오시는 길 → N37, 17, 30, 31, 55, 567, 571, 701, 703, 705, 706, 708, 720, 730, 741, 773, 774, 761, 8722, 9703, 9709 (26년 현재)
                            </span>
                            <span>
                                서울방향에서 오시는 길 → 17, 374, 567, 703, 705, 730, 790 (26년 현재)
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-[110px_1fr] md:grid-cols-[160px_1fr] text-[clamp(11px,1.2vw,14px)]">
                    <div className="flex items-center py-4 font-semibold text-gray-700">
                        <img src={subway} className="w-10 h-10" / >
                        <span>지하철 이용시</span>
                    </div>
                    <div className="py-4 text-gray-700">
                        <div className="flex flex-col text-gray-500">
                            <span>지축역 1번 출구 → 도보 약20분거리</span>
                            <span>삼송역 1번 출구 → 도보 약20분거리</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default Main_CompanyProfile;