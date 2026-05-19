import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import Admin_NoticeEditor from './Admin_NoticeEditor';

const Admin_NoticeManager = () => {
    const API = process.env.REACT_APP_API_BASE;
    const [notices, setNotices] = useState([]);
    const [editIndex, setEditIndex] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');
    const [editPinned, setEditPinned] = useState(false);
    const [editImages, setEditImages] = useState([]);

    // 검색 필터
    const [searchKeyword, setSearchKeyword] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [pinnedFilter, setPinnedFilter] = useState('all');

    // ✅ 페이징 관련 state 추가
    const [currentPage, setCurrentPage] = useState(1);
    const noticesPerPage = 10;   // 한 페이지당 표시할 개수
    const pageGroupSize = 10;    // 페이지 버튼 그룹 크기

    // 검색 필터 적용
    const filterdNotices = notices.filter(n => {
        const titleMatch = n.title.toLowerCase().includes(searchKeyword.toLowerCase());
        const dateMatch = (!startDate || n.createdAt >= startDate) && (!endDate || n.createdAt <= endDate);
        const pinnedMatch =
            pinnedFilter === 'all'
                ? true
                : pinnedFilter === 'pinned'
                ? n.pinned === true
                : n.pinned === false;

        return titleMatch && dateMatch && pinnedMatch;
    });

    // ✅ 페이징 계산 로직
    const totalPages = Math.max(1, Math.ceil(filterdNotices.length / noticesPerPage));
    const currentGroup = Math.floor((currentPage - 1) / pageGroupSize);
    const groupStart = currentGroup * pageGroupSize + 1;
    const groupEnd = Math.min(groupStart + pageGroupSize - 1, totalPages);

    const currentNotices = filterdNotices.slice(
        (currentPage - 1) * noticesPerPage,
        currentPage * noticesPerPage
    );

    useEffect(() => {
        fetchList();
    }, []);

    const fetchList = async () => {
        try {
            const res = await axios.get(`${API}/notice/list`);
            setNotices(res.data);
        } catch (err) {
            console.error('목록 불러오기 실패', err);
        }
    };

    const handleEditClick = async (index, noticeId) => {
        if (editIndex === index) {
            setEditIndex(null);
            return;
        }

        try {
            const res = await axios.get(`${API}/notice/${noticeId}`);
            const data  = res.data;
            setEditIndex(index);
            setEditTitle(data.title);
            setEditContent(data.content);
            setEditPinned(!!data.pinned);
            setEditImages(
                data.imageUrl 
                    ? data.imageUrl.split(',').map((url, idx) => ({
                        id: `existing-${idx}`,
                        type: 'existing',
                        url: url.trim(),

                    })) 
                : []
            );
        } catch (err) {
            console.error('공지 상세 불러오기 실패', err);
        }
    };

    const handleSave = async (noticeId, currentImages) => {
        const formData = new FormData();
        formData.append('title', editTitle);
        formData.append('content', editContent);
        formData.append('pinned', editPinned);

        currentImages.forEach((img, idx) => {
            if (img.type === 'new') {
                formData.append('newImages', img.file);
            } else {
                formData.append('existingUrls', img.url);
            }
        });

        try {
            await axios.post(`${API}/notice/update/${noticeId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data'},
            });
            toast.success('수정되었습니다.');
            setEditIndex(null);
            fetchList();
        } catch (err) {
            console.error('수정 실패', err);
            toast.error('수정에 실패했습니다.');
        }
    };

    const handleDelete = async (noticeId) => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;
        try {
            await axios.delete(`${API}/notice/delete/${noticeId}`);
            toast.success('삭제되었습니다.');
            setNotices(prev => prev.filter(n => n.noticeId !== noticeId));
        } catch (err) {
            console.error('삭제 실패', err);
            toast.error('삭제에 실패했습니다.');
        }
    };

    // 공지사항 등록 모달
    const [showModal, setShowModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newPinned, setNewPinned] = useState(false);
    const [newImages, setNewImages] = useState([]);

    const handleAddNotice = async () => {
        const formData = new FormData();
        formData.append('title', newTitle);
        formData.append('content', newContent);
        formData.append('pinned', newPinned);

        newImages.forEach(img => {
            if (img.type === 'new') {
                formData.append('newImages', img.file);
            }
        });

        try {
            await axios.post(`${API}/notice/insert`, formData, {
                headers: { 'Content-Type' : 'multipart/form-data' }
            });
            toast.success('등록되었습니다.');
            setShowModal(false);
            fetchList();
        } catch (err) {
            console.error('등록 실패', err);
            toast.error('등록에 실패했습니다.');
        }
    };

    const openAddModal = () => {
        setNewTitle('');
        setNewContent('');
        setNewPinned(false);
        setNewImages([]);
        setShowModal(true);
    }

    return (
        <div className="p-8 bg-gray-50 w-full min-h-screen">
            <div className="flex justify-between">
                <h2 className="text-2xl font-bold mb-6">공지사항 관리</h2>
            </div>

            <div className="flex flex-wrap gap-3 items-center mb-6">
                <input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border p-2 text-sm"
                />
                <span>~</span>
                <input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border p-2 text-sm"
                />
                <input 
                    type="text"
                    placeholder="제목 검색"
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="border p-2 text-sm w-60"
                />
                <select
                    value={pinnedFilter}
                    onChange={(e) => setPinnedFilter(e.target.value)}
                    className="border p-2 text-sm"
                >
                    <option value="all">전체</option>
                    <option value="pinned">고정 공지</option>
                    <option value="normal">일반 공지</option>
                </select>

                <button className="bg-black h-10 text-white text-sm px-2 py-1 rounded ml-auto" onClick={openAddModal}>
                    공지 등록
                </button>
            </div>

            <table className="w-full border text-sm bg-white">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border p-2 w-20">번호</th>
                        <th className="border p-2">제목</th>
                        <th className="border p-2">등록일</th>
                        <th className="border p-2">관리</th>
                    </tr>
                </thead>
                <tbody>
                    {currentNotices.map((notice, index) => (
                        <React.Fragment key={notice.noticeId}>
                            <tr>
                                <td className="border p-2 text-center">{index + 1}</td>
                                <td className="border p-2"><span className="text-orange-500 font-bold">{notice.pinned ? `[공지]` : ''}</span>{notice.title}</td>
                                <td className="border p-2 text-center">{notice.createdAt?.slice(0, 10)}</td>
                                <td className="border p-2 text-center">
                                    <button
                                        onClick={() => handleEditClick(index, notice.noticeId)}
                                        className="text-blue-600 mr-2"   
                                    >수정
                                    </button>
                                    <button
                                        onClick={() => handleDelete(notice.noticeId)}
                                        className="text-red-600"
                                    >삭제</button>
                                </td>
                            </tr>
                            {editIndex === index && (
                                <tr className="bg-gray-50 border-t">
                                    <td colSpan={4} className="p-4 text-sm">
                                        <div className="flex flex-col gap-2">
                                            <input 
                                                value={editTitle}
                                                onChange={e => setEditTitle(e.target.value)}
                                                className="border p-1"
                                                placeholder="제목"
                                            />
                                            <textarea
                                                value={editContent}
                                                onChange={e => setEditContent(e.target.value)}
                                                className="border p-1"
                                                rows={4}
                                                placeholder="내용"
                                            />
                                            <label className="text-sm">
                                                <input 
                                                    type="checkbox"
                                                    checked={editPinned}
                                                    onChange={e => setEditPinned(e.target.checked)}
                                                    className="mr-2"
                                                /> 공지 고정
                                            </label>
                                            <Admin_NoticeEditor 
                                                existingImages={editImages} 
                                                onImagesChange={(images) => {
                                                    setEditImages(images)
                                                }}
                                            />
                                            <div className='flex gap-2 mt-2'>
                                                <button
                                                    onClick={() => handleSave(notice.noticeId, editImages)}
                                                    className="bg-blue-600 text-white px-4 py-1 rounded"
                                                >저장</button>
                                                <button
                                                    onClick={() => setEditIndex(null)}
                                                    className="bg-gray-300 text-gray-700 px-4 py-1 rounded"
                                                >취소</button>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>

            {/* 공지사항 등록 모달 */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">공지사항 등록</h3>

                        <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="제목" className="border w-full p-2 mb-2" />
                        <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="내용" rows={4} className="border w-full p-2 mb-2" />
                        <label className="text-sm block mb-2">
                            <input type="checkbox" checked={newPinned} onChange={e => setNewPinned(e.target.checked)} className="mr-2" />
                            공지 고정
                        </label>

                        <Admin_NoticeEditor existingImage={[]} onImagesChange={setNewImages} />

                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setShowModal(false)} className="bg-gray-300 px-4 py-2 rounded">취소</button>
                            <button onClick={handleAddNotice} className="bg-blue-600 text-white px-4 py-2 rounded">등록</button>
                        </div>
                    </div>
                </div>
            )}

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

            {/* 공지사항 등록 모달 */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded w-full max-w-lg" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">공지사항 등록</h3>

                        <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="제목" className="border w-full p-2 mb-2" />
                        <textarea value={newContent} onChange={e => setNewContent(e.target.value)} placeholder="내용" rows={4} className="border w-full p-2 mb-2" />
                        <label className="text-sm block mb-2">
                            <input type="checkbox" checked={newPinned} onChange={e => setNewPinned(e.target.checked)} className="mr-2" />
                            공지 고정
                        </label>

                        <Admin_NoticeEditor existingImage={[]} onImagesChange={setNewImages} />

                        <div className="flex justify-end gap-2 mt-4">
                            <button onClick={() => setShowModal(false)} className="bg-gray-300 px-4 py-2 rounded">취소</button>
                            <button onClick={handleAddNotice} className="bg-blue-600 text-white px-4 py-2 rounded">등록</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Admin_NoticeManager;