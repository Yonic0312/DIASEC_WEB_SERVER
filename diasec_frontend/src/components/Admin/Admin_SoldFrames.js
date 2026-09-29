import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Admin_SoldFrames = () => {
    const API = process.env.REACT_APP_API_BASE;
    const [siteSoldCount, setSiteSoldCount] = useState(0);
    const [extraCount, setExtraCount] = useState('0');
    const [memo, setMemo] = useState('');
    const [totalCount, setTotalCount] = useState(0);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        const { data } = await axios.get(`${API}/admin/site-setting/sold-frames`, {
            withCredentials: true,
        });
        const extra = Number(data?.extraCount ?? 0);
        setSiteSoldCount(Number(data?.siteSoldCount ?? 0));
        setExtraCount(String(Number.isFinite(extra) ? extra : 0));
        setMemo(data?.memo ?? '');
        setTotalCount(Number(data?.totalCount ?? 0));
    };

    useEffect(() => {
        load().catch((err) => {
            console.error(err);
            toast.error('판매 수량을 불러오지 못했습니다.');
        });
    }, []);

    const previewTotal = (() => {
        const extra = Number(extraCount);
        if (!Number.isFinite(extra)) return siteSoldCount;
        return siteSoldCount + extra;
    })();

    const handleSave = async () => {
        const n = Number(extraCount);
        if (!Number.isFinite(n) || !Number.isInteger(n)) {
            toast.error('추가 수량은 정수로 입력해 주세요.');
            return;
        }
        if (n < 0) {
            toast.error('추가 수량은 0 이상이어야 합니다.');
            return;
        }

        setSaving(true);
        try {
            const { data } = await axios.post(
                `${API}/admin/site-setting/sold-frames`,
                { extraCount: n, memo },
                { withCredentials: true }
            );
            if (!data?.success) {
                toast.error(data?.message || '저장에 실패했습니다.');
                return;
            }
            setSiteSoldCount(Number(data.siteSoldCount ?? 0));
            setExtraCount(String(data.extraCount ?? n));
            setMemo(data.memo ?? memo);
            setTotalCount(Number(data.totalCount ?? 0));
            toast.success(`메인에는 판매된 액자 ${Number(data.totalCount ?? 0).toLocaleString()}개로 표시됩니다.`);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || '저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex-1 max-w-[720px] pr-4 pb-20">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">판매 액자 수</h1>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                메인 리뷰 옆에 보이는 숫자는 사이트에서 판매된 수량과 아래에 입력한 수량을 더한 값입니다.
                사이트 수량은 배송완료·교환신청·교환회수완료·교환배송중·교환완료 상태의 상품 수량 합계입니다.
            </p>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-5">
                <div>
                    <p className="text-sm font-semibold text-gray-700">사이트 판매 수량</p>
                    <p className="mt-1 text-2xl font-bold text-gray-900 tabular-nums">
                        {Number(siteSoldCount).toLocaleString()}개
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-semibolc text-gray-700 mb-2" htmlFor="sold-frames-extra">
                        사이트 외 추가 수량
                    </label>
                    <input 
                        id="sold-frames-extra"
                        type="number"
                        min={0}
                        step={1}
                        value={extraCount}
                        onChange={(e) => setExtraCount(e.target.value)}
                        className="w-40 border border-gray-300 rounded px-3 py-2 text-sm tabular-nums"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                        메인 표시 예상: <strong className="text-gray-900">{previewTotal.toLocaleString()}개</strong>
                        {totalCount !== previewTotal && (
                            <span> (저장 전, 현제 메인은 {Number(totalCount).toLocaleString()}개)</span>
                        )}
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="sold-frames-memo">
                        메모
                    </label>
                    <textarea 
                        id="sold-frames-memo"
                        value={memo}
                        onChange={(e) => setMemo(e.target.value)}
                        rows={6}
                        maxLength={2000}
                        placeholder="예: 2024 홈쇼핑 주문 120개, 매장 방문 주문 30개 반영"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm leading-relaxed"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        어떤 주문을 더했는지 적어 두는 칸입니다. 메인에는 나오지 않습니다.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                >
                    {saving ? '저장 중...' : '저장'}
                </button>
            </div>
        </div>
    );
};

export default Admin_SoldFrames;