import { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MemberContext } from '../../context/MemberContext';

const Admin_InquiryList = () => {
    const API = process.env.REACT_APP_API_BASE;
    const { member } = useContext(MemberContext);
    const [inquiries, setInquiries] = useState([]);
    const [openIndex, setOpenIndex] = useState(null);
    const [replyContent, setReplyContent] = useState('');

    const categoryMap = {
        'member' :'회원 문의',
        'product' : '상품 문의',
        'order' : '주문 / 결제문의',
        'cancel' : '취소 / 환불문의',
        'design' : '시안 / 수정문의',
        'shipping' : '배송 / 제작문의',
        'etc' : '기타 문의'
    }

    useEffect(() => {
        axios.get(`${API}/inquiry/admin/list`)
            .then(res => setInquiries(res.data))
            .catch(err => console.error('불러오기 실패', err));
    }, []);

    const toggle = (index) => {
        setOpenIndex(openIndex === index ? null : index);
        setReplyContent('');
    };

    const handleReplySubmit = async (iid, adminId) => {
        if (!replyContent.trim()) {
            toast.error('답변을 입력해주세요.');
            return;
        }

        try {
            await axios.patch(`${API}/inquiry/answer`, {
                iid,
                adminId,
                answer: replyContent
            });
            toast.success('답변이 등록되었습니다.');
            window.location.reload();
        } catch (err) {
            console.error('답변 실패', err);
            toast.error('답변 등록에 실패했습니다.');
        }
    };

    // 날짜 검색
    const [startDate, setStartDate] = useState(() => {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return oneMonthAgo.toISOString().split('T')[0];
    });

    const [endDate, setEndDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });

    // 페이징
    const [currentPage, setCurrentPage] = useState(1);
    const inquiriesPerPage = 5;

    // 검색 및 옵션
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

        // 답변 미답변 확인 토글
        const [answerStatus, setAnswerStatus] = useState('');

    const filteredInquiries = inquiries.filter(inq => {
        const keywordMatch = inq.title.includes(searchKeyword) || inq.content.includes(searchKeyword) || inq.id.includes(searchKeyword);
        const categoryMatch = selectedCategory ? inq.category === selectedCategory : true;
        const answerMatch = 
        answerStatus === 'answered' ? !!inq.answer :
        answerStatus === 'unanswered' ? !inq.answer :
        true;

        const createdDate = inq.createdAt?.slice(0, 10);
        const dateMatch = createdDate >= startDate && createdDate <= endDate;
    
        return keywordMatch && categoryMatch && answerMatch && dateMatch;
    });

    const totalPages = Math.max(1, Math.ceil(filteredInquiries.length / inquiriesPerPage));
    const currentInquiries = filteredInquiries.slice(
        (currentPage - 1) * inquiriesPerPage,
        currentPage * inquiriesPerPage
    );

    // 답변 수정
    const [editingIndex, setEditingIndex] = useState(null);
    const [editContent, setEditContent] = useState('');

    // 날짜 범위 버튼
    const handleRangeClick = (months) => {
        const end = new Date();
        const newStart = new Date(end);
        newStart.setMonth(end.getMonth() - months);
        setStartDate(newStart.toISOString().split('T')[0]);
        setEndDate(end.toISOString().split('T')[0]);
    };

    const handleToday = () => {
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        setEndDate(today);
    }

    // 이미지 확대
    const [selectedImage, setSelectedImage] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);

    return (
        <div className='bg-gray-50 w-full min-h-screen py-12'>
            <div className="max-w-7xl mx-auto">
                <h2 className="text-2xl font-bold mb-4 text-gray-800">고객 문의 목록</h2>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex gap-2">
                        {/* 카테고리 */}
                        <div></div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="border rounded px-2 py-1 text-sm"
                        >
                            <option value="">전체 카테고리</option>
                            {Object.entries(categoryMap).map(([key, value]) => (
                                <option key={key} value={key}>{value}</option>
                            ))}
                        </select>

                        <select
                            value={answerStatus}
                            onChange={(e) => {
                                setAnswerStatus(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="border rounded px-2 py-1 text-sm"
                        >
                            <option value="">전체 상태</option>
                            <option value="unanswered">미답변</option>
                            <option value="answered">답변완료</option>
                        </select>
                    </div>
                    
                    {/* 날짜 */}
                    <div>
                        <button className="w-[65px] h-[32px] border bg-whtie text-sm" onClick={handleToday}>오늘</button>
                        <button className="w-[65px] h-[32px] border bg-whtie text-sm" onClick={() => handleRangeClick(1)}>1개월</button>
                        <button className="w-[65px] h-[32px] border bg-whtie text-sm" onClick={() => handleRangeClick(3)}>3개월</button>

                        <input type="date" className='w-[130px] h-[32px] border text-center text-sm' value={startDate} onChange={(e) => setStartDate(e.target.value)}/>
                        <span className="mx-2">~</span>
                        <input type="date" className='w-[130px] h-[32px] border text-center text-sm' value={endDate} onChange={(e) => setEndDate(e.target.value)}/>
                    </div>
                    
                    <div>
                        <input
                            type="text"
                            placeholder="제목/내용/작성자 검색"
                            value={searchKeyword}
                            onChange={(e) => {
                                setSearchKeyword(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="border rounded px-2 py-1 text-sm w-48"
                        />
                    </div>

                    <p className='text-sm text-gray-500'>
                        전체 {filteredInquiries.length}건 중 {currentPage}페이지
                    </p>
                </div>

                <hr />

                <div className="mt-4 space-y-4">
                    {currentInquiries.length === 0 ? (
                        <div className='text-center text-gray-500 py-12 border rounded bg-white'>
                            문의 내역이 없습니다.
                        </div>
                    ) : (
                        currentInquiries.map((inq, index) => (
                        <div key={inq.iid} className="bg-white rounded-lg border shadow-sm hover:shadow-md transition">
                            <div
                                className="flex justify-between items-center px-5 py-4 cursor-pointer"
                                onClick={() => toggle(index)}
                            >
                                <div className="space-y-1 text-sm">
                                    <p><span className="font-semibold text-gray-800">제목:</span> {inq.title}</p>
                                    <div className="text-sm text-gray-500 space-y-1 mt-1">
                                        <p><span className="font-semibold">작성자:</span> {inq.id}</p>
                                        <p><span className="font-semibold">문의 유형:</span> {categoryMap[inq.category] || inq.category}</p>
                                        {inq.productImg ? (
                                        <p><img src={inq.productImg} className="w-24 h-24"/></p>
                                        ) : ('')}
                                        <p><span className="font-semibold">작성일:</span> {inq.createdAt?.slice(0, 10)}</p>
                                    </div>
                                </div>
                                
                                <div className='flex flex-col justify-between items-end gap-3'>
                                    {/* 답변 상태 */}
                                    <span className={`flex text-xs font-bold px-3 py-1 rounded-full ${
                                        inq.answer
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-600'
                                    }`}>
                                        {inq.answer ? '✔ 답변완료' : '✖ 미답변'}
                                    </span>
                                    
                                    {/* 문의 삭제 버튼 */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm('해당 문의를 삭제하시겠습니까?')) {
                                                axios.delete(`${API}/inquiry/delete/${inq.iid}`)
                                                    .then(() => {
                                                        toast.success('삭제되었습니다.');
                                                        setInquiries(prev => prev.filter(item => item.iid !== inq.iid));
                                                    })
                                                    .catch(err => {
                                                        console.error('삭제 실패', err);
                                                        toast.error('삭제에 실패했습니다.')
                                                    })

                                            }
                                        }} className="flex text-xs text-red-600 border px-3 py-1 rounded-full"
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>

                            {openIndex === index && (
                                <div className="px-6 py-4 border-t bg-gray-50 text-sm text-gray-700">
                                    <p className="mb-4">
                                        <span className="font-semibold text-black">문의 내용:</span><br />
                                        {inq.content}
                                    </p>

                                    {inq.imageUrls?.length > 0 && (
                                        <div className="flex gap-2 flex-wrap mb-4">
                                            {inq.imageUrls.map((url, i) => (
                                                <img
                                                    key={i}
                                                    src={encodeURI(url.trim())}
                                                    alt={`inq-${inq.iid}-${i}`}
                                                    className="w-24 h-24 object-cover border rounded cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedImage(url.trim());
                                                        setShowImageModal(true);
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    {inq.answer && editingIndex !== index ? ( // ? 이게 뭔뜻이지
                                        <div className="bg-green-50 border border-green-200 p-3 rounded">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="font-semibold text-green-700 mb-1">답변 내용</p>
                                                <button
                                                    className="text-sm text-blue-600 underline"
                                                    onClick={(e) => {
                                                        e.stopPropagation();

                                                        // 이미 열려 있는 상태가 아니면 먼저 열어줌
                                                        if (openIndex !== index) {
                                                            setOpenIndex(index);
                                                        }
                                                        setEditingIndex(index);
                                                        setEditContent(inq.answer || '');
                                                    }}
                                                >
                                                    수정
                                                </button>
                                            </div>
                                            <p>{inq.answer}</p>
                                        </div>
                                    ) : inq.answer && editingIndex === index ? (
                                        <div className="mt-3">
                                            <label className="block mb-1 font-semibold">답변 수정</label>
                                            <textarea
                                                rows={4}
                                                className="w-full border px-3 py-2 rounded resize-none"
                                                placeholder="문의에 대한 답변을 입력하세요"
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                            />
                                            <div className="flex gap-2 mt-2">
                                                <button
                                                    onClick={async () => {
                                                        if (!editContent.trim()) return toast.error('답변 내용을 입력하세요.');
                                                        try {
                                                            await axios.patch(`${API}/inquiry/answer/${inq.rid}`, {
                                                                content: editContent
                                                            });
                                                            toast.success('답변이 수정되었습니다.');
                                                            setEditingIndex(null);
                                                            window.location.reload();
                                                        } catch (err) {
                                                            console.error('답변 수정 실패', err);
                                                            toast.error('수정에 실패했습니다.');
                                                        }
                                                    }}
                                                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"    
                                                >
                                                    수정 저장
                                                </button>
                                                <button
                                                    onClick={() => setEditingIndex(null)}
                                                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                                                >
                                                    취소
                                                </button>
                                        </div>
                                    </div>
                                    ) : (
                                        //답변이 없는 경우
                                        <div className="mt-3">
                                            <label className="block mb-1 font-semibold">답변 입력</label>
                                            <textarea
                                                rows={4}
                                                className='w-full border px-3 py-2 rounded resize-none'
                                                placeholder="문의에 대한 답변을 입력하세요"
                                                value={replyContent}
                                                onChange={(e) => setReplyContent(e.target.value)}
                                            />
                                            <button
                                                onClick={() => handleReplySubmit(inq.iid, member?.id || 'admin')}
                                                className="mt-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"    
                                            >
                                                답변 등록
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                )}
                </div>
            </div>

            {/* 페이징 */}
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

            {/* 이미지 모달 UI 추가 */}
            {showImageModal && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex items-center justify-center"
                    onClick={() => setShowImageModal(false)}
                >
                    <div className="relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img src={selectedImage} alt="확대 이미지" className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-lg"/>
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

export default Admin_InquiryList;
