import { useContext, useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { MemberContext } from '../../context/MemberContext';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ChevronDown, X, Menu as MenuIcon } from 'lucide-react';
import diasec1 from '../../assets/dropDownMenu/diasec/1.jpg'; import diasec2 from '../../assets/dropDownMenu/diasec/2.jpg';
import logo from '../../assets/images/logo.png'

const Header = () => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();
    const {member, setMember} = useContext(MemberContext); 

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [openSections, setOpenSections] = useState(null); // 아코디언 열린 섹션 키들

    const [supportOpen, setSupportOpen] = useState(false);
    const supportRef = useRef(null);

    const toggleSection = (key) => {
        setOpenSections(prev => (prev === key ? null : key));
    };

    // 모바일 메뉴 정의 (상단 탭)
    const mainMenus = useMemo(() => ([
        { key:'diasec',              label:'ONLY 디아섹',                  link: '/main_CompanyProfile' },
        { key:'masterPiece',         label:'명화',                         link:'/main_Items?type=masterPiece' },
        { key:'koreanPainting',      label:'동양화',                        link:'/main_Items?type=koreanPainting' },
        { key:'photoIllustration',   label:'사진/일러스트',                  link:'/main_Items?type=photoIllustration' },
        { key:'fengShui',            label:'풍수',                         link:'/main_Items?type=fengShui' },
        // { key:'Contemporary',        label:'현대작가',                      link:'/main_items?type=Contemporary' },
        // { key:'authorCollection',    label:'작가',                         link:'/main_items?type=authorCollection' },
        { key:'customFrame',         label:'맞춤액자/사진보정',               link:'/customFrames' },
        // { key:'companyOrder',        label:'기업주문',                      link:'/bizOrderBoard' },
        // { key:'registerAuthor',      label:'작가등록',                      link:'/authorRegisterIntro' },
        { key:'event',               label:'이벤트',                        link:'/mainEvent' },
    ]), []);

    // 무한 스크롤
    const PAGE_SIZE = 10;

    const [page, setPage] = useState({
        masterPiece: { offset: 0, hasMore: true, loading: false},
        fengShui: { offset: 0, hasMore: true, loading: false},
        authorCollection: { offset: 0, hasMore: true, loading: false},
        photoIllustration: { offset: 0, hasMore: true, loading: false},
    });



    // 드롭다운/드로어에 쓸 하위 항목 (서버 데이터)
    const [dropdown, setDropdown] = useState({
        diasec: [{ label: '디아섹코리아 회사소개', img: diasec1, link: '/main_CompanyProfile'}, { label: '디아섹이란', img: diasec2, link: '/introduce'}], 
        masterPiece: [], photoIllustration: [], fengShui: [], koreanPainting:[], Contemporary: [],
        authorCollection: [], customFrame: [], companyOrder: [], registerAuthor: [], event: []
    });
    
    // 모바일 카테고리 목록
    const categories = useMemo(
        () => ['masterPiece', 'fengShui', 'authorCollection', 'photoIllustration', 'koreanPainting', 'Contemporary'],
        []
    );

    const fetchMore = async (key) => {
        if (!categories.includes(key)) return;

        const p = page[key];

        if (!p || p.loading || !p.hasMore) {
            return;
        } 

        setPage(prev => ({
            ...prev,
            [key]: { ...prev[key], loading: true}
        }));

        try {
            const { data } = await axios.get(`${API}/collections/allItems/paged`, {
                params: {
                    type: key,
                    size: PAGE_SIZE,
                    offset: p.offset
                }
            });

            const mapped = (data || []).map(x => ({
                label: x.label,
                img: x.imageUrl,
                link:
                    key === 'masterPiece'
                        ? `/main_items?type=${key}&author=${encodeURIComponent(x.label)}`
                        : `/main_items?type=${key}&label=${encodeURIComponent(x.label)}`
            }));

            setDropdown(prev => ({
                ...prev,
                [key]: [...(prev[key] || []), ...mapped]
            }));

            setPage(prev => ({
                ...prev,
                [key]: {
                    offset: prev[key].offset + PAGE_SIZE,
                    loading: false,
                    hasMore: mapped.length === PAGE_SIZE
                }
            }));
        } catch (e) {
            setPage(prev => ({
                ...prev,
                [key]: { ...prev[key], loading: false, hasMore: false}
            }));
        }
    };


    useEffect(() => {
            axios.get(`${API}/member/me`, { withCredentials: true })
                .then((res) => {
                    if(res.data.message == "로그인 안됨" || res.data.message == "알 수 없는 사용자" || res.data.message == "인증이 필요합니다." || res.data.message == "접근 권한이 없습니다."){
                        return;
                    }
                    setMember(res.data);
                })
                .catch(() => {
                    setMember(null); // 로그인 안 되어 있으면 null
                });
    }, []);

    const handleLogout = () => {
        if(window.confirm('로그아웃을 하시겠습니까?')){
            axios.post(`${API}/member/logout`, { withCredentials: true})
                .then(() => {
                    setMember(null);
                    toast.success('로그아웃되었습니다.');
                    navigate('/');
                })
                .catch((err) => {
                    toast.error('로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.');
            });
        }
    };

    // 메뉴 토글시 메인 잠금
    useEffect(() => {
        if (!drawerOpen) return;

        // 현재 스크롤 위치 저장
        const scrollY = window.scrollY;

        // body 스크롤 잠금
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';

        // 닫을 때 원복
        return () => {
            const y = document.body.style.top;
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.width = '';
            // 원래 스크롤 위치로 복귀
            window.scrollTo(0, parseInt(y || '0') * -1);
        };
    }, [drawerOpen]);
    
    useEffect(() => {
        const onDown = (e) => {
            if (!supportRef.current) return;
            if (!supportRef.current.contains(e.target)) setSupportOpen(false);
        };

        const onKey = (e) => {
            if (e.key === "Escape") setSupportOpen(false);
        };
        document.addEventListener("mousedown", onDown);
        window.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onDown);
            window.removeEventListener("keydown", onKey);
        };
    }, []);

    return (
        <div className="sticky z-[9999] top-0 w-full h-full flex items-center justify-between px-1 bg-[#ecd2af]">
            <div className="w-full max-w-[1300px] h-full flex items-center justify-between mx-auto">
                <div className="flex items-center flex-1 h-full">
                    <button 
                        onClick={() => window.location.href = '/'} 
                        className="h-full font-bold text-lg"
                    >
                        <img className="w-auto h-[75%] md:h-full" src={logo} />
                    </button>

                    <span className='ml-[1%] lg:text-[14.5px] md:text-[clamp(11px,1.4173vw,14.5px)] text-[11px]'>
                        &nbsp; | 
                        &nbsp;액자의 최상위 레벨 - 디아섹
                    </span>
                </div>

                <div className="
                        h-full
                        text-[clamp(11px,1.0769vw,14px)]
                        xl:gap-4 lg:gap-3 md:gap-2
                        md:flex hidden text-xs">
                    <div className="
                            
                            lg:text-[14.5px] md:text-[clamp(11px,1.4173vw,14.5px)] text-[11px]
                            xl:gap-4 lg:gap-3 md:gap-2
                            md:flex hidden
                            flex-row items-center
                        "
                    >
                        {member ? (
                            <>  
                                {/* 관리자 */}
                                {member.role === 'ADMIN' && (
                                    <>
                                        <button onClick={() => navigate('/admin_home')}>관리자페이지</button>
                                        <span className="opacity-15">|</span>
                                    </>
                                )}
                                <button onClick={handleLogout}>로그아웃</button>
                                <span className="opacity-15">|</span>
                                <button onClick={() => navigate('/mypage')}>마이페이지</button>
                                <span className="opacity-15">|</span>
                                <button onClick={() => navigate('/cart')}>장바구니</button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => navigate('/userLogin')}>로그인</button>
                                <span className="opacity-15">|</span>
                                <button onClick={() => navigate('/join')}>회원가입</button>
                            </>
                        )}  
                        <span className="opacity-15">|</span>
                        <div
                            ref={supportRef}
                            className="relative h-full cursor-pointer"
                            onMouseEnter={() => setSupportOpen(true)}
                            onMouseLeave={() => setSupportOpen(false)}
                        >
                            <button
                                type="button"
                                onClick={() => navigate('/supportMain')}
                                className="
                                    inline-flex items-center gap-1
                                    px-2 rounded-full h-full
                                    transition
                                "
                            >
                                고객센터
                            </button>
                            <div
                                className={`
                                    absolute right-0 top-full
                                    w-[110px]
                                    rounded-2xl
                                    bg-white/95 backdrop-blur
                                    border border-black/10
                                    shadow-xl
                                    overflow-hidden
                                    transition
                                    ${supportOpen
                                        ? "opacity-100 translate-y-0 visible"
                                        : "opacity-0 -translate-y-1 invisible pointer-events-none"}
                                `}
                            >
                                <div className="py-2 bg-white">
                                    <button
                                        type="button"
                                        onClick={() => { navigate("/faqMain"); setSupportOpen(false);}}
                                        className="w-full text-left px-4 py-2 text-[13px] text-gray-700 bg-white hover:bg-[#ecd2af]/35 transition"
                                    >
                                        자주 묻는 질문
                                    </button>
                                    
                                    <button
                                        type="button"
                                        onClick={() => { navigate("/supportMyInquiryList"); setSupportOpen(false);}}
                                        className="w-full text-left px-4 py-2 text-[13px] text-gray-700 bg-white hover:bg-[#ecd2af]/35 transition"
                                    >
                                        1:1문의
                                    </button>
                                    
                                    <button
                                        type="button"
                                        onClick={() => { navigate("/noticeList"); setSupportOpen(false);}}
                                        className="w-full text-left px-4 py-2 text-[13px] text-gray-700 bg-white hover:bg-[#ecd2af]/35 transition"
                                    >
                                        공지사항
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => { navigate("/reviewBoard"); setSupportOpen(false);}}
                                        className="w-full text-left px-4 py-2 text-[13px] text-gray-700 bg-white hover:bg-[#ecd2af]/35 transition"
                                    >
                                        후기게시판
                                    </button>
                                        
                                    {/* <button
                                        type="button"
                                        onClick={() => { navigate("/supportMyInquiryList"); setSupportOpen(false);}}
                                        className="w-full text-left px-4 py-2 text-[13px] text-gray-700 bg-white hover:bg-[#ecd2af]/35 transition"
                                    >
                                        기업컨설팅
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => { navigate("/supportMyInquiryList"); setSupportOpen(false);}}
                                        className="w-full text-left px-4 py-2 text-[13px] text-gray-700 bg-white hover:bg-[#ecd2af]/35 transition"
                                    >
                                        업무제휴
                                    </button> */}
                                </div>      
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    className="md:hidden p-2 -ml-2"
                    aria-label="메뉴 열기"
                    onClick={() => setDrawerOpen(true)}
                >
                    <MenuIcon size={22} />
                </button>
            </div>

            <button
                aria-label="메뉴 닫기"
                className={`fixed inset-0 z-40 bg-black/40 md:hidden transition-opacity duration-300
                            ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setDrawerOpen(false)}
            />
            <aside
                className={`
                    flex flex-col justify-between fixed inset-y-0 left-0 z-50 w-[70%] max-w-[360px] bg-white md:hidden
                    shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-in-out
                    ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}
                style={{ 
                    scrollbarWidth: "none",
                    msOverflowStyle: "none"        
                }}
                role="dialog" aria-modal="true"
            >
                <div>
                    <div className="flex items-center justify-between px-4 py-3 border-b">
                        <span className="font-semibold">메뉴</span>
                        <button onClick={() => setDrawerOpen(false)} aria-label="메뉴 닫기" >
                            <X />
                        </button>
                    </div>

                    <ul className="px-2 py-2">
                        {mainMenus.map(m => {
                            const hasChildren = categories.includes(m.key) || !! dropdown[m.key]?.length;
                            const open = openSections === m.key;
                            return (
                                <li key={m.key} className="border-b last:border-none">
                                    <button
                                        className="w-full flex items-center gap-3 px-2 py-4"
                                        onClick={() => {
                                            if (categories.includes(m.key)) {
                                                // 처음 여는 순간 데이터 없으면 1페이지 로드
                                                if ((dropdown[m.key] || []).length === 0) fetchMore(m.key);
                                                toggleSection(m.key);
                                            } else if (hasChildren) {
                                                toggleSection(m.key);
                                            } else if (m.link) {
                                                navigate(m.link);
                                                setDrawerOpen(false);
                                            }
                                        }}
                                    >
                                        <span className="text-[15px]">{m.label.replace(' / ', ' ')}</span>
                                        {hasChildren && (
                                            <ChevronDown className={`ml-auto transition-transform ${open ? 'rotate-180' : ''}`} />
                                        )}
                                    </button>

                                    {/* 서브 카테고리 */}
                                    {hasChildren && (
                                        <div className={`overflow-y-auto transition-[max-height] duration-300
                                            ${open ? 'max-h-[50vh]' : 'max-h-0 overflow-hidden'}`}
                                            onScroll={(e) => {
                                                if (!open) return; // 닫혀있으면 무시
                                                if (!categories.includes(m.key)) return;

                                                const el = e.currentTarget; 
                                                
                                                const nearBottom =
                                                    el.scrollTop + el.clientHeight >= el.scrollHeight - 60;

                                                if (nearBottom) fetchMore(m.key);
                                            }}
                                        >
                                            <div className="grid grid-cols-1 gap-2 pb-3 pl-1 pr-2">
                                                {dropdown[m.key].map(item => (
                                                    <button
                                                        key={item.label}
                                                        className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-50 text-left"
                                                        onClick={() => {
                                                            navigate(item.link);
                                                            setDrawerOpen(false);
                                                        }}
                                                    >
                                                        <img src={item.img} alt="" className="w-9 h-9 rounded-full object-cover"/>
                                                        <span className="text-[14px]">{item.label}</span>
                                                    </button>
                                                ))}
                                            </div>

                                            {categories.includes(m.key) && page[m.key]?.loading && (
                                                <div className="text-center py-3 text-[12px] text-gray-500">불러오는 중...</div>
                                            )}
                                        </div>
                                    )}
                                </li>
                            )
                        })}
                    </ul>
                </div>
                {/* ── [모바일] 회원 패널 (하단 고정 + 디자인 강화) ───────────────── */}
                <div className="px-3 pb-4">
                    <div className="rounded-2xl bg-gray-50 border border-gray-200 shadow-sm">
            
                        {/* 메뉴 버튼들 */}
                        <ul className="divide-y divide-gray-200">
                        {member ? (
                            <>
                            {member.role === 'ADMIN' && (
                                <li>
                                <button
                                    onClick={() => { navigate('/admin_home'); setDrawerOpen(false); }}
                                    className="flex items-center gap-2 w-full px-4 py-3 text-[14px] text-gray-700 hover:bg-gray-100 transition rounded-t-2xl"
                                >
                                    <svg className="w-5 h-5 text-indigo-500" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M12 1l3 7h7l-5.5 4.5L18 20l-6-3.5L6 20l1.5-7.5L2 8h7z"/>
                                    </svg>
                                    관리자페이지
                                </button>
                                </li>
                            )}
                            <li>
                                <button
                                onClick={() => { navigate('/mypage'); setDrawerOpen(false); }}
                                className="flex items-center gap-2 w-full px-4 py-3 text-[14px] text-gray-700 hover:bg-gray-100 transition"
                                >
                                <svg className="w-5 h-5 text-blue-500" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4s-4 1.79-4 4s1.79 4 4 4m0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                                마이페이지
                                </button>
                            </li>
                            <li>
                                <button
                                onClick={() => { navigate('/cart'); setDrawerOpen(false); }}
                                className="flex items-center gap-2 w-full px-4 py-3 text-[14px] text-gray-700 hover:bg-gray-100 transition"
                                >
                                <svg className="w-5 h-5 text-green-500" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2m10 0c-1.1 0-1.99.9-1.99 2S15.9 22 17 22s2-.9 2-2-.9-2-2-2M7.82 14h8.94c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0018.42 5H6.21l-.94-2H1v2h3l3.6 7.59-1.35 2.44C5.52 15.37 6.17 16 7 16h12v-2H7.82z"/>
                                </svg>
                                장바구니
                                </button>
                            </li>
                            <li>
                                <button
                                onClick={() => { handleLogout(); setDrawerOpen(false); }}
                                className="flex items-center gap-2 w-full px-4 py-3 text-[14px] text-red-600 hover:bg-red-50 transition rounded-b-2xl"
                                >
                                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M14.08 15.59L16.67 13H7v-2h9.67l-2.59-2.59L15.5 7l5 5-5 5-1.42-1.41M19 3H5c-1.1 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                                </svg>
                                로그아웃
                                </button>
                            </li>
                            </>
                        ) : (
                            <>
                            <li>
                                <button
                                onClick={() => { navigate('/userLogin'); setDrawerOpen(false); }}
                                className="flex items-center gap-2 w-full px-4 py-3 text-[14px] text-gray-700 hover:bg-gray-100 transition rounded-t-2xl"
                                >
                                로그인
                                </button>
                            </li>
                            <li>
                                <button
                                onClick={() => { navigate('/join'); setDrawerOpen(false); }}
                                className="flex items-center gap-2 w-full px-4 py-3 text-[14px] text-gray-700 hover:bg-gray-100 transition rounded-b-2xl"
                                >
                                회원가입
                                </button>
                            </li>
                            </>
                        )}
                        {/* 공통 */}
                        <li>
                            <button
                            onClick={() => { navigate('/supportMain'); setDrawerOpen(false); }}
                            className="flex items-center gap-2 w-full px-4 py-3 text-[14px] text-gray-700 hover:bg-gray-100 transition"
                            >
                            <svg className="w-5 h-5 text-gray-500" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M12 3a9 9 0 00-9 9a9 9 0 0012.74 8.26L21 21l-0.74-5.26A9 9 0 0012 3m1 14h-2v-2h2v2m0-4h-2V7h2v6z"/>
                            </svg>
                            고객센터
                            </button>
                        </li>
                        </ul>
                    </div>
                </div>
            </aside>
        </div>
    );
};

export default Header;