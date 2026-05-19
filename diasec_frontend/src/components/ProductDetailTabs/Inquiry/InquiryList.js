import { useCallback, useContext, useEffect, useState } from 'react';
import { MemberContext } from '../../../context/MemberContext';
import lock from '../../../assets/lock.png';
import { toast } from 'react-toastify';
import InquiryForm from './InquiryForm';


const InquiryList = ({ pid }) => {
    const API = process.env.REACT_APP_API_BASE;
    const { member } = useContext(MemberContext);
    const [inquiries, setInquiries] = useState([]);
    const [openIdx, setOpenIdx] = useState(null);
    const [inquiryModalOpen, setInquiryModalOpen] = useState(false);

    const refreshInquiries = useCallback(() => {
        fetch(`${API}/inquiry/list?pid=${pid}`)
            .then((res) => res.json())
            .then((data) => setInquiries(data))
            .catch((err) => console.error('문의 목록 불러오기 실패', err));
    }, [API, pid]);

    useEffect(() => {
        refreshInquiries();
    }, [refreshInquiries]);

    const maskedId = (id) => {
        if (id.length <= 2) return id[0] + '*';
        if (id.length <= 4) return id.slice(0, 1) + '**';
        return id.slice(0, 2) + '*'.repeat(id.length - 3) + id.slice(-1);
    };

    // 비공개 글 클릭
    const handleClick = (inq, idx) => {
        if (inq.isPrivate == 1 &&
            member?.role !== "ADMIN" &&
            member?.id !== inq.id
        ) {
            toast.error("비공개 문의는 문의 작성자와 관리자만 열람할 수 있습니다.");
            return;
        }
        setOpenIdx(openIdx === idx ? null : idx);
    };
    
    // 관리자일때 답변할 수 있도록
    const [answerInputs, setAnswerInputs] = useState({});

    const handleAnswerChange = (iid, value) => {
        setAnswerInputs(prev => ({ ... ({ ...prev, [iid]: value })}));
    };

    // 답변 등록
    const handleAnswerSubmit = async (iid) => {
        try {
            const answer = answerInputs[iid]
            await fetch(`${API}/inquiry/answer`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type' : 'application/json'
                },
                body: JSON.stringify({ iid, answer, adminId: member.id })
            });

            toast.success("답변이 등록되었습니다.");
            // 등록 후 리스트 갱신
            const updated = await fetch(`${API}/inquiry/list?pid=${pid}`).then(res => res.json());
            setInquiries(updated);
            setAnswerInputs(prev => ({ ...prev, [iid]: null}));
        } catch (err) {
            console.error(err);
            toast.error("답변 등록에 실패했습니다.");
        }
    }

    // 답변 수정
    const handleAnswerUpdate = async (rid, iid, newContent) => {
        try {
            await fetch(`${API}/inquiry/answer/${rid}`, {
                method: 'PATCH',
                headers: { 'Content-Type' : 'application/json' },
                body: JSON.stringify({ content: newContent })
            });

            // 리스트 다시 불러오기
            const updated = await fetch(`${API}/inquiry/list?pid=${pid}`).then(res => res.json());
            setInquiries(updated);

            // 수정 완료 후 텍스트박스 초기화
            setAnswerInputs(prev => {
                const copy = { ...prev };
                copy[iid] = null;
                return copy;
            });

            toast.success("수정 완료");

        } catch (err) {
            console.error(err);
            toast.error("수정 실패");
        }
    };

    // 날짜 변경 포맷
    const formatYYMMDD = (input) => {
        const kst = new Date(new Date(input).toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
        const yy = String(kst.getFullYear()).slice(2);
        const mm = String(kst.getMonth() + 1).padStart(2, '0');
        const dd = String(kst.getDate()).padStart(2, '0');
        return `${yy}.${mm}.${dd}`;
    }

    const [currentPage, setCurrentPage] = useState(1);
    const inquiriesPerPage = 5;

    const indexOfLast = currentPage * inquiriesPerPage;
    const indexOfFirst = indexOfLast - inquiriesPerPage;
    const currentInquiries = inquiries.slice(indexOfFirst, indexOfLast);

    return (
        <div className='w-full mt-10 text-sm'>
            <div className='flex justify-between items-center border-b pb-4 mb-4'>
                <h2 className='text-lg font-semibold ml-1'>문의 <span className='text-gray-500'>{inquiries.length}</span></h2>
                <button 
                    onClick={() => {
                        if(!member) {
                            toast.warn('로그인 후 이용해주세요.');
                            return;
                        }
                        setInquiryModalOpen(true);
                    }}
                    className="px-4 py-2 border text-sm text-gray-700 hover:bg-gray-100 mr-1">문의하기</button>
            </div>

            <div className="grid grid-cols-4 text-center px-4 py-2 bg-gray-100 text-gray-500 font-semibold border-t border-b">
                <div>제목</div>
                <div>작성자</div>
                <div>날짜</div>
                <div>답변상태</div>
            </div>

            {currentInquiries.map((inq, idx) => {
                const isPrivate = inq.isPrivate == 1;
                const isOpen = openIdx === idx;

                return (
                    <div key={idx} className="border-b">
                        {/* 문의 요약 영역 */}
                        <div
                            onClick={() => handleClick(inq, idx)}
                            className="
                                grid grid-cols-4 text-center 
                                md:text-lg text-[clamp(12px,2.346vw,18px)]
                                md:px-5 px-2
                                py-4 hover:bg-gray-50 cursor-pointer"
                        >
                            {/* 제목 + 락 */}
                            <div className="flex justify-start items-center gap-1">
                                <span className='text-gray-800 font-semibold'>{inq.title}</span>
                                {isPrivate && <img src={lock} alt="비공개" className="w-4 h-4" />}
                            </div>

                            {/* 작성자 */}
                            <div>
                                {maskedId(inq.id)}
                            </div>

                            {/* 날짜 */}
                            <div>
                                {formatYYMMDD(inq.createdAt?.slice(0, 16))}
                            </div>

                            {/* 상태뱃지 */}
                            <div className="font-medium">
                                <span className={`px-2 py-1 rounded-full ${
                                    inq.status === '답변완료'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {inq.status}
                                </span>
                            </div>
                        </div>

                        {/* 문의 상세 영역 */}
                        {isOpen && (
                            <div className="
                                mt-2 mb-4 p-4 bg-gray-50 border-t border-gray-200 rounded leading-relaxed text-gray-700
                                md:text-base text-[clamp(14px,2.085vw,16px)]
                            ">
                                <p className="mb-4 whitespace-pre-line">
                                    <strong className="block mb-1 text-gray-700">문의내용</strong>
                                    {inq.content}
                                </p>
                                {inq.answer ? (
                                    <>
                                        <p className="whitespace-pre-line">
                                            <strong className="block mb-1 text-blue-700">답변</strong>
                                            {inq.answer}
                                        </p>

                                        {answerInputs[inq.iid] !== undefined && answerInputs[inq.iid] !== null ? (
                                            <>
                                                <textarea
                                                    className="w-full border border-gray-300 rounded p-2 text-sm"
                                                    rows={4}
                                                    value={answerInputs[inq.iid]}
                                                    onChange={(e) => handleAnswerChange(inq.iid, e.target.value)}
                                                />
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => handleAnswerUpdate(inq.rid, inq.iid, answerInputs[inq.iid])}
                                                        className="px-4 py-2 bg-black text-white text-sm rounded hover:bg-gray-800"
                                                        >
                                                        수정완료
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setAnswerInputs(prev => {
                                                                const copy = { ...prev };
                                                                delete copy [inq.iid];
                                                                return copy;
                                                            });
                                                        }}
                                                        className="text-sm text-gray-500 underline"
                                                    >
                                                        취소
                                                    </button>
                                                </div>
                                            </>
                                        ) : null}

                                        <div className='flex gap-2 mt-2 justify-end'>
                                            <button onClick={() => {
                                                setAnswerInputs(prev => ({ ...prev, [inq.iid] : inq.answer}));
                                            }}
                                            className="text-sm text-blue-600 underline"
                                            >
                                                수정
                                            </button>

                                            <button
                                                onClick={async () => {
                                                    if (window.confirm("정말 답변을 삭제하시겠습니까?")) {
                                                        try {
                                                            await fetch(`${API}/inquiry/answer/${inq.rid}`, {
                                                                method: 'DELETE'
                                                            });
                                                            const updated = await fetch(`${API}/inquiry/list?pid=${pid}`).then(res => res.json());
                                                            setInquiries(updated);
                                                            toast.success("답변이 삭제되었습니다.");
                                                        } catch (err) {
                                                            console.error(err);
                                                            toast.error("삭제 실패");
                                                        }
                                                    }
                                                }}
                                                className="text-sm text-red-500 underline"
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </>
                                ) : member?.role === "ADMIN" ? (
                                    <div className="space-y-2">
                                        <strong className="block text-blue-700">답변 작성</strong>
                                        <textarea 
                                            className="w-full border border-gray-300 rounded p-2 text-sm"
                                            rows={4}
                                            value={answerInputs[inq.iid] || ""}
                                            onChange={(e) => handleAnswerChange(inq.iid, e.target.value)}
                                            placeholder="답변 내용을 입력하세요"
                                        />
                                        <button
                                            onClick={() => handleAnswerSubmit(inq.iid)}
                                            className="px-4 py-2 bg-black text-white text-sm rounded hover:bg-gray-800">
                                            등록
                                        </button>
                                    </div>
                                ) : (
                                    <p className="text-gray-400">아직 답변이 등록되지 않았습니다</p>
                                )}
                            </div>
                        )}
                    </div>
                )
            })}
            {/* 페이징 버튼 */}
            <div className="flex justify-center gap-2 mt-4 md:mt-8 text-sm">
                {(() => {
                    const totalPages = Math.max(1, Math.ceil(inquiries.length / 5)); // 10개씩
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

            {inquiryModalOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="inquiry-modal-title"
                    onClick={() => setInquiryModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-lg shadow-lg max-w-xl w-full max-h-[90vh] overflow-y-auto relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <InquiryForm
                            pid={pid}
                            onClose={() => setInquiryModalOpen(false)}
                            onSuccess={refreshInquiries}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default InquiryList;