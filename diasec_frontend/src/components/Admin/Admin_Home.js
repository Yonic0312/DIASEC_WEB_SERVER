import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MemberContext } from '../../context/MemberContext';

const ORDER_PREVIEW_STATUSES = [
    '입금대기',
    '결제완료',
    '배송준비중',
    '배송중',
    '취소요청',
    '교환신청',
    '반품신청',
    '환불처리중',
];

function StatCard({ title, subtitle, value, hint, onClick, accent }) {
    const clickable = typeof onClick === 'function';
    return (
        <button
            type="button"
            disabled={!clickable}
            onClick={clickable ? onClick : undefined}
            className={`
                text-left w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm
                transition hover:border-[#D0AC88] hover:shadow
                ${clickable ? 'cursor-pointer' : 'cursor-default opacity-95'}
            `}
        >
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</div>
            <div className={`mt-1 text-2xl font-bold tabular-nums ${accent || 'text-gray-900'}`}>{value}</div>
            {subtitle && <div className="mt-1 text-sm text-gray-600">{subtitle}</div>}
            {hint && <div className="mt-2 text-xs text-[#a67a3e]">{hint}</div>}
        </button>
    );
}

const Admin_Home = () => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();
    const { member } = useContext(MemberContext);

    const [visitStats, setVisitStats] = useState({ today: 0, total: 0 });
    const [inquiryUnanswered, setInquiryUnanswered] = useState(0);
    const [bizConsultCount, setBizConsultCount] = useState(0);
    const [bizPartnerCount, setBizPartnerCount] = useState(0);
    const [orderCounts, setOrderCounts] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            setLoading(true);
            try {
                const [vis, inq, ord, bizConsult, bizPartner] = await Promise.all([
                    axios.get(`${API}/admin/visit/stats`, { withCredentials: true }).then((r) => r.data),
                    axios.get(`${API}/inquiry/unanswered`).then((r) => r.data),
                    axios.get(`${API}/order/admin/count-by-status`, { withCredentials: true }).then((r) => r.data),
                    axios.get(`${API}/admin/biz-consult/count`, { withCredentials: true }).then((r) => r.data),
                    axios.get(`${API}/admin/biz-partner/count`, { withCredentials: true }).then((r) => r.data),
                ]);
                if (cancelled) return;
                setVisitStats(vis || { today: 0, total: 0 });
                setInquiryUnanswered(Number(inq) || 0);
                setBizConsultCount(Number(bizConsult) || 0);
                setBizPartnerCount(Number(bizPartner) || 0);
                const map = {};
                (ord || []).forEach((row) => {
                    map[row.status] = Number(row.cnt || 0);
                });
                setOrderCounts(map);
            } catch (e) {
                console.error('관리자 홈 요약 로드 실패', e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        run();
        return () => {
            cancelled = true;
        };
    }, [API]);

    const actionableOrderTotal = useMemo(() => {
        const skip = new Set(['배송완료', '교환완료', '환불완료', '취소']);
        return Object.entries(orderCounts).reduce((sum, [st, n]) => {
            if (skip.has(st)) return sum;
            return sum + n;
        }, 0);
    }, [orderCounts]);

    const quickLinks = useMemo(
        () => [
            { label: '주문 상태', path: '/admin/order_Status' },
            { label: '상품 등록', path: '/admin/insert_Product' },
            { label: '상품 수정', path: '/admin_ProductManager' },
            { label: '회원 관리', path: '/admin_MemberManager' },
            { label: '고객 문의', path: '/admin_InquiryList' },
            { label: '기업컨설팅', path: '/admin_BizConsultList' },
            { label: '업무제휴', path: '/admin_BizPartnerList' },
            { label: '보정 요청', path: '/admin_AdminRetouchList' },
            { label: '공지사항', path: '/admin_NoticeManager' },
            { label: 'FAQ', path: '/admin_FAQManager' },
            { label: '후기', path: '/admin_ReviewManager' },
            { label: '이벤트', path: '/admin_EventManager' },
        ],
        []
    );

    return (
        <div className="flex-1 max-w-[960px] pr-4 pb-20">
            <div className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">관리자 홈</h1>
            </div>

            {loading && <p className="text-gray-500 text-sm mb-6">불러오는 중…</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-10">
                <StatCard
                    title="방문자 (오늘 / 누적)"
                    value={`${Number(visitStats.today || 0).toLocaleString()} / ${Number(visitStats.total || 0).toLocaleString()}`}
                    subtitle="자체 방문 집계"
                    hint="접속 로그 기준입니다."
                />
                <StatCard
                    title="진행 중 주문 건수"
                    value={`${actionableOrderTotal.toLocaleString()}건`}
                    subtitle="완료·취소·종료 상태 제외 합계"
                    hint="배송·결제·클레임 등 처리 중"
                    accent={actionableOrderTotal > 0 ? 'text-[#8b6914]' : undefined}
                    onClick={() => navigate('/admin/order_Status')}
                />
                <StatCard
                    title="미답변 문의"
                    value={`${inquiryUnanswered.toLocaleString()}건`}
                    subtitle="고객센터 문의"
                    hint={inquiryUnanswered > 0 ? '답변이 필요합니다.' : '모두 처리됨'}
                    accent={inquiryUnanswered > 0 ? 'text-amber-700' : undefined}
                    onClick={() => navigate('/admin_InquiryList')}
                />
                <StatCard
                    title="기업컨설팅 신청"
                    value={`${bizConsultCount.toLocaleString()}건`}
                    subtitle="미완료 신청 건수"
                    hint={bizConsultCount > 0 ? '처리가 필요합니다.' : '모두 처리됨'}
                    accent={bizConsultCount > 0 ? 'text-amber-700' : undefined}
                    onClick={() => navigate('/admin_BizConsultList')}
                />
                <StatCard 
                    title="업무제휴 신청"
                    value={`${bizPartnerCount.toLocaleString()}건`}
                    subtitle="검토 대기 신청 건수"
                    hint={bizPartnerCount > 0 ? '승인·반려 처리가 필요합니다.' : '모두 처리됨'}
                    accent={bizPartnerCount > 0 ? 'text-amber-700' : undefined}
                    onClick={() => navigate('/admin_BizPartnerList')}
                />
            </div>

            <div className="mb-10 rounded-xl border border-gray-200 bg-gray-50/80 p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">주문 상태 미리보기</h2>
                    <button
                        type="button"
                        onClick={() => navigate('/admin/order_Status')}
                        className="text-sm font-medium text-[#a67a3e] hover:underline"
                    >
                        전체 보기 →
                    </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {ORDER_PREVIEW_STATUSES.map((status) => {
                        const n = orderCounts[status] || 0;
                        if (n === 0) return null;
                        return (
                            <button
                                key={status}
                                type="button"
                                onClick={() =>
                                    navigate(`/admin/order_Status?status=${encodeURIComponent(status)}`)
                                }
                                className="rounded-lg border border-white bg-white px-3 py-3 text-left shadow-sm transition hover:border-[#D0AC88]"
                            >
                                <div className="text-xs text-gray-500">{status}</div>
                                <div className="text-lg font-bold text-gray-900 tabular-nums">{n.toLocaleString()}</div>
                            </button>
                        );
                    })}
                </div>
                {ORDER_PREVIEW_STATUSES.every((s) => !(orderCounts[s] > 0)) && !loading && (
                    <p className="text-sm text-gray-500">표시할 진행 중 주문이 없습니다.</p>
                )}
            </div>

            <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3">빠른 이동</h2>
                <div className="flex flex-wrap gap-2">
                    {quickLinks.map((item) => (
                        <button
                            key={item.path}
                            type="button"
                            onClick={() => navigate(item.path)}
                            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition hover:border-[#D0AC88] hover:bg-[#fffaf3]"
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Admin_Home;
