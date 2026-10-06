import { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { MemberContext } from "../../../context/MemberContext"; // 경로가 다르면 아래 주석 참고

const WishList = () => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();
    const { member } = useContext(MemberContext);

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const convertCategoryName = (category) => {
        if (!category) return "";

        if (category === "masterPiece") {
                return "명화";
            } else if (category === "fengShui") {
                return "풍수";
            } else if (category === "authorCollection") {
                return "작가";
            } else if (category === "photoIllustration") {
                return "사진/일러스트";
            } else if (category === "koreanPainting")  {
                return "동양화";
            } else if (category === "customFrames") {
                return "맞춤액자";  
            } 
    }

    // ✅ 페이징
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [pageGroupSize, setPageGroupSize] = useState(
    window.innerWidth < 640 ? 5 : 10
    );

    useEffect(() => {
    const handleResize = () => {
        setPageGroupSize(window.innerWidth < 640 ? 5 : 10);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    }, []);

    // items가 바뀌면(불러오기/삭제 후) 1페이지로
    useEffect(() => {
    setCurrentPage(1);
    }, [items.length]);

    const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));
    const currentGroup = Math.floor((currentPage - 1) / pageGroupSize);
    const groupStart = currentGroup * pageGroupSize + 1;
    const groupEnd = Math.min(groupStart + pageGroupSize - 1, totalPages);

    const currentItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
    );

    // 현재 페이지가 총 페이지보다 커지면 보정(삭제로 페이지 줄어들 때)
    useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [totalPages, currentPage]);
    // 페이징

    // 체크된 위시 아이템 id들
    const [checked, setChecked] = useState(new Set());

    const checkedCount = checked.size;

    const fetchWishList = async () => {
        if (!member?.id) {
        setLoading(false);
        setItems([]);
        return;
        }

        try {
        setLoading(true);
        const res = await axios.get(`${API}/wishlist/list?id=${member.id}`, {
            withCredentials: true,
        });

        // 백엔드가 {list:[]} 형태면 맞춰줌
        const list = Array.isArray(res.data) ? res.data : (res.data?.list ?? []);
        setItems(list);
        } catch (e) {
        console.error(e);
        toast.error("관심상품을 불러오지 못했습니다.");
        setItems([]);
        } finally {
        setLoading(false);
        setChecked(new Set()); // 새로 불러오면 체크 초기화
        }
    };

    useEffect(() => {
        fetchWishList();
        // eslint-disable-next-line
    }, [member?.id]);

    const toggleAll = () => {
        if (items.length === 0) return;

        if (checked.size === items.length) {
        setChecked(new Set());
        } else {
        setChecked(new Set(items.map((it) => it.wid ?? it.id ?? it.pid)));
        }
    };

    const toggleOne = (key) => {
        setChecked((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        return next;
        });
    };

    const selectedItems = useMemo(() => {
        const keys = checked;
        return items.filter((it) => keys.has(it.wid ?? it.id ?? it.pid));
    }, [items, checked]);

    // ✅ 관심상품 삭제
    const deleteWish = async (it) => {
        const wid = it.wid ?? it.id; // 위시리스트 PK
        const pid = it.pid;

        if (!window.confirm("관심상품에서 삭제할까요?")) return;

        try {
            await axios.post(
                `${API}/wishlist/delete`,
                [Number(wid)],
                { 
                    withCredentials: true,
                    headers: { "Content-Type": "application/json" },
                }
            );

            toast.success("삭제되었습니다.");
            fetchWishList();
        } catch (e) {
            console.error(e);
            toast.error("삭제 실패");
        }
    };

    // ✅ 선택 장바구니 담기
    const addSelectedToCart = async () => {
        if (!member?.id) {
            toast.warn("로그인이 필요합니다.");
            navigate("/userLogin");
            return;
        }

        if (selectedItems.length === 0) {
            toast.warn("선택된 상품이 없습니다.");
            return;
        }

        try {
            const cartList = selectedItems.map((it) => ({
                id: member.id,
                pid: it.pid,
                title: it.title,
                category: it.category,
                price: Number(it.price || 0),
                thumbnail: it.thumbnail,
                size: it.size || "",
                quantity: 1,
                }));

                await axios.post(`${API}/cart/insert`, cartList, {
                    withCredentials: true,
                    headers: { "Content-Type": "application/json" },
            });

            toast.success("선택한 상품을 장바구니에 담았습니다.");
            navigate("/cart", { replace: true});
        } catch (e) {
            console.error("insert cart error:",e?.response?.status, e?.resposne?.data, e);
            toast.error("장바구니 담기 실패");
        }
    };

    // ✅ 비었을 때 / 로딩
    if (loading) {
        return <div className="text-center py-20 text-gray-500">로딩 중...</div>;
    }

    if (!member?.id) {
        return (
        <div className="text-center py-20 text-gray-600">
            로그인 후 관심상품을 확인할 수 있습니다.
        </div>
        );
    }

    // 선택 삭제 함수
    const deleteSelected = async () => {
        if (!member?.id) return;

        if (selectedItems.length === 0) {
            toast.warn("선택된 상품이 없습니다.");
            return;
        }

        if (!window.confirm(`선택한 ${selectedItems.length}개를 삭제할까요?`)) return;

        // 백엔드가 List<Integer>만 받으니까 wid 리스트만 보냄
        const widList = selectedItems
            .map((it) => it.wid ?? it.id)
            .map((v) => Number(v))
            .filter((v) => Number.isFinite(v));

        if (widList.length === 0) {
            toast.error("삭제할 wid가 없습니다.");
            return;
        }

        try {
            await axios.post(`${API}/wishlist/delete`, widList, {
                withCredentials: true,
                headers: { "Content-Type" : "application/json" },
            });

            toast.success("선택한 상품을 삭제했습니다.");
            fetchWishList();
        } catch (e) {
            console.error(e);
            toast.error("선택 삭제 실패");
        }
    }

    return (
        <div className="flex flex-col w-full max-w-[1100px] mb-20 
            mr-2 ml-2 md:ml-0"
        >
            <div className="flex items-center justify-between">
                <span className="
                    md:text-lg text-[clamp(16px,2.346vw,18px)]
                    font-bold pb-2 md:pb-6"
                >
                        | 관심상품 조회
                </span>
                <button
                    type="button"
                    onClick={() => navigate('/mypage')}
                    className="
                        md:hidden
                        self-start flex items-center gap-1 mb-3
                        text-[13px] text-gray-600 hover:text-gray-900
                    "
                >
                    <span className="text-base leading-none">←</span>
                    마이페이지
                </button>
            </div>

            <div className="
                sm:px-8 px-2 sm:py-10 py-5 
                w-full bg-white
                shadow-md border border-gray-200 space-y-2 mb-20"
            >
                <div className="
                    text-[clamp(14px,2.085vw,16px)] md:text-[16px]
                    flex items-end justify-between text-gray-500"
                >   
                    <span>총 {items.length}개 / 선택 {checkedCount}개</span>
                    <div className="
                        text-[clamp(12px,1.824vw,14px)] md:text-[14px]
                        flex gap-2">
                        <button
                            className="
                                px-2
                                py-1
                                border border-gray-400 rounded-lg hover:bg-gray-100"
                            onClick={toggleAll}
                        >
                            {checkedCount === items.length && items.length > 0 ? "전체해제" : "전체선택"}
                        </button>

                        {/* 
                            <button
                                className="
                                    sm:text-sm text-[10px]
                                    sm:px-3 px-2
                                    sm:py-2 py-1 
                                    bg-black text-white rounded-xl hover:opacity-90"
                                onClick={addSelectedToCart}
                            >
                                선택 장바구니
                            </button> 
                        */}

                        <button
                            className="
                                px-2
                                py-1 
                                border border-red-300 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition"
                            onClick={deleteSelected}
                        >
                            선택삭제
                        </button>
                    </div>
                </div>

                {items.length === 0 ? (
                    <div className="text-center py-24 text-gray-600 space-y-6">
                        <div>
                            <p className="text-lg font-semibold">장바구니가 비었습니다.</p>
                            <p className="text-sm text-gray-500 mt-1">
                                마음에 드는 작품을 담아보세요
                            </p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-3 mt-6">
                            <button
                                onClick={() => navigate("/main_Items?type=masterPiece")}
                                className="px-4 py-2 border rounded-xl hover:bg-gray-100"    
                            >
                                명화
                            </button>

                            <button 
                                onClick={() => navigate("/main_Items?type=koreanPainting")}
                                className="px-4 py-2 border rounded-xl hover:bg-gray-100"    
                            >
                                동양화
                            </button>

                            <button
                                onClick={() => navigate("/main_Items?type=photoIllustration")}
                                className="px-4 py-2 border rounded-xl hover:bg-gray-100"    
                            >
                                사진/일러스트
                            </button>

                            <button
                                onClick={() => navigate("/main_Items?type=fengShui")}
                                className="px-4 py-2 border rounded-xl hover:bg-gray-100"    
                            >
                                풍수그림
                            </button>

                            <button
                                onClick={() => navigate("/customFrames")}
                                className="px-4 py-2 bg-black text-white rounded-xl hover:opacity-90"    
                            >
                                맞춤액자/사진보정
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="max-h-[430px] overflow-y-scroll space-y-2">
                    {currentItems.map((it, idx) => {
                        const key = it.wid ?? it.id ?? it.pid;
                        const isChecked = checked.has(key);

                        return (
                            <div
                                key={key ?? idx}
                                className="
                                    w-full
                                    flex items-stretch
                                    sm:gap-3 gap-2
                                    sm:p-3 p-2
                                    border rounded-xl bg-white hover:bg-gray-100 transition cursor-pointer"
                                onClick={() => toggleOne(key)}
                            >   
                                <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleOne(key)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                    }}
                                    className="
                                        self-center
                                        w-[clamp(14px,2.086vw,16px)] md:w-4 
                                        h-[clamp(14px,2.086vw,16px)] md:h-4 
                                    "
                                />
                                <img
                                    src={it.thumbnail}
                                    alt={it.title}
                                    className="
                                        w-[clamp(60px,11.4731vw,88px)] md:w-[clamp(88px,9.3841636vw,96px)] lg:w-24 
                                        h-[clamp(60px,11.4731vw,88px)] md:h-[clamp(88px,9.3841636vw,96px)] lg:h-24
                                        object-cover rounded-lg border bg-white cursor-pointer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        navigate(`/none_custom_detail?pid=${it.pid}&category=${it.category}`);
                                    }}
                                />
                                
                                <div className="flex-1 min-w-0 h-full">
                                    <div className="h-full flex items-center justify-between md:gap-2">
                                        <div className="h-full flex flex-col justify-between min-w-0">
                                            {/* 제목 */}
                                            <p className="
                                                text-[clamp(14px,1.9544vw,15px)] md:text-[clamp(15px,1.564vw,16px)] lg:text-[16px]
                                                font-semibold 
                                                text-gray-800 truncate">{it.title}</p>
                                            {/* 내용 */}
                                            <div>
                                                <p className="
                                                    text-[13px] md:text-[clamp(13px,1.368vw,14px)] lg:text-[14px]
                                                    text-gray-500">
                                                    {convertCategoryName(it.category || "")}
                                                </p>
                                                <p className="
                                                    text-[13px] md:text-[clamp(13px,1.368vw,14px)] lg:text-[14px]
                                                    mt-[-4px] text-gray-500">
                                                    {it.author ? ` ${it.author}` : ""}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            className="
                                                shrink-0
                                                text-[12.5px]
                                                px-2 py-1 border border-red-300 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                deleteWish(it)
                                            }}
                                        >
                                        삭제
                                        </button>
                                    </div>

                                    <div className="mt-2 flex items-end justify-between">
                                        <div className="text-sm text-gray-600">
                                        {it.size ? `사이즈: ${it.size}` : ""}
                                        </div>
                                        {/* <div className="font-bold text-gray-800">
                                        {Number(it.price || 0).toLocaleString()}원
                                        </div> */}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    </div>
                )}
                {/* 페이징 (InquiryList와 동일 패턴) */}
                <div className="flex justify-center gap-2 mt-4 md:mt-8 text-sm">
                    {(() => {
                        const maxVisible = 5;
                        let startPage = Math.max(currentPage - 2, 1);
                        let endPage = Math.min(startPage + maxVisible - 1, totalPages);

                        if (endPage - startPage < maxVisible - 1) {
                            startPage = Math.max(endPage - maxVisible + 1, 1);
                        }

                        const pageNumbers = Array.from(
                            { length: endPage - startPage + 1 },
                            (_, i) => startPage + i
                        );

                        return (
                            <div className="flex justify-center gap-1 text-sm font-medium">  
                                {/* 맨 처음 */}
                                <button
                                    onClick={() => setCurrentPage(1)}
                                    disabled={currentPage === 1}
                                    className={`w-8 h-8 border rounded-full flex items-center justify-center 
                                        ${currentPage === 1 
                                            ? 'text-gray-300 border-gray-200' 
                                            : 'text-gray-700 hover:bg-gray-100 border-gray-300'}`}>
                                    {'<<'}
                                </button>
                                {/* 이전 */}
                                <button
                                    onClick={() => setCurrentPage(prev => prev -1)}
                                    disabled={currentPage === 1}
                                    className={`w-8 h-8 border rounded-full flex items-center justify-center 
                                        ${currentPage === 1 
                                            ? 'text-gray-300 border-gray-200' 
                                            : 'text-gray-700 hover:bg-gray-100 border-gray-300'}`}>
                                    {'<'}
                                </button>

                                {/* 숫자 */}
                                {pageNumbers.map((pageNum) => (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 rounded-full border flex items-center justify-center
                                            ${currentPage === pageNum 
                                                ? 'bg-black text-white border-black' 
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}>
                                        <span>{pageNum}</span>
                                    </button>
                                ))}

                                {/* 다음 */}
                                <button
                                    onClick={() => setCurrentPage(prev => prev + 1)}
                                    disabled={currentPage >= totalPages}
                                    className={`w-8 h-8 border rounded-full flex items-center justify-center 
                                        ${currentPage === totalPages 
                                            ? 'text-gray-300 border-gray-200' 
                                            : 'text-gray-700 hover:bg-gray-100 border-gray-300'}`}>
                                    {'>'}
                                </button>
                                {/* 마지막 */}
                                <button
                                    onClick={() => setCurrentPage(totalPages)}
                                    disabled={currentPage === totalPages}
                                    className={`w-8 h-8 border rounded-full flex items-center justify-center 
                                        ${currentPage === totalPages 
                                            ? 'text-gray-300 border-gray-200' 
                                            : 'text-gray-700 hover:bg-gray-100 border-gray-300'}`}>
                                    {'>>'}
                                </button>
                            </div>
                        )
                    })()}
                </div>
            </div>
        </div>
    );
};

export default WishList;
