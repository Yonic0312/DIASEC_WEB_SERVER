import { useEffect, useLayoutEffect, useState, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import axios from 'axios';
import { X, Search } from 'lucide-react';
import { getMinFrameConfigByRatio } from '../../utils/customFramePrice';
import { SitePriceRow } from '../common/SitePriceDisplay';
import { MAIN_ITEMS_SCROLL_PREFIX } from '../../utils/navigationReload';
import pic_author from '../../assets/collections/author.png';
import pic_photoIllustration from '../../assets/collections/photoIllustration.png'
import pic_fungShui from '../../assets/collections/fungShui.png';

function parseListScrollPayload(raw) {
    if (raw == null || raw === "") return null;
    try {
        const o = JSON.parse(raw);
        if (
            o &&
            typeof o === "object" &&
            typeof o.y === "number" &&
            typeof o.page === "number" &&
            o.page >= 0 &&
            (o.mode === "author" || o.mode === "home")
        ) {
            return {
                y: o.y,
                docH: typeof o.docH === "number" ? Math.max(0, o.docH) : 0,
                mode: o.mode,
                page: o.page,
                itemCount:
                    typeof o.itemCount === "number" && o.itemCount >= 0
                        ? o.itemCount
                        : undefined,
            };
        }
    } catch {
        /* ignore */
    }
    return null;
}

const Main_Items = () => {
    const API = process.env.REACT_APP_API_BASE;
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);

    const getScrollKey = () => `${MAIN_ITEMS_SCROLL_PREFIX}${location.pathname}${location.search}`;

    const author = queryParams.get("author");
    const type = queryParams.get("type");

    // Main_SearchResults에서 검색어 보내면 받기
    const qParam = queryParams.get("q");
    useEffect(() => {
        if (qParam) setTitleSearch(decodeURIComponent(qParam));
    }, [qParam, type, author]);

    // 작가 목록 순서 상태
    const [sortMode, setSortMode] = useState('popular'); // 'popular' | 'name'

    let title = "";
    let pic = "";

    // 동양화 상단 미니 셀렉터 바로 들어감
    const DIRECT_AUTHOR_PERIODS = new Set(["기타작가", "민화", "만화", "불교"]);

    // 경로에 따라 제목 변경
    if(type === "masterPiece") {
        title = "명화";
    } else if (type === "koreanPainting") { 
        title = "동양화";
    } else if(type === "fengShui") {
        title = "풍수";
        pic = pic_fungShui;
    } else if(type === "authorCollection") {
        title = "작가 컬렉션";
        pic = pic_author;
    } else if (type === "photoIllustration") {
        title = "사진/일러스트"
        pic = pic_photoIllustration;
    } else {
        title = "오류"
    }

    // 무한 스크롤
    const PAGE_SIZE = 15;

    // author(작가/전체보기) 상품 무한스크롤
    const [authorProducts, setAuthorProducts] = useState([]);
    const [authorPage, setAuthorPage] = useState(0);
    const [authorHasMore, setAuthorHasMore] = useState(true);
    const [authorLoading, setAuthorLoading] = useState(false);
    const authorReqIdRef = useRef(0);
    const authorLoadMoreRef = useRef(null);

    // 홈(사진/일러스트, 풍수, 작가컬렉션) 상품 무한스크롤
    const [homeProducts, setHomeProducts] = useState([]);
    const [homePage, setHomePage] = useState(0);
    const [homeHasMore, setHomeHasMore] = useState(true);
    const [homeLoading, setHomeLoading] = useState(false);
    const homeReqIdRef = useRef(0);
    const homeLoadMoreRef = useRef(null);

    // 무한 스크롤 sentinel
    const [selectedPeriod, setSelectedPeriod] = useState(''); // 시대
    const [labels, setLabels] = useState([]);
    const [selectedLabel, setSelectedLabel] = useState(author || '');


    const [authorSearch, setAuthorSearch] = useState(''); // 작가 검색창
    const [titleSearch, setTitleSearch] = useState(''); // 제목 검색창

    // 라벨(작가 카드) 무한스크롤
    const [labelPage, setLabelPage] = useState(0);
    const [labelLoading, setLabelLoading] = useState(false);
    const [labelHasMore, setLabelHasMore] = useState(true);
    const labelLoadMoreRef = useRef(null);
    const listRestoreInProgressRef = useRef(false);
    const prevAuthorForScrollRef = useRef(null);
    const prevAuthorForSearchResetRef = useRef(author);
    const postRestoreScrollYRef = useRef(null);

    useEffect(() => {
        const prev = window.history.scrollRestoration;
        if ("scrollRestoration" in window.history) {
            window.history.scrollRestoration = "manual";
        }
        return () => {
            if ("scrollRestoration" in window.history) {
                window.history.scrollRestoration = prev;
            }
        };
    }, []);

    useLayoutEffect(() => {
        const key = `${MAIN_ITEMS_SCROLL_PREFIX}${location.pathname}${location.search}`;
        const raw = sessionStorage.getItem(key);
        const parsed = parseListScrollPayload(raw);
        const el = document.documentElement;
        if (parsed && parsed.docH > 0) {
            el.style.minHeight = `${parsed.docH}px`;
        }
        return () => {
            el.style.minHeight = "";
        };
    }, [location.pathname, location.search]);

    useEffect(() => {
        homeReqIdRef.current += 1;
        authorReqIdRef.current += 1;

        // 라벨 리스트는 type 바뀌면 초기화
        setLabels([]);
        setLabelPage(0);
        setLabelHasMore(true);
        setLabelLoading(false);

        // 홈 상품 무한스크롤 초기화
        setHomeProducts([]);
        setHomePage(0);
        setHomeHasMore(true);
        setHomeLoading(false);

        // author 상품 무한스크롤 초기화
        setAuthorProducts([]);
        setAuthorPage(0);
        setAuthorHasMore(true);
        setAuthorLoading(false);

        window.scrollTo({ top: 0, behavior: "auto" });
    }, [type]);

    useEffect(() => {
        if (!author) return;
        setAuthorProducts([]);
        setAuthorPage(0);
        setAuthorHasMore(true);
        setAuthorLoading(false);
    }, [author]);

    // 상단 미니용 라벨 가져오기
    const [miniLabels, setMiniLabels] = useState([]);

    // 상단 미니 라벨은 항상 전체 로딩
    useEffect(() => {
        if (!type) return;

        axios.get(`${API}/collections/labels`, {
            params: { type, size: 9999, offset: 0 }
        })
        .then(res => setMiniLabels(res.data ?? []))
        .catch(err => {
            console.error("상단 미니 라벨 불러오기 실패", err);
            setMiniLabels([]);
        });
    }, [type]);

    // 상단 미니 라벨 렌더링
    const miniFilteredLabels = miniLabels.filter(item => {
        const matchesPeriod = !selectedPeriod || item.times === selectedPeriod;
        const matchesSearch = item.label.toLowerCase().includes(authorSearch.toLowerCase());
        return matchesPeriod && matchesSearch;
    });

    const miniSortedLabels = [...miniFilteredLabels].sort((a, b) => {
        if (sortMode === 'popular') {
            const ao = Number(a.sortOrder);
            const bo = Number(b.sortOrder);

            const aHas = ao > 0;
            const bHas = bo > 0;

            if (aHas && !bHas) return -1;
            if (!aHas && bHas) return 1;

            if (aHas && bHas && ao !== bo) return ao - bo;

            const c = Number(b.count ?? 0) - Number(a.count ?? 0);
            if (c !== 0) return c;

            return a.label.localeCompare(b.label, 'ko');
        }
        return a.label.localeCompare(b.label, 'ko');
    });

    // 타입이 바뀌면 초기화
    useEffect(() => {
        if (!["masterPiece", "koreanPainting"].includes(type)) return;
        if (author) return;

        setLabels([]);
        setLabelPage(0);
        setLabelHasMore(true);
        setLabelLoading(false);
    }, [type, author]);

    const labelReqIdRef = useRef(0);

    useEffect(() => {
        labelReqIdRef.current += 1;
    }, [type]);
 
    // 라벨 목록 가져오기 (page 기반)
    useEffect(() => {
        if (!type) return;

        // 명화 홈(작가 카드)에서만 라벨 무한스크롤
        if (!["masterPiece", "koreanPainting"].includes(type)) return;
        if (author) return;
        if (!labelHasMore) return;

        const reqId = ++labelReqIdRef.current;

        const fetchLabels = async () => {
            setLabelLoading(true);
            try {
                const offset = labelPage * PAGE_SIZE;
                const res = await axios.get(`${API}/collections/labels`, {
                    params: { type, size: PAGE_SIZE, offset }
                });
                
                if (reqId !== labelReqIdRef.current) return;

                const list = res.data ?? [];
                setLabels(prev => [...prev, ...list]);
                if (list.length < PAGE_SIZE) setLabelHasMore(false);
            } catch (e) {;
                setLabelHasMore(false);
            } finally {
                if (reqId === labelReqIdRef.current) setLabelLoading(false);
            }
        };

        fetchLabels();
    }, [type, author, labelPage, labelHasMore, API]);

    useEffect(() => {
        const el = labelLoadMoreRef.current;
        if (!el) return;

        if (!["masterPiece", "koreanPainting"].includes(type)) return;
        if (author) return;

        const obs = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;

            if (labelLoading || !labelHasMore) return;
            
            if (labels.length === 0) return;
            
            setLabelPage(p => p + 1);
        }, {threshold: 0.2 });

        obs.observe(el);
        return () => obs.disconnect();
    }, [type, author, labelLoading, labelHasMore, labels.length]);

    // 작가가 선택되면 상품을 가져옴 (page 기반)
    useEffect(() => {
        if (!type || !author) return;
        if (listRestoreInProgressRef.current) return;
        if (!authorHasMore) return;

        const reqId = ++authorReqIdRef.current;

        const fetchAuthorProducts = async () => {
            setAuthorLoading(true);
        
            try {
                const decoded = decodeURIComponent(author);
                setSelectedLabel(decoded);

                const offset = authorPage * PAGE_SIZE;
                const isAll = decoded === "ALL";

                const url = isAll ? `${API}/product/list/paged` : `${API}/product/filter/paged`;
                const params = isAll
                    ? { category: type, size: PAGE_SIZE, offset }
                    : { category: type, author: decoded, size: PAGE_SIZE, offset };

                const res = await axios.get(url, { params });
            
                if (reqId !== authorReqIdRef.current) return;

                const list = res.data ?? [];

                setAuthorProducts(prev => {
                    const seen = new Set(prev.map(p => p.pid));
                    const next = [...prev];
                    for (const p of list) if (!seen.has(p.pid)) next.push(p);
                    return next;
                });

              if (list.length < PAGE_SIZE) setAuthorHasMore(false);
            } catch (e) {
                if (reqId !== authorReqIdRef.current) return;
                console.error("author 상품(paged) 로드 실패", e);
                setAuthorHasMore(false);
            } finally {
                if (reqId === authorReqIdRef.current) setAuthorLoading(false);
            }
        };
    
        fetchAuthorProducts();
    }, [type, author, API, authorPage, authorHasMore]);

    const handleLabelClick = (label) => {
        setTitleSearch('');
        navigate(`/main_Items?type=${type}&author=${encodeURIComponent(label)}`);
    }

    const q = titleSearch.trim().toLowerCase();

    const filteredAuthorProducts = useMemo(() => {
        return !q
            ? authorProducts
            : authorProducts.filter(p => (p.title ?? "").toLowerCase().includes(q));
    }, [authorProducts, q]);

    const filteredHomeProducts = useMemo(() => {
        return !q
            ? homeProducts
            : homeProducts.filter(p => (p.title ?? "").toLowerCase().includes(q));
    }, [homeProducts, q]);

    // 검색 중이면 전부 보여주고, 검색 아닐 때만 visibleCount 적용
    const displayProducts = useMemo(() => {
        return author 
            ? filteredAuthorProducts
            : (["masterPiece", "koreanPainting"].includes(type) ? [] : filteredHomeProducts);
    }, [author, type, filteredAuthorProducts, filteredHomeProducts]);

    useEffect(() => {
        setTitleSearch('');
    }, [type]);

    useEffect(() => {
        if (!type || !author) return;

        const el = authorLoadMoreRef.current;
        if (!el) return;

        const obs = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            if (listRestoreInProgressRef.current) return;
            if (authorLoading || !authorHasMore) return;
            if (authorProducts.length === 0) return;
                
            setAuthorPage(p => p + 1);
        }, { threshold: 0.2});

        obs.observe(el);
        return () => obs.disconnect();
    }, [type, author, authorLoading, authorHasMore, authorProducts.length]);

    useEffect(() => {
        if (!author) {
            prevAuthorForScrollRef.current = null;
            return;
        }
        const prev = prevAuthorForScrollRef.current;
        if (prev !== null && prev !== author) {
            window.scrollTo({ top: 0, behavior: "auto" });
        }
        prevAuthorForScrollRef.current = author;
    }, [author]);

    // 마우스 호버 상태 저장(img)
    const [hoveredPid, setHoveredPid] = useState(null);

    const [itemPriceMap, setItemPriceMap] = useState({});

    // 작가 목록 가져오기
    const filteredLabels = labels.filter(item => {
        const matchesPeriod = !selectedPeriod || item.times === selectedPeriod;
        const matchesSearch = item.label.toLowerCase().includes(authorSearch.toLowerCase());
        return matchesPeriod && matchesSearch;
    });

    const sortedLabels = [...filteredLabels].sort((a, b) => {
        if (sortMode === 'popular') {
            const ao = Number(a.sortOrder);
            const bo = Number(b.sortOrder);

            const aHas = ao > 0;
            const bHas = bo > 0;

            // sortOrder 있는 것 먼저
            if (aHas && !bHas) return -1;
            if (!aHas && bHas) return 1;

            // 둘 다 있으면 sortOrder 오름차순
            if (aHas && bHas && ao !== bo) return ao - bo;

            // count 내림차순
            const c = Number(b.count ?? 0) - Number(a.count ?? 0);
            if (c !== 0) return c;

            // 가나다
            return a.label.localeCompare(b.label, 'ko');
        }

        return a.label.localeCompare(b.label, 'ko');
    });

    const authorCards = sortedLabels.map(item => ({
        label: item.label,
        img: item.imageUrl,
        link: `/main_Items?type=${type}&author=${encodeURIComponent(item.label)}`,
        count: item.count,
        sortOrder: item.sortOrder
    }));

    // 상품 갯수 가져오기
    const [totalCount, setTotalCount] = useState(0);
    const [titleFilterCount, setTitleFilterCount] = useState(null);
    const [titleFilterLoading, setTitleFilterLoading] = useState(false);

    useEffect(() => {
        if (!type) return;

        const params = { category: type };
        if (author) params.author = decodeURIComponent(author);

        axios.get(`${API}/product/count/author`, { params })
        .then(res => setTotalCount(res.data ?? 0))
        .catch(() => setTotalCount(0));
    }, [type, author]);

    // 상품명 검색 시 DB 기준 총 개수 (디바운스)
    useEffect(() => {
        if (!type) return;
        const q = titleSearch.trim();
        if (!q) {
            setTitleFilterCount(null);
            setTitleFilterLoading(false);
            return;
        }

        let cancelled = false;
        setTitleFilterLoading(true);

        const t = setTimeout(() => {
            if (cancelled) return;
            const params = { category: type, title: q };
            if (author) params.author = decodeURIComponent(author);

            axios.get(`${API}/product/count/author`, { params })
            .then((res) => {
                if (cancelled) return;
                setTitleFilterCount(res.data ?? 0);
            })
            .catch(() => {
                if (cancelled) return;
                setTitleFilterCount(null);
            })
            .finally(() => {
                if (cancelled) return;
                setTitleFilterLoading(false);
            })
        }, 300);

        return () => {
            cancelled = true;
            clearTimeout(t);
            setTitleFilterLoading(false);
        };
    }, [type, author, titleSearch, API]);

    useEffect(() => {
        if (prevAuthorForSearchResetRef.current !== author) {
            setAuthorSearch('');
            setTitleSearch('');
        }
        prevAuthorForSearchResetRef.current = author;

        if (!author) {
            setSelectedLabel('');
            setSelectedPeriod('');
            setSortMode('popular');
        }
    }, [author]);

    useEffect(() => {
        if (!type) return;
        if (author) return;

        // 명화/동양화는 라벨 카드 구조니까 홈상품 로딩 안 함
        if (["masterPiece", "koreanPainting"].includes(type)) return;
        if (listRestoreInProgressRef.current) return;
        if (!homeHasMore) return;

        const reqId = ++homeReqIdRef.current;

        const fetchHomePaged = async () => {
            setHomeLoading(true);
            try {
                const offset = homePage * PAGE_SIZE;

                const res = await axios.get(`${API}/product/list/paged`, {
                    params: { category: type, size: PAGE_SIZE, offset }
                });

                if (reqId !== homeReqIdRef.current) return;

                const list = res.data ?? [];

                setHomeProducts(prev => {
                    const seen = new Set(prev.map(p => p.pid));
                    const next = [...prev];
                    for (const p of list) if (!seen.has(p.pid)) next.push(p);
                    return next;
                });

                if (list.length < PAGE_SIZE) setHomeHasMore(false);
            } catch (e) {
                if (reqId !== homeReqIdRef.current) return;
                console.error("홈 상품 로드 실패", e);
                setHomeHasMore(false);
            } finally {
                if (reqId === homeReqIdRef.current) setHomeLoading(false);
            }
        };

        fetchHomePaged();
    }, [type, author, API, homePage, homeHasMore]);

    useEffect(() => {
        if (!type) return;
        if (author) return;
        if (["masterPiece", "koreanPainting"].includes(type)) return;

        const el = homeLoadMoreRef.current;
        if(!el) return;

        const obs = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            if (listRestoreInProgressRef.current) return;
            if (homeLoading || !homeHasMore) return;
            if (homeProducts.length === 0) return;

            setHomePage(p => p + 1);
        }, { threshold: 0.2 });

        obs.observe(el);
        return () => obs.disconnect();
    }, [type, author, homeLoading, homeHasMore, homeProducts.length]);

    // 상세에서 뒤로: 저장된 페이지까지 API를 연속 호출해 한 번에 목록을 채운 뒤 스크롤만 맞춤 (무한스크롤 단계별 렌더로 푸터가 흔들리지 않게)
    useEffect(() => {
        const key = `${MAIN_ITEMS_SCROLL_PREFIX}${location.pathname}${location.search}`;
        const raw = sessionStorage.getItem(key);
        const parsed = parseListScrollPayload(raw);
        if (!parsed) return;

        if (parsed.mode === "author") {
            if (!type || !author) return;
        } else if (parsed.mode === "home") {
            if (!type || author || ["masterPiece", "koreanPainting"].includes(type)) return;
        } else {
            return;
        }

        let cancelled = false;
        listRestoreInProgressRef.current = true;
        authorReqIdRef.current += 1;
        homeReqIdRef.current += 1;

        const finishScroll = () => {
            postRestoreScrollYRef.current = parsed.y;
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const el = document.documentElement;
                    const maxY = Math.max(0, el.scrollHeight - window.innerHeight);
                    window.scrollTo({
                        top: Math.min(parsed.y, maxY),
                        left: 0,
                        behavior: "auto",
                    });
                    sessionStorage.removeItem(key);
                });
            });
            setTimeout(() => {
                if (postRestoreScrollYRef.current == null) return;
                const yy = postRestoreScrollYRef.current;
                const maxY = Math.max(
                    0,
                    document.documentElement.scrollHeight - window.innerHeight
                );
                window.scrollTo({ top: Math.min(yy, maxY), left: 0, behavior: "auto" });
                postRestoreScrollYRef.current = null;
                document.documentElement.style.minHeight = "";
            }, 1200);
        };

        const runAuthor = async () => {
            const reqId = authorReqIdRef.current;
            const decoded = decodeURIComponent(author);
            const isAll = decoded === "ALL";
            const url = isAll ? `${API}/product/list/paged` : `${API}/product/filter/paged`;
            const merged = [];
            const ic =
                typeof parsed.itemCount === "number" && parsed.itemCount >= 0
                    ? parsed.itemCount
                    : 0;
            const batchesFromItems = ic > 0 ? Math.ceil(ic / PAGE_SIZE) : 0;
            const ps = parsed.page;
            const toExclusive =
                ps <= 0
                    ? Math.max(1, batchesFromItems || 1)
                    : Math.max(ps, batchesFromItems || 0);

            setAuthorLoading(true);
            try {
                setSelectedLabel(decoded);
                let lastLen = PAGE_SIZE;
                const runLoop = async (fromP, toEx) => {
                    for (let p = fromP; p < toEx; p++) {
                        if (cancelled || reqId !== authorReqIdRef.current) return;
                        const offset = p * PAGE_SIZE;
                        const params = isAll
                            ? { category: type, size: PAGE_SIZE, offset }
                            : { category: type, author: decoded, size: PAGE_SIZE, offset };
                        const res = await axios.get(url, { params });
                        const list = res.data ?? [];
                        const seen = new Set(merged.map((x) => x.pid));
                        for (const item of list) {
                            if (!seen.has(item.pid)) {
                                seen.add(item.pid);
                                merged.push(item);
                            }
                        }
                        lastLen = list.length;
                        if (list.length < PAGE_SIZE) return;
                    }
                };
                await runLoop(0, toExclusive);
                if (cancelled || reqId !== authorReqIdRef.current) return;
                setAuthorProducts(merged);
                setAuthorPage(toExclusive);
                setAuthorHasMore(lastLen >= PAGE_SIZE);
            } catch (e) {
                console.error("목록 복원(작가) 실패", e);
                setAuthorHasMore(false);
            } finally {
                if (reqId === authorReqIdRef.current) setAuthorLoading(false);
            }
        };

        const runHome = async () => {
            const reqId = homeReqIdRef.current;
            const merged = [];
            const ic =
                typeof parsed.itemCount === "number" && parsed.itemCount >= 0
                    ? parsed.itemCount
                    : 0;
            const batchesFromItems = ic > 0 ? Math.ceil(ic / PAGE_SIZE) : 0;
            const ps = parsed.page;
            const toExclusive =
                ps <= 0
                    ? Math.max(1, batchesFromItems || 1)
                    : Math.max(ps, batchesFromItems || 0);

            setHomeLoading(true);
            try {
                let lastLen = PAGE_SIZE;
                const runLoop = async (fromP, toEx) => {
                    for (let p = fromP; p < toEx; p++) {
                        if (cancelled || reqId !== homeReqIdRef.current) return;
                        const offset = p * PAGE_SIZE;
                        const res = await axios.get(`${API}/product/list/paged`, {
                            params: { category: type, size: PAGE_SIZE, offset },
                        });
                        const list = res.data ?? [];
                        const seen = new Set(merged.map((x) => x.pid));
                        for (const item of list) {
                            if (!seen.has(item.pid)) {
                                seen.add(item.pid);
                                merged.push(item);
                            }
                        }
                        lastLen = list.length;
                        if (list.length < PAGE_SIZE) return;
                    }
                };
                await runLoop(0, toExclusive);
                if (cancelled || reqId !== homeReqIdRef.current) return;
                setHomeProducts(merged);
                setHomePage(toExclusive);
                setHomeHasMore(lastLen >= PAGE_SIZE);
            } catch (e) {
                console.error("목록 복원(홈) 실패", e);
                setHomeHasMore(false);
            } finally {
                if (reqId === homeReqIdRef.current) setHomeLoading(false);
            }
        };

        (async () => {
            try {
                if (parsed.mode === "author") {
                    await runAuthor();
                } else {
                    await runHome();
                }
            } finally {
                listRestoreInProgressRef.current = false;
            }
            if (!cancelled) finishScroll();
        })();

        return () => {
            cancelled = true;
            listRestoreInProgressRef.current = false;
        };
    }, [API, author, type, location.pathname, location.search]);

    const saveListScrollForDetail = () => {
        const payload = {
            y: window.scrollY,
            docH: document.documentElement.scrollHeight,
            mode: author ? "author" : "home",
            page: author ? authorPage : homePage,
            itemCount: author ? authorProducts.length : homeProducts.length,
        };
        sessionStorage.setItem(getScrollKey(), JSON.stringify(payload));
    };

    const displayCount = author ? filteredAuthorProducts.length : 0;

    const loadImageSize = (src) => {
        return new Promise((resolve, reject) => {
            if (!src) {
                reject(new Error("이미지 URL 없음"));
                return;
            }

            const img = new Image();
            img.onload = () => resolve({ width: img.width, height: img.height });
            img.onerror = reject;
            img.src = src;
        });
    };

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            try {
                const entries = await Promise.all(
                    displayProducts.map(async (product) => {
                        try {
                            const { width, height } = await loadImageSize(product.imageUrl);
                            const ratio = width / height;
                            const cfg = getMinFrameConfigByRatio(ratio);
                            return [product.pid, cfg.price];
                        } catch (e) {
                            console.error("Main_Items 가격 계산 실패:", product.pid, e);
                            return [product.pid, null];
                        }
                    })
                );

                if (cancelled) return;
                setItemPriceMap(Object.fromEntries(entries));
            } catch (e) {
                console.error("Main_Items 가격 map 생성 실패:", e);
                if (!cancelled) setItemPriceMap({});
            }
        };

        if (displayProducts.length > 0) {
            run();
        } else {
            setItemPriceMap({});
        }

        return () => {
            cancelled = true;
        };
    }, [displayProducts]);

    // 복원 직후 가격(비동기) 들어오며 카드 높이가 늘어나 스크롤이 밀리는 보정
    useEffect(() => {
        const y = postRestoreScrollYRef.current;
        if (y == null) return;
        if (displayProducts.length === 0) return;

        const allPriced = displayProducts.every((p) =>
            Object.prototype.hasOwnProperty.call(itemPriceMap, p.pid)
        );
        if (!allPriced) return;

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (postRestoreScrollYRef.current == null) return;
                const yy = postRestoreScrollYRef.current;
                const maxY = Math.max(
                    0,
                    document.documentElement.scrollHeight - window.innerHeight
                );
                window.scrollTo({
                    top: Math.min(yy, maxY),
                    left: 0,
                    behavior: "auto",
                });
                postRestoreScrollYRef.current = null;
                document.documentElement.style.minHeight = "";
            });
        });
    }, [itemPriceMap, displayProducts]);

    const hasTitleSearch = titleSearch.trim().length > 0;
    const productCountText = !hasTitleSearch
        ? totalCount.toLocaleString()
        : titleFilterLoading
            ? '…'
            : titleFilterCount != null
                ? titleFilterCount.toLocaleString()
                : '-';

    return (
        <div>
            {/* [공통] 페이지 제목 */}
            <div className="flex justify-center mt-[40px] text-[#cfab88]">
                <span className="md:text-3xl text-[clamp(24px,3.911vw,30px)] font-bold">{selectedLabel ?  selectedLabel : title}</span>
            </div>

            {/* [공통] 상단 미니 셀렉터 */}
            {!author && (
                <>  
                        <div className="mb:mt-[60px] md:mr-[4px] mt-3">
                            <div className='flex items-end justify-between'>
                                <div className="ml-1 text-[15px]">
                                    <span
                                        className={`cursor-pointer ${sortMode === 'popular' ? 'font-bold text-black' : 'text-gray-500'}`}
                                        onClick={() => setSortMode('popular')}
                                    >
                                        인기순
                                    </span>
                                    <span 
                                        className={`ml-2 cursor-pointer ${sortMode === 'name' ? 'font-bold text-black' : 'text-gray-500'}`}
                                        onClick={() => setSortMode('name')}    
                                    >
                                        가나다순
                                    </span>
                                </div>
                                {type !== "fengShui" && type !== "photoIllustration" && (
                                    <div className='mr-1 relative md:w-[240px] w-[clamp(170px,31.29vw,240px)]'>
                                        <input 
                                            type="text"
                                            placeholder="작가 이름을 검색하세요"
                                            value={authorSearch}
                                            onChange={(e) => setAuthorSearch(e.target.value)}
                                            className='
                                                w-full pl-10 pr-8 py-[6px] rounded-full border border-gray-300 
                                                focus:outline-none focus:ring-2 focus:ring-[#D0AC88]
                                                md:text-sm text-[clamp(12px,1.955vw,15px)]'
                                        />
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        {authorSearch && (
                                            <button
                                                type="button"
                                                onClick={() => setAuthorSearch('')}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                                                aria-label="작가 검색어 지우기"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            {/* [명화] 시대 */}
                            {type === "masterPiece" && (
                                <div 
                                    className='
                                        sm:text-base text-[clamp(14px,2.503vw,16px)]
                                        flex overflow-x-auto no-scrollbar whitespace-nowrap md:gap-5 gap-3 text-gray-600 mt-1 ml-1 mb-1'>
                                    {[
                                        "전체", "르네상스", "베네치아파", "바로크", "로코코", "신고전주의", "낭만주의", "사실주의", "인상주의", "신인상주의", "후기인상주의", "근대미술"
                                    ].map((period, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setSelectedPeriod(period === "전체" ? "" : period);
                                                setSelectedLabel('');
                                            }}
                                            className={`pb-[2px] font-medium ${
                                                (selectedPeriod === "" && period === "전체") || selectedPeriod === period 
                                                ? 'text-black border-black border-b-2' 
                                                : 'border-transparent' }
                                                border-b-2 hover:border-black hover:text-black transition`}
                                        >
                                            {period}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* [동양화] 시대 */}
                            {type === "koreanPainting" && (
                                <div 
                                    className='
                                        sm:text-base text-[clamp(14px,2.503vw,16px)]
                                        flex overflow-x-auto no-scrollbar whitespace-nowrap md:gap-5 gap-3 text-gray-600 mb-1'>
                                    {[
                                        "전체", "조선 전기", "조선 후기", "기타작가", "민화", "불교"
                                    ].map((period, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                if (DIRECT_AUTHOR_PERIODS.has(period)) {
                                                    setSelectedPeriod('');
                                                    setSelectedLabel(period);
                                                    setAuthorSearch('');
                                                    setTitleSearch('');
                                                    navigate(`/main_Items?type=${type}&author=${encodeURIComponent(period)}`);
                                                    return;
                                                }

                                                setSelectedPeriod(period === "전체" ? "" : period);
                                                setSelectedLabel('');
                                            }}
                                            className={`pb-[2px] font-medium ${
                                                (selectedPeriod === "" && period === "전체") || selectedPeriod === period 
                                                ? 'text-black border-black border-b-2' 
                                                : 'border-transparent' }
                                                border-b-2 hover:border-black hover:text-black transition`}
                                        >
                                            {period}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                    {/* 상단 미니 컬렉션 셀렉터 */}
                    {['masterPiece', 'koreanPainting', 'fengShui', 'authorCollection', 'photoIllustration'].includes(type) && (
                        <div 
                            className='
                                lg:grid-cols-6 md:grid-cols-4 grid-cols-2
                                text-[13px]
                                font-normal w-full grid border-t border-l border-black border-opacity-10
                                max-h-[121px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300'
                        >
                            {miniSortedLabels.map((item, index) => (
                                    <div
                                        key={index}
                                        className='flex items-center px-1 justify-start h-10 border-r border-b border-black border-opacity-10 hover:bg-[#555555] hover:text-white'
                                        onClick={() => handleLabelClick(item.label)}
                                    >
                                        {item.label}
                                        <span className='text-gray-400'>&nbsp;({item.count})</span>
                                    </div>
                                ))
                            }
                        </div>
                    )}
                </>
            )} {/* [공통] 상단 미니 셀렉터 */}

            {/* [공통 (상품)] 상단 상품 갯수 카운트*/}
            {!["masterPiece", "koreanPainting"].includes(type) && !author && (
                <div className="flex items-end justify-between mt-2 px-3"> 
                    <div 
                        className="
                            text-[15px] text-[#CDC9C3]
                        "
                    > 
                        상품 <span className="text-[#555555]">{productCountText}</span>개
                    </div>
                    
                    <div className='flex md:justify-end justify-center'>
                        <div className='relative md:w-[240px] w-[clamp(170px,31.29vw,240px)] md:mr-[4px]'>
                            <input 
                                type="text"
                                placeholder="상품명을 검색하세요"
                                value={titleSearch}
                                onChange={(e) => setTitleSearch(e.target.value)}
                                className='
                                    w-full pl-10 pr-8 py-[6px] rounded-full border border-gray-300 
                                    focus:outline-none focus:ring-2 focus:ring-[#D0AC88]
                                    md:text-sm text-[clamp(12px,1.955vw,15px)]'
                            />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            {titleSearch && (
                                <button
                                    type="button"
                                    onClick={() => setTitleSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                                    aria-label="상품 검색어 지우기"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* [명화, 동양화] 메인 작가 목록*/}
            {(type === 'masterPiece' || type === 'koreanPainting') && !author && (
                <div className="max-w-[1300px] mx-auto px-2 md:mt-5 mt-3 grid xl:grid-cols-5 md:grid-cols-4 sm:grid-cols-3 grid-cols-2 gap-[20px]">
                    {authorCards.map(item => (
                        <div
                            key={item.label}
                            onClick={() => navigate(item.link)}
                            className="flex flex-col items-center border border-gray-300 rounded-xl cursor-pointer overflow-hidden hover:opacity-80 hover:shadow-lg"
                        >
                            <img 
                                src={item.img}
                                alt={item.label}
                                className="w-full aspect-[220/220] object-cover border-b border-gray-200"
                            />
                            <div className="py-2 text-center font-bold text-[15px] text-[#b29476]">
                                {item.label}
                                <span className='text-gray-40 font-normal'>({item.count})</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* [명화, 동양화] 메인 작가 목록 무한스크롤*/}
            {(type === 'masterPiece' || type === 'koreanPainting') && !author && (
                <>
                    <div ref={labelLoadMoreRef} className="h-10" />
                    {labelLoading && <div className="text-center py-4">로딩중...</div>}
                </>
            )}

            {/* [명화, 동양화] 상품 갯수, 검색창 */}
            {author && (
                <div className="px-3">  
                    <div className="flex gap-2 mt-2 text-[15px]">
                        <span className="font-bold">인기순</span>
                        <button
                            onClick={() => {
                                setSelectedLabel('');
                                navigate(`/main_Items?type=${type}`);
                            }}
                        >
                            {(type === "masterPiece" || type === "authorCollection" || type === "koreanPainting") ? "다른작가 보기" : "다른작품 보기"}
                        </button>
                    </div>
                    
                    <div className="flex justify-between items-end mt-1"> 
                        <div 
                            className="
                                text-[15px] text-[#888]
                            "
                        > 
                            상품 <span className="text-[#555555]">{productCountText}</span>개
                        </div>
                        
                        <div className='flex md:justify-end justify-center'>
                            <div className='relative md:w-[240px] w-[clamp(170px,31.29vw,240px)] md:mr-[4px]'>
                                <input 
                                    type="text"
                                    placeholder="상품명을 검색하세요"
                                    value={titleSearch}
                                    onChange={(e) => setTitleSearch(e.target.value)}
                                    className='
                                        w-full pl-10 pr-8 py-[6px] rounded-full border border-gray-300 
                                        focus:outline-none focus:ring-2 focus:ring-[#D0AC88]
                                        md:text-sm text-[clamp(12px,1.955vw,15px)]'
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                {titleSearch && (
                                    <button
                                        type="button"
                                        onClick={() => setTitleSearch('')}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                                        aria-label="상품 검색어 지우기"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* [사진/일러스트, 풍수그림] 메인 목록*/}
            {((type=='masterPiece' && author) || type!='masterPiece') && (
                <>
                    <div className="grid lg:grid-cols-4 md:grid-cols-3 grid-cols-2 md:gap-y-10 md:gap-x-[0.1%] gap-x-[5%] md:mt-5 mt-3 md:px-4 px-3">
                        {displayProducts.map((product) => {
                            const isHoverd = hoveredPid === product.pid;

                            return (
                                <div
                                    key={product.pid}
                                    onClick={() => {
                                        saveListScrollForDetail();
                                        navigate(`/none_custom_detail?pid=${product.pid}&category=${product.category}`);
                                    }}
                                    className="flex flex-col 
                                            lg:px-4 md:px-2 px-[2px]
                                            w-full/4
                                            h-auto md:mb-10 mb-2 cursor-pointer"
                                    onMouseEnter={() => setHoveredPid(product.pid)}
                                    onMouseLeave={() => setHoveredPid(null)}
                                >   
                                    {/* 기본 이미지 */}
                                    <div className="
                                                flex justify-center items-center w-full aspect-[292/292] overflow-hidden 
                                                bg-white">
                                        <div className="w-full h-full">
                                            <img 
                                                className="h-[100%] w-[100%] object-contain"
                                                style={{ boxShadow: '8px 8px 10px rgba(0,0,0,0.2)'}} 
                                                src={isHoverd ? product.hoverImageUrl : product.imageUrl} 
                                                alt={product.title} 
                                            />
                                        </div>
                                    </div>

                                    <span className="
                                        lg:text-[18px] text-[clamp(16px,1.759vw,18px)]
                                        line-clamp-1
                                        font-bold mt-2">
                                        {product.title}
                                    </span>

                                    <span className="
                                        lg:text-[14px] text-[clamp(13.5px,1.368vw,14px)]
                                        line-clamp-1
                                        font-bold text-[#83807d]">
                                        {product.author}
                                    </span>

                                    <span className="mt-[2px] min-h-[1.375rem] inline-block w-full font-semibold text-[#a67a3e]">
                                        {Object.prototype.hasOwnProperty.call(itemPriceMap, product.pid)
                                            ? itemPriceMap[product.pid] != null
                                                ? (
                                                    <SitePriceRow
                                                        unitPrice={itemPriceMap[product.pid]}
                                                        quantity={1}
                                                        suffix="~"
                                                    />
                                                )
                                                : ""
                                            : "\u00a0"}
                                    </span>

                                    <hr className="my-1" />
                                </div>
                            );
                        })}
                    </div>
                    {author && (
                        <>
                            <div ref={authorLoadMoreRef} className="h-10" />
                            {authorLoading && <div className="text-center py-4">로딩중...</div>}
                        </>
                    )}
                    
                    {!author && !["masterPiece", "koreanPainting"].includes(type) && (
                        <>
                            <div ref={homeLoadMoreRef} className="h-10" />
                            {homeLoading && <div className="text-center py-4">로딩중...</div>}
                        </>
                    )}
                </>
            )}
            {/* [사진/일러스트, 풍수그림] 메인 목록*/}
        </div>
    );
};

export default Main_Items;
