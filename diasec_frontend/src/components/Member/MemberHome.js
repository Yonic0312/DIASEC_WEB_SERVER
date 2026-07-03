import { useContext, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { MemberContext } from '../../context/MemberContext';
import { Member_Nav_Sections } from './Member_Nav_Sections';
import { usePartnerNavVisible } from '../../hooks/usePartnerNavVisible';
import { PARTNER_TIERS } from '../../config/partnerTiers';
import { getSiteDiscountPercent, getTotalDiscountPercent } from '../../utils/siteDiscount';

const resolvePartnerDiscount = (grade, fromApi) => {
    if (fromApi != null && fromApi !== '') return Number(fromApi) || 0;
    if (!grade || grade === '-') return 0;
    const tier = PARTNER_TIERS.find(
        (t) => t.grade === grade || t.grade.startsWith(grade)
    );
    return tier?.discount ?? 0;
};

const MemberHome = () => {
    const API = process.env.REACT_APP_API_BASE;
    const { member, setMember } = useContext(MemberContext);
    const showPartnerNav = usePartnerNavVisible(member);
    const navigate = useNavigate();
    const location = useLocation();
    const [summary, setSummary] = useState({
        loading: true,
        credit: null,
        wishCount:null,
        orderCount:null,
    });
    const [partner, setPartner] = useState(null);

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

            const end = new Date();
            const endStr = end.toISOString().split('T')[0];
            const startStr = '2000-01-01';

            try {
                const [creditRes, wishRes, orderRes, partnerRes] = await Promise.all([
                    axios.get(`${API}/credit/history/${member.id}`),
                    axios.get(`${API}/wishlist/list?id=${member.id}`, { withCredentials: true}),
                    fetch(`${API}/order/list`, {
                        method: 'POST',
                        credentials: 'include',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            id: member.id,
                            startDate: startStr,
                            endDate: endStr,
                            status: '전체',
                        }),
                    }).then((r) => r.json()),
                    axios.get(`${API}/biz-partner/my-status`, { withCredentials: true })
                        .then((r) => r.data)
                        .catch(() => null),
                ]);

                if (cancelled) return;

                const history = Array.isArray(creditRes.data) ? creditRes.data : [];
                const credit = history[0]?.credit ?? 0;

                const rawWish = wishRes.data;
                const wishList = Array.isArray(rawWish) ? rawWish : rawWish?.list ?? [];

                const orders = Array.isArray(orderRes) ? orderRes : [];
                const inRange = orders.filter((order) => {
                    const d = order.createdAt.slice(0, 10);
                    if (!d) return false;
                    return d >= startStr && d <= endStr;
                });
                const orderCount = inRange.length;

                setSummary({
                    loading: false,
                    credit,
                    wishCount: wishList.length,
                    orderCount,
                });
                setPartner(partnerRes);
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

    const partnerPct = 
        partner?.partnerStatus === '승인'
            ? resolvePartnerDiscount(partner.partnerGrade, partner.discountPercent)
            : 0;
    const totalPct = getTotalDiscountPercent(partnerPct);
    const sitePct = getSiteDiscountPercent();
    
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

            {(partner?.partnerStatus === '대기' || partner?.partnerStatus === '승인') && (
                <button
                    type="button"
                    onClick={() => navigate('/mypage/partner')}
                    // className="w-full mb-6 rounded-2xl border border-[#D0AC88] bg-[#fffaf3] px-4 py-4 text-left hover:bg-[#fff5e8] transition"
                    className="group w-full mb-6 rounded-2xl border border-[#D0AC88]/70 bg-gradient-to-br from-[#fffbf7] via-[#fff8ef] to-[#fff3e0] px-5 py-4 text-left shadow-sm hover:shadow-md hover:border-[#c49a6c] transition-all"
                >
                    <div className="text-xs font-semibold text-[#a67a3e] mb-1">업무제휴</div>
                    {partner.partnerStatus === '대기' ? (
                        <>
                            <p className="text-sm font-bold text-gray-900">신청 검토 중</p>
                            <p className="mt-1 text-xs text-gray-600">
                                검토 후 마이페이지에서 승인 결과를 확인하실 수 있습니다.
                            </p>
                        </>
                    ) : (
                        <>
                            <p className="text-sm font-bold text-gray-900">
                                {partner.partnerGrade} 파트너 · 추가 {partner.discountPercent}% 할인 적용 중
                            </p>
                            <p className="mt-1 text-xs text-gray-600">
                                누적 거래 {Number(partner.cumulativeAmount || 0).toLocaleString()}원
                            </p>
                        </>
                    )}
                </button>
            )}

            {Member_Nav_Sections.map((section) => (
                <section key={section.title} className="mb-6 last:mb-0">
                    <h2 className="text-[14px] font-bold text-gray-500 uppercase tracking-wide mb-2 px-0.5">
                        {section.title}
                    </h2>
                    <div className="grid grid-cols-2 gap-2 md:gap-3">
                        {section.items.map((item) => {
                            if (item.onlyWeb && member.provider !== 'web') return null;
                            if (item.onlyPartner && !showPartnerNav) return null;
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