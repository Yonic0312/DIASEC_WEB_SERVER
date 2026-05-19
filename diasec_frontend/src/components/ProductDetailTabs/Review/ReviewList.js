import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { MemberContext } from '../../../context/MemberContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const ReviewList = ({ pid }) => {
    const API = process.env.REACT_APP_API_BASE;
    const { member } = useContext(MemberContext);
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);
    const [selectedReview, setSelectedReview] = useState(null);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    useEffect(() => {
        // fetch(`${API}/review/list?pid=${pid}`) 상품([pid]별 리뷰 * 추후 사용)
        fetch(`${API}/review/all`)
            .then(res => res.json())
            .then(data => setReviews(data))
            .catch(err => console.error("리뷰 불러오기 실패", err));
    // }, [pid]);
    }, []);

    // 리뷰 작성
    const handleWriteReview = () => {
        if (!member?.id) {
            toast.info("비회원은 주문조회에서 배송 완료 주문 확인 후 리뷰를 작성할 수 있습니다.");
            navigate('/guestOrderSearch');
            return;
        }
        navigate('/reviewWrite');
    };

    // 상단 통계 레이아웃 추가 (별점)
    const totalReviews = reviews.length;
    const avgRating = totalReviews ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) : 0;

    const ratingLabels = ['아주 좋아요', '마음에 들어요', '보통이에요', '그냥 그래요', '별로예요'];
    const ratingCounts = [0, 0, 0, 0, 0];

    reviews.forEach(r => {
        const idx = 5 - r.rating;
        if (ratingCounts[idx] !== undefined) ratingCounts[idx]++;
    });

    // 닉네임 마스킹
    const maskedId = (id) => {
        if (id.length <= 2) return id[0] + '*';
        if (id.length <= 4) return id.slice(0, 1)  + '**';
        return id.slice(0, 2) + '*'.repeat(id.length - 3) + id.slice(-1);
    };
    
    // 리뷰 페이징
    const [currentPage, setCurrentPage] = useState(1); // 현재 페이지
    const reviewsPerPage = 5; // 한 페이지에 보여줄 리뷰 수

    const indexOfLastReview = currentPage * reviewsPerPage; // [1] : 5, [2] : 10
    const indexOfFirstReview = indexOfLastReview - reviewsPerPage; // [1] : 0, [2] : 5
    const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview); // [1] : 0 ~ 4, [2] : 5 ~ 9

    return (
        <div className="space-y-12 w-full mx-auto">
            {/* 리뷰 통계 상단 바 */}
            <div className="
                bg-gray-50 rounded-md shadow-sm
                md:p-6 p-[clamp(0.5rem,3.129vw,1.5rem)]
                ">
                <div className="flex items-center justify-between">
                    <div className="
                        md:text-2xl text-[clamp(20px,3.128vw,24px)]
                        text-black font-medium"
                    >
                        후기 <span className="font-semibold text-gray-500">{totalReviews}</span>
                    </div>
                    <button onClick={handleWriteReview}
                        className="px-3 py-1.5 bg-[#D0AC88] text-white text-sm rounded hover:bg-gray-500 transition">
                        후기작성
                    </button>
                </div>
                <br /><hr />

                <div className="flex md:gap-6 gap-1">
                    {/* 평균 별점 */}
                    <div className="
                        w-1/2 flex flex-col items-center justify-center text-center gap-2 border-r md:pr-6 pr-2
                        md:text-2xl text-[clamp(18px,3.126vw,24px)]
                    ">
                        <span className="text-black font-semibold">별점</span>
                        <div className="flex flex-col">
                            <div className="text-yellow-400 font-bold mb-2">
                                {"★".repeat(Math.round(avgRating))}
                            </div>
                            <span className='text-gray-500 font-medium'>{avgRating} / 5.0</span>
                        </div>
                    </div>

                    {/* 평점 분포 */}
                    <div className="
                        flex flex-col flex-1 py-10
                        md:gap-2 gap-1
                        md:px-10
                        ">
                        {ratingLabels.map((label, idx) => {
                            const count = ratingCounts[idx];
                            const ratio = totalReviews ? (count / totalReviews) * 100 : 0;
                            return (
                                <div key={idx} 
                                    className="
                                        flex items-center justify-center text-gray-600
                                        md:text-[16.5px] text-[clamp(14.5px,2.15vw,16.5px)]">
                                    <div className="w-24 text-gray-700">{label}</div>

                                    <div className="flex-1 md:block hidden bg-gray-200 h-2 rounded mx-2">
                                        <div className="bg-blue-400 h-2 rounded" style={{ width: `${ratio}%`}}></div>
                                    </div>
                                    <div className="w-8 text-right text-blue-500 font-medium">{count}</div>
                                </div>
                            )
                        })}
                    </div>
                </div>
                <hr />
            </div>

            <div>
                {/* 🔶 일반 리스트 */}
                <ul className='divide-y border-y'>
                    {currentReviews.map((review, i) => (
                        <li
                            key={i}
                            className='flex gap-4 py-6 cursor-pointer'
                            onClick={() => setSelectedReview(review)}
                        >
                            <div className='flex-1'>
                                <div className="
                                    md:text-sm text-[clamp(12px,1.825vw,14px)]
                                    flex items-center justify-between text-gray-400">
                                    <span>{review.id?.slice(0, 2)}***님</span>
                                    <span>{review.createdAt?.slice(2, 10).replaceAll('-', '.')}</span>
                                </div>
                                <div className="
                                    md:text-[16px] text-[clamp(12px,2.085vw,16px)]
                                    font-semibold text-gray-700">
                                    <span className="text-orange-400">
                                        {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                                    </span>
                                </div>

                                <div className='text-[14px] md:text-[16px] font-semibold'>
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
                        className="fixed inset-0 bg-black/55 backdrop-blur-[2px] flex items-center justify-center px-4 py-6 z-[10000]"
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
                                    onClick={() => {
                                        setSelectedReview(null);
                                        setSelectedImageIndex(0);
                                    }}
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

                {/* 페이징 버튼 */}
                <div className="flex justify-center gap-2 mt-4 md:mt-8 text-sm">
                    {(() => {
                        const totalPages = Math.max(1, Math.ceil(reviews.length / 5)); // 10개씩
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
        </div>
    );
};

export default ReviewList;