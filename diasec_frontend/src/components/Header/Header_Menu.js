import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useMemo, useRef } from 'react'
import axios from 'axios';
import HeaderSearch from './HeaderSearch';
import { useMember } from '../../context/MemberContext';

import diasec1 from '../../assets/dropDownMenu/diasec/1.jpg'; 
import diasec2 from '../../assets/dropDownMenu/diasec/2.jpg';

import custom1 from '../../assets/dropDownMenu/customFrame/c1.jpg'; 
import custom2 from '../../assets/dropDownMenu/customFrame/c2.jpg'; 
import custom3 from '../../assets/dropDownMenu/customFrame/c3.jpg'; 
import custom4 from '../../assets/dropDownMenu/customFrame/c4.jpg'; 
import custom5 from '../../assets/dropDownMenu/customFrame/c5.jpg'; 
import custom6 from '../../assets/dropDownMenu/customFrame/c6.jpg'; 
import custom7 from '../../assets/dropDownMenu/customFrame/c7.jpg'; 
import custom8 from '../../assets/dropDownMenu/customFrame/c8.jpg'; 
import custom9 from '../../assets/dropDownMenu/customFrame/c9.jpg'; 
import custom10 from '../../assets/dropDownMenu/customFrame/c10.jpg'; 

const Header_Menu = () => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();
    const { member } = useMember();
    const isAdmin = member?.role === 'ADMIN';

    const [hovered, setHovered] = useState(null); // 드롭다운 상태 (PC)

    // 메뉴 정의 (상단 탭)
    const mainMenus =  useMemo(() => ([
        { key : 'diasec',            label: 'ONLY 디아섹',       link:'/main_CompanyProfile'},
        { key : 'masterPiece',       label: '명화',         link:'/main_Items?type=masterPiece' },
        { key : 'koreanPainting',       label: '동양화',         link:'/main_Items?type=koreanPainting' },
        { key : 'photoIllustration', label: '사진 / 일러스트',     link:'/main_Items?type=photoIllustration' },
        { key : 'fengShui',          label: '풍수그림',           link:'/main_Items?type=fengShui'},
        { key : 'customFrame',       label: '맞춤액자 / 사진보정',  link: '/customFrames' },
        { key : 'event',             label: '이벤트',             link: '/mainEvent'},
        // { key : 'companyOrder',      label: '기업주문',           link: '/bizOrderBoard' },
        // { key : 'registerAuthor',    label: '작가등록',           link: '/authorRegisterIntro' },
        // { key : 'Contemporary', label:'현대작가', link:'' },
        // { key : 'authorCollection',  label: '작가갤러리',          link:'/main_Items?type=authorCollection'},
        
    ]), []);

    // 드롭메뉴 사용하는지?
    const categories = useMemo(
        () => ['masterPiece', 'koreanPainting', 'fengShui', 'authorCollection', 'photoIllustration', 'customFrame'], []
    );

    const PAGE_SIZE = 15;

    const [page, setPage] = useState({
        masterPiece: { offset: 0, hasMore: true, loading: false},
        koreanPainting: { offset: 0, hasMore: true, loading: false},
        fengShui: { offset: 0, hasMore: true, loading: false},
        authorCollection: { offset: 0, hasMore: true, loading: false},
        photoIllustration: { offset: 0, hasMore: true, loading: false},
    });

    // 드롭다운/드로어에 쓸 하위 항목 (서버 데이터)
    const [dropdown, setDropdown] = useState({
        diasec: [
            { label: '회사소개', img: diasec1, link: '/main_CompanyProfile'},
            { label: '디아섹이란', img: diasec2, link: '/introduce'},
            { label: '가격정책', img: null, link: '/pricePolicy'},
        ], 
        masterPiece: [], 
        koreanPainting: [], 
        photoIllustration: [], 
        fengShui: [], 
        authorCollection: [], 
        customFrame: [
            { label: '웨딩사진', img:custom1, link:'/customFrames?preset=wedding'}, 
            { label: '가족', img:custom2, link:'/customFrames?preset=family'}, 
            { label: '반려동물', img:custom3, link:'/customFrames?preset=pet'}, 
            { label: '아기', img:custom4, link:'/customFrames?preset=baby'}, 
            { label: '프로필', img:custom5, link:'/customFrames?preset=profile'},
            { label: '풍경', img:custom9, link:'/customFrames?preset=sight'},
            { label: '애니메이션', img:custom8, link:'/customFrames?preset=anime'},
            { label: '게임', img:custom7, link:'/customFrames?preset=game'},
            { label: '매장 인테리어', img:custom6, link:'/customFrames?preset=store'},
            { label: '엔터테인먼트', img:custom10, link:'/customFrames?preset=entertainment'}],
        companyOrder: [], 
        registerAuthor: [], 
        event: []
    });

    const pageRef = useRef(page);
    const inflightRef = useRef({});
    const scrollBoxRef = useRef(null);

    // 이미지 프리로드
    // 1) 브라우저 캐시에 이미지 올리기 (가장 기본)
    const warmImageCache = (url) => {
        if (!url) return;
        const img = new Image();
        img.src = url;
    };

    // 2) 여러개 한 번에
    const warmImageCacheBatch = (urls = []) => {
        urls.forEach(warmImageCache);
    }

    const fetchCategories = useMemo(
        () => ['masterPiece', 'koreanPainting', 'fengShui', 'authorCollection', 'photoIllustration'],
        []
    );

    // 초기 데이터 로드
    useEffect(() => {
        let cancelled = false;

        // preload라는 비동기 함수 정의 (await : 이 작업 끝날 때까지 기다려 | async : 이 함수 안에서는 기다릴 수 있다)
        const preload = async () => {
            try{
                const results = await Promise.all (
                    fetchCategories.map(async (key) => {
                        // 서버에서 해당 카테고리의 첫 페이지 데이터를 가져옴
                        const { data } = await axios.get(`${API}/collections/allItems/paged`, {
                            params: {
                                type: key, // 어떤 카테고리
                                size: PAGE_SIZE, // 몇개씩
                                offset: 0 // 페이지
                            }
                        });


                        // 서버에서 받은 데이터를 헤더에서 사용하게 가공
                        const mapped = (data || []).map(x => ({
                            label: x.label,
                            img: x.imageUrl,
                            link: `/main_Items?type=${key}&author=${encodeURIComponent(x.label)}`
                        }));

                        // 이번에 받은 이미지들 미리 로딩
                        warmImageCacheBatch(mapped.map(v => v.img));

                        return { key, mapped };
                    })
                );

                if (cancelled) return;
                
                // dropdown 상태에 저장 
                setDropdown(prev => {
                    const next = { ...prev };
                    results.forEach(({key, mapped }) => { next[key] = mapped; });
                    return next;
                });

                // 페이지 정보 업데이트
                setPage(prev => {
                    const next = { ...prev };
                    results.forEach(({ key, mapped }) => {
                        next[key] = {
                            offset: mapped.length, // 이미 불러온 개수
                            loading: false, // 로딩 끝
                            hasMore: mapped.length === PAGE_SIZE // 더 불러올 수 있는지
                        };
                    });
                    return next;
                });
            } catch (e) {
                console.error('헤더 preload 실패:', e);
            }
        };

        preload();
        return () => { cancelled = true; };
    }, [API, fetchCategories, PAGE_SIZE]);

    // 더 불러오기
    const fetchMore = async (key) => {
        if (!fetchCategories.includes(key)) return;

        const p = pageRef.current[key];
        if (!p || p.loading || !p.hasMore) {
            return
        };

        if (inflightRef.current[key]) return;
        inflightRef.current[key] = true;

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
                link: `/main_Items?type=${key}&author=${encodeURIComponent(x.label)}`
            }));

            warmImageCacheBatch(mapped.map(v => v.img));

            setDropdown(prev => ({
                ...prev,
                [key]: [...(prev[key] || []), ...mapped]
            }));

            setPage(prev => ({
                ...prev,
                [key]: {
                    offset: p.offset + mapped.length,
                    loading: false,
                    hasMore: mapped.length === PAGE_SIZE
                }
            }));
        } catch (e) {
            console.error('드롭다운 로드 실패', key, e);
            setPage(prev => ({
                ...prev,
                [key]: { ...prev[key], loading: false, hasMore: false}
            }));
        } finally {
            inflightRef.current[key] = false;
        }
    };

    useEffect(() => {
        pageRef.current = page;
    }, [page]);

    // hovered 바뀔 때 스크롤 0으로 리셋
    useEffect(() => {
        if (!hovered) return;
        if (!categories.includes(hovered)) return;

        const el = scrollBoxRef.current;
        if (el) el.scrollTop = 0;
    }, [hovered]);

    const isDropdownMenu = (key) => 
        key === "diasec" || categories.includes(key);

    // const lastHoveredRef = useRef(null);
    // useEffect(() => {
    //     if (hovered) lastHoveredRef.current = hovered;
    // }, [hovered]);

    const activeKey = hovered;
    const showDropdown = !!hovered && isDropdownMenu(hovered);
    const currentItems = useMemo(() => {
        if (!hovered) return [];
        const items = dropdown[hovered] || [];
        if (hovered === 'diasec' && !isAdmin) {
            return items.filter((item) => item.link !== '/pricePolicy');
        }
        return items;
    }, [hovered, dropdown, isAdmin]);

    // 메뉴 즉시 닫기 금지
    const closeTimerRef = useRef(null);

    const openMenu = (key) => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
        setHovered(key);
    };

    const scheduleClose = () => {
        if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
        closeTimerRef.current = setTimeout(() => setHovered(null), 120);
    }

    // 데스크톱 메뉴 (기존)
    return (
        <div className="relative hidden md:block items-center w-full h-fit border-b-[1px] px-2"
            onMouseLeave={scheduleClose}
            onMouseEnter={() => {
                if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
            }}
        >
            <div className="flex items-center w-full h-full">
                <div className='flex items-center justify-between w-full max-w-[1300px] mx-auto text-[clamp(12px,1.154vw,15px)]'>
                    {mainMenus.map(menu => (
                        <div
                            key={menu.key}
                            onMouseEnter={() => openMenu(menu.key)}
                        >   
                            <button 
                                className={`relative hover:text-[#a67a3e] transition-all duration-300
                                    ${hovered === menu.key ? 'text-[#a67a3e] underline-offset' : ''}`}
                                    onClick={() => {
                                        if (menu.link) {
                                            navigate(menu.link);
                                        }
                                        setHovered(null);
                                    }}
                            >   
                                {/* / 작게 하기 */}
                                <span className={`relative after:absolute after:left-0 after:bottom-0 after:h-[2px] after:bg-[#a67a3e] after:transition-all after:duration-300 after:content-[''] ${hovered === menu.key ? 'after:w-full' : 'after:w-0' }`}>
                                    {menu.label.split(/( \/ )/).map((part, idx) => 
                                        part === ' / ' ? (
                                            <span key={idx} className='font-thin mx-[1px]'>/</span>
                                        ) : (
                                            <span key={idx}>{part}</span>
                                        )
                                    )}
                                </span>
                            </button>
                        </div>
                    ))}
                    {/* ✅ 돋보기 검색 (PC) */}
                    <HeaderSearch variant="desktop" />
                </div>
            </div>

            <div className={`
                absolute w-full left-0 top-full z-50 rounded-b-lg overflow-hidden gap-9
                    bg-white shadow-xl pb-4 h-auto
                    transition-opacity duration-150
                    ${showDropdown ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}
                `}
                onMouseEnter={() => {
                    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
                }}
                onMouseLeave={scheduleClose}
            >   
                <div className={`max-w-[1300px] mx-auto px-5 mt-8 overflow-y-auto xl:max-h-[570px] lg:max-h-[560px] max-h-[440px]`}
                    ref={scrollBoxRef}
                    onScroll={(e) => {
                        if (!activeKey) return;
                        // 페이징 대상 카테고리 아니면 무시
                        if (!fetchCategories.includes(activeKey)) return;

                        const el = e.currentTarget;
                        const nearBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 80;
                        if (nearBottom) fetchMore(activeKey);
                    }}
                >
                    <div className="grid grid-cols-5 gap-[22px]">
                        {currentItems.map(item => (
                            <div
                                key={item.label}
                                onClick={() => {
                                    navigate(item.link);
                                    setHovered(null);
                                }}
                                className={`
                                    flex flex-col h-auto items-center border-[1.5px] border-gray-400 rounded-xl cursor-pointer overflow-hidden hover:opacity-80 hover:shadow-lg
                                `}
                            >
                                {item.img || item.imageUrl ? (
                                    <img
                                        src={item.img || item.imageUrl}
                                        className='w-full aspect-[220/220] object-cover border-gray-400 border-b-[1.5px]'
                                        alt={item.label}
                                    />
                                ) : (
                                    <div className='w-full aspect-[220/220] bg-gray-200 border-gray-400 border-b-[1.5px]' />
                                )}
                                <span className="
                                    xl:text-[14.5px] lg:text-[11px] md:text-[9.5px]
                                    py-2 font-[700] text-center">{item.label}</span>
                            </div>
                        ))}
                    </div>
                    {fetchCategories.includes(activeKey) && page[activeKey]?.loading && (
                        <div className="text-center py-3 text-[12px] text-gray-500">불러오는 중...</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Header_Menu;