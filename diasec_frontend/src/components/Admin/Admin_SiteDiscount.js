import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useSitePromo } from '../../context/SitePromoContext';

const Admin_SiteDiscount = () => {
    const API = process.env.REACT_APP_API_BASE;
    const { siteDiscountPercent, setSiteDiscountLocal, refreshSiteDiscount } = useSitePromo();
    const [value, setValue] = useState(String(siteDiscountPercent ?? 20));
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setValue(String(siteDiscountPercent ?? 20));
    }, [siteDiscountPercent]);

    useEffect(() => {
        refreshSiteDiscount();
    }, [refreshSiteDiscount]);

    const handleSave = async () => {
        const n = Number(value);
        if (!Number.isFinite(n) || !Number.isInteger(n)) {
            toast.error('정수로 입력해 주세요. (예: 20)');
            return;
        }
        if (n < 0 || n > 100) {
            toast.error('할인율은 0~100 사이여야 합니다.');
            return;
        }

        setSaving(true);
        try {
            const { data } = await axios.post(
                `${API}/admin/site-setting/discount`,
                { siteDiscountPercent: n },
                { withCredentials: true }
            );
            if (!data?.success) {
                toast.error(data?.message || '저장에 실패했습니다.');
                return;
            }
            setSiteDiscountLocal(data.siteDiscountPercent);
            toast.success(`사이트 할인율이 ${data.siteDiscountPercent}%로 저장되었습니다.`);
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data.message || '저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex-1 max-w-[720px] pr-4 pb-20">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">사이트 할인율 관리</h1>
            <p className="text-sm text-gray-600 mb-6">
                상품·장바구니·주문에 공통으로 적용되는 사이트 기본 할인율입니다.
                파트너 할인은 이 값에 추가로 합산됩니다. (합산 최대 50%)
            </p>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    사이트 기본 할인율 (%)
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                    <input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        className="w-28 border border-gray-300 rounded px-3 py-2 text-sm tabular-nums"
                    />
                    <span className="text-sm text-gray-500">현재 적용: <strong className="text-gray-900">{siteDiscountPercent}%</strong></span>
                </div>

                <p className="mt-3 text-xs text-gray-500">
                    0이면 사이트 기본 할인이 없습니다. 저장 즉시 사이트에 반영됩니다.
                </p>

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="mt-5 px-5 py-2.5 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                >
                    {saving ? '저장 중...' : '저장'}
                </button>
            </div>
        </div>
    );
};

export default Admin_SiteDiscount;