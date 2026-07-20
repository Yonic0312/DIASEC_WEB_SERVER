import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import thumbCustom from '../../../assets/CustomFrames/customFrames.png';

const GuestOrderSearch = () => {
    const API = process.env.REACT_APP_API_BASE;
    const FILE_BASE = API.replace('/api', '');
    const navigate = useNavigate();
    
    const [oid, setOid] = useState('');
    const [guestPassword, setGuestPassword] = useState('');
    const [order, setOrder] = useState(null);

    // 조회 요청
    const handleSearch = async () => {
        if (!oid || !guestPassword) {
        toast.error("주문번호와 비밀번호를 입력해주세요.");
        return;
        }

        try {
        const res = await axios.post(`${API}/order/guest-search`, {
            oid,
            guestPassword
        });

        if (res.data.success) {
            setOrder(res.data.order);
        } else {
            toast.error(res.data.message || "조회 실패");
        }
        } catch (err) {
        console.error(err);
        toast.error("조회된 주문이 없습니다.");
        }
    };

    // 카테고리 변환
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
    };

    // 사이즈 변환 (inch → cm)
    const convertInchToCm = (size) => {
        if (!size || typeof size !== "string") return size;

        const match = size.match(/([\d.]+)\s*[xX]\s*([\d.]+)/);
        if (!match) return size;

        const wInch = parseFloat(match[1]);
        const hInch = parseFloat(match[2]);

        if (isNaN(wInch) || isNaN(hInch)) return size;

        const wCm = Math.round(wInch * 2.54);
        const hCm = Math.round(hInch * 2.54);

        return `약 ${wCm} x ${hCm} cm (${wInch.toFixed(1)} x ${hInch.toFixed(1)} inch)`;
    };

    const resolveItemThumbnail = (item) => {
        if (item.category === 'customFrames') {
            const path = item.thumbnail || item.thumbnailPreview;
            if (!path) return thumbCustom;
            return path.startsWith('http') ? path : `${FILE_BASE}${path}`;
        }

        if (!item.thumbnail) return thumbCustom;
        return item.thumbnail.startsWith('http') ? item.thumbnail : `${FILE_BASE}${item.thumbnail}`;
    };

    return (
        <div className="min-h-[600px] flex flex-col items-center justify-start pt-20 px-4">
            <h1 className="
                text-xl
                font-bold mb-2">비회원 주문 조회</h1>

            {/* 검색 영역 */}
            <div 
                className="
                    md:text-base text-[clamp(12px,2.085vw,16px)]
                    max-w-md bg-white mt-4 mb-2">
                <div className="flex items-center justify-between mb-4 gap-2">
                    <label className="block font-medium mb-1">주문번호</label>
                    <input 
                        type="text" 
                        value={oid} 
                        onChange={(e) => setOid(e.target.value)}
                        className="
                            sm:w-[226px] w-[156px] h-10
                            border px-3 py-2 rounded"
                        placeholder="주문번호 입력" 
                    />
                </div>

                <div className="flex items-center justify-between mb-4 gap-2">
                    <label className="block font-medium mb-1">비밀번호</label>
                    <input 
                        type="password" 
                        value={guestPassword} 
                        onChange={(e) => setGuestPassword(e.target.value)}
                        className="
                            sm:w-[226px] w-[156px] h-10
                            border px-3 py-2 rounded"
                        placeholder="비밀번호 입력" 
                    />
                </div>

                <button 
                    onClick={handleSearch} 
                    className={`
                        w-full bg-black text-white  
                        h-[48px]
                        sm:text-sm text-[12px]`}
                >
                조회하기
                </button>
                
                <p className="mt-2 text-xs text-gray-500">
                    ※ 주문번호와 비밀번호를 모두 잊으신 경우 고객센터로 문의해주세요.
                </p>

                <div className="flex flex-row w-full justify-center mt-3">
                    <button className=
                        "border-[1px] w-full h-[48px] sm:text-sm text-[12px]" onClick={() => navigate('/userLogin')} type="button">
                        로그인
                    </button>
                </div>
            </div>

            

            {/* 주문 결과 */}
            {order && (
                <div className="w-full max-w-3xl mt-8">
                    <div 
                        className="border rounded sm:p-4 p-2 sm:mb-4 mb-2 bg-white shadow-sm"
                    >
                        {/* 주문번호 및 날짜 */}
                        <div 
                            className="flex justify-between items-center 
                                md:text-sm text-[clamp(11px,1.8252vw,14px)]
                                text-gray-500"
                        >
                        <span className='font-medium'>
                            {order.createdAt?.slice(0, 10)} · 주문번호: {order.oid}
                        </span>
                        <button
                            onClick={() => {
                                sessionStorage.setItem(`guestOrderPwd_${order.oid}`, guestPassword);
                                navigate(`/orderDetail/${order.oid}`, {
                                    state: { guestPassword },
                                });
                            }}
                            className='
                            ml-2 sm:px-2 px-[2px] py-1 border border-gray-400 text-gray-700 
                            md:text-[10px] text-[clamp(8px,1.303vw,10px)]
                            rounded hover:bg-gray-100'
                        >
                            주문 상세
                        </button>
                        </div>

                        {/* 주문 상품들 */}
                        {order.items?.map((item) => (
                            <div key={item.itemId} className="flex flex-col">
                                <div className="flex items-center gap-2 mt-1 
                                md:text-sm text-[clamp(11px,1.8252vw,14px)] text-gray-700">
                                {/* 배송 상태 */}
                                <span className="text-sm md:text-base font-semibold text-black">
                                    {item.orderStatus}
                                </span>
                                </div>

                                <div className="flex flex-row gap-4 py-2">
                                    <img 
                                        src={resolveItemThumbnail(item)}
                                        alt={item.title} 
                                        className="md:w-20 w-[clamp(4rem,10.43vw,5rem)] 
                                        md:h-20 h-[clamp(4rem,10.43vw,5rem)] 
                                        object-cover rounded border" 
                                    />
                                    <div className="flex sm:justify-between flex-1 text-gray-500">
                                        <div className="flex flex-col w-full
                                            md:text-sm text-[clamp(9px,1.825vw,14px)]">
                                            <span className="font-bold text-black">{item.title}</span>
                                            <span>카테고리: {convertCategoryName(item.category)}</span>
                                            <div className="flex sm:flex-row flex-col">
                                                <span>사이즈: </span>
                                                <span>{convertInchToCm(item.size)} ({item.quantity}개)</span>
                                            </div>
                                            <div className="flex font-bold ml-auto">
                                                <span>{(item.price).toLocaleString()}원</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GuestOrderSearch;
