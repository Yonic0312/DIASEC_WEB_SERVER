import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import SupportHeader from './SupportHeader';
import { MemberContext } from '../../context/MemberContext';
import { toast } from 'react-toastify';

const MyInquiryList = () => {
    const API = process.env.REACT_APP_API_BASE;
    const { member } = useContext(MemberContext);
    const [inquiries, setInquiries] = useState([]);
    const [expandedIid, setExpandedIid] = useState(null);
    const navigate = useNavigate();

    // 페이징
    const [currentPage, setCurrentPage] = useState(1);
    const inquiriesPerPage = 5;

    useEffect(() => {
        if (!member?.id) return;

        axios.get(`${API}/inquiry/myList?id=${member?.id}`)
            .then(res => setInquiries(res.data))
            .catch(err => {
                console.error(err);
                toast.error('문의 목록을 불러오는 데 실패했습니다.');
            });
    }, [member]);

    // 카테고리 표시용
    const categoryLabel = {
        member: '회원 문의',
        order: '주문/결제',
        cancel: '취소/환불',
        design: '시안 /수정',
        shipping: '배송/제작',
        etc: '기타'
    }

    // 페이징
    const filtered = inquiries.filter(i => i.category !== 'product');
    const totalPages = Math.max(1, Math.ceil(filtered.length / inquiriesPerPage));
    const currentInquiries = filtered.slice(
        (currentPage -1) * inquiriesPerPage,
        currentPage * inquiriesPerPage
    );

    // ✅ 반응형 그룹 크기
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

    const currentGroup = Math.floor((currentPage - 1) / pageGroupSize);
    const groupStart = currentGroup * pageGroupSize + 1;
    const groupEnd = Math.min(groupStart + pageGroupSize - 1, totalPages);


    const toggleExpand = (iid) => {
        setExpandedIid(prev => (prev === iid ? null : iid));
    };

    return (
        <div className="max-5xl mx-auto px-4 pt-16 pb-24">
            <SupportHeader />
            <div className="mt-10 mb-20">
                <div className="flex items-center justify-end md:mb-6 mb-2">
                    <div className="flex gap-2">
                        <button
                            className="
                                md:text-sm text-[13px]
                                md:px-4 px-2 
                                md:py-2 py-1 
                                bg-black text-white rounded hover:bg-gray-800"
                            onClick={() => {
                                if (!member) {
                                    toast.warn("로그인 후 이용해주세요.");
                                    return;
                                }
                                navigate('/supportInquiryForm', {
                                state: { returnTo: '/supportMyInquiryList'}
                            })}}
                        >
                            문의하기
                        </button>
                    </div>
                </div>

                {filtered.length === 0 ? (
                    <div className="text-sm text-gray-500 border rounded p-5 text-center">
                        아직등록된 문의가 없습니다.
                    </div>
                ) : (
                    <>
                        <div className="grid gap-5">
                            {currentInquiries.map((item, index) => (
                                <div key={index} 
                                    className="
                                        md:p-5 p-3
                                        border rounded-lg bg-white shadow-sm hover:shadow-md transition cursor-pointer"
                                    onClick={() => toggleExpand(item.iid)}
                                >
                                    <div className="
                                        md:text-base text-[clamp(13px,2.085vw,16px)]
                                        flex justify-between items-center mb-1">
                                        <button 
                                            className="font-semibold text-gray-900"
                                        >
                                            {item.title}
                                        </button>
                                        <div 
                                            className={`
                                                md:text-sm text-[clamp(11px,1.8252vw,14px)]
                                                px-2 py-1 rounded-full ${
                                            item.status === '답변대기' 
                                                ? 'bg-orange-100 text-orange-600' 
                                                : 'bg-green-100 text-green-600'
                                        }`}
                                    >
                                            {item.status}
                                        </div>
                                    </div>                                
                                    <div className="
                                        md:text-sm text-[clamp(11px,1.8252vw,14px)]
                                        flex items-cetner gap-2 text-gray-500 mb-1">
                                        <span>작성일: {item.createdAt?.substring(0, 10)}</span>
                                        <span>.</span>
                                        <span className="text-blue-600 font-medium">
                                            {categoryLabel[item.category] || item.category}
                                        </span>
                                    </div>
                                    {item.productName && (
                                        <div className="text-xs text-gray-400 mt-1">
                                            상품 : {item.productName}
                                        </div>
                                    )}
                                
                                    {expandedIid === item.iid && (
                                        <div className="
                                            md:text-sm text-[clamp(11px,1.8252vw,14px)]
                                            mt-4  space-y-6 text-gray-800">
                                            <div>
                                                <div className="font-semibold text-black mb-1">문의 내용</div>
                                                <p className="whitespace-pre-line leading-relaxed text-gray-700">{item.content}</p>
                                                {item.imageUrls?.length > 0 && (
                                                    <div className='flex gap-2 my-3 flex-wrap'>
                                                        {item.imageUrls.map((url, idx) => (
                                                            <img
                                                                src={encodeURI(url)}
                                                                alt={`inquiry-${item.iid}-${idx}`}
                                                                className="w-24 h-24 object-cover border rounded"
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            {item.answer && (
                                                <div className='bg-green-50 rounded-md text-sm text-gray-800'>
                                                    <div className="font-semibold text-green-700 mb-1">답변</div>
                                                    <p className="whitespace-pre-line">{item.answer}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div> 
                            ))}
                        </div>

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
                    </>
                )}
            </div>
        </div>
    );
};

export default MyInquiryList;