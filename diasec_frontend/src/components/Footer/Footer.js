import { useNavigate, Link } from "react-router-dom";

const Footer = () => {
    const navigate = useNavigate();

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#b29476] mb:mt-20 mt-10">
            <div className="
                md:text-[15px] text-[clamp(12px,1.955vw,15px)]
                flex flex-col items-center text-white">
                <div className="
                    md:text-[15px] text-[clamp(12px,1.955vw,15px)]
                    flex
                    gap-2 mb-[6px] md:mb-0"
                >
                    <span> 상호명 : 디아섹코리아</span> 
                    <span className="md:block hidden">|</span>
                    <span> 대표 : 임정원</span> 
                    
                </div> 

                <div className="
                    flex flex-col md:flex-row md:gap-2 text-center
                ">
                    <span> 메일 : d2one@naver.com</span>
                    <span className="md:block hidden">|</span>
                    <span> 고객센터 : 02-389-5879</span>
                    <span className="md:block hidden">|</span>
                    <span> 사업자등록번호 : 357-78-00448</span>
                    
                </div>

                <div className="
                    flex flex-col md:flex-row md:gap-2 text-center
                ">
                    <span> 통신판매업신고번호 : 2026-고양덕양구-0505</span>
                    <span className="md:block hidden">|</span>
                    <span> 주소 : 경기 고양시 덕양구 통일로 140 삼송테크노밸리 A동 355호</span>
                </div>

                <nav
                    aria-label="쇼핑 카테고리"
                    className="flex flex-wrap justify-center items-center gap-x-1 gap-y-1 mt-3 mb-1 text-[11px] md:text-[13px] max-w-[min(100%,520px)]"
                >
                    <Link to="/main_Items?type=masterPiece" className="hover:underline px-1">명화</Link>
                    <span className="opacity-70">|</span>
                    <Link to="/main_Items?type=koreanPainting" className="hover:underline px-1">동양화</Link>
                    <span className="opacity-70">|</span>
                    <Link to="/main_Items?type=photoIllustration" className="hover:underline px-1">사진·일러스트</Link>
                    <span className="opacity-70">|</span>
                    <Link to="/main_Items?type=fengShui" className="hover:underline px-1">풍수그림</Link>
                    <span className="opacity-70">|</span>
                    <Link to="/customFrames" className="hover:underline px-1">맞춤액자</Link>
                </nav>

                <div className="
                        flex md:gap-2 gap-[4px]
                    "
                >
                    <button
                        onClick={() => navigate('/')}
                    >
                        홈
                    </button>
                    |
                    <button
                        onClick={() => navigate('/main_CompanyProfile')}
                    >
                        회사소개
                    </button>
                    |
                    <button
                        onClick={() => navigate('/policy/terms')}
                    >
                        이용약관
                    </button>
                    |
                    <button
                        onClick={() => navigate('/policy/privacy')}
                    >
                        개인정보 취급방침
                    </button>
                    {/* |
                    <button
                        onClick={() => navigate('')}
                    >
                        기업컨설팅
                    </button>
                    |
                    <button
                        onClick={() => navigate('')}
                    >
                        제휴문의
                    </button> */}
                     |
                    <a
                        href="https://blog.naver.com/diasec_korea"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                    >
                        블로그
                    </a>
                </div>

                <div className="flex md:text-[15px] text-[12px]  mt-[6px]">
                    <span>Copyright ⓒ2000 DIASEC KOREA All right reserved</span>
                </div>
            </div>
        </div>
    )
}

export default Footer;