import { useContext, useEffect, useMemo, useRef, useState } from 'react';
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

function formatMd(dateStr) {
    if (!dateStr) return '';
    const parts = String(dateStr).split('-');
    if (parts.length < 3) return dateStr;
    return `${Number(parts[1])}/${Number(parts[2])}`;
}

function VisitDailyModal({ open, onClose, days, setDays, daily, loading }) {
    const chartScrollRef = useRef(null);

    const maxCount = useMemo(
        () => Math.max(1, ...daily.map((d) => Number(d.count) || 0)),
        [daily]
    );
    const periodTotal = useMemo(
        () => daily.reduce((sum, d) => sum + (Number(d.count) || 0), 0),
        [daily]
    );
    const peak = useMemo(() => {
        if (!daily.length) return null;
        return daily.reduce((best, cur) =>
            Number(cur.count) > Number(best.count) ? cur : best
        );
    }, [daily]);

    // 모달 오픈·기간 변경·데이터 로드 후 최근 날짜(오른쪽 끝)부터 보이게
    useEffect(() => {
        if (!open || loading || daily.length === 0) return;
        const el = chartScrollRef.current;
        if (!el) return;
        const scrollToEnd = () => {
            el.scrollLeft = el.scrollWidth;
        };
        scrollToEnd();
        requestAnimationFrame(scrollToEnd);
    }, [open, loading, daily, days]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/45 p-4"
            role="presentation"
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="visit-daily-title"
                className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3 border-b border-gray-100">
                    <div>
                        <h3 id="visit-daily-title">
                            일별 방문자
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            날짜별로 몇 명이 방문했는지 확인할 수 있습니다.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 text-xl leading-none px-1"
                        aria-label="닫기"
                    >
                        ×
                    </button>
                </div>

                <div className="px-5 py-3 flex flex-wrap items-center gap-2 border-b border-gray-50">
                    {[7, 14, 30, 90, 0].map((d) => (
                        <button
                            key={d}
                            type="button"
                            onClick={() => setDays(d)}
                            className={`px-3 py-1.5 rounded-md text-sm font-semibold border ${
                                days === d 
                                    ? 'bg-[#D0AC88] text-white border-[#D0AC88]'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-[#D0AC88]'
                            }`}
                        >
                            {d === 0 ? '전체' : `최근 ${d}일`}
                        </button>
                    ))}
                    <div className="ml-auto text-xs text-gray-600 flex flex-wrap gap-3">
                        <span>
                            기간 합계{' '}
                            <strong className="text-gray-900">{periodTotal.toLocaleString()}명</strong>
                        </span>
                        {peak && (
                            <span>
                               최다{' '}
                               <strong className="text-gray-900">
                                    {formatMd(peak.date)} {Number(peak.count).toLocaleString()}명
                               </strong>
                            </span>
                        )}
                    </div>
                </div>

                <div className="px-5 py-4 overflow-y-auto flex-1">
                    {loading ? (
                        <p className="text-sm text-gray-500 py-10 text-center">불러오는 중...</p>
                    ) : daily.length === 0 ? (
                        <p className="text-sm text-gray-500 py-10 text-center">데이터가 없습니다.</p>
                    ) : (
                        <>
                            {/* 막대 그래프 */}
                            <div ref={chartScrollRef} className="overflow-x-auto mb-5">
                                <div
                                    className="flex items-end gap-2"
                                    style={{ minWidth: `${daily.length * 36}px` }}
                                >
                                    {daily.map((d) => {
                                        const count = Number(d.count) || 0;
                                        const pct = Math.max(count > 0 ? 6 : 0, (count / maxCount) * 100);
                                        return (
                                            <div
                                                key={d.date}
                                                className="w-7 shrink-0 flex flex-col items-center"
                                                title={`${d.date}: ${count.toLocaleString()}명`}
                                            >
                                                <div className="w-full h-[200px] flex flex-col justify-end items-center relative group">
                                                    <span className="absolute -top-5 text-[10px] text-gray-700 opacity-0 group-hover:opacity-100 tabular-nums whitespace-nowrap">
                                                        {count}
                                                    </span>
                                                    <div 
                                                        className="w-full rounded-t-sm bg-[#D0AC88] hover:bg-[#c49a72] transition-all"
                                                        style={{ height: `${pct}%` }}
                                                    />
                                                </div>
                                                <div className="w-full border-t border-gray-200" />
                                                <span className="mt-1.5 text-[10px] text-gray-500 tabular-nums text-center leading-tight whitespace-nowrap">
                                                    {formatMd(d.date)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 날짜별 표 */}
                            <div className="max-h-[240px] overflow-y-auto border border-gray-200 rounded-lg">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 sticky top-0">
                                        <tr className="text-left text-gray-600">
                                            <th className="px-3 py-2 font-semibold">날짜</th>
                                            <th className="px-3 py-2 font-semibold text-right">방문자</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...daily].reverse().map((d) => (
                                            <tr key={d.date} className="border-t border-gray-100">
                                                <td className="px-3 py-1.5 text-gray-800">{d.date}</td>
                                                <td className="px-3 py-1.5 text-right tabular-nums font-medium text-gray-900">
                                                    {Number(d.count || 0).toLocaleString()}명
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >

                    </button>
                </div>
            </div>
        </div>
    );
}

const Admin_Home = () => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();
    const { member } = useContext(MemberContext);

    const [visitStats, setVisitStats] = useState({ today: 0, total: 0, online: 0 });
    const [inquiryUnanswered, setInquiryUnanswered] = useState(0);
    const [bizConsultCount, setBizConsultCount] = useState(0);
    const [bizPartnerCount, setBizPartnerCount] = useState(0);
    const [orderCounts, setOrderCounts] = useState({});
    const [loading, setLoading] = useState(true);

    const [visitModalOpen, setVisitModalOpen] = useState(false);
    const [visitDays, setVisitDays] = useState(30);
    const [visitDaily, setVisitDaily] = useState([]);
    const [visitDailyLoading, setVisitDailyLoading] = useState(false);

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
                setVisitStats(vis || { today: 0, total: 0, online: 0 });
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

    // 실시간 접속자 수 폴링 (10초)
    useEffect(() => {
        let cancelled = false;
        const pollOnline = async () => {
            try {
                const { data } = await axios.get(`${API}/admin/visit/online`, { withCredentials: true });
                if (!cancelled) {
                    setVisitStats((prev) => ({
                        ...prev,
                        online: Number(data?.online ?? 0),
                    }));
                }
            } catch (e) {
                // 조용히 무시 (관리자 세션 만료 등은 기존 로드에서 처리)
            }
        };
        pollOnline();
        const id = setInterval(pollOnline, 10_000);
        return () => {
            cancelled = true;
            clearInterval(id);
        };
    }, [API]);

    useEffect(() => {
        if (!visitModalOpen) return;
        let cancelled = false;
        const run = async () => {
            setVisitDailyLoading(true);
            try {
                 const { data } = await axios.get(`${API}/admin/visit/daily`, {
                    params: { days: visitDays },
                    withCredentials: true,
                 });
                 if (!cancelled) setVisitDaily(Array.isArray(data) ? data : []);
            } catch (e) {
                console.error('일별 방문자 로드 실패', e);
                if (!cancelled) setVisitDaily([]);
            } finally {
                if (!cancelled) setVisitDailyLoading(false);
            }
        };
        run();
        return () => {
            cancelled = true;
        };
    }, [API, visitModalOpen, visitDays]);

    useEffect(() => {
        if (!visitModalOpen) return;
        const onKey = (e) => {
            if (e.key === 'Escape') setVisitModalOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [visitModalOpen]);

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
            { label: '기업주문', path: '/admin_BizList' },
            { label: '상품 등록', path: '/admin/insert_Product' },
            { label: '상품 수정', path: '/admin_ProductManager' },
            { label: '회원 관리', path: '/admin_MemberManager' },
            { label: '회원 매출 순위', path: '/admin_MemberSalesRanking' },
            { label: '고객 문의', path: '/admin_InquiryList' },
            { label: '기업컨설팅', path: '/admin_BizConsultList' },
            { label: '업무제휴', path: '/admin_BizPartnerList' },
            { label: '보정 요청', path: '/admin_AdminRetouchList' },
            { label: '공지사항', path: '/admin_NoticeManager' },
            { label: 'FAQ', path: '/admin_FAQManager' },
            { label: '후기', path: '/admin_ReviewManager' },
            { label: '이벤트', path: '/admin_EventManager' },
            { label: '사이트 할인율', path: '/admin_SiteDiscount' },
        ],
        []
    );

    return (
        <div className="flex-1 max-w-[960px] pr-4 pb-20">
            <div className="flex justify-between items-center gap-3 mb-8 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">관리자 홈</h1>
                <div
                    className="
                        inline-flex items-center gap-2.5 rounded-full
                        border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-white
                        pl-3 pr-4 py-1.5 shadow-sm
                    "
                    title="최근 60초 이내 활동 기준 · 본인(관리자) IP 제외 · 10초마다 갱신"
                >
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    </span>
                    <span className="text-xs font-semibold tracking-wide text-emerald-800/80">
                        실시간 접속
                    </span>
                    <span className="text-lg font-bold tabular-nums text-emerald-900 leading-none">
                        {Number(visitStats.online || 0).toLocaleString()}
                        <span className="ml-0.5 text-sm font-semibold text-emerald-700">명</span>
                    </span>
                </div>
            </div>

            {loading && <p className="text-gray-500 text-sm mb-6">불러오는 중…</p>}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-10">
                <StatCard
                    title="방문자 (오늘 / 누적)"
                    value={`${Number(visitStats.today || 0).toLocaleString()} / ${Number(visitStats.total || 0).toLocaleString()}`}
                    subtitle="자체 방문 집계"
                    hint="클릭하면 일별 그래프를 볼 수 있습니다."
                    onClick={() => setVisitModalOpen(true)}
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

            <VisitDailyModal
                open={visitModalOpen}
                onClose={() => setVisitModalOpen(false)}
                days={visitDays}
                setDays={setVisitDays}
                daily={visitDaily}
                loading={visitDailyLoading}
            />
        </div>
    );
};

export default Admin_Home;
