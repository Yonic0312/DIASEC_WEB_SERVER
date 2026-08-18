import { useEffect, useMemo, useState } from "react";
import { Link } from 'react-router-dom';
import axios from "axios";

const PERIOD_OPTIONS = [
    { days: 0, label: '전체' },
    { days: 1, label: '오늘' },
    { days: 7, label: '최근 7일' },
    { days: 14, label: '최근 14일' },
    { days: 30, label: '최근 1달' },
    { days: 90, label: '최근 3달' },
];

const toYmd = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

const addDays = (date, diff) => {
    const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() + diff);
    return d;
};

const periodRange = (days) => {
    const end = new Date();
    if (!days) return { startDate: null, endDate: toYmd(end) };
    const start = addDays(end, -(days - 1));
    return { startDate: toYmd(start), endDate: toYmd(end) };
};

const num = (row, ...keys) => {
    for (const k of keys) {
        if (row[k] != null) return Number(row[k]) || 0;
    }
    return 0;
}

const Admin_PageView = () => {
    const API = process.env.REACT_APP_API_BASE;
    const [days, setDays] = useState(0);
    const [rows, setRows] = useState([]);
    const [daily, setDaily] = useState([]);
    const [total, setTotal] = useState(0);
    const [range, setRange] = useState({ startDate: '', endDate: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const run = async () => {
            setLoading(true);
            const { startDate, endDate } = periodRange(days);
            const params = { days };
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            
            try {
                const { data } = await axios.get(`${API}/admin/visit/pages`, {
                    params,
                    withCredentials: true,
                });
                if (cancelled) return;
                setRows(Array.isArray(data?.pages) ? data.pages : []);
                setDaily(Array.isArray(data?.daily) ? data.daily : []);
                setTotal(Number(data?.total) || 0);
                setRange({
                    startDate: data?.startDate || startDate || '',
                    endDate: data?.endDate || endDate || '',
                });
            } catch (err) {
                console.error('페이지 접속 통계 불러오기 실패', err);
                if (!cancelled) {
                    setRows([]);
                    setDaily([]);
                    setTotal(0);
                    setRange({ startDate: '', endDate: '' });
                }    
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        run();
        return () => { cancelled = true; };
    }, [API, days]);

    const maxCount = useMemo(
        () => Math.max(1, ...rows.map((r) => num(r, 'viewCount', 'viewcount'))),
        [rows]
    );

    const periodLabel = PERIOD_OPTIONS.find((o) => o.days === days)?.label || '전체';

    return (
        <div className="flex-1 max-w-[1100px] pr-4 pb-20">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">페이지 접속 통계</h1>
                <p className="mt-2 text-sm text-gray-600">
                    선택한 기간 동안 사이트에서 열린 주소별 횟수입니다. 같은 사람이 여러 번 들어가도 모두 합산합니다.
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 mb-6">
                {PERIOD_OPTIONS.map((opt) => (
                    <button
                        key={opt.days}
                        type="button"
                        onClick={() => setDays(opt.days)}
                        className={`px-3 py-1.5 rounded-md text-sm font-semibold ${
                            days === opt.days
                                ? 'bg-[#D0AC88] text-white border-[#D0AC88]'
                                : 'bg-white text-gray-600 border-gray-300 hover:border-[#D0AC88]'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
                <div className="ml-auto text-sm text-gray-700 flex flex-wrap gap-x-3 gap-y-1">
                    {range.startDate && range.endDate && (
                        <span className="text-gray-500">
                            {range.startDate === range.endDate
                                ? range.startDate
                                : `${range.startDate} ~ ${range.endDate}`}
                        </span>
                    )}
                    <span>
                        합계 <strong>{total.toLocaleString()}</strong>
                        <span className="text-gray-500 ml-1">({periodLabel})</span>
                    </span>
                </div>
            </div>

            {loading ? (
                <p className="text-sm text-gray-500">불러오는 중...</p>
            ) : rows.length === 0 && daily.length === 0 ? (
                <p className="text-sm text-gray-500">이 기간의 기록이 없습니다</p>
            ) : (
                <>
                    {daily.length > 0 && (
                        <div className="mb-6 border border-gray-200 rounded-lg overflow-hidden">
                            <div className="px-3 py-2 bg-gray-50 text-sm font-semibold text-gray-700">
                                일별 합계
                            </div>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-gray-600 border-t border-gray-100">
                                        <th className="px-3 py-2 font-semibold">날짜</th>
                                        <th className="px-3 py-2 font-semibold text-right">횟수</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...daily].reverse().map((d) => {
                                        const dateVal = d.viewDate || d.viewdate || d.VIEWDATE || '';
                                        const count = num(d, 'viewCount', 'veiwcount', 'VIEWCOUNT');
                                        return (
                                            <tr key={String(dateVal)} className="border-t border-gray-100">
                                                <td className="px-3 py-1.5 text-gray-800">
                                                    {String(dateVal).slice(0, 10)}
                                                </td>
                                                <td className="px-3 py-1.5 text-right tabular-nums font-medium">
                                                    {count.toLocaleString()}회
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr className="text-left text-gray-600">
                                    <th className="px-3 py-2 font-semibold w-12">#</th>
                                    <th className="px-3 py-2 font-semibold">주소</th>
                                    <th className="px-3 py-2 font-semibold text-right w-28">횟수</th>
                                    <th className="px-3 py-2 font-semibold w-[180px]">비율</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((r, i) => {
                                    const count = num(r, 'viewCount', 'viewcount', 'VIEWCOUNT');
                                    const pct = total > 0 ? (count / total) * 100 : 0;
                                    const bar = (count / maxCount) * 100;
                                    return (
                                        <tr key={r.path} className="border-t border-gray-100">
                                            <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                                            <td className="px-3 py-2 font-mono text-[13px] break-all">
                                                <Link
                                                    to={r.path || '/'}
                                                    className="text-[#a67a3e] hover:underline"
                                                >
                                                    {r.path}
                                                </Link>
                                            </td>
                                            <td className="px-3 py-2 text-right tabular-nums font-medium">
                                                {count.toLocaleString()}
                                            </td>
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 rounded bg-gray-100 overflow-hidden">
                                                        <div
                                                            className="h-full bg-[#D0AC88]"
                                                            style={{ width: `${bar}%`}}
                                                        />
                                                    </div>
                                                    <span className="w-12 text-right text-xs text-gray-500 tabular-nums">
                                                        {pct.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};

export default Admin_PageView;