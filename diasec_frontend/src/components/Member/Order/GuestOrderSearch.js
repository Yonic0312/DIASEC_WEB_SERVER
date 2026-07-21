import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import thumbCustom from '../../../assets/CustomFrames/customFrames.png';

const GuestOrderSearch = () => {
    const API = process.env.REACT_APP_API_BASE;
    const FILE_BASE = API.replace('/api', '');
    const navigate = useNavigate();
    
    const [phone1, setPhone1] = useState('010');
    const [phone2, setPhone2] = useState('');
    const [phone3, setPhone3] = useState('');
    const [guestPassword, setGuestPassword] = useState('');
    const [orders, setOrders] = useState([]);

    // 페이징
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [pageGroupSize, setPageGroupSize] = useState(
        window.innerWidth < 640 ? 5 : 10
    );

    useEffect(() => {
        const handleResize = () => {
            setPageGroupSize(window.innerWidth < 640 ? 5 : 10);
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const totalPages = Math.max(1, Math.ceil(orders.length / itemsPerPage));
    const currentGroup = Math.floor((currentPage - 1) / pageGroupSize);
    const groupStart = currentGroup * pageGroupSize + 1;
    const groupEnd = Math.min(groupStart + pageGroupSize - 1, totalPages);

    const currentOrders = orders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const ordererPhone = `${phone1}-${phone2}-${phone3}`;

    // 조회 요청
    const handleSearch = async () => {
        if (!phone2.trim() || !phone3.trim() || !guestPassword) {
            toast.error("휴대폰 번호와 비밀번호를 입력해주세요.");
            return;
        }

        try {
            const res = await axios.post(`${API}/order/guest-search`, {
                ordererPhone,
                guestPassword,
            });

            if (res.data.success) {
                const result = res.data.orders || (res.data.order ? [res.data.order] : []);
                setOrders(result);
                setCurrentPage(1);
                if (result.length === 0) {
                    toast.error("조회된 주문이 없습니다.");
                }
            } else {
                setOrders([]);
                setCurrentPage(1);
                toast.error(res.data.message || "조회 실패");
            }
        } catch (err) {
            console.error(err);
            setOrders([]);
            setCurrentPage(1);
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

    const resolveItemThumb = (item) => {
        if (item.category === 'customFrames') {
            const path = item.thumbnail || item.thumbnailPreview;
            if (!path) return thumbCustom;
            return path.startsWith('http') ? path : `${FILE_BASE}${path}`;
        }

        if (!item.thumbnail) return thumbCustom;
        return item.thumbnail.startsWith('http') ? item.thumbnail : `${FILE_BASE}${item.thumbnail}`;
    };

    const goToOrderDetail = (order) => {
        sessionStorage.setItem(`guestOrderPwd_${order.oid}`, guestPassword);
        navigate(`/orderDetail/${order.oid}`, {
            state: { guestPassword },
        });
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
                    <label className="block font-medium mb-1 shrink-0">휴대폰 번호</label>
                    <div className="flex gap-1 sm:w-[226px] w-[156px]">
                        <select
                            className="w-1/3 h-10 border px-1 rounded"
                            value={phone1}
                            onChange={(e) => setPhone1(e.target.value)}
                        >
                            <option value="010">010</option>
                            <option value="011">011</option>
                            <option value="016">016</option>
                            <option value="017">017</option>
                            <option value="018">018</option>
                            <option value="019">019</option>
                        </select>
                        <input
                            type="text"
                            value={phone2}
                            onChange={(e) => setPhone2(e.target.value.replace(/\D/g, ''))}
                            maxLength="4"
                            inputMode="numeric"
                            className="w-1/3 h-10 border px-2 rounded"
                            placeholder="0000"
                        />
                        <input
                            type="text"
                            value={phone3}
                            onChange={(e) => setPhone3(e.target.value.replace(/\D/g, ''))}
                            maxLength="4"
                            inputMode="numeric"
                            className="w-1/3 h-10 border px-2 rounded"
                            placeholder="0000"
                        />
                    </div>
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
                    ※ 주문 시 입력한 주문자 휴대폰 번호와 비밀번호로 조회합니다. 분실 시 고객센터로 문의해주세요.
                </p>

                <div className="flex flex-row w-full justify-center mt-3">
                    <button className=
                        "border-[1px] w-full h-[48px] sm:text-sm text-[12px]" onClick={() => navigate('/userLogin')} type="button">
                        로그인
                    </button>
                </div>
            </div>

            {/* 주문 결과 */}
            {orders.length > 0 && (
                <div className="w-full max-w-3xl mt-8 space-y-4">
                    {currentOrders.map((order) => (
                        <div
                            key={order.oid}
                            className="border rounded sm:p-4 p-2 bg-white shadow-sm"
                        >
                            <div 
                                className="flex justify-between items-center 
                                    md:text-sm text-[clamp(11px,1.8252vw,14px)]
                                    text-gray-500"
                            >
                                <span className='font-medium'>
                                    {order.createdAt?.slice(0, 10)} · 주문번호: {order.oid}
                                </span>
                                <button
                                    onClick={() => goToOrderDetail(order)}
                                    className='
                                    ml-2 sm:px-2 px-[2px] py-1 border border-gray-400 text-gray-700 
                                    md:text-[10px] text-[clamp(8px,1.303vw,10px)]
                                    rounded hover:bg-gray-100'
                                >
                                    주문 상세
                                </button>
                            </div>

                            {order.items?.map((item) => (
                                <div key={item.itemId} className="flex flex-col">
                                    <div className="flex items-center gap-2 mt-1 
                                    md:text-sm text-[clamp(11px,1.8252vw,14px)] text-gray-700">
                                        <span className="text-sm md:text-base font-semibold text-black">
                                            {item.orderStatus}
                                        </span>
                                    </div>

                                    <div className="flex flex-row gap-4 py-2">
                                        <img 
                                            src={resolveItemThumb(item)}
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
                    ))}

                    {/* 페이징 (OrderList와 동일 패턴) */}
                    <div className="flex justify-center gap-2 mt-4 md:mt-8 text-sm">
                        {(() => {
                            const maxVisible = 5;
                            let startPage = Math.max(currentPage - 2, 1);
                            let endPage = Math.min(startPage + maxVisible - 1, totalPages);

                            if (endPage - startPage < maxVisible - 1) {
                                startPage = Math.max(endPage - maxVisible + 1, 1);
                            }

                            const pageNumbers = Array.from(
                                { length: endPage - startPage + 1 },
                                (_, i) => startPage + i
                            );

                            return (
                                <div className="flex justify-center gap-1 text-sm font-medium">  
                                    {/* 맨 처음 */}
                                    <button
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                        className={`w-8 h-8 border rounded-full flex items-center justify-center 
                                            ${currentPage === 1 
                                                ? 'text-gray-300 border-gray-200' 
                                                : 'text-gray-700 hover:bg-gray-100 border-gray-300'}`}>
                                        {'<<'}
                                    </button>
                                    {/* 이전 */}
                                    <button
                                        onClick={() => setCurrentPage(prev => prev -1)}
                                        disabled={currentPage === 1}
                                        className={`w-8 h-8 border rounded-full flex items-center justify-center 
                                            ${currentPage === 1 
                                                ? 'text-gray-300 border-gray-200' 
                                                : 'text-gray-700 hover:bg-gray-100 border-gray-300'}`}>
                                        {'<'}
                                    </button>

                                    {/* 숫자 */}
                                    {pageNumbers.map((pageNum) => (
                                        <button
                                            key={pageNum}
                                            onClick={() => setCurrentPage(pageNum)}
                                            className={`w-8 h-8 rounded-full border flex items-center justify-center
                                                ${currentPage === pageNum 
                                                    ? 'bg-black text-white border-black' 
                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}>
                                            <span>{pageNum}</span>
                                        </button>
                                    ))}

                                    {/* 다음 */}
                                    <button
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                        disabled={currentPage >= totalPages}
                                        className={`w-8 h-8 border rounded-full flex items-center justify-center 
                                            ${currentPage === totalPages 
                                                ? 'text-gray-300 border-gray-200' 
                                                : 'text-gray-700 hover:bg-gray-100 border-gray-300'}`}>
                                        {'>'}
                                    </button>
                                    {/* 마지막 */}
                                    <button
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        className={`w-8 h-8 border rounded-full flex items-center justify-center 
                                            ${currentPage === totalPages 
                                                ? 'text-gray-300 border-gray-200' 
                                                : 'text-gray-700 hover:bg-gray-100 border-gray-300'}`}>
                                        {'>>'}
                                    </button>
                                </div>
                            )
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default GuestOrderSearch;
