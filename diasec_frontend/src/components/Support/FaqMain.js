import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import SupportHeader from './SupportHeader';
import { FiSearch } from 'react-icons/fi';

const faqCategories = [
    { key: 'all', label: '전체' },
    { key: 'member', label: '회원' },
    { key: 'order', label: '주문' },
    { key: 'payment', label: '결제'},
    { key: 'shipping', label: '배송' },
    { key: 'cancel', label: '취소 및 환불' },
    { key: 'design', label: '보정 및 시안수정' },
    { key: 'etc', label: '기타' },
]

const FaqMain = () => {
    const API = process.env.REACT_APP_API_BASE;
    const [faqList, setFaqList] = useState([]);
    const [expandedId, setExpandedId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const faqsPerPage = 10; // 페이지별 게시글 개수

    // 메인에서 넘어오는 값 초기화
    const [searchParams] = useSearchParams();

    const initialCategory = searchParams.get('category') || 'all';
    const initialKeyword = searchParams.get('keyword') || '';

    const [category, setCategory] = useState(initialCategory);
    const [keyword, setKeyword] = useState(initialKeyword);
    const [inputValue, setInputValue] = useState(initialKeyword);

    useEffect(() => {
        fetchFaq();
    }, [category, keyword]);

    const fetchFaq = async () => {
        const query = new URLSearchParams();
        if (category !== 'all') query.append('category', category);
        if (keyword) query.append('keyword', keyword);

        const url = `${API}/faq/list${query.toString() ? '?' + query.toString() : ''}`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('데이터 요청 실패');
            const data = await res.json();
            setFaqList(data);
            setCurrentPage(1); // 검색하거나 카테고리 바꾸면 첫 페이지로
        } catch (err) {
            console.error('FAQ 불러오기 실패:', err);
        }
    };

    const handleToggle = async (id) => {
        const isOpening = expandedId !== id;
        setExpandedId(prev => (prev === id ? null : id));

        if (isOpening) {
            try {
                await fetch(`${API}/faq/view/${id}`, { method: 'PATCH' });
            } catch (err) {
                console.error('조회수 증가 실패', err);
            }
        }
    };

    // 입려값이 바뀌면 검색어로 목록 갱신
    useEffect(() => {
        const timer = setTimeout(() => {
            setKeyword(inputValue.trim());
            setCurrentPage(1);
        },150); // 디바운스 시간

        return () => clearTimeout(timer);
    }, [inputValue]);

    const handleSearch = () => {
        setKeyword(inputValue);
    };

    const totalPages = Math.max(1, Math.ceil(faqList.length / faqsPerPage));
    const currentFaqs = faqList.slice((currentPage - 1) * faqsPerPage, currentPage * faqsPerPage);

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

    // 필터 비동기이기 때문에 즉시 요청
    const fetchFaqDirect = async (newCategory, newKeyword) => {
        const query = new URLSearchParams();
        if (newCategory !== 'all') query.append('category', newCategory);
        if (newKeyword) query.append('keyword', newKeyword);

        const url = `${API}/faq/list${query.toString() ? '?' + query.toString() : ''}`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('데이터 요청 실패');
            const data = await res.json();
            setFaqList(data);
            setCurrentPage(1);
        } catch (err) {
            console.error('FAQ 불러오기 실패:', err);
        }
    };

    return (
        <div className="max-5xl mx-auto px-4 pt-16 mb-[200px]">
            <SupportHeader />
            <div className="text-center mt-12">
                <h2 className="
                    text-[21px]
                    font-bold mt-10 mb-2"
                >
                    무엇을 도와드릴까요?
                </h2>

                <div className='relative max-w-xl mx-auto'>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="궁금한 내용을 입력하세요"
                        className="w-full border border-gray-300 px-5 py-3 pl-10 rounded-full text-sm focus:outline-none focus-ring-2 focus:ring-black"
                    />
                    <FiSearch 
                        className="absolute left-3 top-3.5 text-gray-400 text-lg cursor-pointer"
                        onClick={handleSearch}
                    />
                </div>
            </div>

            {/* 카테고리 필터 */}
            <div className="
                flex justify-start overflow-x-auto whitespace-nowrap
                [-webkit-overflow-scrolling:touch]
                [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden
                md:gap-2 gap-1 
                mt-4 mb-8
                text-[15px]"
                >
                {faqCategories.map((cat) => (
                    <button
                        key={cat.key}
                        onClick={() => {
                            setCategory(cat.key);
                            setKeyword('');
                            setInputValue('')
                            fetchFaqDirect(cat.key, '');
                        }}
                        className={`px-4 py-1.5 rounded-full border ${
                            category === cat.key ? 'bg-black text-white' : 'bg-white text-gray-600'
                        }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* FAQ 목록 */}
            <div className="divide-y border-t">
                {currentFaqs.map((faq) => (
                    <div 
                        key={faq.faqId} 
                        className="py-5 cursor-pointer break-keep" 
                        onClick={() => handleToggle(faq.faqId)}>
                        <div className="flex justify-between items-start">
                            <div className='
                                text-[14px] md:text-[16px]
                                font-semibold'
                            >
                                <div className="flex justify-between">
                                    <span className='text-orange-500 font-bold mr-2'>Q</span>
                                    {faq.question}
                                </div>
                            </div>
                            <span className="text-gray-400">{expandedId === faq.faqId ? '▲' : '▼'}</span>
                        </div>
                        {expandedId === faq.faqId && (
                            <div className="
                                text-[13px] md:text-[14px]   
                                mt-3 bg-gray-50 p-4 text-gray-700 whitespace-pre-line">
                                <div className="flex justify-between">
                                    <div className="w-fit">
                                        <span className="text-blue-700 font-medium mr-1">A</span>
                                    </div>
                                    <div className="w-full">
                                        {faq.answer}
                                    </div>
                                </div>
                            </div>
                        )}
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
    )
}

export default FaqMain;