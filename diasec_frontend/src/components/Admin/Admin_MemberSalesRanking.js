import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { PARTNER_TIERS } from "../../config/partnerTiers";
import { toast } from "react-toastify";

const formatWon = (n) => `${Number(n || 0).toLocaleString()}원`;

const gradeLabel = (grade) => {
    if (!grade) return '-';
    const tier = PARTNER_TIERS.find(
        (t) => t.grade.replace(' 파트너', '') === grade || t.grade === grade
    );
    return tier ? tier.grade : `${grade} 파트너`;
};

const nextGradeLabel = (nextGrade) => {
    if (!nextGrade) return null;
    return gradeLabel(nextGrade);
};

const Admin_MemberSalesRanking = () => {
    const API = process.env.REACT_APP_API_BASE;
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [keyword, setKeyword] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    const fetchRanking = async (kw = keyword) => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API}/admin/member/sales-ranking`, {
                params: kw ? { keyword: kw } : {},
                withCredentials: true,
            });
            setRows(Array.isArray(data) ? data : []);
            setCurrentPage(1);
        } catch (err) {
            console.error('매출 순위 불러오기 실패', err);
            const msg = err.response?.data?.error || err.response?.data?.message || '매출 순위를 불러오지 못했습니다.';
            toast.error(msg);
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRanking();
    }, [API]);

    const handleSearch = (e) => {
        e.preventDefault();
        setKeyword(searchInput.trim());
        fetchRanking(searchInput.trim());
    };

    const totalPages = Math.max(1, Math.ceil(rows.length / itemsPerPage));
    const currentRows = rows.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const summary = useMemo(() => {
        const totalSales = rows.reduce((sum, r) => sum + (Number(r.totalSales) || 0), 0);
        return {
            memberCount: rows.length,
            totalSales,
        };
    }, [rows]);

    return (
        <div className="flex-1 max-w-[1100px] pr-4 pb-20">
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">회원 매출 순위</h1>
                <p className="mt-2 text-sm text-gray-600">
                    회원별 누적 매출과 파트너 등급 기준을 확인할 수 있습니다.
                </p>
            </div>

            <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950">
                <p className="font-semibold mb-1">집계 기준 안내</p>
                <ul className="list-disc list-inside space-y-1 text-amber-900/90">
                    <li>매출은 주문 상품 단가 x 수량 합계입니다. (배송비·적립금 제외)</li>
                    <li>
                       <strong>배송완료</strong>, <strong>교환완료</strong> 상태의 주문만 합산됩니다.
                    </li>
                    <li>등급·다음 등급까지 남은 금액은 위 매출 기준으로 계산됩니다.</li>
                    <li>비회원 주문은 포함되지 않습니다.</li>
                </ul>
            </div>

            <div className="mb-4 flex flex-wrap items-end gap-3">
                <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
                    <input 
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        placeholder="ID, 이름, 이메일 검색"
                        className="border border-gray-300 rounded px-3 py-2 text-sm w-64"
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-black text-white text-sm rounded hover:bg-gray-800"
                    >
                        검색
                    </button>
                    {keyword && (
                        <button
                            type="button"
                            onClick={() => {
                                setSearchInput('');
                                setKeyword('');
                                fetchRanking('');
                            }}
                            className="px-3 py-2 border border-gray-300 text-sm rounded hover:bg-gray-50"
                        >
                            초기화
                        </button>
                    )}
                </form>
                <div className="ml-auto text-sm text-gray-600">
                    집계 회원 <strong className="text-gray-900">{summary.memberCount.toLocaleString()}명</strong>
                    {' · '}
                    합계 <strong className="text-gray-900">{formatWon(summary.totalSales)}</strong>
                </div>
            </div>

            {loading ? (
                <p className="text-sm text-gray-500 py-10 text-center">불러오는 중...</p>
            ) : rows.length === 0 ? (
                <p className="text-sm text-gray-500 py-10 text-center border rounded-lg bg-white">
                    집계된 매출 데이터가 없습니다.
                </p>
            ) : (
                <>
                    <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white shadow-sm">
                        <table className="w-full text-sm min-w-[900px]">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr className="text-left text-gray-600">
                                    <th className="px-3 py-3 font-semibold w-14 text-center">순위</th>
                                    <th className="px-3 py-3 font-semibold">회원 ID</th>
                                    <th className="px-3 py-3 font-semibold">이름</th>
                                    <th className="px-3 py-3 font-semibold">이메일</th>
                                    <th className="px-3 py-3 font-semibold">파트너</th>
                                    <th className="px-3 py-3 font-semibold">등급</th>
                                    <th className="px-3 py-3 font-semibold text-right">매출액</th>
                                    <th className="px-3 py-3 font-semibold text-right">완료 건수</th>
                                    <th className="px-3 py-3 font-semibold">다음 등급까지</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentRows.map((row) => (
                                    <tr key={row.memberId} className="border-t border-gray-100 hover:bg-gray-50/60">
                                        <td className="px-3 py-2.5 text-center font-bold tabular-nums text-gray-800">
                                            {row.rank <= 3 ? (
                                                <span className={
                                                    row.rank === 1 ? 'text-amber-600'
                                                    : row.rank === 2 ? 'text-gray-500'
                                                    : 'text-orange-700'
                                                }>
                                                    {row.rank}
                                                </span>
                                            ) : (
                                                row.rank
                                            )}
                                        </td>
                                        <td className="px-3 py-2.5 text-gray-800">{row.memberId}</td>
                                        <td className="px-3 py-2.5 text-gray-800">{row.memberName || '-'}</td>
                                        <td className="px-3 py-2.5 text-gray-800">{row.email || '-'}</td>
                                        <td className="px-3 py-2.5">
                                            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                                row.pratnerStatus === '승인'
                                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                                            }`}>
                                                {row.partnerStatus || '없음'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 font-medium text-gray-900">
                                            {gradeLabel(row.grade)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right font-semibold tabular-nums text-gray-900">
                                            {formatWon(row.totalSales)}
                                        </td>
                                        <td className="px-3 py-2.5 text-right tabular-nums text-gray-700">
                                            {Number(row.completedItemCount || 0).toLocaleString()}건
                                        </td>
                                        <td className="px-3 py-2.5 text-gray-700">
                                            {row.nextGrade ? (
                                                <span>
                                                    <span className="text-gray-500">{nextGradeLabel(row.nextGrade)}</span>
                                                    {' '}
                                                    <strong className="text-[#8b6914]">
                                                        {formatWon(row.amountToNextTier)}
                                                    </strong>
                                                    {' '}남음
                                                </span>
                                            ) : (
                                                <span className="text-emerald-700 font-medium">최고 등급</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-6 text-sm">
                            <button
                                type="button"
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border rounded disabled:opacity-40"
                            >
                                {'<<'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentPage((p) => p - 1)}
                                disabled={currentPage === 1}
                                className="px-3 py-1 border rounded disabled:opacity-40"
                            >
                                {'<'}
                            </button>
                            <span className="px-3 py-1 tabular-nums">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() => setCurrentPage((p) => p + 1)}
                                disabled={currentPage >= totalPages}
                                className="px-3 py-1 border rounded disabled:opacity-40"
                            >
                                {'>'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage >= totalPages}
                                className="px-3 py-1 border rounded disabled:opacity-40"
                            >
                                {'>>'}
                            </button>
                        </div>
                    )}
                </>
            )}

            <div className="mt-8 rounded-lg border border-gray-200 bg-white p-4">
                <h2 className="text-sm font-bold text-gray-800 mb-2">등급 기준 (매출 기준)</h2>
                <table className="w-full border-collapse border text-xs md:text-sm text-center">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border p-2">등급</th>
                            <th className="border p-2">누적 매출 조건</th>
                            <th className="border p-2">파트너 추가 할인</th>
                        </tr>
                    </thead>
                    <tbody>
                        {PARTNER_TIERS.map((t) => (
                            <tr key={t.grade}>
                                <td className="border p-2">{t.grade}</td>
                                <td className="border p-2">{t.condition}</td>
                                <td className="border p-2">{t.discount}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Admin_MemberSalesRanking;