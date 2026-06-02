import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import SupportHeader from './SupportHeader';
import { MemberContext } from '../../context/MemberContext';
import { toast } from 'react-toastify';

const ReviewBoard = () => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();
    const { member } = useContext(MemberContext);
    const [reviews, setReviews] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedReview, setSelectedReview] = useState(null);
    const reviewsPerPage = 10;

    // 상단 리뷰 슬라이더
    const [topThumbnailReviews, setTopThumbnailReviews] = useState([]);

    useEffect(() => {
        fetch(`${API}/review/recent?limit=20`)
            .then(res => res.json())
            .then(data => setTopThumbnailReviews(data))
            .catch(err => console.error('썸네일 리뷰 로딩 실패:', err));
    }, []);

    useEffect(() => {
        fetch(`${API}/review/all`)
            .then(res => res.json())
            .then(data => setReviews(data))
            .catch(err => console.error('리뷰 불러오기 실패:', err));
    }, []);

    // 리뷰 작성
    const handleWriteReview = () => {
        if (!member?.id) {
            toast.info('비회원은 주문조회에서 배송 완료 주문 확인 후 리뷰를 작성할 수 있습니다.');
            navigate('/guestOrderSearch');
            return;
        }
        navigate('/reviewWrite');
    } 

    // 리뷰상세 페이지 이미지 슬라이드
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const closeReviewModal = () => {
        setSelectedReview(null);
        setSelectedImageIndex(0);
    };

    // 리뷰 모달 열림 시 배경 스크롤 잠금
    useEffect(() => {
        if (!selectedReview) return;

        const scrollY = window.scrollY;
        const prevOverflow = document.body.style.overflow;

        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';

        const onKey = (e) => {
            if (e.key === 'Escape') closeReviewModal();
        };
        window.addEventListener('keydown', onKey);

        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.width = '';
            document.body.style.overflow = prevOverflow;
            window.scrollTo(0, scrollY);
        };
    }, [selectedReview]);

    // 페이징
    const totalPages = Math.max(1, Math.ceil(reviews.length / reviewsPerPage));

    // ✅ 반응형 그룹 크기
    const currentReviews = reviews.slice((currentPage - 1) * reviewsPerPage, currentPage * reviewsPerPage);
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

    

    return (
        <div className="max-5xl mx-auto px-4 mt-16 pb-24 text-sm text-gray-800">
            <SupportHeader />

            <div className='flex justify-end mt-16 mb-4'>
                <button onClick={handleWriteReview}
                    className="
                        md:text-sm text-[13px]
                        md:px-4 px-2 
                        md:py-2 py-1
                        bg-[#D0AC88] text-white rounded hover:bg-gray-500 transition">
                    후기작성
                </button>
            </div>

            {/* 🔶 썸네일 슬라이더 영역 */}
            <div className="overflow-x-auto mb-12 scrollbar-hide">
                <div className="flex md:gap-5 gap-2 px-1 sm:px-2 md:px-4">
                    {topThumbnailReviews.map((review, i) => (
                        <div
                            key={i}
                            className="
                                md:w-60 w-[clamp(128px,31.28vw,240px)] 
                                flex-shrink-0 bg-white border rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition"
                            onClick={() => setSelectedReview(review)}
                        >
                            <img
                                src={review.images?.[0]}
                                alt="리뷰 이미지"
                                className="w-full h-[clamp(140px,31.28vw,240px)] md:h-60 object-cover"
                            />
                            <div className="
                                text-[11.5px] md:text-[13px]
                                p-2"
                            >
                                <div className="text-orange-400">
                                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                </div>
                                <div className="text-[14px] md:text-[16px] font-semibold truncate mb-0.5">
                                    {review.title}
                                </div>
                                <div className="
                                    text-[12px] md:text-[14px]
                                    text-gray-500 truncate">{review.content}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 🔶 일반 리스트 */}
            <ul className='divide-y border-y'>
                {currentReviews.map((review, i) => (
                    <li key={i} className='
                        flex gap-4 py-6 cursor-pointer' onClick={() => setSelectedReview(review)}>
                        <div className='flex-1'>
                            <div className="
                                md:text-sm text-[clamp(12px,1.825vw,14px)]
                                flex items-center justify-between text-gray-400">
                                <span>{review.id.slice(0, 2)}***님</span>
                                <span>{review.createdAt?.slice(2, 10).replaceAll('-', '.')}</span>
                            </div>
                            <div className="
                                md:text-[16px] text-[clamp(12px,2.085vw,16px)]
                                font-semibold text-gray-700">
                                <span className="text-orange-400">
                                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                </span>
                            </div>

                            <div className='
                                text-[14px] md:text-[16px]
                                font-semibold'>
                                {review.title}{' '}
                            </div>
                            
                            <div className='
                                text-gray-500 mt-[2px]
                                text-[12px] md:text-[14px]
                                '>
                                {review.content.length > 50
                                    ? `${review.content.slice(0, 50)}...`
                                    : review.content}
                            </div>

                            {/* 이미지 */}
                            <div className="flex overflow-x-auto mt-2 gap-2">
                                {review.images?.map((img, idx) => (
                                    <img
                                        key={idx}
                                        src={img}
                                        alt={`리뷰 이미지 ${idx}`}
                                        className="
                                            md:w-28 w-[clamp(48px,14.6vw,112px)]
                                            md:h-28 h-[clamp(48px,14.6vw,112px)]
                                            object-cover rounded border"
                                    />
                                ))}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>

            {/* 리뷰 선택 모달창 */}
            {selectedReview && (
                <div
                    className="fixed inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center px-4 py-6 z-[10000] overscroll-none"
                    onClick={() => {
                        setSelectedReview(null);
                        setSelectedImageIndex(0);
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="
                            relative flex flex-col w-full max-w-[620px]
                            max-h-[88vh] overflow-hidden
                            rounded-2xl bg-white shadow-2xl
                            border border-gray-100
                        "
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* 헤더 */}
                        <div className="flex shrink-0 items-center justify-between px-3 md:px-2 md:py-2 bg-white/95 backdrop-blur border-gray-100">
                            <p className="text-[14px] md:text-[16px] font-semibold text-gray-900">
                                리뷰 상세보기
                            </p>
                            <button
                                aria-label="모달 닫기"
                                className="w-8 h-8 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
                                onClick={closeReviewModal}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 md:px-5 md:pb-5">
                            {/* 메인 이미지 */}
                            <div className="w-full aspect-[4/3] rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                                <img
                                    src={selectedReview.images?.[selectedImageIndex]}
                                    alt={`상세 이미지 ${selectedImageIndex + 1}`}
                                    className="max-w-full max-h-full object-contain"
                                />
                            </div>

                            {/* 썸네일 */}
                            <div className="mt-2 md:mt-3 flex flex-wrap justify-center gap-2">
                                {selectedReview.images?.map((img, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        className={`
                                            w-[58px] h-[58px] rounded-lg overflow-hidden border transition
                                            ${idx === selectedImageIndex
                                                ? "border-gray-900 ring-2 ring-gray-900/20"
                                                : "border-gray-200 hover:border-gray-400"}
                                        `}
                                        onClick={() => setSelectedImageIndex(idx)}
                                    >
                                        <img
                                            src={img}
                                            alt={`썸네일 ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>

                            {/* 텍스트 정보 */}
                            <div className="mt-5">
                                <h2 className="text-[18px] md:text-[20px] font-bold text-gray-900 leading-snug">
                                    {selectedReview.title}
                                </h2>

                                <div className="flex flex-col items-start">
                                    <span className="
                                        inline-flex items-center rounded-full text-orange-400 py-1 mb-1
                                        text-[12px] md:text-[14px] font-semibold"
                                    >
                                        {'★'.repeat(selectedReview.rating)}{'☆'.repeat(5 - selectedReview.rating)}
                                    </span>
                                </div>

                                <p className=" text-[14px] md:text-[16px] text-gray-700 leading-relaxed whitespace-pre-line">
                                    {selectedReview.content}
                                </p>

                                <div className="mt-4 pt-3 border-t border-gray-100 text-[12px] text-gray-500 flex justify-between">
                                    작성자: {selectedReview.id?.slice(0, 2)}***
                                    <span className="text-[12px] text-gray-500">
                                        {selectedReview.createdAt?.slice(0, 10)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* 리뷰 선택 모달창 */}

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

export default ReviewBoard;
