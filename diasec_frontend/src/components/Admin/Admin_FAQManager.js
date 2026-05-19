import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const Admin_FAQManager = () => {
    const API = process.env.REACT_APP_API_BASE;
    const [faqs, setFaqs] = useState([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 10;
    const pageGroupSize = 10;

    const categoryMap = {
        member : '회원',
        order : '주문',
        payment : '결제',
        shipping : '배송',
        cancel : '취소 및 환불',
        design : '보정 및 시안 수정',
        etc :'기타',
    };

    useEffect(() => {
        axios.get(`${API}/faq/list`)
            .then(res => setFaqs(res.data))
            .catch(err => console.error('FAQ 불러오기 실패', err));
    }, []);

    const filteredFaqs = faqs.filter(faq => {
        const keywordMatch = faq.question.includes(searchKeyword) || faq.answer.includes(searchKeyword);
        const categoryMatch = selectedCategory ? faq.category === selectedCategory : true ;
        const dateMatch = (!startDate || faq.createdAt >= startDate) && (!endDate || faq.createdAt <= endDate);
        return keywordMatch && categoryMatch && dateMatch;
    });

    // ✅ 페이지 계산
    const totalPages = Math.max(1, Math.ceil(filteredFaqs.length / itemsPerPage));
    const currentGroup = Math.floor((currentPage - 1) / pageGroupSize);
    const groupStart = currentGroup * pageGroupSize + 1;
    const groupEnd = Math.min(groupStart + pageGroupSize - 1, totalPages);

    const currentFaqs = filteredFaqs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // ✅ 필터 변경 시 첫 페이지로
    useEffect(() => {
        setCurrentPage(1);
    }, [searchKeyword, selectedCategory, startDate, endDate]);

    // 토글 형식
    const [editIndex, setEditIndex] = useState(null);
    const [editQuestion, setEditQuestion] = useState('');
    const [editAnswer, setEditAnswer] = useState('');
    const [editCategory, setEditCategory] = useState('');

    // 수정
    const handleEditClick = (index, faq) => {
        if (editIndex === index) {
            setEditIndex(null);
        } else {
            setEditIndex(index);
            setEditQuestion(faq.question);
            setEditAnswer(faq.answer);
            setEditCategory(faq.category);
        }
    }

    // 저장
    const handleSave = async (faqId) => {
        try {
            await axios.patch(`${API}/faq/update/${faqId}`, {
                category: editCategory,
                question: editQuestion,
                answer: editAnswer
            });
            toast.success('수정되었습니다.');
            setEditIndex(null);
            
            const updated = await axios.get(`${API}/faq/list`);
            setFaqs(updated.data);
        } catch (err) {
            console.error('수정 실패', err);
            toast.error('수정에 실패했습니다.');
        }
    };

    // 삭제
    const handleDelete = async (faqId) => {
        if (window.confirm('정말 삭제하시겠습니까?')) {
            try {
                await axios.delete(`${API}/faq/delete/${faqId}`);
                toast.success('삭제되었습니다.');
                setFaqs(prev => prev.filter(f => f.faqId !== faqId));
            } catch (err) {
                console.error('삭제 실패', err);
                toast.error('삭제에 실패했습니다.');
            }
        }
    };

    // 글 등록 팝업 모달
    const [showModal, setShowModal] = useState(false);
    const [newQuestion, setNewQuestion] = useState('');
    const [newAnswer, setNewAnswer] = useState('');
    const [newCategory, setNewCategory] = useState('');

    const handleAddFaq = async () => {
        try {
            await axios.post(`${API}/faq/add`, {
                category: newCategory,
                question: newQuestion,
                answer: newAnswer
            });

            toast.success('FAQ가 등록되었습니다.');

            // 입력값 초기화
            setNewCategory('');
            setNewQuestion('');
            setNewAnswer('');

            // 모달 닫기
            setShowModal(false);

            setShowModal(false);
            const res = await axios.get(`${API}/faq/list`);
            setFaqs(res.data);
        } catch (err) {
            console.error('등록 실패', err);
            toast.error('등록에 실패했습니다.');
        }
    }

    const closeModal = () => {
        setShowModal(false);
        setNewCategory('');
        setNewQuestion('');
        setNewAnswer('');
    }

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <h2 className="text-2xl font-bold mb-6">FAQ 관리</h2>

            {/* 필터 UI */}
            <div className="flex flex-wrap gap-4 mb-6">
                <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="border p-2 text-sm">
                    <option value="" >전체 카테고리</option>
                    {Object.entries(categoryMap).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                    ))}
                </select>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border p-2 text-sm" /> 
                <span>~</span>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border p-2 text-sm" />
                <input type="text" placeholder="질문 또는 답변 검색" value={searchKeyword}
                       onChange={(e) => setSearchKeyword(e.target.value)} className="border p-2 text-sm w-60" />
                <button className="ml-auto bg-black text-white px-4 py-2 rounded"
                    onClick={() => setShowModal(true)}
                >
                    글 등록
                </button>
            </div>         

            {/* 목록 테이블 */}
            <table className="w-full border text-sm bg-white">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border p-2 w-20">번호</th>
                        <th className="border p-2">카테고리</th>
                        <th className="border p-2">질문</th>
                        <th className="border p-2">등록일</th>
                        <th className="border p-2 w-32">관리</th>
                    </tr>
                </thead>
                <tbody>
                    {currentFaqs.map((faq, index) => (
                        <React.Fragment key={faq.faqId}>
                        <tr key={faq.faqId}>
                            <td className="border p-2 text-center">{(currentPage -1) * itemsPerPage + index + 1}</td>
                            <td className="border p-2 text-center">{categoryMap[faq.category]}</td>
                            <td className="border p-2 text-center">{faq.question}</td>
                            <td className="border p-2 text-center">{faq.createdAt?.slice(0, 10)}</td>
                            <td className="border p-2 text-center">
                                <button onClick={() => handleEditClick(index, faq)} className="text-blue-600 mr-2">수정</button>
                                <button onClick={() => handleDelete(faq.faqId)} className="text-red-600">삭제</button>
                            </td>
                        </tr>

                        {/* 수정 에디터 */}
                        {editIndex === index && (
                            <tr className="bg-gray-50 border-t">
                                <td colSpan={5} className="p-4 text-sm">
                                    <div className="flex flex-col gap-2">
                                        <select value={editCategory} onChange={e => setEditCategory(e.target.value)} className="border p-1 w-48">
                                            {Object.entries(categoryMap).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                        <input value={editQuestion} onChange={e => setEditQuestion(e.target.value)} className="border p-1 "/>
                                        <textarea value={editAnswer} onChange={e => setEditAnswer(e.target.value)} className='border p-1' rows={4} />
                                        <div className='flex gap-2 mt-2'>
                                            <button
                                                onClick={() => handleSave(faq.faqId)}
                                                className="bg-blue-600 text-white px-4 py-1 rounded">저장</button>
                                            <button
                                                onClick={() => setEditIndex(null)}
                                                className="bg-gray-300 text-gray-700 px-4 py-1 rounded">취소</button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>

            {/* ✅ 페이지네이션 */}
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
            
            {/* 글 등록창 모달 */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center"
                    onClick={() => setShowModal(false)}>
                    <div className="bg-white p-6 rounded w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <h3 className='text-xl font-bold mb-4'>FAQ 등록</h3>

                        <select value={newCategory} onChange={e => setNewCategory(e.target.value)} className='border w-full p-2 mb-2' >
                            <option value="" disabled>카테고리 선택</option>
                            {Object.entries(categoryMap).map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                            ))}
                        </select>
                        <input type="text" placeholder="질문" value={newQuestion}
                            onChange={e => setNewQuestion(e.target.value)} className="border w-full p-2 mb-4" rows={4} />
                        <textarea placeholder="답변" value={newAnswer}
                                  onChange={e => {setNewAnswer(e.target.value)}} className="border w-full p-2 mb-4" />

                        <div className='flex justify-end gap-2'>
                            <button onClick={closeModal} className="bg-gray-300 px-4 py-2 rounded">취소</button>
                            <button onClick={handleAddFaq} className="bg-blue-600 text-white px-4 py-2 rounded">등록</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Admin_FAQManager;