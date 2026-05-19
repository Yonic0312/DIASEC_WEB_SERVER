import { useEffect, useState } from 'react';
import SupportHeader from './SupportHeader';

const NoticeList = () => {
    const API = process.env.REACT_APP_API_BASE;
    const [notices, setNotices] = useState([]);
    const [openIndex, setOpenIndex] = useState(null);

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        try {
            const res = await fetch(`${API}/notice/list`, {
                credentials: 'include',
            });
            const data = await res.json();
            setNotices(data);
        } catch (err) {
            console.error('공지사항 불러오기 실패', err);
        }
    };

    // 토글
    const toggleNotice = (index) => {
        setOpenIndex(prev => (prev === index ? null : index));
    };

    // 페이징
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const totalPages = Math.max(1, Math.ceil(notices.length / itemsPerPage));
    const indexOfLastNotice = currentPage * itemsPerPage;
    const indexOfFirstNotice = indexOfLastNotice - itemsPerPage;
    const currentNotices = notices.slice(indexOfFirstNotice, indexOfLastNotice);

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


    return(
        <div className="max-5xl mx-auto px-4 mt-16 pb-24 text-sm text-gray-800">
            <SupportHeader />

            <ul className="
                text-[14px] md:text-[16px]
                mt-16 divide-y border-b">
                {currentNotices.map((notice, idx) => {
                    const globalIndex = (currentPage - 1) * indexOfFirstNotice + idx;
                    return(
                        <li key={`${notice.notice_id}-${idx}`}>
                            <div
                                onClick={() => toggleNotice(globalIndex)}
                                className="
                                    flex justify-between items-center 
                                    px-3 md:px-4
                                    py-3 md:py-4
                                    hover:bg-gray-50 transition cursor-pointer"    
                            >
                            <div className="
                                text-[14px] md:text-[16px]
                                truncate"
                            >
                                {notice.pinned && (
                                    <span className="text-orange-500 font-semibold mr-2">[고정]</span>
                                )}
                                {notice.title}
                            </div>
                            <div className="
                                text-[12px] md:text-[14px]
                                text-gray-400 shrink-0 ml-4">
                                {notice.createdAt?.slice(2, 10).replaceAll('-', '.')}
                            </div>
                        </div>

                        {openIndex === globalIndex && (
                            <div className='bg-gray-50 min-h-40 px-4 py-4 text-gray-700 whitespace-pre-wrap border-t'>
                                {notice?.imageUrl && (
                                    <img src={notice.imageUrl} alt="공지 이미지" className="max-w-full rounded-md border" />
                                )}
                                {notice.content}
                            </div>
                        )}
                    </li>
                    );
                })}
            </ul>
            
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

export default NoticeList;