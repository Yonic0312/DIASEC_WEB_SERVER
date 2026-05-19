import { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { MemberContext } from '../../context/MemberContext';
import { Member_Nav_Sections } from './Member_Nav_Sections';

const MemberHome = () => {
    const API = process.env.REACT_APP_API_BASE;
    const { member, setMember } = useContext(MemberContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [summary, setSummary] = useState({
        loading: true,
        credit: null,
        wishCount:null,
        orderCount:null,
    });

    const handleLogout = () => {
        if (window.confirm('로그아웃을 하시겠습니까?')) {
            axios
                .post(`${API}/member/logout`, { withCredentials: true })
                .then(() => {
                    setMember(null);
                    navigate('/');
                })
                .catch((err) => {
                    console.error("로그아웃 실패", err);
                });
        }
    };

    const go = (path, state) => {
        if (state) navigate(path, { state });
        else navigate(path);
    };

    const isItemActive = (path) => {
        if (path === '/mypage/retouch') return location.pathname.startsWith('/mypage/retouch');
        return location.pathname === path;
    };

    useEffect(() => {
        if (!member?.id) {
            setSummary((s) => ({ ...s, loading: false }));
            return;
        }

        let cancelled = false;

        const load = async () => {
            setSummary((s) => ({ ...s, loading: true }));

            // 주문내역(OrderList) 기본 조회와 동일: 오늘 기준 최근 3개월 (전체 기간이면 카드 수와 숫자가 어긋남)
            const end = new Date();
            const endStr = end.toISOString().split('T')[0];
            const orderWindowStart = new Date(end);
            orderWindowStart.setMonth(orderWindowStart.getMonth() - 3);
            const orderStartStr = orderWindowStart.toISOString().split('T')[0];

            try {
                const [creditRes, wishRes, orderRes] = await Promise.all([
                    axios.get(`${API}/credit/history/${member.id}`),
                    axios.get(`${API}/wishlist/list?id=${member.id}`, { withCredentials: true}),
                    fetch(`${API}/order/list`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: member.id,
                            startDate: orderStartStr,
                            endDate: endStr,
                            status: '전체',
                        }),
                    }).then((r) => r.json()),
                ]);

                if (cancelled) return;

                const history = Array.isArray(creditRes.data) ? creditRes.data : [];
                const credit = history[0]?.credit ?? 0;

                const rawWish = wishRes.data;
                const wishList = Array.isArray(rawWish) ? rawWish : rawWish?.list ?? [];

                const orders = Array.isArray(orderRes) ? orderRes : [];
                const orderCount = orders.length;

                setSummary({
                    loading: false,
                    credit,
                    wishCount: wishList.length,
                    orderCount,
                });
            } catch (e) {
                console.error('마이페이지 요약 로드 실패', e);
                if (cancelled) {
                    setSummary({
                        loading: false,
                        credit: 0,
                        wishCount: 0,
                        orderCount: 0,
                    });
                }
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, [member?.id]);

    if (!member) {
        return (
            <div className="w-full px-4 pt-4 pb-20 md:px-6">
                <p className="text-center text-gray-500 text-sm">로그인이 필요합니다.</p>
            </div>
        );
    }

    const displayName = member.name || member.email || '회원';
    
    return (
        <div className="w-full max-w-lg mx-auto mt-20 px-4 pt-2 pb-24 md:pt-4 md:pb-12 md:max-w-none">
            <div className="flex items-start justify-between gap-3 mb-6">
                <div>
                    <h1 className="text-lg md:text-xl font-bold text-gray-900">마이페이지</h1>
                    <p className="mt-1 text-[15px] md:text-base text-gray-800">
                        <span className="font-semibold text-[#a67a3e]">{displayName}</span>님 환영합니다.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={handleLogout}
                    className="shrink-0 text-sm text-gray-500 underline underline-offset-2 hover:text-gray-800"
                >
                    로그아웃
                </button>
            </div>

            <div className="rounded-2xl border border-[#e8dfd4] bg-[#faf8f5] px-2 py-4 mb-6">
                <div className="grid grid-cols-3 divide-x divide-[#e0d5c8] text-center">
                    <button
                        type="button"
                        title="최근 3개월 주문 건수 (주문내역 기본 기간과 동일)"
                        onClick={() => navigate('/orderList')}
                        className="px-1 py-1 hover:opacity-80 transition"
                    >
                        <div className="text-[13px] md:text-xs text-gray-600 font-medium">나의 주문</div>
                        <div className="mt-1 text-base md:text-lg font-bold text-[#a67a3e] tabular-nums">
                            {summary.loading ? '…' : `${summary.orderCount ?? 0}건` }
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/wishList')}
                        className="px-1 py-1 hover:opacity-80 transition"
                    >
                        <div className="text-[13px] md:text-xs text-gray-600 font-medium">관심상품</div>
                        <div className="mt-1 text-base md:text-lg font-bold text-[#a67a3e] tabular-nums">
                            {summary.loading ? '…' : `${summary.wishCount ?? 0}개`}
                        </div>
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/creditHistory')}
                        className="px-1 py-1 hover:opacity-80 transition"
                    >
                        <div className="text-[13px] md:text-xs text-gray-600 font-medium">적립금</div>
                        <div className="mt-1 text-base md:text-lg font-bold text-[#a67a3e] tabular-nums">
                            {summary.loading ? '…' : `${(summary.credit ?? 0).toLocaleString()}원`}
                        </div>
                    </button>
                </div>
            </div>

            {Member_Nav_Sections.map((section) => (
                <section key={section.title} className="mb-6 last:mb-0">
                    <h2 className="text-[14px] font-bold text-gray-500 uppercase tracking-wide mb-2 px-0.5">
                        {section.title}
                    </h2>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                        {section.items.map((item) => {
                            if (item.onlyWeb && member.provider !== 'web') return null;
                            const active = isItemActive(item.path);
                            return (
                                <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => go(item.path, item.state)}
                                    className={`
                                        min-h-[52px] rounded-xl border px-3 py-2.5 text-left text-[13px] md:text-sm font-medium
                                        transition shadow-sm
                                        ${
                                            active
                                                ? 'border-[#D0AC88] bg-[#fffaf3] text-[#6b4c2a]'
                                                : 'border-gray-200 bg-white text-gray-800 hover:border-[#D0AC88]/60 hover:bg-[#fffaf3]/50'
                                        }
                                    `}
                                >
                                    {item.label}
                                </button>
                            )
                        })}
                    </div>
                </section>
            ))}
        </div>
    )
}

export default MemberHome;