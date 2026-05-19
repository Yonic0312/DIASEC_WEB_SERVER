import { useEffect, useMemo, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { MemberContext } from "../../../context/MemberContext";
import { getDiscountedUnitPrice } from "../../../utils/siteDiscount";
import {
    SitePriceRow,
    SitePriceTotal,
    SITE_PRICE_TEXT,
} from "../../common/SitePriceDisplay";

const Cart = () => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();
    const { member } = useContext(MemberContext);

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    const categoryMap = {
        masterPiece: '명화',
        koreanPainting: '동양화',
        photoIllustration: '사진/일러스트',
        fengShui: '풍수',
        authorCollection: '작가',
        customFrames: '맞춤액자'
    };

    // 체크박스(선택주문용으로만 사용: 백엔드 선택삭제 API 없음)
    const [checked, setChecked] = useState(new Set());

    const getKey = (it) => it.cid; // CartController delete?cid, update CartVo -> cid가 PK

    const fetchCart = async () => {
        if (!member?.id) {
            setItems([]);
            setChecked(new Set());
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const res = await axios.get(`${API}/cart/list?id=${member.id}`, {
                withCredentials: true,
        });

        const list = Array.isArray(res.data) ? res.data : (res.data?.list ?? []);
            setItems(list);
            setChecked(new Set());
        } catch (e) {
            console.error(e);
            toast.error("장바구니를 불러오지 못했습니다.");
            setItems([]);
            setChecked(new Set());
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCart();
        // eslint-disable-next-line
    }, [member?.id]);

    const toggleAll = () => {
        if (items.length === 0) return;

        if (checked.size === items.length) {
            setChecked(new Set());
        } else {
            setChecked(new Set(items.map((it) => getKey(it))));
        }
    };

    const toggleOne = (cid) => {
        setChecked((prev) => {
        const next = new Set(prev);
        if (next.has(cid)) next.delete(cid);
        else next.add(cid);
        return next;
        });
    };

    const selectedItems = useMemo(() => {
        return items.filter((it) => checked.has(getKey(it)));
    }, [items, checked]);

    // ✅ 수량 변경: PUT /api/cart/update  (CartVo: cid, quantity)
    const updateQty = async (it, nextQty) => {
        const cid = getKey(it);
        const qty = Number(nextQty);

        if (!Number.isFinite(qty) || qty < 1) return;

        // UI 먼저 반영
        setItems((prev) => prev.map((x) => (getKey(x) === cid ? { ...x, quantity: qty } : x)));

        try {
        await axios.put(
            `${API}/cart/update`,
            { cid, quantity: qty },
            { withCredentials: true }
        );
        } catch (e) {
            console.error(e);
            toast.error("수량 변경 실패");
            fetchCart(); // 롤백
        }
    };

    // ✅ 단일 삭제: DELETE /api/cart/delete?cid=
    const deleteOne = async (it) => {
        const cid = getKey(it);

        if (!window.confirm("해당 상품을 장바구니에서 삭제할까요?")) return;

        try {
        await axios.delete(`${API}/cart/delete?cid=${cid}`, {
            withCredentials: true,
        });
            toast.success("삭제 완료");
            fetchCart();
        } catch (e) {
            console.error(e);
            toast.error("삭제 실패");
        }
    };

    // ✅ 선택 삭제(백엔드에 API 없으니 반복 DELETE로 처리)
    const deleteSelected = async () => {
        if (selectedItems.length === 0) {
            toast.warn("선택된 상품이 없습니다.");
        return;
        }

        if (!window.confirm(`선택한 ${selectedItems.length}개를 삭제할까요?`)) return;

        try {
        // 순차 삭제 (서버 부담 줄이고 에러 추적 쉬움)
        for (const it of selectedItems) {
            const cid = getKey(it);
            await axios.delete(`${API}/cart/delete?cid=${cid}`, { withCredentials: true });
        }
            toast.success("선택 삭제 완료");
            fetchCart();
        } catch (e) {
            console.error(e);
            toast.error("선택 삭제 실패");
            fetchCart();
        }
    };

    const convertInchToCm = (size) => {
        if (!size || typeof size !== "string") return size;

        const match = size.match(/([\d.]+)\s*[xX]\s*([\d.]+)/);
        if (!match) return size;

        const wInch = parseFloat(match[1]);
        const hInch = parseFloat(match[2]);

        if (isNaN(wInch) || isNaN(hInch)) return size;

        const wCm = Math.round(wInch * 2.54);
        const hCm = Math.round(hInch * 2.54);

        return `${wCm} x ${hCm} cm (${wInch.toFixed(1)} x ${hInch.toFixed(1)})`;
    };

    // ✅ 선택 주문: OrderForm으로 state 넘김 (너 프로젝트 방식)
    const orderSelected = () => {
        if (!member?.id) {
            toast.warn("로그인이 필요합니다.");
            navigate("/userLogin");
        return;
        }

        if (selectedItems.length === 0) {
            toast.warn("선택된 상품이 없습니다.");
        return;
        }

        const orderData = selectedItems.map((it) => ({
            id: member.id,
            pid: it.pid,
            title: it.title,
            price: it.price,
            thumbnail: it.thumbnail,
            size: it.size,
            quantity: it.quantity ?? 1,
            category: it.category,
            cid: it.cid, // 필요하면 같이 넘겨
            finishType: it.finishType,
        }));

        navigate("/orderForm", { state: { orderItems: orderData } });
    };

    const originalCartTotal = useMemo(() => {
        return items.reduce(
            (sum, it) => sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
            0
        );
    }, [items]);

    const totalPrice = useMemo(() => {
        return items.reduce((sum, it) => {
            const unit = getDiscountedUnitPrice(it.price);
            return sum + unit * (Number(it.quantity) || 1);
        }, 0);
    }, [items]);

    if (loading) return <div className="text-center py-20 text-gray-500">로딩 중...</div>;

    if (!member?.id) {
        return <div className="text-center py-20 text-gray-600">로그인 후 장바구니를 확인할 수 있습니다.</div>;
    }

    return (
        <div className="
            w-full bg-white 
            px-2 sm:px-8 py-4 sm:py-8
            shadow-md border-y md:border border-gray-200 mt-10 mb-20">
            <h2 className="
                text-[clamp(18px,3.1288vw,20px)] sm:text-[clamp(20px,3.128vw,24px)] md:text-2xl
                font-bold"
            >
                장바구니
            </h2>

            <div className="flex items-end justify-between">
                <div className="
                    text-[clamp(14px,2.085vw,16px)] md:text-[16px]
                    text-gray-500">
                    총 {items.length}개 / {checked.size}개 선택
                </div>

                <div className="
                    text-[clamp(12px,1.824vw,14px)] md:text-[14px]
                    flex 
                    md:gap-2 gap-1"
                >
                    <button
                        className="
                            px-2 py-1  border border-gray-400 rounded-lg hover:bg-gray-100"
                        onClick={toggleAll}
                    >
                        {checked.size === items.length && items.length > 0 ? "전체해제" : "전체선택"}
                    </button>

                    <button
                        className="
                            px-2 py-1 bg-black text-white rounded-lg hover:opacity-90"
                        onClick={orderSelected}
                    >
                        선택주문
                    </button>

                    <button
                        className="
                            px-2 py-1 border border-red-300 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition"
                        onClick={deleteSelected}
                    >
                        선택삭제
                    </button>
                </div>
            </div>
            
            {/* 장바구니 비었을 때 여기도 수정해야 함 */}
            {items.length === 0 ? (
                <div className="text-center py-24 text-gray-600 space-y-6">
                    <div>
                        <p className="text-lg font-semibold">장바구니가 비었습니다.</p>
                        <p className="text-sm text-gray-500 mt-1">
                            마음에 드는 작품을 담아보세요
                        </p>
                    </div>

                    <div className="
                        text-[clamp(12px,2.085vw,16px)] md:text-base
                        flex flex-wrap justify-center gap-3 mt-6">
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
                <>
                    <div className="max-h-[540px] overflow-y-scroll space-y-3 mt-2">
                        {items.map((it) => {
                            const cid = getKey(it);
                            const isChecked = checked.has(cid);

                            return (
                                <div className="flex flex-col">
                                    <div
                                        key={cid}
                                        className="flex items-center gap-[10px] border rounded-xl p-3 bg-white hover:bg-gray-100 transition"
                                        onClick={() => {toggleOne(cid);}}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleOne(cid)}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                            }}
                                            className="
                                                w-[clamp(14px,2.086vw,16px)] md:w-4 
                                                h-[clamp(14px,2.086vw,16px)] md:h-4 
                                            "
                                        />

                                        <img
                                            src={it.thumbnail}
                                            alt={it.title}
                                            className="
                                                w-[clamp(76px,11.4731vw,88px)] md:w-[clamp(88px,9.3841636vw,96px)] lg:w-24 
                                                h-[clamp(76px,11.4731vw,88px)] md:h-[clamp(88px,9.3841636vw,96px)] lg:h-24
                                                object-cover rounded-lg border bg-white cursor-pointer"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/none_custom_detail?pid=${it.pid}&category=${it.category}`)
                                            }}
                                        />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                {/* 여기 */}
                                                <div className="w-full">
                                                    <div className="w-full flex items-start justify-between">
                                                        <div>
                                                            <p className="
                                                                text-[clamp(14px,1.9544vw,15px)] md:text-[clamp(15px,1.564vw,16px)] lg:text-[16px]
                                                                font-semibold text-gray-800 truncate">
                                                                {it.title}
                                                            </p>
                                                            <p className="
                                                                text-[clamp(12px,1.694vw,13px)] md:text-[clamp(13px,1.368vw,14px)] lg:text-[14px]
                                                                text-gray-500">
                                                                {categoryMap[it.category]} ({it.finishType === 'matte' ? '무광' : '유광'})
                                                            </p>
                                                        </div>
                                                        <button
                                                            className="shrink-0 px-2 py-1 text-[12.5px] border border-red-300 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteOne(it);
                                                            }}
                                                            >
                                                            삭제
                                                        </button>
                                                    </div>
                                                    <p className="
                                                        text-[clamp(12px,1.694vw,13px)] md:text-[clamp(13px,1.368vw,14px)] lg:text-[14px]
                                                        text-gray-500">
                                                        {it.size ? `사이즈: ${convertInchToCm(it.size)}` : ""}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between">
                                                {/* 여기 */}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        className="
                                                            w-[clamp(28px,4.172vw,32px)] md:w-8 
                                                            h-[clamp(28px,4.172vw,32px)] md:h-8 
                                                            border rounded-lg bg-white hover:bg-gray-100"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateQty(it, (Number(it.quantity) || 1) - 1);  
                                                        }}
                                                    >
                                                        -
                                                    </button>
                                                    <span className="
                                                        text-[13px] md:text-[14px]
                                                        w-fit px-[2px] min-w-6 text-center font-semibold ">
                                                        {Number(it.quantity) || 1}
                                                    </span>
                                                    <button
                                                        className="
                                                            w-[clamp(28px,4.172vw,32px)] md:w-8 
                                                            h-[clamp(28px,4.172vw,32px)] md:h-8 
                                                            border rounded-lg bg-white hover:bg-gray-100"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateQty(it, (Number(it.quantity) || 1) + 1);
                                                        }}
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                <div className="text-gray-700 font-semibold">
                                                    <SitePriceRow
                                                        unitPrice={it.price}
                                                        quantity={Number(it.quantity) || 1}
                                                        neutralClassName={`${SITE_PRICE_TEXT} text-gray-700 font-semibold`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-end mt-2 pt-4 border-t">
                        <div className="text-right">
                            <div className="text-sm text-gray-500">총 결제금액</div>
                            <div className={`${SITE_PRICE_TEXT} font-bold`}>
                                <SitePriceTotal
                                    original={originalCartTotal}
                                    discounted={totalPrice}
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Cart;
