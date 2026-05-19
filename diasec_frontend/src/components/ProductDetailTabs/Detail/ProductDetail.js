import { useEffect, useState } from 'react';
import axios from 'axios';
import diasec_old from '../../../assets/video/diasec_old.mp4';
import diasec_hang from '../../../assets/video/diasec_hang.mp4';

// 보정
import custom1 from '../../../assets/custom_Frames/1.Skin RetouchB.jpg';
import custom2 from '../../../assets/custom_Frames/1.Skin RetouchF.jpg';
import custom3 from '../../../assets/custom_Frames/2.Teeth WhiteningB.jpg';
import custom4 from '../../../assets/custom_Frames/2.Teeth WhiteningF.jpg';
import custom5 from '../../../assets/custom_Frames/3.Object RemovalB.jpg';
import custom6 from '../../../assets/custom_Frames/3.Object RemovalF.jpg';
import custom7 from '../../../assets/custom_Frames/4.Color CorrectionB.jpg';
import custom8 from '../../../assets/custom_Frames/4.Color CorrectionF.jpg';
import custom9 from '../../../assets/custom_Frames/5.Background RemovalB.jpg';
import custom10 from '../../../assets/custom_Frames/5.Background RemovalF.jpg';
import custom11 from '../../../assets/custom_Frames/6.BlurB.jpg';
import custom12 from '../../../assets/custom_Frames/6.BlurF.jpg';

import detailAll from '../../../assets/custom_Frames/detailAll.jpg';
import detailCustom from '../../../assets/custom_Frames/detailCustom.jpg';

const ProductDetail = ({ pid }) => {
    const API = process.env.REACT_APP_API_BASE;
    const [images, setImages] = useState([]);

    const BEFORE_AFTER_DATA = [
        { title: '피부 보정', before: custom1, after: custom2},
        { title: '치아 보정', before: custom3, after: custom4},
        { title: '체형 보정', before: custom5, after: custom6},
        { title: '색감 보정', before: custom7, after: custom8},
        { title: '배경 정리', before: custom9, after: custom10},
        { title: '고해상도 업스케일', before: custom11, after: custom12},
    ];
    const isCustomFramePid = (pid => Number(pid) === -3);

    const [activeIndex, setActiveIndex] = useState(0);
    const [showAfter, setShowAfter] = useState(false);

    const isCustomFrame = isCustomFramePid(pid);
    const current = BEFORE_AFTER_DATA[activeIndex];

    

    useEffect(() => {
        axios.get(`${API}/product/images?pid=${pid}`)
            .then(res => setImages(res.data))
            .catch(err => console.error("상세 이미지 불러오기 실패", err));
    }, [pid]);

    return (
        <div className="w-full flex flex-col items-center bg-white">            
            {/* 보정 */}
            {isCustomFrame && (
                <div className="mb-[200px]">
                    <div className="text-center mb-[6px]">
                        <h2 className='
                            lg:text-[22px] md:text-[clamp(20px,2.15vw,22px)] sm:text-[clamp(17px,2.607vw,20px)] text-[17px]
                            font-bold text-gray-500 opacity-70'>보정 서비스 미리보기</h2>
                    </div>
                    <div>
                        {/* 보정 비교 */}
                        {/* xl:w-[550px] lg:w-[clamp(380px,33.62vw,430px)] md:w-[clamp(250px,32.257vw,330px)] sm:w-[clamp(230px,32.59vw,250px)]  */}
                        <div className='
                            max-w-[530px] border
                            aspect-[1024/1366] mx-auto bg-opacity-60 rounded-lg
                            pt-0
                            xl:px-6 xl:py-4
                            lg:px-5 lg:py-3
                            px-4 py-2
                        '>
                            <h3 className='
                                text-[clamp(16px,1.759vw,18px)] lg:text-[18px]
                                font-semibold text-center  text-[a67a3e] mb-2'
                            >
                                {current.title}
                            </h3>
                            
                            <div className='relative w-full flex justify-center items-center'>
                                <img src={
                                    showAfter ? current.after : current.before}
                                    alt="보정 비교" 
                                    className='rounded-xl transition duration-500 max-w-full aspect-[1024/1366] object-contain'
                                />
                                <div className='
                                    text-[clamp(14px,1.9544vw,15px)] md:text-[clamp(15px,1.564vw,16px)] lg:text-[16px]
                                    absolute bottom-2 flex gap-3 px-4 py-2'
                                > {/* transform -translate-x-1/2 너비의 절반만큼 왼쪽으로 간다 */}
                                    <button
                                        className={`
                                            px-4 py-1 rounded-full font-semibold transition ${
                                            !showAfter ? 'bg-[#cfab88] text-white' : 'bg-gray-200 text-gray-700'}`}
                                        onClick = {() => setShowAfter(false)}
                                        onMouseEnter={() => setShowAfter(false)}
                                    >
                                        원본사진
                                    </button>
                                    <button
                                        className={`
                                            px-4 py-1 rounded-full font-semibold transition ${
                                            showAfter ? 'bg-[#cfab88] text-white' : 'bg-gray-200 text-gray-700'
                                        }`}
                                        onClick = {() => setShowAfter(true)}
                                        onMouseEnter={() => setShowAfter(true)}
                                    >
                                        보정사진
                                    </button>
                                </div>
                            </div>

                            {/* 페이지 네이션 */}
                            <div className="mt-3 flex justify-center gap-2">
                                {BEFORE_AFTER_DATA.map((_, idx) => (
                                    <button
                                        key={idx}
                                        className={`
                                            w-[clamp(15px,2.215vw,17px)] md:w-[clamp(17px,1.954vw,20px)] xl:w-5
                                            h-[clamp(15px,2.215vw,17px)] md:h-[clamp(17px,1.954vw,20px)] xl:h-5
                                            rounded-full transition ${
                                            activeIndex === idx ? 'bg-[#cfab88]' : 'bg-gray-300'
                                        }`}
                                        onClick={() => {
                                            setActiveIndex(idx);
                                            setShowAfter(false);
                                        }}
                                    />
                                ))}
                            </div>
                            <span
                                className="
                                    flex flex-col justify-center items-center
                                    mt-3
                                    md:text-sm text-[clamp(11px,1.8252vw,14px)]
                                    font-medium tracking-wide
                                    text-gray-600
                                    px-4
                                "
                            >
                                원본사진과 보정사진을 <div><span className="text-[#a67a3e] ml-1 font-semibold">클릭</span>해 비교해보세요!</div>
                            </span>
                            {/* 보정 비교 */}
                        </div>
                    </div>

                    <div className='
                        md:mx-auto mx-4
                        max-w-3xl bg-white border border-[#D0AC88] rounded-2xl shadow-md 
                        md:p-6 p-[clamp(10px,3.128vw,24px)]
                        mt-6 text-[15px] text-gray-700 leading-relaxed
                        '>
                        <div className='flex items-center mb-4'>
                            <div className='
                                w-6 h-6 flex items-center justify-center rounded-full bg-[#D0AC88] text-white text-sm font-bold mr-2'>i</div>
                            <h3 
                                className="
                                    md:text-lg text-base
                                    font-bold text-gray-800">보정 서비스 안내</h3>
                        </div>
                        <hr className='mb-4 border-[#f1e2d1]' />
                        <ul 
                            className='
                                text-[clamp(13px,1.955vw,15px)] md:text-[15px]
                                space-y-3 pl-4 list-disc break-keep
                        '>
                            {/* <li>예시 외 <span className='font-semibold text-gray-900'>난이도가 높은 보정 또는 작업 시간이 많이 소요되는 경우</span> 시간당 <span className='text-[#D0AC88] font-semibold'>5만원</span>입니다.</li> */}
                            <li><span>원고 이미지가 지나치게 흐리거나 해상도가 낮은 경우, 화질 개선에 한계가 있을 수 있는 점 양해 부탁드립니다.</span></li>
                            <li><span>작업 난이도가 높은 보정 작업은 추가 시간이 소요되며, 별도의 추가 비용이 발생할 수 있습니다.</span></li>
                            <li><span>보정에 관한 궁금한 사항이 있으시면 문의 바랍니다.</span></li>                    
                        </ul>
                    </div>
                </div>
            )}
            {/* /보정 */}

            {/* 상품별 상세 이미지 */}
            {!isCustomFrame && ( 
                (images && images.length > 0) ? (
                    images.map((url, idx) => (
                        <img key={idx}
                            src={url}
                            alt={`상세 이미지 ${idx + 1}`}
                            className="w-full max-w-[800px] rounded"
                        />
                    ))
                ) : (
                    <p className="text-gray-400 text-sm mt-[200px]">등록된 상세 이미지가 없습니다.</p>
                )
            )}
            {/* 상품별 상세 이미지 */}

            <img src={isCustomFrame ? detailCustom : detailAll} alt="상세 이미지" className="w-full max-w-[800px]" />
            
            {/* 영상 */}
            <video
                src={diasec_old}
                muted
                autoPlay
                playsInline
                loop
                preload="none"
                className="
                    w-[800px] mt-[200px]
                    video_product_pc"
            />

            <video
                src={diasec_hang}
                muted
                autoPlay
                playsInline
                loop
                preload="none"
                className="
                    w-[800px] mt-[200px]
                    video_product_pc"
            />
        </div>
    )
}

export default ProductDetail;