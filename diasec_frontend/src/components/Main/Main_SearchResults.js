import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import axios from "axios"
import { getMinFrameConfigByRatio } from '../../utils/customFramePrice';
import { SitePriceRow } from '../common/SitePriceDisplay';

const CATS = [
    { key: "masterPiece", label: "명화" },
    { key: "koreanPainting", label: "동양화" },
    { key: "photoIllustration", label: "사진/일러스트" },
    { key: "fengShui", label: "풍수그림" },
];

const Main_SearchResults = () => {
    const API = process.env.REACT_APP_API_BASE;
    const location = useLocation();
    const navigate = useNavigate();

    const [hoveredPid, setHoveredPid] = useState(null);
    const queryParams = new URLSearchParams(location.search);
    const q = (queryParams.get("q") || "").trim();

    const [activeTab, setActiveTab] = useState("ALL");
    const [loading, setLoading] = useState(false);

    const [data, setData] = useState({
        masterPiece: [],
        koreanPainting: [],
        photoIllustration: [],
        fengShui: [],
    });

    const [counts, setCounts] = useState({
        masterPiece: 0,
        koreanPainting: 0,
        photoIllustration: 0,
        fengShui: 0,
    });

    const [priceMap, setPriceMap] = useState({});

    // 토글 (접고 펴기)
    const [openMap, setOpenMap] = useState(() => 
        Object.fromEntries(CATS.map(c => [c.key, true]))
    );

    const toggleOpen = (key) => {
        setOpenMap(prev => ({ ...prev, [key]: !prev[key]}));
    };

    // 검색어 바뀌면 "기본 전부 열림"
    useEffect(() => {
        setOpenMap(Object.fromEntries(CATS.map(c => [c.key, true])));
    }, [q]);


    const totalCount = useMemo(() => {
        return Object.values(counts).reduce((a, b) => a + (Number(b) || 0), 0);
    }, [counts]);

    const goItems = (type, keyword) => {
        navigate(`/main_Items?type=${type}&q=${encodeURIComponent(keyword)}`);
    };

    const loadImageSize = (src) => {
        return new Promise ((resolve, reject) => {
            if (!src) {
                reject(new Error("이미지 URL 없음"));
                return;
            }

            const img = new Image();
            img.onload = () => resolve({ width: img.width, height: img.height });
            img.onerror = reject;
            img.src = src;
        })
    }

    useEffect(() => {
    let cancelled = false;

    const allProducts = [
        ...data.masterPiece,
        ...data.koreanPainting,
        ...data.photoIllustration,
        ...data.fengShui,
    ];

    const run = async () => {
        try {
            const entries = await Promise.all(
                allProducts.map(async (p) => {
                    try {
                        const { width, height } = await loadImageSize(p.imageUrl);
                        const ratio = width / height;
                        const cfg = getMinFrameConfigByRatio(ratio);

                        return [p.pid, cfg.price];
                    } catch (e) {
                        console.error("검색결과 가격 계산 실패:", p.pid, e);
                        return [p.pid, null];
                    }
                })
            );

            if (cancelled) return;
                setPriceMap(Object.fromEntries(entries));
            } catch (e) {
                console.error("검색결과 가격 map 생성 실패:", e);
                if (!cancelled) setPriceMap({});
            }
        };

        if (allProducts.length > 0) {
            run();
        } else {
            setPriceMap({});
        }

        return () => {
            cancelled = true;
        };
    }, [data]);

    useEffect(() => {
        if (!q) {
            setData({ masterPiece: [], koreanPainting: [], photoIllustration: [], fengShui: [] });
            setCounts({ masterPiece: 0, koreanPainting: 0, photoIllustration: 0, fengShui: 0});
            return;
        }

        const run = async () => {
            setLoading(true);
            try { 

                const res = await axios.get(`${API}/product/search/all`, {
                    params: { q },
                });

                const next = {
                    masterPiece: res.data?.masterPiece ?? [],
                    koreanPainting: res.data?.koreanPainting ?? [],
                    photoIllustration: res.data?.photoIllustration ?? [],
                    fengShui: res.data?.fengShui ?? [],
                };

                setData(next);
                setCounts({
                    masterPiece: next.masterPiece.length,
                    koreanPainting: next.koreanPainting.length,
                    photoIllustration: next.photoIllustration.length,
                    fengShui: next.fengShui.length,
                });
            } catch (e) {
                console.error("전체 검색 실패", e);
                setData({ masterPiece: [], koreanPainting: [], photoIllustration: [], fengShui: [] });
                setCounts({ masterPiece: 0, koreanPainting: 0, photoIllustration: 0, fengShui: 0 })
            } finally {
                setLoading(false);
            }
        };

        run();
    }, [API, q]);

    const renderGrid = (items, type) => {
        if (!items?.length) {
            return <div className="text-[13px] text-gray-400 py-6">검색 결과 없음</div>;
        }

        return (
            <div className="grid lg:grid-cols-4 md:grid-cols-3 grid-cols-2 md:gap-y-10 md:gap-x-[2%] gap-x-[5%] mt-4 px-1">
                {items.slice(0, 12).map((p) => (
                    <button
                        key={p.pid}
                        onClick={() => 
                            navigate(`/none_custom_detail?pid=${p.pid}&category=${encodeURIComponent(p.category)}`)
                        }
                        onMouseEnter={() => setHoveredPid(p.pid)}
                        onMouseLeave={() => setHoveredPid(null)}
                        className="text- left"
                    >
                        <div className="flex flex-col w-full h-auto cursor-pointer">
                            <div className="flex justify-center items-center w-full aspect-[292/292] overflow-hidden bg-white">
                                <img 
                                    className="h-[100%] w-[100%] object-contain"
                                    style={{ boxShadow: "8px 8px 10px rgba(0,0,0,0.2)" }}
                                    src={hoveredPid == p.pid && p.hoverImageUrl ? p.hoverImageUrl :  p.imageUrl}
                                    alt={p.title}
                                />
                            </div>

                            <span className="lg:text-[18px] text-[clamp(16px,1.759vw,18px)] line-clamp-1 font-bold mt-2">
                                {p.title}
                            </span>
                            <span className="lg:text-[14px] text-[clamp(13.5px,1.368vw,14px)] line-clamp-1 font-bold text-[#83807d]">
                                {p.author}
                            </span>

                            <span className="mt-[2px] font-semibold text-[#a67a3e]">
                                {priceMap[p.pid] != null ? (
                                    <SitePriceRow
                                        unitPrice={priceMap[p.pid]}
                                        quantity={1}
                                        suffix="~"
                                    />
                                ) : (
                                    ''
                                )}
                            </span>

                            <hr className="my-1" />
                        </div>
                    </button>
                ))}
            </div>
        );
    };

    const visibleCats = activeTab === "ALL" ? CATS : CATS.filter((c) => c.key === activeTab);
    
    return (
        <div className="mt-10">
            <div className="flex flex-col items-center">
                <div className="text-[#cfab88] md:text-3xl text-xl font-bold">검색 결과</div>
                <div className="mt-2 text-[13px] text-gray-600">
                    검색어: <span className="font-semibold text-gray-800">{q || "-"}</span> · 총{" "}
                    <span className="font-semibold text-gray-800">{totalCount}</span>건
                </div>
            </div>

            <div className="mt-6 flex gap-2 justify-center flex-wrap">
                <button
                    onClick={() => setActiveTab("ALL")}
                    className={`px-3 py-2 rounded-full text-[13px] border ${
                        activeTab === "ALL" ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-200"
                    }`}
                >
                    전체({totalCount})
                </button>

                {CATS.map((c) => (
                    <button
                        key={c.key}
                        onClick={() => setActiveTab(c.key)}
                        className={`px-3 py-2 rounded-full text-[13px] border ${
                            activeTab === c.key ? "bg-black text-white border-black" : "bg-white text-gray-700 border-gray-200"
                        }`}
                    >
                        {c.label}({counts[c.key] || 0})
                    </button>
                ))}
            </div>

            <div className="mt-6">
                {loading ? (
                    <div className="text-center py-10 text-[13px] text-gray-500">검색 중...</div>
                ) : !q ? (
                    <div className="text-center py-10 text-[13px] text-gray-500">검색어를 입력해 주세요.</div>
                ) : (
                    <div className="space-y-10">
                        {visibleCats.map((c) => {
                            const isOpen = openMap[c.key];

                            return (
                                <section key={c.key} className="px-2">
                                    <div className="flex items-center justify-between border-b pb-2">
                                        <button
                                            type="button"
                                            onClick={() => toggleOpen(c.key)}
                                            className="flex items-center gap-2 font-bold text-[15px] text-gray-800"
                                        >
                                            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-0" : "-rotate-90"}`} />
                                            <span>
                                                {c.label}{" "}
                                                <span className="text-gray-400 font-normal">
                                                    ({counts[c.key] || 0})
                                                </span>
                                            </span>
                                        </button>

                                        {/* <div className="font-bold text-[15px] text-gray-800">
                                            {c.label} <span className="text-gray-400 font-normal">({counts[c.key] || 0})</span>
                                        </div> */}

                                        <button
                                            type="button"
                                            className="text-[13px] text-[#a67a3e] hover:underline"
                                            onClick={() => goItems(c.key, q)}
                                        >
                                            {c.label} 더보기 →
                                        </button>
                                    </div>

                                    {isOpen && renderGrid(data[c.key])}
                                </section>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Main_SearchResults;