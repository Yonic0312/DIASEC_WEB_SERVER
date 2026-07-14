import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PARTNER_TIERS } from '../../config/partnerTiers';
import { getSiteDiscountPercent, getTotalDiscountPercent } from '../../utils/siteDiscount';

const formatWon = (n) => `${Number(n || 0).toLocaleString()}원`;

const formatReviewedAt = (v) => {
    if (!v) return '';
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? String(v) : d.toLocaleDateString('ko-KR');
};

const isCurrentGrade = (tierGrade, current) => {
    if (!current || current === '-') return false;
    return tierGrade.replace(' 파트너', '') === current || tierGrade === current;
};

const Member_PartnerStatus = () => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();
    const [status, setStatus] = useState(null);

    useEffect(() => {
        axios.get(`${API}/biz-partner/my-status`, { withCredentials: true })
            .then((res) => setStatus(res.data))
            .catch(() => setStatus(null));
    }, [API]);

    if (!status) return <div className="p-10 text-center w-full">불러오는 중...</div>;

    const nextTier = PARTNER_TIERS.find(
        (t) => status.cumulativeAmount < t.minAmount
    );

    const sitePct = getSiteDiscountPercent();
    const partnerPct = status.partnerStatus === '승인' ? (status.discountPercent || 0) : 0;
    const totalPct = getTotalDiscountPercent(partnerPct);

    return (
        <div className="w-full px-4 py-6">
            <h2 className="text-2xl font-bold mb-6">업무제휴 현황</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="border rounded p-4">
                    <p className="text-sm text-gray-500">파트너 상태</p>
                    <p className="text-xl font-bold">{status.partnerStatus}</p>
                </div>
                <div className="border rounded p-4">
                    <p className="text-sm text-gray-500">현재 등급</p>
                    <p className="text-xl font-bold">{status.partnerGrade}</p>
                </div>
                <div className="border rounded p-4">
                    <p className="text-sm text-gray-500">누적 거래금액</p>
                    <p className="text-xl font-bold">{formatWon(status.cumulativeAmount)}</p>
                </div>
                <div className="border rounded p-4">
                    <p className="text-sm text-gray-500">추가 할인율 (파트너)</p>
                    <p className="text-xl font-bold">{partnerPct}%</p>
                </div>
            </div>

            {/* 실제 적용 할인 안내 */}
            <div className="mb-8 p-4 rounded border bg-blue-50 border-blue-200">
                <p className="text-sm font-medium text-blue-900 mb-1">주문 시 적용 할인</p>
                {status.partnerStatus === '승인' ? (
                    <p className="text-sm text-blue-800">
                        사이트 기본 <strong>{sitePct}%</strong> + 파트너 <strong>{partnerPct}%</strong>
                        {' '}= 총 <strong>{totalPct}%</strong> 할인이 작품 결제에 적용됩니다.
                    </p>
                ) : (
                    <p className="text-sm text-blue-800">
                        현재 사이트 기본 <strong>{sitePct}%</strong> 할인만 적용됩니다.
                        파트너 승인 후 등급에 따른 추가 할인이 적용됩니다.
                    </p>
                )}
            </div>

            {status.partnerStatus === '승인' && nextTier && (
                <p className="text-sm text-gray-600 mb-4">
                    다음 등급({nextTier.grade})까지 {formatWon(nextTier.minAmount - status.cumulativeAmount)} 남음
                </p>
            )}

            {status.partnerStatus === '대기' && (
                <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded p-3 mb-4">
                    제휴 신청이 접수되었습니다. 검토 후 이 페이지에서 승인 결과를 확인하실 수 있습니다.
                </p>
            )}

            {status.adminReply && status.partnerStatus === '미승인' && (
                <div className="rounded p-3 mb-4 border bg-red-50 border-red-200 text-red-800">
                    <p className="text-sm font-medium mb-1">관리자 검토 결과</p>
                    <p className="text-sm whitespace-pre-line">{status.adminReply}</p>
                    {status.reviewedAt && (
                        <p className="text-xs mt-2 opacity-70">검토일: {formatReviewedAt(status.reviewedAt)}</p>
                    )}
                </div>
            )}

            {(status.partnerStatus === '없음' || status.partnerStatus === '미승인') && (
                <div className="mb-4">
                    {status.partnerStatus === '미승인' && !status.adminReply && (
                        <p className="text-red-700 bg-red-50 border border-red-200 rounded p-3 mb-3">
                            이전 제휴 신청이 승인되지 않았습니다. 내용을 보완하여 다시 신청하실 수 있습니다.
                        </p>
                    )}
                    <button
                        type="button"
                        onClick={() => navigate('/bizPartnerApply')}
                        className="bg-black text-white px-4 py-2 rounded"
                    >
                        {status.partnerStatus === '미승인' ? '업무제휴 재신청하기' : '업무제휴 신청하기'}
                    </button>
                </div>
            )}

            <div className="mt-8">
                <h3 className="font-bold mb-2">등급 기준</h3>
                <table className="w-full border-collapse border text-sm text-center">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="border p-2">등급</th> 
                            <th className="border p-2">조건</th> 
                            <th className="border p-2">할인</th> 
                            <th className="border p-2">총 할인 (기본+파트너)</th> 
                        </tr>
                    </thead>
                    <tbody>
                        {PARTNER_TIERS.map((t) => (
                            <tr key={t.grade}
                                className={isCurrentGrade(t.grade, status.partnerGrade) ? 'bg-amber-50' : ''}
                            >
                                <td className="border p-2">{t.grade}</td>
                                <td className="border p-2">{t.condition}</td>
                                <td className="border p-2">{t.discount}%</td>
                                <td className="border p-2">{getTotalDiscountPercent(t.discount)}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Member_PartnerStatus;