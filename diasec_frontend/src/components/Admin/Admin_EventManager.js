import { useState, useEffect } from "react";
import EventModal from "./Admin_EventModal";
import { toast } from 'react-toastify';

const Admin_EventManager = () => {
    const API = process.env.REACT_APP_API_BASE;
    const [events, setEvents] = useState([]);
    const [statusFilter, setStatusFilter] = useState("all");

    // 모달
    const [showInsertModal, setShowInsertModal] = useState(false); // insert
    const [editEvent, setEditEvent] = useState(null); // 수정창 모달 상태

    // ✅ 페이징 상태 추가
    const [currentPage, setCurrentPage] = useState(1);
    const eventsPerPage = 10;
    const pageGroupSize = 10;

    useEffect(() => {
        fetchEvents();
    }, [statusFilter])

    const fetchEvents = () => {
        fetch(`${API}/event?status=${statusFilter}`)
            .then(res => res.json())
            .then(data => setEvents(data))
            .catch(err => console.error("이벤트 목록 불러오기 실패", err));
    };

    // ✅ 필터 변경 시 첫 페이지로 이동
    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter]);

    // ✅ 페이징 계산
    const totalPages = Math.max(1, Math.ceil(events.length / eventsPerPage));
    const currentGroup = Math.floor((currentPage - 1) / pageGroupSize);
    const groupStart = currentGroup * pageGroupSize + 1;
    const groupEnd = Math.min(groupStart + pageGroupSize - 1, totalPages);

    const currentEvents = events.slice(
        (currentPage - 1) * eventsPerPage,
        currentPage * eventsPerPage
    );

    // 이벤트 삭제 요청
    const handleDelete = async (eventId) => {
        if (!window.confirm("이벤트를 삭제하시겠습니까?")) return;

        try {
            await fetch(`${API}/event/delete/${eventId}`, {
                method: "DELETE",
                credentials: "include",
            });

            toast.success("이벤트가 삭제되었습니다.");
            fetchEvents();
            setStatusFilter(prev => prev);
        } catch (err) {
            console.error("삭제 실패", err);
            toast.error("삭제 중 오류가 발생했습니다.");
        }
    }

    return (
        <div className="w-full p-6">
            <h2 className="text-2xl font-bold mb-4">이벤트 관리</h2>

            <div className="flex justify-between">
                {/* 필터 */}
                <div className="mb-4 flex gap-2">
                    <button onClick={() => setStatusFilter("all")} className={statusFilter === "all" ? "font-bold underline" : ""}>전체</button>
                    <button onClick={() => setStatusFilter("ongoing")} className={statusFilter === "ongoing" ? "font-bold underline" : ""}>진행중</button>
                    <button onClick={() => setStatusFilter("ended")} className={statusFilter === "ended" ? "font-bold underline" : ""}>종료</button>
                </div>

                {/* 이벤트 등록 */}
                <div className="mb-4">
                    <button 
                        onClick={() => setShowInsertModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded">
                        이벤트 등록
                    </button>
                </div>
            </div>

            {/* 이벤트 리스트 */}
            <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="w-[10%] p-2 border">ID</th>
                        <th className="w-[45%] p-2 border">제목</th>
                        <th className="w-[25%] p-2 border">기간</th>
                        <th className="w-[10%] p-2 border">상태</th>
                        <th className="w-[10%] p-2 border">관리</th>
                    </tr>
                </thead>
                <tbody>
                    {events.map((e) => (
                        <tr key={e.id} className="border-b">
                            <td className="p-2 border text-center">{e.eventId}</td>
                            <td className="p-2 border">{e.title}</td>
                            <td className="p-2 border">{e.period}</td>
                            <td className= {
                                `p-2 border text-center 
                                ${e.status === 'ongoing' ? 'text-blue-500' : 'text-red-500'}`}
                            >
                                {e.status === 'ongoing' ? '진행중' : '종료'}
                            </td>
                            <td className="p-2 border text-center">
                                <button 
                                    className="text-blue-500 mr-2"
                                    onClick={() => setEditEvent(e)}
                                >
                                    수정
                                </button>
                                <button 
                                    onClick={() => handleDelete(e.eventId)}
                                    className="text-red-500"
                                >
                                    삭제
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* insert 모달창 */}
            {showInsertModal && (
                <EventModal 
                    onClose={() => setShowInsertModal(false)}
                    onSuccess={() => {
                        fetchEvents() // 강제 새로고침
                        // 현재 필터 기준으로 다시 fetch 유도
                        setStatusFilter(prev => prev);
                    }}
                />
            )}

            {editEvent && (
                <EventModal
                    event={editEvent} // 수정용 이벤트 데이터 전달
                    onClose={() => setEditEvent(null)}
                    onSuccess={() => {
                        fetchEvents();
                        setStatusFilter(prev => prev);
                    }}
                />
            )}
            <div className="text-sm text-red-500">
               <span>썸네일 : 582px x 291px / 상세사진 : 1300px x 자유px 기준</span>
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
        </div>
    )
}

export default Admin_EventManager;