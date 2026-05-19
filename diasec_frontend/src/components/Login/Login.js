import { useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useMember } from '../../context/MemberContext';
import axios from 'axios';
import { toast } from 'react-toastify';

import btn_kakao from '../../assets/btn_kakao.png';
import btn_naver from '../../assets/btn_naver.png';

// ✅ CORS 세션 유지 위해 기본 설정 추가
axios.defaults.withCredentials = true;

const Login = () => {
    const API = process.env.REACT_APP_API_BASE;
    const api = useMemo(() => axios.create({ 
        baseURL: API,
        withCredentials: true,
    }), [API]);
    
    const navigate = useNavigate();
    const location = useLocation();
    const { member,setMember } = useMember();

    const [id, setId] = useState('');
    const [password, setPassword] = useState('');

    // focus
    const idRef = useRef(null);
    const pwRef = useRef(null);

    const redirectAfterLogin = useCallback((profileLike) => {
        const pendingOrderItems = Array.isArray(location.state?.pendingOrderItems)
            ? location.state.pendingOrderItems
            : null;

        if (pendingOrderItems && pendingOrderItems.length > 0) {
            const enrichedOrderItems = pendingOrderItems.map((item) => ({
                ...item,
                id: item.id ?? profileLike?.id,
            }));
            navigate('/orderForm', {
                state: { orderItems: enrichedOrderItems, isGuest: false },
                replace: true,
            });
            return;
        }

        const returnTo = location.state?.returnTo;
        if (typeof returnTo === 'string' && returnTo.trim()) {
            navigate(returnTo, { replace: true });
            return;
        }

        navigate('/');
    }, [location.state, navigate]);

    // 자동 로그인 차단 (url로 로그인 접근 : 이미 로그인)
    useEffect(() => {
        if (member?.id) {
            redirectAfterLogin(member);
        }
    }, [member?.id, member, redirectAfterLogin]);

    const [loading, setLoading] = useState(false);

    const oauthPopupOrigin = useMemo(
        () => (API || '').replace(/\/api\/?$/, ''),
        [API]
    );

    const handleLogin = async (e) => {
        e.preventDefault();
        if (loading) return;

        const _id = id.trim();
        const _pw = password.trim();

        if (!_id) { 
            toast.error('아이디를 입력해 주세요.');
            idRef.current?.focus();
            return
        }

        if (!_pw) {
            toast.error('비밀번호를 입력해 주세요');
            pwRef.current?.focus();
            return;
        }

        try {
            setLoading(true);
            const response = await api.post(`/member/login`, { id: _id, password: _pw });

            if (!response.data?.success) {
                toast.error('아이디 또는 비밀번호가 틀렸습니다.');
                return;
            } 

            // 로그인 후 사용자 정보 불러오기
            const profile = await api.get(`/member/me`);
            setMember(profile.data);
            toast.success('로그인되었습니다.');
            redirectAfterLogin(profile.data);
        } catch (error) {
            toast.error('아이디 또는 비밀번호를 다시 확인해 주세요');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    // 소셜 로그인
    const handleSocialLogin = (provider) => {
        const width = 500;
        const height = 600
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const url = `${oauthPopupOrigin}/oauth2/authorization/${provider}`;
        window.open(url, "_blank", `width=500,height=600,top=${top},left=${left}`);
    }

    useEffect(() => {
        const handler = async (e) => {
            if (!oauthPopupOrigin || e.origin !== oauthPopupOrigin) return;

            const { type, message } = e.data || {};

            if (type === "LINK_REQUIRED") {
                navigate("/link-social");
                return;
            }

            if (type === "OAUTH_FAIL") {
                toast.error("소셜 로그인에 실패했습니다. 다시 시도해주세요.");
                console.error("OAUTH_FAIL:", message);
                return;
            }

            if (type === "OAUTH_SUCCESS") {
                try {
                    const profile = await api.get(`/member/me`);
                    setMember(profile.data);
                    toast.success('로그인되었습니다.');
                    navigate("/");
                } catch (err) {
                    toast.error("로그인 정보를 불러오지 못했습니다.");
                    console.error(err);
                }
            }
        };

        window.addEventListener("message", handler);
        return () => window.removeEventListener("message", handler);
    }, [api, navigate, setMember, oauthPopupOrigin]);

    return (
        <div className="flex items-center justify-center">
            <form onSubmit={handleLogin}>
                <div className="flex flex-col pt-20">
                    <span className="flex text-xl font-bold pb-2 justify-center">로그인</span>

                    <div className="flex mt-4 mb-2">
                        <div className="flex flex-col gap-2">
                            <div className="
                                flex w-auto items-center justify-between gap-2
                                sm:text-[17px] text-[15.5px]"
                            >
                                <span> 아이디 </span> 
                                <input 
                                    ref={idRef}
                                    type="text" 
                                    id="id" 
                                    autoFocus
                                    autoComplete="username"
                                    value={id} 
                                    onChange={(e) => setId(e.target.value)} 
                                    className="
                                        sm:w-[226px] w-[156px]
                                        px-2 border-gray-300 border-[1px] h-10" 
                                />
                            </div>
                            <div className="
                                flex w-auto items-center justify-between gap-2 
                                sm:text-[17px] text-[15.5px]">
                                <span> 비밀번호 </span> 
                                <input 
                                    ref={pwRef}
                                    type="password" 
                                    id="password" 
                                    autoComplete="current-password"
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    className="
                                        sm:w-[226px] w-[156px]
                                        px-2 border-gray-300 border-[1px] h-10"
                                />
                            </div>
                            <div className="flex w-full justify-center">
                                <button type="submit" 
                                    className={`
                                        w-full bg-black text-white  
                                        h-[48px]
                                        sm:text-sm text-[12px]`}
                                > 
                                    LOGIN 
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-row gap-2 mb-3 justify-center">
                        <button type="button" className="
                            border-[1px] w-1/2 h-[48px]
                            sm:text-sm text-[12px]" onClick={() => navigate('/find_Id')}> 아이디 찾기 </button>
                        <button type="button" className="
                            border-[1px] w-1/2 h-[48px]
                            sm:text-sm text-[12px]" onClick={() => navigate('/find_Pwd')}> 비밀번호 찾기 </button>
                    </div>

                    <span className="
                        flex justify-center mb-1 font-semibold
                        sm:text-sm text-[12px]">소셜 로그인</span>
                    <div className="flex flex-row justify-center gap-4 mb-4">
                        <button
                            type="button"
                            className="
                                sm:w-[40px] w-[34px]
                                sm:h-[40px] h-[34px]"
                            onClick={() => handleSocialLogin("kakao")}
                            >
                            <img src={btn_kakao} className="w-full h-full rounded-full" alt="카카오 로그인" />
                        </button>

                        <button
                            type="button"
                            className="
                                sm:w-[40px] w-[34px]
                                sm:h-[40px] h-[34px]"
                            onClick={() => handleSocialLogin("naver")}
                            >
                            <img src={btn_naver} className="w-full h-full rounded-full" alt="네이버 로그인" />
                        </button>
                    </div>

                    <hr/>

                    <div className="flex flex-row justify-center mt-3 relative">
                        {/* 말풍선 */}
                        <div className="
                            absolute -top-6 right-2
                            bg-[#E6C39A] text-white
                            text-[11px] px-2 py-1
                            rounded-full
                            font-semibold
                            shadow-md
                            animate-bounceX
                            whitespace-nowrap
                        ">
                            적립금 5,000원

                            <div className="
                                absolute -bottom-1 right-4
                                w-2 h-2 bg-[#E6C39A]
                                rotate-45
                            "></div>
                        </div>
                                                    
                        <button className=
                            "border-[1px] w-full h-[48px] sm:text-sm text-[12px]" onClick={() => navigate('/join')} type="button">
                            회원가입
                        </button>
                    </div>
                    <div className="flex flex-row justify-center mt-3">
                        <button className=
                            "border-[1px] w-full h-[48px] sm:text-sm text-[12px]" onClick={() => navigate('/GuestOrderSearch')} type="button">
                            비회원 주문조회 
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default Login;