import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { MemberContext } from '../../../context/MemberContext';
import { toast } from 'react-toastify';

const InquiryList = () => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();
    const { member } = useContext(MemberContext);
    const [inquiries, setInquiries] = useState([]);
    const [activeTab, setActiveTab] = useState('personal');
    const [openIdx, setOpenIdx] = useState(null);

    useEffect(() => {
        fetch(`${API}/inquiry/myList?id=${member?.id}`, {
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                setInquiries(data);
            });
    }, [member?.id]);

    const handleToggle = (idx) => {
        setOpenIdx(openIdx === idx ? null : idx);
    };

    // 카테고리
    const categoryLabel = {
        member: '회원 문의',
        order: '주문/결제',
        cancel: '취소/환불',
        design: '시안/수정',
        shipping: '배송/제작',
        etc: '기타'
    };

    // 이미지 확대
    const [selectedImage, setSelectedImage] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);

    // 날짜
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // 오늘 날짜로 초기 설정
    useEffect(() => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];

        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        const pastStr = threeMonthsAgo.toISOString().split('T')[0];

        setStartDate(pastStr);
        setEndDate(todayStr);
    }, []);

    // 날짜 버튼 핸들러
    const handleRangeClick = (months) => {
        const end = new Date(endDate);
        const newStart = new Date(end);
        newStart.setMonth(end.getMonth() - months);
    };

    const handleToday = () => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        setStartDate(todayStr);
        setEndDate(todayStr);
    }

    // 상태 필터
    const [statusFilter, setStatusFilter] = useState('전체');

    const statusOptions = ['전체', '답변대기', '답변완료'];

    // 필터 + 날짜 적용
    const filteredInquiries = inquiries.filter(inq => 
        (activeTab === 'product' ? inq.category === 'product' : inq.category !== 'product') &&
        (statusFilter === '전체' || inq.status === statusFilter) && 
        (inq.createdAt?.slice(0, 10) >= startDate && inq.createdAt?.slice(0, 10) <= endDate)
    );

    // 페이징
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const totalPages = Math.max(1, Math.ceil(filteredInquiries.length / itemsPerPage));

    // ✅ 반응형 그룹 크기 적용
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

    const currentItems = filteredInquiries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
    );

    const handleDelete = async (iid) => {
        if (!window.confirm("문의글을 삭제할까요?")) return;

        try {
            const res = await fetch(`${API}/inquiry/my/${iid}`, {
                method: "DELETE",
                credentials: "include",
            });

            const msg = await res.text();
            if (!res.ok) throw new Error(msg);

            alert("삭제 완료");
            // 다시 조회
            const r = await fetch(`${API}/inquiry/myList?id=${member?.id}`, { credentials: "include" });
            setInquiries(await r.json());
            setOpenIdx(null);
        } catch (e) {
            toast.error(e.message || "삭제 실패");
        }
    }

    return (
        <div className="flex flex-col w-full max-w-[1100px] mb-20 
            mr-2 ml-2 md:ml-0"
        >   
            <div className="flex items-center justify-between">
                <span className="
                    md:text-lg text-[clamp(16px,2.346vw,18px)]
                    font-bold pb-2 md:pb-6">
                        | 문의 내역
                </span>
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
            <div className="flex flex-col md:flex-row
                text-sm
            ">
                <div className="flex flex-row">
                    <div onClick={() => setActiveTab('personal')} 
                        className={`
                                flex items-center justify-center cursor-pointer
                                md:w-[260px] w-[clamp(100px,33.898vw,260px)]
                                md:h-[52px] h-[clamp(35px,6.779vw,52px)]
                                md:text-base text-[clamp(14px,2.09vw,16px)]
                            ${activeTab === 'personal' ? 'bg-[#555555] text-[#fbf7f0]' : 'bg-white text-black'}`}>
                        1:1 문의
                    </div>

                    <div onClick={() => setActiveTab('product')}
                        className={`
                                flex items-center justify-center cursor-pointer
                                md:w-[260px] w-[clamp(100px,33.898vw,260px)]
                                md:h-[52px] h-[clamp(35px,6.779vw,52px)]
                                md:text-base text-[clamp(14px,2.09vw,16px)]
                            ${activeTab === 'product' ? 'bg-[#555555] text-[#fbf7f0]' : 'bg-white text-black'}`}>
                        상품 문의
                    </div>
                </div>
            </div>

            <div className="
                w-full sm:p-[24px] p-2 bg-[#f6f6f6] text-sm flex 
                xl:flex-row flex-col
                ">
                <div className="
                    md:text-base text-[clamp(13px,2.085vw,16px)]
                    flex sm:flex-row flex-col">
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} 
                        className="
                            sm:w-[120px] w-[102px]
                            sm:h-[40px] h-[30px]
                            xl:mb-0 mb-2
                            border-[1px] text-center sm:mr-4 mr-[2px] bg-white">
                        {statusOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                    <div className="
                        flex sm:gap-2 gap-[2px]
                        xl:mb-0 mb-2
                    ">
                        <button 
                            className="
                                w-[50px] 
                                sm:h-[40px] h-[30px] 
                                border-[1px] bg-white" onClick={handleToday}>오늘</button>
                        <button className="
                                w-[50px] 
                                sm:h-[40px] h-[30px] 
                                border-[1px] bg-white" onClick={() => handleRangeClick(1)}>1개월</button>
                        <button className="
                                w-[50px] 
                                sm:h-[40px] h-[30px] 
                                border-[1px] bg-white" onClick={() => handleRangeClick(3)}>3개월</button>
                        <button className="
                                w-[50px] 
                                sm:h-[40px] h-[30px] 
                                border-[1px] bg-white" onClick={() => handleRangeClick(6)}>6개월</button>
                    </div>
                </div>
                <div className="md:text-base text-[clamp(13px,2.085vw,16px)]">
                    <input type="date" 
                        className="
                            sm:w-[140px] w-[110px] 
                            sm:h-[40px] h-[30px]
                            border-[1px] border-opacity-15 text-center" value={startDate} onChange={(e) => setStartDate(e.target.value)}></input>
                    <span className="mx-2">~</span>
                    <input type="date" 
                        className="
                            sm:w-[140px] w-[110px] 
                            sm:h-[40px] h-[30px]
                            border-[1px] border-opacity-15 text-center mr-2" value={endDate} onChange={(e) => setEndDate(e.target.value)}></input>
                </div>
            

                {activeTab === 'personal' && (
                    <div className="flex items-center ml-auto mr-2">
                        <button
                            onClick={() => navigate('/supportInquiryForm', {
                                state: { returnTo: '/myInquiryList'}
                            })}
                            className='
                                md:px-4 px-[clamp(0.5rem,2.085vw,1rem)]
                                md:py-2 py-[clamp(0.25rem,1.043vw,0.5rem)]
                                md:mt-0 mt-[clamp(0rem,1.0429vw,0.5rem)]
                                md:text-base text-[clamp(13px,2.085vw,16px)]
                                bg-black text-white font-bold rounded hover:bg-gray-800'>
                            문의하기
                        </button>
                    </div>
                )}
            </div>
            

            <div>
                {filteredInquiries.length === 0 ? (
                    <div className='text-center text-gray-500 py-10'>
                        {activeTab === 'product' ? '상품 문의 내역이 없습니다.' : '1:1 문의 내역이 없습니다.'}
                    </div>
                ) : (
                    <div>
                        {activeTab === 'product' ? (
                            <div className="
                                text-[13px] sm:text-[16px]
                                grid grid-cols-4 text-center px-4 py-2 bg-white text-black 
                                border-y-2 font-semibold">
                                <div>상품명</div>
                                <div>제목</div>
                                <div>문의날짜</div>
                                <div>문의상태</div>
                            </div>
                        ) : (
                            <div className="
                                text-[13px] sm:text-[16px]
                                grid grid-cols-4 text-center px-4 py-2 bg-white text-black
                                border-y-2 font-semibold">
                                <div>카테고리</div>
                                <div>제목</div>
                                <div>문의날짜</div>
                                <div>문의상태</div>
                            </div>
                        )}

                        {currentItems.map((inq, idx) => (
                            <div key={inq.iid}
                                className="text-[13px] sm:text-[16px]"
                            >
                                <div
                                    onClick={() => handleToggle(idx)}
                                    className="
                                        grid grid-cols-4 
                                        sm:p-4 p-1
                                        border-b text-center items-center  
                                        cursor-pointer hover:bg-gray-50 transition"
                                >
                                    {/* 카테고리 */}
                                    <div className="text-gray-700">
                                        {activeTab === 'product'
                                        ? inq.productName || '상품명 미지정'
                                        : categoryLabel[inq.category] || inq.category}
                                    </div>
                                    {/* 제목 */}
                                    <div className="line-clamp-1">{inq.title}</div>
                                    {/* 문의날짜 */}
                                    <div className="text-gray-500">{inq.createdAt?.slice(0, 10)}</div>
                                    {/* 문의상태 */}
                                    <div>
                                        <span className={`
                                            inline-block px-[2px] py-1 rounded-full 
                                        ${inq.status === '답변완료' 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-orange-100 text-orange-600'}`}>
                                        {inq.status}
                                        </span>
                                    </div>
                                </div>

                                {openIdx === idx && (
                                    <div className="
                                        md:p-6 p-[clamp(0.5rem,4.999vw,1.25rem)]
                                        bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 mt-2 shadow-sm">
                                        
                                        <div className="
                                            md:text-base text-[clamp(13px,2.085vw,16px)]
                                            mb-6"
                                        >
                                            <div className="mb-2">
                                                    <span 
                                                        className="
                                                            font-semibold text-gray-700 block mb-1">문의 제목</span>
                                                    <p 
                                                        className="
                                                            font-medium text-black">{inq.title}</p>
                                            </div>
                                            <div className="mt-4">
                                                <span 
                                                    className="
                                                        font-semibold text-gray-700 block mb-1">문의 내용</span>
                                                <p className="whitespace-pre-line leading-relaxed text-gray-700">
                                                    {inq.content}
                                                </p>
                                            </div>
                                        </div>

                                        {inq.imageUrls?.length > 0 && (
                                            <div className="flex flex-wrap gap-3 mb-6">
                                                {inq.imageUrls.map((url, i) => (
                                                    <img
                                                        key={i}
                                                        src={encodeURI(url.trim())}
                                                        alt={`inquiry-${inq.iid}-${i}`}
                                                        className="
                                                            md:w-20 w-[70px]
                                                            md:h-20 h-[70px]
                                                            object-cover border rounded shadow-sm cursor-pointer hover:opacity-90"
                                                        onClick={() => {
                                                            setSelectedImage(url.trim());
                                                            setShowImageModal(true);
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        <div className="mt-4 mb-2 flex justify-end gap-2">
                                            {inq.status !== "답변완료" && (
                                                <>
                                                    <button
                                                        className="px-3 py-1 border rounded hover:bg-gray-100"
                                                        onClick={() => navigate("/supportInquiryForm", { state: { mode: "edit", inquiry: inq, returnTo: "/myInquiryList" } })}
                                                    >
                                                        수정
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                className="px-3 py-1 border border-red-300 text-red-600 rounded hover:bg-red-50"
                                                onClick={() => handleDelete(inq.iid)}
                                            >
                                                삭제
                                            </button>
                                        </div>

                                        <hr /><br/>
                                        
                                        <div 
                                            className='
                                                md:text-base text-[clamp(13px,2.08vw,16px)]
                                                md:mt-6 mt-1
                                                bg-blue-50 border border-blue-200 rounded-md p-4'>
                                            <div className="
                                                flex justify-between">
                                                <strong 
                                                    className="
                                                        font-semibold text-blue-700 block mb-1">답변</strong>
                                                <span 
                                                    className='
                                                        text-gray-500 '>{inq.rcreatedAt}</span>
                                            </div>
                                            {inq.answer ? (
                                                <p className="whitespace-pre-line text-gray-800 leading-relaxed">{inq.answer}</p>
                                            ) : (
                                                <p className="text-gray-400">아직 답변이 등록되지 않았습니다.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
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

            {showImageModal && (
                <div
                    className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center"
                    onClick={() => setShowImageModal(false)}
                >
                    <div
                        className="relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={selectedImage}
                            alt="확대 이미지"
                            className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-lg"
                        />
                        <button
                            onClick={() => setShowImageModal(false)}
                            className="absolute top-2 right-2 text-white text-2xl font-bold"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InquiryList;
