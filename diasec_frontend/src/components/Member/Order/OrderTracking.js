import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { MemberContext } from '../../../context/MemberContext';
import { resolveTrackingLookupUrl } from '../../../utils/deliveryTrackingUrls';
import thumbCustom from '../../../assets/CustomFrames/customFrames.png';

const OrderTracking = () => {
    const API = process.env.REACT_APP_API_BASE;
    const { member } = useContext(MemberContext);
    const navigate = useNavigate();
    const location = useLocation();
    const { itemId } = useParams();
    const guestPassword =
        location.state?.guestPassword ||
        sessionStorage.getItem(`guestOrderPwd_item_${itemId}`) ||
        '';
    const [item, setItem] = useState(null);

    useEffect(() => {
        const config = { withCredentials: true };
        if (!member?.id && guestPassword) {
            config.params = { guestPassword };
        }

        axios.get(`${API}/order/detail/${itemId}`, config)
            .then(res => setItem(res.data))
            .catch(err => {
                if (err.response?.status === 403 || err.response?.status === 401) {
                    navigate(member?.id ? '/orderList' : '/guestOrderSearch', { replace: true });
                    return;
                }
                console.error('배송 정보 불러오기 실패', err);
            });
    }, [itemId, API, navigate, member?.id, guestPassword]);

    if (!item) return <div className="text-center py-20 text-gray-500">로딩 중...</div>;

    const steps = ['입금대기', '결제완료', '배송준비중', '배송중', '배송완료'];

    const stepMap = {
        '입금대기': 0,
        '결제완료': 1,
        '배송준비중': 2,
        '배송중': 3,
        '교환배송중': 3,
        '배송완료': 4,
    }

    const currentStepIndex = stepMap[item?.items[0]?.orderStatus] ?? 0;

    // 인치 -> cm 변환
    const convertInchToCm = (size) => {
        if (!size || typeof size !== "string") return size;

        const match = size.match(/([\d.]+)\s*[xX]\s*([\d.]+)/);
        if (!match) return size;

        const wInch = parseFloat(match[1]);
        const hInch = parseFloat(match[2]);

        if (isNaN(wInch) || isNaN(hInch)) return size;

        const wCm = Math.round(wInch * 2.54);
        const hCm = Math.round(hInch * 2.54);

        return `${wCm} x ${hCm} cm (${wInch.toFixed(1)} x ${hInch.toFixed(1)})`;
    }

    const convertCategoryName = (category) => {
        if (category === "masterPiece") {
            return "명화";
        } else if (category === "fengShui") {
            return "풍수";
        } else if (category === "authorCollection") {
            return "작가";
        } else if (category === "photoIllustration") {
            return "사진/일러스트";
        } else if (category === "koreanPainting")  {
            return "동양화";
        } else if (category === "customFrames") {
            return "맞춤액자";  
        } 
    }

    return (
        <div 
            className="
                md:px-8 px-2
                md:py-6 py-2
                md:space-y-4 space-y-2
                flex flex-col w-full h-fit bg-white mx-4 shadow-md border border-gray-200">
            <button 
                className="
                    md:text-[12px] text-[10px]     
                    ml-auto w-fit px-2 py-1 
                    font-medium border bg-black text-white border-gray-500 rounded-xl hover:text-gray-300  transition" 
                onClick={() => navigate(-1)}> 
                이전으로
            </button>
            {/* 상품 정보 */}
            <div key={item.items[0].itemId} 
                className="
                    flex sm:gap-6 gap-[6px] items-start border rounded-lg
                        md:p-6 p-2
                        bg-gray-50 transition-transform"
            >
                <img
                    src={
                        item.items[0].category === 'customFrames'
                            ? item.items[0].thumbnailPreview || item.items[0].thumbnail || thumbCustom
                            : item.items[0].thumbnail
                    }
                    alt={item.title}
                    className="
                        md:w-24 sm:w-[clamp(5rem,10.95vw,6rem)] w-[clamp(72px,12.52vw,5rem)]
                        md:h-24 sm:h-[clamp(5rem,10.95vw,6rem)] h-[clamp(72px,12.52vw,5rem)]
                        object-cover rounded border" 
                />
                <div className="
                    flex flex-col
                    md:h-24 sm:h-[clamp(5rem,10.948vw,6rem)]
                    text-[14px] md:text-[16px]
                    flex-1 justify-between"
                >
                    <div className="flex justify-between flex-row font-semibold">
                        <span className="min-w-0 flex-1 truncate pr-2">{item.items[0].title}</span>
                        <span>{item.items[0].orderStatus}</span>
                    </div>
                    <div>
                        <div className="flex sm:justify-between sm:flex-row flex-col">
                            <div>
                                <div className="
                                    flex flex-col
                                    md:text-[14px] text-[clamp(12px,1.8252vw,14px)]
                                    text-gray-500"
                                >
                                    카테고리: {convertCategoryName(item.items[0].category)} ({item.items[0].finishType === 'matte' ? '무광' : '유광'}) <br />
                                    <span>수량: {item.items[0].quantity}개</span>
                                    사이즈: {convertInchToCm(item.items[0].size)}
                                </div>
                            </div>
                            <div 
                                className="
                                    text-[14px] md:text-[16px]
                                    flex sm:items-end justify-end
                                    font-bold text-right mt-[2px]">
                                {(item.items[0].price)?.toLocaleString()}원</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 주문상태에 따라 상태 메세지 */}
            {item.items[0].orderStatus === '취소' && (
                <div>
                    <h3 
                        className="
                            md:text-lg sm:text-[clamp(16px,2.346vw,18px)] text-[clamp(14px,2.503vw,16px)]
                            font-semibold mt-2 mb-4">주문 진행 상황</h3>
                    <div 
                        className="
                            md:text-sm text-[clamp(11px,1.8252vw,14px)]
                            p-4 border rounded bg-yellow-50 text-yellow-700 font-medium">
                        주문이 취소되었습니다.
                    </div>
                </div>
            )}

            {/* 클레임 메세지 */}
            {['반품신청', '반품회수완료', '환불처리중', '환불완료'].includes(item.items[0].orderStatus) && (
                <div>
                    <h3 
                        className="
                            md:text-lg sm:text-[clamp(16px,2.346vw,18px)] text-[clamp(14px,2.503vw,16px)]
                            font-semibold mt-2 mb-4">반품 진행 상황</h3>
                    <div 
                        className="
                            md:text-sm sm:text-[clamp(12px,1.822vw,14px)] text-[clamp(10px,1.878vw,12px)]
                            p-4 border rounded bg-yellow-50 text-yellow-700 font-medium">
                        {item.items[0].orderStatus === '반품신청' && (
                        <>
                            반품 요청이 접수되었습니다.<br/>
                            상품을 아래 주소로 선불 발송해 주세요.<br/><br/>
                            <span className="font-normal text-gray-800">
                                경기 고양시 덕양구 통일로 140 (동산동, 삼송테크노밸리) A동 355호 <br/>
                                수신자: 디아섹 <br/> 연락처 : 010-0000-0000
                            </span>
                           </>
                          )}
                          {item.items[0].orderStatus === '반품회수완료' && (
                            <>반품 상품이 도착했습니다. 환불 절차를 진행 중입니다.</>
                          )}
                          {item.items[0].orderStatus === '환불처리중' && (
                            <>환불이 처리 중입니다. 영업일 기준 2~3일 내 입금 예정입니다.</>
                          )}
                          {item.items[0].orderStatus === '환불완료' && (
                            <>환불이 완료되었습니다. 계좌를 확인해 주세요.</>
                          )}
                    </div>
                </div>
            )}

            {['교환신청', '교환회수완료', '교환배송중', '교환완료'].includes(item.items[0].orderStatus) && (
                <div>
                    <h3 
                        className="
                            md:text-lg sm:text-[clamp(16px,2.346vw,18px)] text-[clamp(14px,2.503vw,16px)]
                            font-semibold mt-2 mb-4">교환 진행 상황</h3>
                    <div 
                        className="
                            md:text-sm sm:text-[clamp(12px,1.822vw,14px)] text-[clamp(10px,1.878vw,12px)]
                            p-4 border rounded bg-yellow-50 text-yellow-700 font-medium">
                        {item.items[0].orderStatus === '교환신청' && (
                        <>
                            교환 요청이 접수되었습니다.<br/>
                            상품을 아래 주소로 선불 발송해 주세요.<br/><br/>
                            <span className="font-normal text-gray-800">
                                경기 고양시 덕양구 통일로 140 (동산동, 삼송테크노밸리) A동 355호 <br/>
                                수신자: 디아섹 <br/> 연락처 : 010-0000-0000
                            </span>
                           </>
                          )}
                          {item.items[0].orderStatus === '교환회수완료' && (
                            <>회수 상품이 도착했습니다. 새 상품 준비 중입니다.</>
                          )}
                          {item.items[0].orderStatus === '교환배송중' && (
                            <>새 상품이 발송되었습니다. 곧 받아보실 수 있습니다.</>
                          )}
                          {item.items[0].orderStatus === '교환완료' && (
                            <>교환이 완료되었습니다. 이용해 주셔서 감사합니다.</>
                          )}
                    </div>
                </div>
            )}

            {/* 배송 상태 단계 */}
            {!['취소', '반품신청', '반품회수완료', '환불처리중', '환불완료', 
                '교환신청', '교환회수완료', '교환완료'].includes(item.items[0].orderStatus) && (
                <div>
                    <h3 
                        className="
                            md:text-lg sm:text-[clamp(16px,2.346vw,18px)] text-[clamp(14px,2.503vw,16px)]
                            font-semibold mt-2 mb-4">배송 진행 상황</h3>
                    <div className="flex justify-between items-center px-2 relative">
                        {steps.map((step, idx) => (
                            <div 
                                key={step}
                                className="
                                    flex-1 text-center sm:px-2 relative">
                                <div 
                                    className={`
                                        w-4 
                                        h-4 
                                        mx-auto rounded-full ${idx <= currentStepIndex ? 'bg-black' : 'bg-gray-300'} z-10 relative`}></div>
                                <div 
                                    className={`
                                        md:text-[14px] text-[12px]
                                        mt-2 ${idx <= currentStepIndex ? 'font-bold text-black' : 'text-gray-400'}`}>{step}</div>
                                {idx < steps.length - 1 && (
                                    <div className={`absolute top-2 left-1/2 w-full h-[2px] ${idx < currentStepIndex ? 'bg-black' : 'bg-gray-300'}`}></div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* 운송장 표시 */}
                    {item.items[0].trackingNumber && (() => {
                        const trackingUrl = resolveTrackingLookupUrl(
                            item.items[0].trackingCompany,
                            item.items[0].trackingNumber
                        );
                        return (
                        <div 
                            className="
                                md:text-lg sm:text-[clamp(16px,2.346vw,18px)] text-[clamp(14px,2.503vw,16px)]
                                mt-6 border rounded-lg p-4 bg-gray-50 text-gray-800">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-gray-700">운송장 정보</span>
                                <a
                                    href={trackingUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="
                                        md:text-sm text-[clamp(11px,1.8252vw,14px)]
                                    text-blue-600 hover:underline"
                                >
                                    배송조회 바로가기 
                                </a>
                            </div>
                            <div
                                className="
                                    md:text-base text-[clamp(12px,2.085vw,16px)]
                                    font-bold text-gray-900">
                                운송장 번호: {item.items[0].trackingNumber}
                            </div>
                            <div 
                                className="
                                    md:text-base text-[clamp(12px,2.085vw,16px)]
                                    text-gray-500 mt-1">
                                ※ 택배사 : {item.items[0].trackingCompany}
                            </div>
                        </div>
                        );
                    })()}
                    {item.items[0].orderStatus === '입금대기' && (
                        <div 
                            className="
                                md:text-base text-[clamp(12px,2.085vw,16px)]
                                mt-6 p-4 border rounded bg-yellow-50 text-yellow-700 font-medium">
                            <>
                                주문이 정상적으로 접수되었으며, 고객의 입금을 기다리고 있습니다. <br />
                                입금이 확인되면 배송 준비를 시작하겠습니다.
                            </>
                        </div>
                    )}

                    {item.items[0].orderStatus === '결제완료' && (item.items[0].category === 'wall' || item.items[0].category === 'table') && (
                        <div 
                            className="
                                md:text-base text-[clamp(12px,2.085vw,16px)]
                                mt-6 p-4 border rounded bg-yellow-50 text-yellow-700 font-medium">
                            <>
                                입금이 확인되었습니다. 상품 준비 후 빠르게 발송해드리겠습니다.
                            </>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
};

export default OrderTracking;
