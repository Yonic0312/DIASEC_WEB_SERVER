import { useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

import diasec_view from '../../assets/video/diasec_view.mp4';
import P0 from '../../assets/whatDiasec/0.png'
import P1 from '../../assets/whatDiasec/1.jpg'
import P2 from '../../assets/whatDiasec/2.png'
import P3 from '../../assets/whatDiasec/3.jpg'
import P4 from '../../assets/whatDiasec/4.png'
import P5 from '../../assets/whatDiasec/5.png'
import P6 from '../../assets/whatDiasec/6.png'
import P7 from '../../assets/whatDiasec/7.jpg'
import P8 from '../../assets/whatDiasec/8.png'
import P9 from '../../assets/whatDiasec/9.jpg'
import P10 from '../../assets/whatDiasec/10.jpg'
import P11 from '../../assets/whatDiasec/11.png'
import P12 from '../../assets/whatDiasec/12.jpg'

import i1 from '../../assets/whatDiasec/i1.jpg'
import i2 from '../../assets/whatDiasec/i2.jpg'
import i3 from '../../assets/whatDiasec/i3.jpg'
import i4 from '../../assets/whatDiasec/i4.jpg'
import i5 from '../../assets/whatDiasec/i5.jpg'
import i6 from '../../assets/whatDiasec/i6.jpg'

const Main_Introduce = () => {

    // 더보기 토글
    const [showMore1, setShowMore1] = useState(false);
    const [showMore2, setShowMore2] = useState(false);
    const [showMore3, setShowMore3] = useState(false);
    const [showMore4, setShowMore4] = useState(false);
    const [showMore5, setShowMore5] = useState(false);
    const [showMore6, setShowMore6] = useState(false);
    const [showMore7, setShowMore7] = useState(false);

    return (
        <div className="w-full flex flex-col break-keep">
            {/* 메인 이미지 */}
            <img src={P0} className="w-full shadow-lg" />

            <div className="flex flex-col mt-10 md:mx-5 mx-[6px] text-gray-800 md:gap-20 gap-10">
                <div className="flex flex-col items-center px-4 md:gap-4 gap-2">
                    <video
                        src={diasec_view}
                        muted
                        autoPlay
                        playsInline
                        loop
                        preload="none"
                        className="
                            w-[800px] mt-10
                            video_product_pc"
                    />
                </div>

                {/* 디아섹이란? */}
                <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-full gap-4 mb-10">
                        <div className="flex-1 border-t-[1px] border-[#D0AC88]"></div>
                        <span className="lg:text-[36px] text-[clamp(26px,3.519vw,36px)] font-bold text-[#D0AC88]">
                            디아섹이란?
                        </span>
                        <div className="flex-1 border-t-[1px] border-[#D0AC88]"></div>
                    </div>
                    <div className="w-full max-w-[850px] flex flex-col justify-center md:flex-row md:items-stretch px-4 gap-8 md:gap-10">
                        <div className="w-full md:w-[30%] shrink-0 overflow-hidden rounded-xl bg-gray-100 shadow-sm ring-1 ring-black/5">
                            <img 
                                className="w-full h-auto object-cover" 
                                src={P12} 
                                alt="디아섹 액자 인테리어 예시"
                            />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 text-left">
                            <h3 className="
                                text-[15px] md:text-[24px]
                                font-bold text-gray-900">
                                이미지를 더 선명하게, 오래도록 보존하는 액자 방식
                            </h3>
                            <span className=" text-[13px] md:text-[19px] leading-relaxed text-gray-600">
                                디아섹(Diasec)은 이미지를 투명 아크릴과 복합판넬 사이에 진공압축을 하여
                                일체형으로 제작되는 액자입니다.
                                이 구조는 이미지의 깊이있는 생동감을 보여주며 장기보존의 원천이 됩니다.
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-full gap-4 mb-5">
                    <div className="flex-1 border-t-[1px] border-[#D0AC88]"></div>
                        <span className="lg:text-[36px] text-[clamp(26px,3.519vw,36px)] font-bold text-[#D0AC88]">
                            디아섹 액자 구조
                        </span>
                        <div className="flex-1 border-t-[1px] border-[#D0AC88]"></div>
                    </div>
                    <img src={P9} />
                </div>

                {/* <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-full gap-4 mb-5">
                        <div className="flex-1 border-t-[1px] border-[#D0AC88]"></div>
                        <span className="lg:text-[36px] text-[clamp(24px,5.865vw,60px)] font-bold text-[#D0AC88]">
                            디아섹의 추가 설명
                        </span>
                        <div className="flex-1 border-t-[1px] border-[#D0AC88]"></div>
                    </div>
                    <img src={P10} />
                </div> */}

                <div>
                    <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center w-full gap-4 mb-10">
                        <div className="flex-1 border-t-[1px] border-[#D0AC88]"></div>
                            <span className="lg:text-[36px] text-[clamp(26px,3.519vw,36px)] font-bold text-[#D0AC88]">
                                디아섹 액자 특징
                            </span>
                            <div className="flex-1 border-t-[1px] border-[#D0AC88]"></div>
                        </div>
                    </div>

                    <div className='flex lg:flex-row flex-col justify-between px-4 gap-10'>
                        {/* 디아섹 액자 특징 1 */}
                        <section className="lg:w-1/3 w-full flex flex-col items-start gap-4">
                            <div className="object-cover w-full">
                                <img src={P7} className="w-full h-auto object-cover rounded-3xl" />
                            </div>
                            <div className="w-full flex-1 text-black flex flex-col">
                                <h2 className="
                                        flex md:justify-center 
                                        text-[clamp(16px,4.381vw,28px)] md:text-[28px]
                                        font-medium text-gray-900 border-b border-gray-300
                                        mb-2 md:mb-4  mb:pb-2 "
                                >
                                    프레임리스
                                </h2>
                                <div className="
                                    text-[clamp(13px,2.085vw,16px)] md:text-base
                                    leading-7 text-700 space-y-2 break-keep">
                                    <p className="leading-relaxed">
                                        테두리 없는 매끄러운 마감은 이미지의 주목률을 
                                        극대화하여 작품 속으로 빨려드는 듯한 압도적인 몰입감을 선사합니다.<br />
                                        전 세계의 사진작가들이 자신의 작품이 가진 에너지를 가장 순수하게 전달하기 위해
                                        디아섹을 선택하는 이유입니다.
                                    </p>
                                </div>
                                
                            </div>
                        </section>

                        {/* 디아섹 액자 특징 2 */}
                        <section className="lg:w-1/3 w-full flex flex-col items-start gap-4">
                            <div className="w-full object-cover">
                                <img src={P4} className="w-full object-cover rounded-3xl" />
                            </div>
                            <div className="flex-1 w-full text-black flex flex-col">
                                <h2 
                                    className="
                                    flex md:justify-center 
                                        text-[clamp(16px,4.381vw,28px)] md:text-[28px]
                                        font-medium text-gray-900 border-b border-gray-300
                                        mb-2 md:mb-4  mb:pb-2 "
                                >
                                    보존성
                                </h2>
                                <div 
                                    className="
                                        md:text-base text-[clamp(13px,2.085vw,16px)] 
                                        leading-7 text-700 space-y-2">
                                    <p className="leading-relaxed break-keep">
                                        평활도를 견고하게 유지하는 알루미늄 복합 패널과<br /> 
                                        견고한 프레임을 일체형의 결합된 구조로 제작함으로<br /> 
                                        휨과 뒤틀림, 박리에 대한 문제점을 해결합니다. <br />
                                        또한 작품의 변색과 퇴색을 막아주는 특수 UV 차단코팅과<br /> 
                                        외부 공기, 습기, 스크래치 등으로부터 작품을 완벽하게 보호하며,
                                        수십 년이 흘러도 처음의 선명하고 화사한 색감을 변함없이 유지합니다.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* 디아섹 액자 특징 3 */}
                        <section className="lg:w-1/3 w-full flex flex-col items-start gap-4">
                            <div className="w-full object-cover">
                                <img src={P5} className="w-full h-auto object-cover rounded-3xl" />
                            </div>
                            <div className="flex-1 w-full text-black flex flex-col">
                                <h2 
                                    className="flex md:justify-center 
                                        text-[clamp(16px,4.381vw,28px)] md:text-[28px]
                                        font-medium text-gray-900 border-b border-gray-300
                                        mb-2 md:mb-4  mb:pb-2"
                                >
                                    선명함
                                </h2>
                                <div 
                                    className="
                                        md:text-base text-[clamp(13px,2.085vw,16px)] 
                                        text-700 space-y-2">
                                    <p className="break-keep">
                                        독일에서 수입한 전용 용지와, 현존하는 최고 수준의 해상도를 구현하는 10색 Ultra Chrome HD 잉크를 사용하여
                                        원본 데이터의 미세한 질감까지 섬세하게 표현합니다. <br />
                                        디아섹은 인쇄 기술과 소재의 결합으로 작품에 깊이와 선명도를 더합니다.
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-full gap-4 mb-10">
                    <div className="flex-1 border-t-[1px] border-[#D0AC88]"></div>
                        <span className="lg:text-[36px] text-[clamp(26px,3.519vw,36px)] font-bold text-[#D0AC88]">
                            디아섹코리아의 디테일
                        </span>
                        <div className="flex-1 border-t-[1px] border-[#D0AC88]"></div>
                    </div>

                    {/* <img src={P11}  className="lg:w-[55%]"/> */}

                    <div className="w-full max-w-[1200px] mx-auto">
                        <div className="w-[80%] mx-auto grid md:grid-cols-3 grid-cols-1 gap-8">
                            {[
                                {
                                    title: "약 4H 수준의 표면 강도",
                                    desc: `스크래치에 강한 UV 코팅으로
                                            깨끗하게 오래 유지됩니다`,
                                    img: i1
                                },
                                {
                                    title: "안전을 고려한 모서리 마감",
                                    desc: `부드러운 라운딩 처리로 안심하고 
                                            사용할 수 있습니다`,
                                    img: i2
                                },
                                {
                                    title: "헤어라인 프레임 마감",
                                    desc: `깔끔하고 세련된 후면 구조로 완성도를 
                                            높였습니다`,
                                    img: i3
                                },
                                {
                                    title: "간편한 거치 시스템",
                                    desc: `표시 스티커 부착으로 쉽고 정확하게 
                                            설치할 수 있습니다`,
                                    img: i4
                                },
                                {
                                    title: "디아섹코리아의 자신감",
                                    desc: `후면에 부착된 10년 품질 보증서로 
                                            약속드립니다`,
                                    img: i5
                                },
                                {
                                    title: "사용전 안내문구",
                                    desc: `최상의 상태로 감상 하기위한 내용이 
                                            전면에 부착되어 있습니다`,
                                    img: i6
                                }
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className="flex flex-col bg-white rounded-2xl shadow-md hover:shadow-lg transition overflow-hidden"
                                >
                                    <div className="bg-gray-100 flex items-center justify-center text-gray-400">
                                        <img src={item.img} className="w-full h-full object-cover" />
                                    </div>
                                    
                                    <div className="p-3 text-center">
                                        <h3 className="font-semibold text-[16px] md:text-[19px] mb-[2px]">
                                            {item.title}
                                        </h3>
                                        <p 
                                            style={{ whiteSpace: 'pre-line' }}
                                            className="text-[13px] md:text-[16px] text-gray-600">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center w-full gap-4">
                <div className="flex-1 border-t-[1px] border-[#D0AC88]"></div>
                    <span className="lg:text-[42px] text-[clamp(26px,4.105vw,42px)] font-semibold text-[#D0AC88]">
                        DIASEC HISTORY
                    </span>
                    <div className="flex-1 border-t-[1px] border-[#D0AC88]"></div>
                </div>

                {/* DIASEC History */}
                <div className="px-4">
                    <section className="flex flex-col lg:flex-row items-start gap-4 md:gap-10 mb-10">
                        <div 
                            className="
                                lg:w-1/2 w-full
                                h-auto
                                flex-shrink-0">
                            <img src={P1} className="w-full object-cover rounded-3xl" />
                        </div>

                        <div className="lg:w-1/2 w-full flex-1 text-black flex flex-col">
                            <h2 className="
                                text-[clamp(17px,4.381vw,28px)] md:text-[28px]
                                font-medium text-gray-900 mb-[6px] border-b border-gray-300"
                            >
                                Heinz Sovila와 Brulhart
                            </h2>
                            <div 
                                className="
                                    text-[clamp(13px,2.085vw,16px)] md:text-[18px]
                                    leading-7 text-700 space-y-2 pr-5"
                            >
                                <p className="leading-relaxed">
                                    디아섹(DIASEC)은 스위스의 Heinz Sovilla와 그의 아내 Brulhart 부부가 개발한 사진 보존 기술입니다.<br/>
                                    이들은 시간이 지남에 따라 행복하고 소중한 가족사진이 변색되고 변형되는 것에 안타까움을 느끼며,
                                    이를 방지할 방법을 찾기 시작했습니다.<br/>
                                    개발은 1969년부터 시작되었으며,
                                    완성까지 약 10년간의 연구와 실험이 이어졌습니다.<br/>
                                    마침내, 사진 위에 아크릴을 진공 상태에서 직접 부착하는 방식으로
                                    사진의 변질을 막고 오랜 시간 보존할 수 있는 새로운 형태의 액자가 탄생했습니다.<br/>
                                    이 기술은 ‘디아섹(DIASEC)’이라는 이름으로 특허 등록되었으며,
                                    새로운 액자의 트렌드로 전환점을 마련했습니다.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="flex flex-col lg:flex-row items-start gap-4 mb-10">
                        <div 
                            className="
                                lg:hidden 
                                lg:w-1/2 w-full
                                h-auto
                                flex-shrink-0">
                            <img src={P2} className="w-full object-cover rounded-3xl" />
                        </div>
                        <div className="flex-1 text-black flex flex-col">
                            <h2 className="
                                text-[clamp(17px,4.381vw,28px)] md:text-[28px]
                                font-medium text-gray-900 mb-[6px] border-b border-gray-300"
                            >
                                세계 확산 과정
                            </h2>
                            <div 
                                className="
                                    text-[clamp(13px,2.085vw,16px)] md:text-[18px]
                                    break-keep leading-7 text-700 space-y-2"
                            >
                                <p className="leading-relaxed">
                                    1979년, 네덜란드의 Wilcovak사가 디아섹 기술의 라이선스를 이어받아 본격적인 생산에 나섰습니다.<br/>
                                    이후 미국, 캐나다, 독일 등으로 확산되었고,
                                    2000년대 초 독일의 Grieger사가 상표와 공법의 허가를 이어받아 대량 생산 체제를 갖추면서
                                    디아섹은 전 세계적으로 널리 알려지게 됩니다.
                                </p>
                            </div>
                        </div>
                        <div 
                            className="
                                hidden lg:block 
                                lg:w-1/2 w-full
                                h-auto
                                flex-shrink-0">
                            <img src={P2} className="w-full object-cover rounded-3xl" />
                        </div>
                    </section>

                    <section className="flex flex-col lg:flex-row items-start gap-4 mb-10">
                        <div className="lg:w-1/2 w-full 
                        h-auto
                        shrink-0">
                            <img src={P3} className="w-full object-cover rounded-3xl" />
                        </div>
                        <div className="flex-1 text-black flex flex-col">
                            <h2 className="
                                text-[clamp(17px,4.381vw,28px)] md:text-[28px] 
                                font-medium text-gray-900 mb-[6px] border-b border-gray-300"
                            >
                                국내 도입과 성장
                            </h2>
                            <div 
                                className="
                                    text-[clamp(13px,2.085vw,16px)] md:text-[18px]
                                    leading-7 text-700 space-y-2 break-keep">
                                <p className="leading-relaxed">
                                    한국에는 2006년경 처음 소개되었으며, 2012년부터 본격적으로 확산되기 시작했습니다.
                                    2025년에 디아섹은 사진작가들의 전시용 작품은 물론,<br/> 
                                    연예인 사진, 웨딩사진, 가족사진 등 다양한 분야에서
                                    각광받는 고급 액자 방식으로 자리잡고 있습니다.
                                </p>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Main_Introduce;
