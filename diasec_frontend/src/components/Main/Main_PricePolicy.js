import P1 from '../../assets/whatDiasec/1.jpg'

const reasons = [
    {
        title: '검증된 자재',
        desc: '그이유는 독일 수입 용지와 변색이 적은 울트라 크롬잉크, 자체 개발한 뒷면 프레임 등 검증된 자재만을 사용하기 때문입니다',
    },
    {
        title: '공법의 노하우',
        desc: '오랜 시행착오와 연구개발로 축적된 디아섹코리아의 제작 노하우는 변색·뒤틀림·박리 현상을 최소화하고, 오랜 시간이 지나도 안정적인 품질을 유지합니다',
    },
    {
        title: '수작업 마감',
        desc: '또한, 숙련된 기술자가 고객의 안전을 위한 미세한 부분까지 수작업으로 마감처리를 함으로써 디아섹의 완성도를 높여줍니다.',
    },
    {
        title: '가격 이상의 가치',
        desc: '디아섹코리아의 전 상품 무료배송과, 후면 프레임 차별화와 대형 액자는 크기에 맞는 전용 프레임을 적용해 안정성을 높였습니다. 이런 구성까지 따져보면 실제 구매가격은 더욱 합리적입니다.',
    },
];

const Main_PricePolicy = () => {
    return (
        <div className="w-full flex flex-col break-keep">
            <div className="flex flex-col mt-20 md:mx-5 mx-[6px] mb-16 text-gray-800 md:gap-20 gap-10">

                <div className="flex flex-col items-center">
                    <div className="flex items-center justify-center w-full gap-4 mb-10">
                        <div className="flex-1 border-t-[1px] border-[#D0AC88]"></div>
                        <span className="lg:text-[36px] text-[clamp(22px,3.519vw,36px)] font-bold text-[#D0AC88] text-center">
                            디아섹코리아의 10년 품질보증
                        </span>
                        <div className="flex-1 border-t-[1px] border-[#D0AC88]"></div>
                    </div>
                </div>

                <div className="flex flex-col items-center px-4">
                    <section className="flex flex-col lg:flex-row items-start gap-4 md:gap-10 mb-10">
                        <div className="w-full max-w-[850px] flex flex-col justify-center md:flex-row md:items-stretch px-4 gap-8 md:gap-10">
                            <div className="w-full md:w-[40%] shrink-0 overflow-hidden rounded-xl bg-gray-100 shadow-sm ring-1 ring-black/5">
                                <img 
                                    className="w-full h-auto object-cover" 
                                    src={P1} 
                                    alt="디아섹 작품 보존"
                                />
                            </div>
                            <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 text-left">
                                <h3 className="
                                    text-[15px] md:text-[22px]
                                    font-bold text-gray-900">
                                    고객의 소중한 추억을 오랜 기간 동안 간직하도록 설계 제작된 정통 디아섹만을 만듭니다
                                </h3>
                                <span className=" text-[13px] md:text-[17px] leading-relaxed text-gray-600">
                                    디아섹코리아는 디아섹 최초 개발자인
                                    스위스 Heinz Sovilla 부부의{' '}
                                    작품 보존 정신을 계승한,{' '}
                                    독일식 정통 제작 공법을 기준으로 제작합니다.
                                    19년의 오랜 제작 경험과 축적된 노하우로 오랜시간이 지나도 작품 본연의 색감과
                                    형태를 그대로 유지하는 기술력으로 프리미엄 디아섹액자를 생산합니다
                                </span>
                            </div>
                        </div>
                    </section>

                    <div className="flex items-center justify-center w-full py-6 md:py-8 border-y border-[#D0AC88]">
                        <p className="
                            text-[15px] md:text-[20px]
                            text-center text-gray-800 leading-relaxed"
                        >
                            이것이 디아섹코리아가{' '}
                            <span className="font-bold text-[#a67a3e]">‘10년 품질 보증’</span>을
                            약속할 수 있는 이유입니다.
                        </p>
                    </div>
                </div>

                <div>
                    <div className="flex flex-col items-center">
                        <div className="flex items-center justify-center w-full gap-4 mb-10">
                            <div className="flex-1 border-t-[1px] border-[#D0AC88]"></div>
                            <span className="lg:text-[36px] text-[clamp(20px,3.519vw,36px)] font-bold text-[#D0AC88] text-center">
                                정통 디아섹을 고집하는 이유
                            </span>
                            <div className="flex-1 border-t-[1px] border-[#D0AC88]"></div>
                        </div>
                    </div>

                    <div className="flex lg:flex-row flex-col justify-between px-4 gap-10">
                        {reasons.map((item) => (
                            <section
                                key={item.title}
                                className="lg:w-1/3 w-full flex flex-col items-start"
                            >
                                <h2 className="
                                    flex md:justify-center w-full
                                    text-[clamp(16px,4.381vw,28px)] md:text-[28px]
                                    font-medium text-gray-900 border-b border-gray-300
                                    mb-2 md:mb-4"
                                >
                                    {item.title}
                                </h2>
                                <p className="
                                    text-[clamp(13px,2.085vw,16px)] md:text-base
                                    leading-7 text-gray-700"
                                >
                                    {item.desc}
                                </p>
                            </section>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Main_PricePolicy;
