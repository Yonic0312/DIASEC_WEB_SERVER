import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import axios from 'axios';

const HeaderSearch = ({ variant = 'desktop' }) => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();

    const [q, setQ] = useState('');
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchModalOpen, setSearchModalOpen] = useState(false);
    const [searchResult, setSearchResult] = useState({
        masterPiece: [],
        koreanPainting: [],
        photoIllustration: [],
        fengShui: [],
    });

    const doSearch = useCallback(async (keyword) => {
        const k = (keyword || '').trim();
        if (!k) {
            setSearchResult({
                masterPiece: [],
                koreanPainting: [],
                photoIllustration: [],
                fengShui: [],
            });
            return;
        }

        setSearchLoading(true);
        try {
            const { data } = await axios.get(`${API}/product/search/all`, {
                params: { q: k },
            });
            setSearchResult({
                masterPiece: data?.masterPiece ?? [],
                koreanPainting: data?.koreanPainting ?? [],
                photoIllustration: data?.photoIllustration ?? [],
                fengShui: data?.fengShui ?? [],
            });
        } catch (e) {
            console.error('검색 실패', e);
            setSearchResult({
                masterPiece: [],
                koreanPainting: [],
                photoIllustration: [],
                fengShui: [],
            });
        } finally {
            setSearchLoading(false);
        }
    }, [API]);

    const closeSearchModal = () => {
        setSearchModalOpen(false);
        setQ('');
        setSearchResult({
            masterPiece: [],
            koreanPainting: [],
            photoIllustration: [],
            fengShui: [],
        });
    };

    const goSearchPage = (keyword) => {
        const k = keyword.trim();
        if (!k) return;
        navigate(`/search?q=${encodeURIComponent(k)}`);
    };

    return (
        <>
            {variant === 'desktop' && (
                <div className="relative group flex items-center">
                    <button
                        type="button"
                        onClick={() => setSearchModalOpen(true)}
                        className="
                            flex items-center justify-center
                            w-9 h-9 rounded-full
                            hover:bg-black/5 transition
                        "
                        aria-label="검색 열기"
                    >
                        <Search className="w-5 h-5 text-gray-700" />
                    </button>
                    <div
                        className="
                            pointer-events-none
                            absolute right-0 top-full mt-[-2.1px]
                            z-[9999]
                            whitespace-nowrap
                            rounded-full
                            px-4 py-1.5
                            text-[11.5px] font-medium tracking-tight
                            text-[#3b2b1a]
                            bg-white/95 backdrop-blur-md
                            border border-black/10
                            shadow-[0_10px_25px_rgba(0,0,0,0.10)]
                            opacity-0 translate-y-1 scale-[0.98]
                            transition-all duration-200
                            group-hover:opacity-100
                        "
                    >
                        작품 검색
                    </div>
                </div>
            )}

            {variant === 'mobileIcon' && (
                <button
                    type="button"
                    onClick={() => setSearchModalOpen(true)}
                    className="p-2"
                    aria-label="검색 열기"
                >
                    <Search size={22} className="text-gray-800" />
                </button>
            )}

            <SearchModal
                open={searchModalOpen}
                onClose={closeSearchModal}
                q={q}
                setQ={setQ}
                searchLoading={searchLoading}
                searchResult={searchResult}
                doSearch={doSearch}
                goSearchPage={goSearchPage}
                navigate={navigate}
            />
        </>
    );
};

const SearchModal = ({
    open,
    onClose,
    q,
    setQ,
    searchLoading,
    searchResult,
    doSearch,
    goSearchPage,
    navigate,
}) => {
    const submitSearch = () => {
        const k = q.trim();
        if (!k) return;
        onClose();
        goSearchPage(k);
    };

    const inputRef = useRef(null);

    useEffect(() => {
        if (!open) return;

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const t = setTimeout(() => inputRef.current?.focus(), 30);

        const onKey = (e) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'Enter') submitSearch();
        };
        window.addEventListener('keydown', onKey);

        return () => {
            clearTimeout(t);
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [open, q, goSearchPage, onClose]);

    useEffect(() => {
        if (!open) return;
        const keyword = q.trim();
        if (!keyword) return;

        const t = setTimeout(() => doSearch(keyword), 250);
        return () => clearTimeout(t);
    }, [open, q, doSearch]);

    if (!open) return null;

    const safe = (arr) => (Array.isArray(arr) ? arr : []);
    const master = safe(searchResult?.masterPiece);
    const korean = safe(searchResult?.koreanPainting);
    const photo = safe(searchResult?.photoIllustration);
    const feng = safe(searchResult?.fengShui);
    const total = master.length + korean.length + photo.length + feng.length;

    const CardRow = ({ title, items }) => (
        <div className="py-3 border-t first:border-t-0">
            <div className="flex items-center justify-between mb-2">
                <div className="text-[13px] font-semibold text-gray-800">
                    {title}
                    <span className="ml-2 text-[12px] text-gray-400 font-normal">
                        {items.length}
                    </span>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="text-[12px] text-gray-400">검색 결과 없음</div>
            ) : (
                <div className="flex gap-3 overflow-x-auto pb-1 ">
                    {items.map((it) => (
                        <button
                            key={it.pid || it.id || it.link || it.label}
                            type="button"
                            onClick={() => {
                                if (it.link) navigate(it.link);
                                else if (it.pid) {
                                    navigate(
                                        `/none_custom_detail?pid=${it.pid}&category=${encodeURIComponent(it.category || '')}`
                                    );
                                }
                                onClose();
                                setQ('');
                            }}
                            className="
                                shrink-0 w-[80px]
                                rounded-2xl border border-gray-200 bg-white
                                hover:shadow-md hover:border-gray-300 transition
                                overflow-hidden text-left
                            "
                        >
                            <div className="w-full aspect-square bg-gray-50 overflow-hidden">
                                <img
                                    src={it.img || it.imageUrl}
                                    alt={it.label || it.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="px-2 py-1">
                                <div className="text-[12px] font-semibold text-gray-900 truncate">
                                    {it.label || it.title}
                                </div>
                                <div className="text-[11px] text-gray-500 truncate">
                                    {it.author || ''}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[10000]">
            <button
                type="button"
                onClick={onClose}
                className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/55"
                aria-label="검색 닫기"
            />

            <div className="absolute left-1/2 top-[8.5%] -translate-x-1/2 w-[min(920px,94vw)]">
                <div className="bg-white rounded-3xl shadow-2xl border border-black/10 overflow-hidden">
                    <div className="p-5 pb-2">
                        <div className="flex items-center gap-3">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    ref={inputRef}
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                    placeholder="작품 제목을 검색하세요"
                                    className="
                                        w-full pl-11 pr-[60px]
                                        h-11 rounded-full
                                        border border-gray-200
                                        bg-gray-50
                                        text-[13px]
                                        outline-none
                                        focus:bg-white focus:border-gray-300
                                        transition
                                    "
                                />

                                {!!q.trim() && (
                                    <button
                                        type="button"
                                        onClick={() => setQ('')}
                                        className="absolute right-[70px] top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-black/5"
                                        aria-label="검색어 지우기"
                                    >
                                        <X size={16} className="text-gray-500" />
                                    </button>
                                )}

                                <button
                                    type="button"
                                    onClick={submitSearch}
                                    className="
                                        absolute right-1 top-1/2 -translate-y-1/2
                                        h-9 px-4 rounded-full
                                        bg-[#ECD2AF] text-white text-[13px]
                                        hover:bg-[#e7c699] transition
                                    "
                                >
                                    검색
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-black/5"
                                aria-label="닫기"
                            >
                                <X className="w-5 h-5 text-gray-700" />
                            </button>
                        </div>

                        <div className="mt-3 flex items-center justify-between">
                            <div className="text-[12px] text-gray-500">
                                {q.trim() ? (
                                    <>
                                        "<span className="text-gray-900 font-semibold">{q.trim()}</span>" · 총{" "}
                                        <span className="text-gray-900 font-semibold">{total}</span>건
                                    </>
                                ) : (
                                    ''
                                )}
                            </div>

                            {q.trim() && (
                                <button
                                    type="button"
                                    onClick={submitSearch}
                                    className="text-[12px] text-gray-600 hover:text-gray-900 hover:underline"
                                >
                                    전체 결과 페이지로 →
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="px-5 py-4 max-h-[60vh] overflow-y-auto">
                        {searchLoading ? (
                            <div className="py-10 text-center text-[13px] text-gray-500">검색 중...</div>
                        ) : !q.trim() ? (
                            <div className="py-10 text-center text-[13px] text-gray-500">
                                예) 해바라기, 청룡, 밤...
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-gray-100 bg-white">
                                <div className="px-4">
                                    <CardRow title="명화" items={master} />
                                    <CardRow title="동양화" items={korean} />
                                    <CardRow title="사진/일러스트" items={photo} />
                                    <CardRow title="풍수그림" items={feng} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-3 text-center text-[11px] text-white/80 hidden md:block">
                    ESC로 닫기 · Enter로 검색
                </div>
            </div>
        </div>
    );
};

export default HeaderSearch;
