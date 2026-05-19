import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MemberContext } from '../../../context/MemberContext';

const CreditHistory = () => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();
    const { member } = useContext(MemberContext);
    const [history, setHistory] = useState([]);

    // ✅ 페이징
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // 테이블이니까 10개가 적당

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

    // 데이터 바뀌면 1페이지로
    useEffect(() => {
        setCurrentPage(1);
    }, [history.length]);

    const totalPages = Math.max(1, Math.ceil(history.length / itemsPerPage));
    const currentGroup = Math.floor((currentPage - 1) / pageGroupSize);
    const groupStart = currentGroup * pageGroupSize + 1;
    const groupEnd = Math.min(groupStart + pageGroupSize - 1, totalPages);

    const currentHistory = history.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const formatShortDate = (dateStr) => {
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return "-";
        const yy = String(d.getFullYear()).slice(2);
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yy}.${mm}.${dd}`;
    };

    const renderRelatedOrderText = (item) => {
        if (!item?.oid) return "-";
        if ((item.totalCount ?? 0) > 1) return `${item.title} 외 ${item.totalCount - 1}건`;
        return `${item.title} (${item.oid})`;
    };

    // 삭제/변경으로 페이지 초과 방지
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

    useEffect(() => {
        if (!member?.id) return;

        axios.get(`${API}/credit/history/${member.id}`)
            .then(res => setHistory(res.data))
            .catch(err => {
                console.error("적립금 내역 불러오기 실패", err);
                setHistory([]);
            });
    }, [member?.id]);

    return (
        <div className="flex flex-col w-full max-w-[1100px] mb-20 
            mr-2 ml-2 md:ml-0"
        >
            <div className="flex items-center justify-between">
                <h2 
                    className="
                        md:text-lg text-[clamp(16px,2.346vw,18px)]
                        font-bold pb-2 md:pb-6"
                >
                    | 적립금 내역
                </h2>

                <button
                    type="button"
                    onClick={() => navigate('/mypage')}
                    className="
                        md:hidden
                        self-start flex items-center gap-1 mb-3
                        text-[13px] text-gray-600 hover:text-gray-900
                    "
                >
                    <span className="text-base leading-none">←</span>
                    마이페이지
                </button>
            </div>

            <div 
                className="
                    md:mb-4 mb-1
                    text-[12px] md:text-[14px]"
            >
                <span className="font-medium">현재 보유 적립금: </span>
                <span className="font-bold">{history[0]?.credit?.toLocaleString()}원</span>
            </div>

            {history.length === 0 ? (
                <div className="text-gray-500">적립금 내역이 없습니다.</div>
            ) : (
                <>
                    {/* 카드 (모바일 UI를 PC에도 적용) */}
                    <div className="space-y-2 md:space-y-3">
                        {currentHistory.map((item) => {
                            const isUse = item.type === "사용";
                            return (
                                <div key={item.cid} className="border rounded-lg bg-white p-3 md:p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="text-[14px] text-gray-500 whitespace-nowrap">
                                            {formatShortDate(item.createdAt)}
                                        </div>
                                        <div className={`text-[15px] font-bold whitespace-nowrap ${isUse ? "text-red-500" : "text-green-600"}`}>
                                            {isUse ? "-" : "+"}{item.amount.toLocaleString()}원
                                        </div>
                                    </div>

                                    <div className="text-[14px] text-gray-800 break-words">
                                        {item.description}
                                    </div>

                                    <div className="text-[13px] text-gray-500 break-words">
                                        {renderRelatedOrderText(item)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* 페이징 */}
            {/* 페이징 (InquiryList와 동일 패턴) */}
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
    );
};

export default CreditHistory;