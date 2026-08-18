import P1 from '../../assets/whatDiasec/1.jpg'

const reasons = [
    {
        title: '검증된 자재',
        desc: '그 이유는 장기보전을 위한 검증된 자재를 사용하기 때문입니다.',
    },
    {
        title: '공법의 노하우',
        desc: '시간이 흐름에 따라 발생할 수 있는 액자의 변색·뒤틀림·박리 현상 등을 방지하기 위한, 엄선된 자재와 축적된 공법의 노하우가 디아섹의 품질을 좌우합니다.',
    },
    {
        title: '수작업 마감',
        desc: '또한, 숙련된 기술자가 미세한 부분까지 수작업으로 마감처리를 함으로써 디아섹의 완성도를 높여줍니다.',
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
                            디아섹코리아의 가격정책
                        </span>
                        <div className="flex-1 border-t-[1px] border-[#D0AC88]"></div>
                    </div>
                </div>

                <div className="px-4">
                    <section className="flex flex-col lg:flex-row items-start gap-4 md:gap-10 mb-10">
                        <div className="lg:w-1/2 w-full shrink-0">
                            <img 
                                src={P1}
                                alt="디아섹 작품 보존"
                                className="w-full object-cover rounded-3xl"
                            />
                        </div>

                        <div className="lg:w-1/2 w-full flex-1 text-black flex flex-col">
                            <h2 className="
                                text-[clamp(17px,4.381vw,28px)] md:text-[28px]
                                font-medium text-gray-900 mb-[6px] border-b border-gray-300"
                            >
                                디아섹코리아의 제품가격은 결코 저렴하지 않습니다
                            </h2>
                            <div className="
                                text-[clamp(13px,2.085vw,16px)] md:text-[18px]
                                leading-7 space-y-2"
                            >
                                <p className="leading-relaxed">
                                    그 이유는 디아섹코리아가 디아섹 최초 개발자인
                                    스위스 Heinz Sovilla 부부의{' '}
                                    작품 보존 정신을 존중하고,{' '}
                                    독일식 정통 제작 공법을 기준으로 제작하기 때문입니다.
                                    오랜 시간이 지나도 작품 본연의 색감과 형태를 그대로 유지하는 기술력,
                                </p>
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
                            <span className="lg:text-[36px] text-[clamp(20px, 3.519vw, 36px)] font-bold text-[#D0AC88] text-center">
                                정통 디아섹이 저렴할 수 없는 이유
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