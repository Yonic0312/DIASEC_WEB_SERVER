import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMember } from "./context/MemberContext";
import { toast } from 'react-toastify';

import './App.css';
import { Routes, Route, useLocation, Outlet } from 'react-router-dom';
import { MemberProvider } from './context/MemberContext';
import { PartnerProvider } from './context/PartnerContext';
import { SitePromoProvider } from './context/SitePromoContext';
import AdminRoute from './components/common/AdminRoute';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'

import Header from './components/Header/Header'
import Header_Menu from './components/Header/Header_Menu'
import Main_Image from './components/Main/Main_Image'
import Login from './components/Login/Login'
import Join from './components/Login/Join'
import Join_success from './components/Login/Join_success'
import Find_Id from './components/Login/Find_Id'
import Find_Id_success from './components/Login/Find_Id_success'
import Find_Pwd from './components/Login/Find_Pwd'
import Find_Pwd_success from './components/Login/Find_Pwd_success'
import Main from './components/Main/Main'
import Main_Items from './components/Main/Main_Items'
import Main_Introduce from './components/Main/Main_Introduce'
import Main_Event from './components/Main/Main_Event'
import Main_EventDetail from './components/Main/Main_EventDetail'
import None_Custom_Detail from './components/Product_Detail/None_Custom_Detail'
import Modify from './components/Member/Modify/Modify'
import ChangePwd from './components/Member/Modify/ChangePwd'
import OrderList from './components/Member/Order/OrderList' 
import WishList from './components/Member/Items/WishList'
import AddrList from './components/Member/Addr/AddrList'
import AddrModify from './components/Member/Addr/AddrModify'
import AddrRegister from './components/Member/Addr/AddrRegister'
import Member_Sidebar from './components/Member/Member_Sidebar'
import Cart from './components/Member/Items/Cart'
import OrderForm from './components/Order/OrderForm'
import OrderComplete from './components/Order/OrderComplete'
import OrderDetail from './components/Member/Order/OrderDetail'
import OrderTracking from './components/Member/Order/OrderTracking'
import ReviewWrite from './components/ProductDetailTabs/Review/ReviewWrite'
import Admin_Sidebar from './components/Admin/Admin_Sidebar'
import Order_Status from './components/Admin/Order_Status'
import ProductDetail from './components/ProductDetailTabs/Detail/ProductDetail'
import InquiryForm from './components/ProductDetailTabs/Inquiry/InquiryForm'
import MyInquiryList from './components/Member/Inquiry/InquiryList'
import CreditHistory from './components/Member/Credit/CreditHistory'
import SupportMain from './components/Support/SupportMain'
import SupportInquiryForm from './components/Support/SupportInquiryForm'
import SupportMyInquiryList from './components/Support/MyInquiryList'
import FaqMain from './components/Support/FaqMain'
import NoticeList from './components/Support/NoticeList'
import ReviewBoard from './components/Support/ReviewBoard'
import CustomFrames from './components/Main/Main_CustomFrames'
import BizOrderBoard from './components/Biz/BizOrderBoard'
import Biz_OrderWrite from './components/Biz/Biz_OrderWrite'
import Main_CompanyProfile from './components/Main/Main_CompanyProfile'
import MyRetouchList from './components/Member/Order/MyRetouchList'
import MemberHome from './components/Member/MemberHome'
// import LeasePage from './components/Lease/LeasePage'
import AuthorRegisterIntro from './components/Author/AuthorRegisterIntro'
import AuthorRegisterForm from './components/Author/AuthorRegisterForm'
import AuthorPage from './components/Author/AuthorPage'
import FloatingButtons from './components/Button/FloatingButtons'
import GuestOrderSearch from './components/Member/Order/GuestOrderSearch'
import LinkSocial from "./components/Member/Modify/LinkSocial"
import SearchResults from './components/Main/Main_SearchResults';
import Terms from './components/Policy/Terms';
import Privacy from './components/Policy/Privacy';
import Biz_ConsultWrite from './components/Biz/Biz_ConsultWrite';
import Biz_ConsultList from './components/Biz/Biz_ConsultList';
import Biz_PartnerMain from './components/Biz/Biz_PartnerMain';
import Biz_PartnerApply from './components/Biz/Biz_PartnerApply';
import Member_PartnerStatus from './components/Member/Member_PartnerStatus';
import Admin_BizPartnerList from './components/Admin/Admin_BizPartnerList';
import Admin_BizPartnerView from './components/Admin/Admin_BizPartnerView';

import Admin_InquiryList from './components/Admin/Admin_InquiryList'
import Admin_FAQManager from './components/Admin/Admin_FAQManager'
import Admin_NoticeManager from './components/Admin/Admin_NoticeManager'
import Admin_MemberManager from './components/Admin/Admin_MemberManager'
import Admin_MemberSalesRanking from './components/Admin/Admin_MemberSalesRanking'
import Admin_ProductManager from './components/Admin/Admin_ProductManager'
import Admin_ReviewManager from './components/Admin/Admin_ReviewManager'
import Admin_CollectionManager from './components/Admin/Admin_CollectionManager'
import Admin_Order_Detail from './components/Admin/Order_Detail'
import Admin_EventManager from './components/Admin/Admin_EventManager'
import Admin_SiteDiscount from './components/Admin/Admin_SiteDiscount'
import Admin_BizList from './components/Admin/Admin_BizList'
import Admin_BizConsultList from './components/Admin/Admin_BizConsultList'
import Admin_BizConsultView from './components/Admin/Admin_BizConsultView'
import Admin_BizView from './components/Admin/Admin_BizView'
// import Admin_Lease_Status from './components/Admin/Lease_Status'
import Admin_AuthorManager from './components/Admin/AuthorManager'
import Admin_RetouchList from './components/Admin/AdminRetouchList'
import Admin_Home from './components/Admin/Admin_Home'


import Footer from './components/Footer/Footer'

// Admin
import Insert_Product from './components/Admin/Insert_Product'
import axios from 'axios';
import {
    consumeDocumentReloadOnce,
    clearMainItemsScrollSession,
    MAIN_ITEMS_SCROLL_PREFIX,
} from './utils/navigationReload';
import { getSiteWideDiscountPercent } from './config/sitePromo';

const SEO_SITE_ORIGIN = 'https://diasec.co.kr';
const SEO_DEFAULT_OG_IMAGE = `${SEO_SITE_ORIGIN}/icon.png`;
const getSeoPromoTitle = () => {
    const pct = getSiteWideDiscountPercent();
    return pct > 0 ? ` | ${pct}% 오픈할인 · 무료배송` : ' · 무료배송';
};

function getMainItemsSeoByType(type) {
    const promo = getSeoPromoTitle();
    switch (type) {
        case 'masterPiece':
            return {
                title: `명화 | 디아섹코리아${promo}`,
                description:
                    '명화·고전 회화를 고해상 디아섹 액자로 제작합니다. 작품에 맞는 사이즈와 마감으로 갤러리 수준의 인테리어를 완성해 보세요.',
            };
        case 'koreanPainting':
            return {
                title: `동양화 | 디아섹코리아${promo}`,
                description:
                    '민화·수묵·동양풍 작품을 위한 디아섹 액자. 선명한 발색과 깊이 있는 표현을 살리는 맞춤 제작 서비스입니다.',
            };
        case 'photoIllustration':
            return {
                title: `사진·일러스트 | 디아섹코리아${promo}`,
                description:
                    '스냅·일러스트·디지털 아트까지 사진과 그래픽 작품용 디아섹 액자. 출력 품질과 보존성에 최적화된 프리미엄 액자입니다.',
            };
        case 'fengShui':
            return {
                title: `풍수그림 | 디아섹코리아${promo}`,
                description:
                    '풍수 인테리어용 그림을 디아섹 액자로 제작합니다. 공간에 맞는 사이즈와 마감으로 맞춤 주문이 가능합니다.',
            };
        case 'authorCollection':
            return {
                title: `작가 컬렉션 | 디아섹코리아${promo}`,
                description:
                    '작가별 컬렉션 작품을 디아섹 액자로 만나보세요. 고해상 프린트와 아크릴 마감으로 작품을 오래 보존합니다.',
            };
        default:
            return {
                title: `디아섹코리아${promo}`,
                description:
                    '디아섹코리아에서 디아섹 액자와 맞춤 액자를 만나보세요. 작품과 사진에 맞춘 프리미엄급 액자 제작 서비스를 제공합니다.',
            };
    }
}

const CUSTOM_FRAME_PRESET_SEO_MAP = {
    wedding: {
        title: '웨딩사진 맞춤 디아섹 액자 | 디아섹코리아',
        description:
            '웨딩 스냅·본식 사진을 프리미엄 디아섹 액자로 제작합니다. 사이즈·마감 맞춤 주문이 가능합니다.',
    },
    family: {
        title: '가족사진 맞춤 디아섹 액자 | 디아섹코리아',
        description:
            '가족 단체사진·기념 촬영을 고광택·무광 디아섹 액자로 오래 보존하세요.',
    },
    pet: {
        title: '반려동물 사진 디아섹 액자 | 디아섹코리아',
        description:
            '반려동물 프로필·스튜디오 컷을 선명한 디아섹 액자로 맞춤 제작합니다.',
    },
    baby: {
        title: '아기 성장사진 디아섹 액자 | 디아섹코리아',
        description:
            '백일·돌·성장 기록 사진을 아크릴 디아섹 액자로 인테리어용으로 제작합니다.',
    },
    profile: {
        title: '프로필·증명사진 맞춤 액자 | 디아섹코리아',
        description:
            '프로필·증명 촬영 이미지를 깔끔한 디아섹 액자로 완성합니다.',
    },
    store: {
        title: '매장·사무실 인테리어용 디아섹 액자 | 디아섹코리아',
        description: '매장·카페·사무실 벽면용 대형 디아섹 액자 맞춤 제작.',
    },
    game: {
        title: '게임·굿즈 일러스트 디아섹 액자 | 디아섹코리아',
        description:
            '게임 일러스트·굿즈 아트를 컬렉션용 디아섹 액자로 제작합니다.',
    },
    anime: {
        title: '애니·일러스트 디아섹 액자 | 디아섹코리아',
        description:
            '애니메이션·팬아트를 선명한 색감의 디아섹 액자로 보관·전시하세요.',
    },
    sight: {
        title: '풍경·여행사진 디아섹 액자 | 디아섹코리아',
        description:
            '여행·야경·자연 풍경 사진을 거실용 디아섹 액자로 맞춤 제작합니다.',
    },
};

function upsertMetaByName(name, content) {
    let tag = document.querySelector(`meta[name="${name}"]`);
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', name);
        document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
}

function upsertMetaProperty(property, content) {
    let tag = document.querySelector(`meta[property="${property}"]`);
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
}

function upsertCanonical(href) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
    }
    link.setAttribute('href', href);
}

function applyPageSeo(seo) {
    document.title = seo.title;
    upsertMetaByName('description', seo.description);
    upsertCanonical(seo.canonical);
    upsertMetaProperty('og:type', 'website');
    upsertMetaProperty('og:title', seo.title);
    upsertMetaProperty('og:description', seo.description);
    upsertMetaProperty('og:url', seo.canonical);
    upsertMetaProperty('og:image', SEO_DEFAULT_OG_IMAGE);
    upsertMetaProperty('og:locale', 'ko_KR');
}

function SeoMetaManager() {
    const location = useLocation();

    useEffect(() => {
        const origin = SEO_SITE_ORIGIN;
        const path = location.pathname;
        const search = location.search;
        const currentUrl = `${origin}${path}${search}`;

        const promoTitle = getSeoPromoTitle();
        const seoDefaults = {
            title: `디아섹 액자 전문 맞춤액자 디아섹코리아${promoTitle}`,
            description:
                '디아섹코리아에서 디아섹 액자와 맞춤 액자를 만나보세요. 작품과 사진에 맞춘 프리미엄급 액자 제작 서비스를 제공합니다.',
            canonical: currentUrl,
        };

        let seo = { ...seoDefaults };

        const params = new URLSearchParams(search);

        if (path === '/main_Items') {
            const type = params.get('type');
            const author = params.get('author');
            const base = getMainItemsSeoByType(type);
            let title = base.title;
            let description = base.description;
            if (author) {
                const name = decodeURIComponent(author);
                title = `${name} | ${base.title}`;
                description = `${name} 작품. ${base.description}`;
            }
            seo = { title, description, canonical: currentUrl };
        } else if (path === '/customFrames') {
            const presetKey = params.get('preset');
            const baseTitle = `맞춤액자·사진보정 | 디아섹코리아${promoTitle}`;
            const baseDesc =
                '맞춤 디아섹 액자 주문과 전문 사진보정. 이미지 업로드 후 사이즈·마감을 선택하고 웨딩·가족·반려 등 프리셋으로 빠르게 주문할 수 있습니다.';
            const preset = presetKey ? CUSTOM_FRAME_PRESET_SEO_MAP[presetKey] : null;
            if (preset) {
                seo = {
                    title: preset.title,
                    description: preset.description,
                    canonical: `${origin}/customFrames?preset=${encodeURIComponent(presetKey)}`,
                };
            } else {
                seo = {
                    title: baseTitle,
                    description: baseDesc,
                    canonical: `${origin}/customFrames`,
                };
            }
        } else if (path === '/introduce') {
            seo = {
                title: `디아섹 액자 소개 | 디아섹코리아${promoTitle}`,
                description:
                    '디아섹코리아의 디아섹 액자를 소개합니다. 선명한 발색과 고급스러운 마감의 아크릴 액자를 확인해보세요.',
                canonical: `${origin}/introduce`,
            };
        } else if (path === '/main_CompanyProfile') {
            seo = {
                title: `회사소개 | 디아섹코리아${promoTitle}`,
                description:
                    '디아섹코리아 회사 소개. 디아섹과 프리미엄 아크릴 액자 제작 서비스, 브랜드 스토리를 확인하세요.',
                canonical: `${origin}/main_CompanyProfile`,
            };
        } else if (path === '/mainEvent') {
            seo = {
                title: `이벤트 | 디아섹코리아${promoTitle}`,
                description:
                    '디아섹코리아 진행 중인 할인·프로모션 이벤트를 한눈에 보세요. 액자·맞춤 제작 혜택을 놓치지 마세요.',
                canonical: `${origin}/mainEvent`,
            };
        }

        applyPageSeo(seo);
    }, [location.pathname, location.search]);

    return null;
}

function ScrollToTop() {
    const location = useLocation();
    useEffect(() => {
        const restoreKey = `${MAIN_ITEMS_SCROLL_PREFIX}${location.pathname}${location.search}`;

        if (consumeDocumentReloadOnce()) {
            clearMainItemsScrollSession();
            window.scrollTo(0, 0);
            return;
        }

        if (location.pathname === "/main_Items" && sessionStorage.getItem(restoreKey) != null) {
            return;
        }
        window.scrollTo(0, 0);
    }, [location.pathname, location.search]);
    return null;
}

function Layout() {
    const location = useLocation();
    const path = location.pathname;
    const API = process.env.REACT_APP_API_BASE;
    const isItems = location.pathname === '/' || location.pathname === '/main_Items_Clock';
    const isMain = location.pathname === '/';

    const navigate = useNavigate();
    const { member, setMember } = useMember();

    const memberPaths = ['/modify', '/changePwd', '/orderList', '/orderDetail', '/orderList_Claim' , '/addrList', '/addrModify', '/myInquiryList', '/reviewWrite', '/supportInquiryForm', '/mypage/partner',
                    '/addrRegister', '/wishList', '/creditHistory', '/orderTracking', '/mypage/retouch'];
    const isMemberPage = memberPaths.some(p => path.startsWith(p)) || path.startsWith('/addrModify/') || path.startsWith('/orderDetail');
    // 비회원 주문조회 경로는 마이페이지 사이드바 없이 표시
    const isMember = Boolean(member?.id) && isMemberPage;
    const isAdmin = path.startsWith('/admin');

    const extraPb = 
        path === "/none_custom_detail" ? "mb-[100px] md:mb-0"
        : path === "/customFrames" ? " mb-[50px] md:mb-0"
        : "";

    useEffect(() => {
        const sendHeartbeat = () => {
            if (document.visibilityState === "hidden") return;
            axios.post(`${API}/visit/track`, {}, { withCredentials: true })
            .catch(() => {});
        };
        
        sendHeartbeat();
        const id = setInterval(sendHeartbeat, 30_000);

        const onVisibility = () => {
            if (document.visibilityState === 'visible') sendHeartbeat();
        };
        document.addEventListener('visibilitychange', onVisibility);

        return () => {
            clearInterval(id);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [API]);

    useEffect(() => {
        const handler = async (e) => {
            if (e.origin !== window.location.origin) return;

            const { type, message } = e.data || {};

            if (type === "LINK_REQUIRED") {
                navigate("/link-social");
                return;
            }

            if (type === "OAUTH_FAIL") {
                toast.error("소셜 로그인 실패");
                console.error("OAUTH_FAIL:", message);
                return;
            }

            if (type === "OAUTH_SUCCESS") {
                try {
                    const API = process.env.REACT_APP_API_BASE;
                    const api = axios.create({ baseURL: API, withCredentials: true});

                    const profile = await api.get(`/member/me`);
                    setMember(profile.data);
                    toast.success("로그인되었습니다.");
                    navigate("/");
                } catch (err) {
                    toast.error("로그인 정보를 불러오지 못했습니다.");
                    console.error(err);
                }
            }
        };

        window.addEventListener("message", handler);
        return () => window.removeEventListener("message", handler);
    }, [navigate, setMember]);

    return (
        <div className="w-full min-h-screen bg-white">
            {/* 우측하단 버튼 */}
            <FloatingButtons />

            {/* 헤더 */}
            <div className="sticky z-[9999] top-0 w-full bg-white">
                <div className="max-w-[2560px] h-[45px] mx-auto">
                    <Header />
                </div>
                <div className="hidden md:flex w-full h-[44px] mx-auto">
                    <Header_Menu />
                </div>
            </div>
            
            {isItems && (
                <div className="max-w-[2560px] max-h-[600px] mx-auto">
                    <Main_Image />
                </div>
            )}

            <div className={`
                max-w-[1300px] 
                min-h-[calc(100vh_-_150px)] 
                md:min-h-[calc(100vh_-_180px)] 
                lg:min-h-[calc(100vh_-_200px)] 
                xl:min-h-[calc(100vh_-_210px)] 
                mx-auto
            `}> 
                {isMain && (
                    <div className="
                        xl:mt-32
                        lg:mt-28
                        md:mt-24
                        mt-20">
                        
                    </div>
                )}

                {isAdmin ? (
                    <div className="flex flex-row mt-20">
                        <Admin_Sidebar />
                        <Outlet />
                    </div>
                ) : isMember ? (
                    <div className="flex flex-row mt-20">
                        <div className="hidden md:block shrink-0">
                            <Member_Sidebar />
                        </div>
                        <Outlet />
                    </div>
                ) : (
                    <Outlet />
                )}
            </div>

            <div className={`
                h-[240px] md:h-[220px] xl:h-[210px] 
                w-full bg-white ${extraPb}`}>
                <Footer />
            </div>
        </div>
    );
}

function App() {

    // 새로고침시 상단
    useEffect(() => {
        if ('scrollRestoration' in window.history) {
            window.history.scrollRestoration = 'manual';
        }
    }, []);

    return (
        <MemberProvider>
            <SitePromoProvider>
            <PartnerProvider>
                <SeoMetaManager />
                <ScrollToTop />
                <Routes>
                    <Route element={<Layout />}>
                        <Route path="/" element={<Main />}/>
                        <Route path="/userLogin" element={<Login />} />
                        <Route path="/join" element={<Join />} />
                        <Route path="/join_success" element={<Join_success />} />
                        <Route path="/find_Id" element={<Find_Id />} />
                        <Route path="/find_Id_success" element={<Find_Id_success />} />
                        <Route path="/find_Pwd" element={<Find_Pwd />} />
                        <Route path="/find_Pwd_success" element={<Find_Pwd_success />} />
                        <Route path="/modify" element={<Modify />} />
                        <Route path="/changePwd" element={<ChangePwd />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/orderList" element={<OrderList />} />
                        {/* <Route path="/orderList_Lease" element={<OrderList_Lease />} /> */}
                        <Route path="/orderDetail/:oid" element={<OrderDetail />} />
                        <Route path="/orderTracking/:itemId" element={<OrderTracking />} />
                        <Route path="/addrList" element={<AddrList />} />
                        <Route path="/addrModify/:cno" element={<AddrModify />} />
                        <Route path="/addrRegister" element={<AddrRegister />} />
                        <Route path="/wishList" element={<WishList />} />
                        <Route path="/none_custom_detail" element={<None_Custom_Detail/>} />
                        <Route path="/main_Items" element={<Main_Items/>} />
                        <Route path="/orderForm" element={<OrderForm/>} />
                        <Route path="/orderComplete" element={<OrderComplete/>} />
                        <Route path="/introduce" element={<Main_Introduce/>} />
                        <Route path="/mainEvent" element={<Main_Event/>} />
                        <Route path="/mainEventDetail/:id" element={<Main_EventDetail/>} />
                        <Route path="/reviewWrite" element={<ReviewWrite/>} />
                        <Route path="/inquiryForm" element={<InquiryForm/>} />
                        <Route path="/productDetail" element={<ProductDetail />} />
                        <Route path="/myInquiryList" element={<MyInquiryList />} />
                        <Route path="/creditHistory" element={<CreditHistory />} />
                        <Route path="/supportMain" element={<SupportMain />} />
                        <Route path="/supportInquiryForm" element={<SupportInquiryForm />} />
                        <Route path="/supportMyInquiryList" element={<SupportMyInquiryList />} />
                        <Route path="/faqMain" element={<FaqMain />} />
                        <Route path="/noticeList" element={<NoticeList />} />
                        <Route path="/reviewBoard" element={<ReviewBoard />} />
                        <Route path="/customFrames" element={<CustomFrames />} />
                        <Route path="/bizOrderBoard" element={<BizOrderBoard />} />
                        <Route path="/biz_OrderWrite" element={<Biz_OrderWrite />} />
                        <Route path="/main_CompanyProfile" element={<Main_CompanyProfile />} />
                        <Route path="/mypage/retouch" element={<MyRetouchList />} />
                        <Route path="/mypage" element={<MemberHome />} />
                        {/* <Route path="/leasePage" element={<LeasePage />} /> */}
                        <Route path="/authorRegisterIntro" element={<AuthorRegisterIntro />} />
                        <Route path="/authorRegisterForm" element={<AuthorRegisterForm />} />
                        <Route path="/authorPage/:id" element={<AuthorPage />} />
                        <Route path="/guestOrderSearch" element={<GuestOrderSearch />} />
                        <Route path="/link-social" element={<LinkSocial />} />
                        <Route path="/search" element={<SearchResults />} />
                        <Route path="/policy/terms" element={<Terms />} />
                        <Route path="/policy/privacy" element={<Privacy />} />
                        <Route path="/bizConsult" element={<Biz_ConsultWrite />} />
                        <Route path="/bizConsultList" element={<Biz_ConsultList />} />
                        <Route path="/bizPartner" element={<Biz_PartnerMain />} />
                        <Route path="/bizPartnerApply" element={<Biz_PartnerApply />} />
                        <Route path="/mypage/partner" element={<Member_PartnerStatus />} />
                        

                        {/* 어드민 */}
                        <Route path="/admin_home" element={<AdminRoute><Admin_Home /></AdminRoute>} />
                        <Route path="/admin/insert_Product" element={<AdminRoute><Insert_Product/></AdminRoute>} />
                        <Route path="/admin/order_Status" element={<AdminRoute><Order_Status/></AdminRoute>} />   
                        <Route path="/admin/order_Detail/:itemId" element={<AdminRoute><Admin_Order_Detail/></AdminRoute>} />
                        <Route path="/admin_BizList" element={<AdminRoute><Admin_BizList /></AdminRoute>} />
                        <Route path="/admin/biz/view/:id" element={<AdminRoute><Admin_BizView /></AdminRoute>} />
                        <Route path="/admin_BizConsultList" element={<AdminRoute><Admin_BizConsultList /></AdminRoute>} />
                        <Route path="/admin_biz-consult/view/:id" element={<AdminRoute><Admin_BizConsultView /></AdminRoute>} />
                        <Route path="/admin_AuthorManager" element={<AdminRoute><Admin_AuthorManager /></AdminRoute>} />
                        <Route path="/admin_AdminRetouchList" element={<AdminRoute><Admin_RetouchList /></AdminRoute>} />
                        <Route path="/admin_BizPartnerList" element={<AdminRoute><Admin_BizPartnerList /></AdminRoute>} />
                        <Route path="/admin_biz-partner/view/:id" element={<AdminRoute><Admin_BizPartnerView /></AdminRoute>} />
                        <Route path="/admin_InquiryList" element={<AdminRoute><Admin_InquiryList /></AdminRoute>} />
                        <Route path="/admin_FAQManager" element={<AdminRoute><Admin_FAQManager /></AdminRoute>} />
                        <Route path="/admin_NoticeManager" element={<AdminRoute><Admin_NoticeManager /></AdminRoute>} />
                        <Route path="/admin_MemberManager" element={<AdminRoute><Admin_MemberManager /></AdminRoute>} />
                        <Route path="/admin_MemberSalesRanking" element={<AdminRoute><Admin_MemberSalesRanking /></AdminRoute>} />
                        <Route path="/admin_ProductManager" element={<AdminRoute><Admin_ProductManager /></AdminRoute>} />
                        <Route path="/admin_ReviewManager" element={<AdminRoute><Admin_ReviewManager /></AdminRoute>} />
                        <Route path="/admin_CollectionManager" element={<AdminRoute><Admin_CollectionManager /></AdminRoute>} />
                        <Route path="/admin_EventManager" element={<AdminRoute><Admin_EventManager /></AdminRoute>} />
                        <Route path="/admin_SiteDiscount" element={<AdminRoute><Admin_SiteDiscount /></AdminRoute>} />
                        
                    </Route>
                </Routes>
                <ToastContainer
                    position="top-center"
                    autoClose={2500}
                    hideProgressBar={true}
                    closeOnClick
                    draggable={false}
                    pauseOnHover
                    toastClassName="custom-toast-white"
                    bodyClassName="custom-toast-body"
                />
            </PartnerProvider>
            </SitePromoProvider>
        </MemberProvider>
    );
}
  

export default App;