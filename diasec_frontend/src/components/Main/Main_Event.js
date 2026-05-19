import { useEffect, useState } from "react";

const Main_Event = () => {
    const API = process.env.REACT_APP_API_BASE;
    const [activeTab, setActiveTab] = useState("ongoing");
    const [events, setEvents] = useState([]);

    useEffect(() => {
        fetch(`${API}/event?status=${activeTab}`)
            .then((res) => res.json())
            .then((data) => setEvents(data))
            .catch((err) => console.error("이벤트 불러오기 실패", err));
    }, [activeTab]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const totalPages = Math.max(1, Math.ceil(events.length / itemsPerPage));
    const currentPosts = events.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);

    useEffect(() => {
        setCurrentPage((p) => Math.min(p, totalPages));
    }, [totalPages]);

    return (
        <div className="max-full mx-auto px-4 py-20">
            {/* 탭 */}
            <div
                className="
                    flex justify-center gap-4 border-b border-gray-200 mb-6
                    md:text-base text-[clamp(11px,2.085vw,16px)]
                    "
            >
                <button
                    onClick={() => setActiveTab("ongoing")}
                    className={`pb-2 px-4 font-semibold ${
                        activeTab === "ongoing"
                            ? "border-b-2 border-black text-black"
                            : "text-gray-400"
                    }`}

                >
                    진행중인 이벤트
                </button>
                <button
                    onClick={() => setActiveTab("ended")}
                    className={`pb-2 px-4 font-semibold ${
                        activeTab === "ended"
                            ? "border-b-2 border-black text-black"
                            : "text-gray-400"
                    }`}
                >
                    종료된 이벤트
                </button>
            </div>

            {/* 이벤트 카드 */}
            <div
                className="
                    justify-center grid md:grid-cols-2 gap-12
                    md:text-base text-[clamp(11px,2.085vw,16px)]
                    "
            >
                {currentPosts.map((event, index) => (
                    <div
                        key={`${event.eventId}-${index}`}
                        onClick={() => (window.location.href = `/mainEventDetail/${event.eventId}`)}
                        className="max-w-[582px] cursor-pointer rounded-b-xl hover:shadow-xl"
                    >
                        <div className="w-full max-h-[291px] rounded-lg overflow-hidden shadow border border-gray-100 cursor-pointer">
                            <img
                                src={event.thumbnailUrl}
                                alt={event.title}
                                className=" w-full h-full object-cover"
                            />
                        </div>
                        <div className="p-4">
                            <h3 className="font-semibold text-gray-800">{event.title}</h3>
                            <p className="text-sm text-gray-500 mt-1">{event.period}</p>
                        </div>
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
        </div>
    );

};



export default Main_Event;

