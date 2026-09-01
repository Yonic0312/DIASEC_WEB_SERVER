import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const emptyItem = () => ({ title: '', linkUrl: '', imageUrl: '' });

const Admin_MainBlog = () => {
    const API = process.env.REACT_APP_API_BASE;
    const [items, setItems] = useState([emptyItem()]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        (async () => {
            try {
                const { data } = await axios.get(`${API}/site-setting/main-blogs`, {
                    signal: controller.signal,
                });
                const list = Array.isArray(data) ? data : [];
                setItems(list.length > 0 ? list : [emptyItem()]);
            } catch (err) {
                if (err?.name === 'CanceledError') return;
                console.error(err);
                toast.error('블로그 목록을 불러오지 못했습니다.');
            } finally {
                setLoading(false);
            }
        })();

        return () => controller.abort();
    }, [API]);
    
    const updateItem = (index, field, value) => {
        setItems((prev) =>
            prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
        );
    };

    const addItem = () => {
        setItems((prev) => [...prev, emptyItem()]);
    };

    const removeItem = (index) => {
        setItems((prev) => {
            if (prev.length <= 1) return [emptyItem()];
            return prev.filter((_, i) => i !== index);
        });
    };

    const handleSave = async () => {
        const payload = items
            .map((item) => ({
                title: (item.title || '').trim(),
                linkUrl: (item.linkUrl || '').trim(),
                imageUrl: (item.imageUrl || '').trim(),
            }))
            .filter((item) => item.title || item.linkUrl || item.imageUrl);
        
        for (const item of payload) {
            if (!item.title || !item.linkUrl || !item.imageUrl) {
                toast.error('제목, 블로그 링크, 썸네일 이미지 URL을 모두 입력해 주세요.');
                return;
            }
        }

        setSaving(true);
        try {
            const { data } = await axios.post(
                `${API}/admin/site-setting/main-blogs`,
                { items: payload },
                { withCredentials: true }
            );
            if (!data?.success) {
                toast.error('저장에 실패했습니다.');
                return;
            }
            const saved = Array.isArray(data.items) ? data.items : [];
            setItems(saved.length > 0 ? saved : [emptyItem()]) ;
            toast.success('메인 홈 블로그 목록이 저장되었습니다.');
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || '저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 max-w-[900px] pr-4 pb-20 text-sm text-gray-500">
                불러오는 중…
            </div>
        );
    }

    return (
        <div className="flex-1 max-w-[900px] pr-4 pb-20">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">메인 홈 블로그 관리</h1>
            <p className="text-sm text-gray-600 mb-6">
                메인 홈 고객 리뷰 아래에 노출됩니다. 제목, 블로그 글 링크, 썸네일 이미지 URL을 직접 등록합니다.
            </p>

            <div className="space-y-4">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-semibold text-gray-700">항목 {index + 1}</span>
                            <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-xs text-red-600 hover:text-red-700"
                            >
                                삭제
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">제목</label>
                                <input
                                    type="text"
                                    value={item.title}
                                    onChange={(e) => updateItem(index, 'title', e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                    placeholder="블로그 글 제목"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">블로그 글 URL</label>
                                <input 
                                    type="url"
                                    value={item.linkUrl}
                                    onChange={(e) => updateItem(index, 'linkUrl', e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                    placeholder="https://blog.naver.com/..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">썸네일 이미지 URL</label>
                                <input 
                                    type="url"
                                    value={item.imageUrl}
                                    onChange={(e) => updateItem(index, 'imageUrl', e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                    placeholder="https://..."
                                />
                            </div>
                            {item.imageUrl?.trim() && (
                                <img 
                                    src={item.imageUrl.trim()}
                                    alt="미리보기"
                                    referrerPolicy="no-referrer"
                                    className="w-32 aspect-[4/5] object-cover rounded-lg border border-gray-200"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap gap-3 mt-5">
                <button
                    type="button"
                    onClick={addItem}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50"
                >
                    항목 추가
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                >
                    {saving ? '저장 중…' : '저장'}
                </button>
            </div>
        </div>
    );
};

export default Admin_MainBlog;