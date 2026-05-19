import { useNavigate, useLocation } from 'react-router-dom';

const tabs = [
    // '고객센터홈', 
    // '고객센터홈','자주 묻는 질문', '1:1 문의','공지사항', '후기게시판', '기업컨설팅', '업무제휴'];
    '고객센터홈','자주 묻는 질문', '1:1 문의','공지사항', '후기게시판'];

const routes = {
    '고객센터홈': '/supportMain',
    '자주 묻는 질문' : '/faqMain',
    '공지사항' : '/noticeList',
    '후기게시판' : '/reviewBoard',
    '1:1 문의' : '/supportMyInquiryList',
    '업무제휴' : '1',
    '기업컨설팅' : '2',
};

const SupportHeader = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const currentPath = Object.values(routes).find(path => location.pathname.startsWith(path));
    const activeTab = Object.keys(routes).find(tab => routes[tab] === currentPath);

    return (
        <>
            <h1 
                className='
                    text-[20px] md:text-[24px]
                    w-fit font-bold mb-10 cursor-pointer'
                onClick={() => {navigate("/supportMain")}}
            >
                고객센터
            </h1>
            {/* 모바일: 탭이 한 줄로 길어지면 가로 스크롤 */}
            <div 
                className="
                    flex flex-nowrap overflow-x-auto overflow-y-hidden
                    [-webkit-overflow-scrolling:touch]
                    [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden
                    font-medium
                    md:gap-6 gap-3 
                    text-[14px] md:text-[16px]
                    scrollbar-thin scrollbar-thumb-gray-300"
                >
                {tabs.map((tab, idx) => (
                    <button 
                        key={idx}
                        type="button"
                        onClick={() => {
                            navigate(routes[tab]);
                        }}
                        className={`relative shrink-0 whitespace-nowrap
                            after:absolute after:left-0 md:after:-bottom-1 after:bottom-[0px]
                            after:w-0 after:h-0.5 after:bg-[#D0AC88]
                            after:transition-all after:duration-300
                            hover:after:w-full hover:text-black
                            ${
                                activeTab === tab
                                    ? 'text-black after:w-full'
                                    : 'text-gray-500'
                        }`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

        </>
    )
}

export default SupportHeader;