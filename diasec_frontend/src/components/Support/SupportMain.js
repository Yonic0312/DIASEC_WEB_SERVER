import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi'; // 아이콘 사용
import { BsTelephone, BsChatDots, BsEnvelope } from 'react-icons/bs';
import SupportHeader from './SupportHeader';

const SupportMain = () => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('고객센터홈');

    // FAQ 검색
    const [searchValue, setSearchValue] = useState('');

    const handleSearch = () => {
        if (searchValue.trim()) {
            navigate(`/faqMain?keyword=${encodeURIComponent(searchValue.trim())}`);
        }
    }

    // FAQ top5 가져오기
    const [faqs, setFaqs] = useState([
        "회원", 
        "주문",
        "결제",
        "배송",
        "취소 및 환불",
        "보정 및 시안 수정",
        "기타"
    ]);

    const categoryMap = {
        "회원" : "member",
        "주문" : "order",
        "결제" : "payment",
        "배송" : "shipping",
        "취소 및 환불" : "cancel",
        "보정 및 시안 수정" : "design",
        "기타" : "etc"
    };

    // 공지사항 불러오기
    const [latestNotices, setLatestNotices] = useState([]);

    useEffect(() => {
        const fetchLatestNotices = async () => {
            try {
                const res = await fetch(`${API}/notice/latest`);
                const data = await res.json();
                setLatestNotices(data);
            } catch (err) {
                console.error('최신 공지사항 불러오기 실패', err);
            }
        };
        fetchLatestNotices();
    }, []);

    // 공지사항 추가
    const [openIndex, setOpenIndex] = useState(null);

    const toggleNotice = (index) => {
        setOpenIndex(prev => (prev === index ? null : index));
    };

    return (
        <div className="max-5xl mx-auto px-4 pt-16 mb-[200px] text-gray-800">
            <SupportHeader />
            <div className="text-center mt-12">
                {/* 인삿말 */}
                <h1 className="
                    text-[21px]
                    font-bold mt-10 mb-2"
                >
                    무엇을 도와드릴까요?
                </h1>

                {/* 검색창 */}
                <div className="relative max-w-xl w-full mx-auto">
                    <input
                        type="text"
                        placeholder="궁금한 내용을 입력하세요"
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="w-full border border-gray-300 px-5 py-3 pl-10 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-black" 
                    />
                    <FiSearch 
                        className="absolute left-3 top-3.5 text-gray-400 text-lg"
                        onClick={handleSearch}    
                    />
                </div>

                {/* FAQ 카테고리 */}
                <div className="mt-14">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="
                            md:text-lg text-[clamp(16px,2.346vw,18px)]
                            font-bold cursor-pointer" onClick={() => navigate('/faq')}>자주 묻는 질문</h2>
                    </div>
                    <div className="
                        grid grid-cols-2 lg:grid-cols-3 
                        md:gap-4 gap-3
                        text-[15px]"
                    >
                        {faqs.map((faq, i) => (
                            <div key={`${faq.faq_id}-${i}`} 
                                className="
                                    border rounded-lg 
                                    md:p-5 p-3
                                    hover:shadow-md cursor-pointer bg-white transition"
                                onClick={() => {
                                    const key = categoryMap[faq] || "all";
                                    navigate(`/faqMain?category=${encodeURIComponent(key)}`);
                                }}
                            >
                                <span className="text-orange-500 font-bold mr-1">Q.</span>{faq}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 서비스 안내 */}
                <div className="
                        grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 border-t pt-8 
                        text-[15px]">
                    {[
                        { icon: <BsTelephone className="text-[24px] text-gray-600" />, title: '전화 상담', desc: '02-389-5879' },
                        { 
                            icon: <BsChatDots className="text-[24px] text-gray-600" />, 
                            title: '카카오 채팅 상담', 
                            desc: '디아섹코리아',
                            linkUrl: 'http://pf.kakao.com/_RWqbX',
                        },
                        { 
                            icon: <BsEnvelope className="text-[24px] text-gray-600" />, 
                            title: '1:1 문의', 
                            action: () => { 
                                navigate('/supportMyInquiryList');
                            }
                        },
                    ].map((item, i) => (
                        <div key={i} className="
                            flex items-center justify-start md:justify-center 
                            md:gap-4 gap-6
                            border rounded-md p-5 hover:shadow-sm bg-white transition"
                        >
                            {item.icon}
                            <div className="text-left md:text-center">
                                <div className="font-semibold">{item.title}</div>
                                <div className="text-gray-600">
                                    {item.linkUrl ? (
                                        <>
                                            <span className="text-gray-500">검색 : </span>
                                            <a
                                                href={item.linkUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:underline"
                                            >
                                                {item.desc}
                                            </a>
                                        </>
                                    ) : (
                                        item.desc
                                    )}
                                </div>
                                {item.action && (
                                    <button onClick={item.action} className="text-blue-500 text-[13px] mt-1 hover:underline">바로가기 →</button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16">
                    <div className="flex items-center justify-between">
                        <h2 className="
                            md:text-lg text-[clamp(16px,2.346vw,18px)] 
                            font-bold mb-3"
                        >
                            공지사항
                        </h2>
                        <button onClick={() => navigate('/noticeList')} className="text-[14px] text-gray-400 hover:underline">더보기 →</button>
                    </div>
                    <hr className='border-t-2 border-black'/>
                    
                    <ul className="text-[14px] divide-y border-b">
                        {latestNotices.map((notice, index) => (
                            <li key={notice.noticeId}>
                                <div
                                    onClick={() => toggleNotice(index)} 
                                    className='flex justify-between items-center py-3 hover:bg-gray-50 px-2 transition cursor-pointer'
                                >
                                    <div className="truncate">
                                        {notice.title}
                                    </div>
                                    <div className="text-gray-400 text-xs shrink-0 ml-4">
                                        {notice.createdAt?.slice(2, 10).replaceAll('-', '.')}
                                    </div>
                                </div>

                                {openIndex === index && (
                                    <div className='bg-gray-50 px-4 py-3 text-left text-gray-700 whitespace-pre-wrap border-t'>
                                        {notice.imageUrl && (
                                            <img 
                                                src={notice.imageUrl}
                                                alt="공지 이미지"
                                                className="max-w-full rounded-md border mb-2"
                                            />
                                        )}
                                        {notice.content}
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default SupportMain