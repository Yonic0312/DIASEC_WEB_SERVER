import { useEffect, useState, useContext, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MemberContext } from '../../context/MemberContext';
import ProductDetailTabs from '../ProductDetailTabs/ProductDetailTabs';
import { toast } from 'react-toastify';
import { usePartner } from '../../context/PartnerContext';
import { getDiscountedUnitPrice } from '../../utils/siteDiscount';
import {
    SitePriceRow,
    SitePriceTotal,
    SITE_PRICE_TEXT,
} from '../common/SitePriceDisplay';
import bg from '../../assets/CustomFrames/p.png';
import bg2 from '../../assets/CustomFrames/p2.png'; // 현재 배경

const None_Custom_Detail = () => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();
    const location = useLocation();
    const {member, setMember} = useContext(MemberContext);
    const queryParams = new URLSearchParams(location.search);
    const [frameType, setFrameType] = useState('wall'); // 액자 타입
    const [selectedSize, setSelectedSize] = useState('');
    const category = queryParams.get("category");
    const pid = queryParams.get("pid");
    const [showGuestChoice, setShowGuestChoice] = useState(false); // 구매시 비회원 구매 상태
    const [product, setProduct] = useState(null);
    const { partnerDiscount } = usePartner();

    // 모바일 구매버튼 바텀에 스티키
    const buyButtonSectionRef = useRef(null);
    const [showBottomBuy, setShowBottomBuy] = useState(false);

    // 헤더 높이만큼 빼고 판단
    const HEADER_OFFSET_PX = 45;

    useEffect(() => {
        const el = buyButtonSectionRef.current;

        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                // 헤더 아래(45px) 기준 뷰포트에 안 보이기 시작하면 true
                const coveredByHeader = entry.boundingClientRect.top <= HEADER_OFFSET_PX;
                setShowBottomBuy(!entry.isIntersecting && coveredByHeader);
            },
            {
                threshold: 0,
                rootMargin: `-${HEADER_OFFSET_PX}px 0px 0px 0px`,
            }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [product]);

    useEffect(() => {
    }, [showBottomBuy]);
    // 모바일 구매버튼 바텀에 스티키//

    const categoryMap = {
        masterPiece : "명화",
        koreanPainting : "동양화",
        photoIllustration: "사진/일러스트",
        fengShui : "풍수",
        authorCollection: "작가 컬렉션",
    };

    // 주문 항목 구현
    const [selectedItems, setSelectedItems] = useState([]);

    // 상품 상단 이미지 가져오기
    const [topImages, setTopImages] = useState([]);
    const [mainImage, setMainImage] = useState(null);

    // 상품 커스터마이징 상태 (명화 이미지를 여기에 넣어서 활용)
    const [customItems, setCustomItems] = useState([]);
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [imageSrc, setImageSrc] = useState(null);
    const [maxWidth, setMaxWidth] = useState(200.7); // 초기값: 가로 최대
    const [maxHeight, setMaxHeight] = useState(101.6); // 초기값: 세로 최대

    // const disableDelete = customItems.length <= 1;
    const MAX_CUSTOM_ORDER_ITEMS = 30;
    const canDeleteItem = customItems.length > 1;
    const isCustomOrderFull = customItems.length >= MAX_CUSTOM_ORDER_ITEMS;

    // 사이즈
    const [width, setWidth] = useState(35.6);
    const [height, setHeight] = useState(27.9);

    const MIN_WIDTH = 30;

    const [aspectRatio, setAspectRatio] = useState(null);
    const [toastCooldown, setToastCooldown] = useState(false);

    // 중간 가져오기
    const getMidWidth = (minW, maxW, maxH, ratio) => {
        const actualMaxW = Math.min(maxW, maxH * ratio);

        const midW = (minW + actualMaxW) / 2;

        return parseFloat(midW.toFixed(1));
    };

    const nextIdRef = useRef(1);

    const findSelected = () => customItems.find(it => it.id === selectedItemId);

    const syncInputFromSelected = (item) => {
        if (!item) return;

        setAspectRatio(item.aspectRatio);
        setMaxWidth(item.maxWidth);
        setMaxHeight(item.maxHeight);

        setWidth(item.width);
        setHeight(item.height);
        setWidthInput(String(Math.floor(item.width)));
        setHeightInput(String(Math.floor(item.height)));
    };

    // 추가 버튼 클릭
    const handleAddOption = () => {
        if (!mainImage || !aspectRatio) {
            toast.error("이미지 로딩 후 이용해주세요.");
            return;
        }
        if (customItems.length >= MAX_CUSTOM_ORDER_ITEMS) {
            toast.warn(`한 번에 최대 ${MAX_CUSTOM_ORDER_ITEMS}개까지 등록할 수 있습니다.`);
            return;
        }

        // 현재 입력값 기준으로 새 옵션 생성
        const newArea = Math.floor(width * height);
        const newPrice = calculateCumulativePrice(newArea);

        const newId = `opt-${nextIdRef.current++}`;

        const newItem = {
            id: newId,
            imageSrc: mainImage,
            aspectRatio,
            width,
            height,
            maxWidth,
            maxHeight,
            price: newPrice,
            finishType: (findSelected()?.finishType) ?? 'glossy',
            quantity: 1,
        };

        setCustomItems(prev => [...prev, newItem]);
        setSelectedItemId(newId);
    }

    // 선택된 항목 바뀌면 입력값/프리뷰도 그 항목 기준으로 바꾸기
    useEffect(() => {
        if (!selectedItemId) return;
        const item = findSelected();
        if (!item) return;
        syncInputFromSelected(item);
    }, [selectedItemId, customItems.length]);

    const showToastOnce = (message) => {
        if (!toastCooldown) {
            toast.error(message);
            setToastCooldown(true);
            setTimeout(() => setToastCooldown(false), 1000);
        }
    };

    // 입력 완료 후 반영
    const [widthInput, setWidthInput] = useState(String(Math.floor(width)));
    const [heightInput, setHeightInput] = useState(String(Math.floor(height)));
    const sizeHintConsumedRef = useRef(false);
    const [showSizeAdjustHint, setShowSizeAdjustHint] = useState(false);

    const activateSizeAdjustHint = () => {
        if (sizeHintConsumedRef.current) return;
        sizeHintConsumedRef.current = true;
        setShowSizeAdjustHint(true);
    };

    const dismissSizeAdjustHint = () => {
        setShowSizeAdjustHint(false);
    };

    useEffect(() => {
        setWidthInput(String(Math.floor(width)));
    }, [width]);

    useEffect(() => {
        setHeightInput(String(Math.floor(height)));
    }, [width]);

    const handleWidthChange = (e) => {
        let value = parseFloat(e.target.value);

        if (isNaN(value)) return;

        if (value < MIN_WIDTH) {
            showToastOnce(`최소 넓이는 ${Math.floor(MIN_WIDTH)}cm입니다.`);
            value = MIN_WIDTH;
        } else if (value > actualMaxWidth) {
            showToastOnce(`최대 넓이는 ${Math.floor(actualMaxWidth)}cm입니다.`);
            value = actualMaxWidth;
        }

        value = parseFloat(value.toFixed(1));

        if (aspectRatio) {
            let newHeight = parseFloat((value / aspectRatio).toFixed(1));

            if (newHeight > maxHeight) {
                showToastOnce(`이미지 비율로 계산된 높이가 최대 높이 ${maxHeight}cm를 초과하여 자동 조정됩니다.`);
                newHeight = maxHeight;
                value = parseFloat((newHeight * aspectRatio).toFixed(1));
            }
            
            setWidth(Math.floor(value));
            setHeight(Math.floor(newHeight));
        } else {
            setWidth(Math.floor(value));
        }

        setWidthInput(String(Math.floor(value)));
    }

    const handleHeightChange = (e) => {
        let value = parseFloat(e.target.value);

        if (isNaN(value)) return;

        const minHeight = getActualMinHeight();

        if (value < minHeight) {
            showToastOnce(`최소 높이는 ${Math.floor(minHeight)}cm입니다.`);
            value = minHeight;
        } else if (value > actualMaxHeight) {
            showToastOnce(`최대 높이는 ${Math.floor(actualMaxHeight)}cm입니다.`);
            value = actualMaxHeight;
        }

        value = parseFloat(value.toFixed(1));

        if (aspectRatio) {
            let newWidth = parseFloat((value * aspectRatio).toFixed(1));

            if (newWidth > maxWidth) {
                showToastOnce(`이미지 비율로 계산된 가로가 최대 너비 ${maxWidth}cm를 초과하여 자동 조정됩니다.`);
                newWidth = maxWidth;
                value = parseFloat((newWidth / aspectRatio).toFixed(1));
            }

            setWidth(Math.floor(newWidth));
            setHeight(Math.floor(value));
        } else {
            setHeight(Math.floor(value));
        }

        setHeightInput(String(Math.floor(value)));
    }

    const toInchSize = (wCm, hCm) => {
        const wInch = (wCm / 2.54).toFixed(1);
        const hInch = (hCm / 2.54).toFixed(1);
        return `${wInch} X ${hInch}`;
    }

    // cm to px 변환 비율
    const CM_TO_PX = 2.74;
    const previewWidth = width * CM_TO_PX;
    const previewHeight = height * CM_TO_PX;

    const priceTiers = [
        { maxArea: 993.4, unitPrice: 38.3 },
        { maxArea: 1327.9, unitPrice: 37.2 },
        { maxArea: 2064.5, unitPrice: 33.6 },
        { maxArea: 2477.4, unitPrice: 32.0 },
        { maxArea: 3096.7, unitPrice: 30.2 },
        { maxArea: 4967.2, unitPrice: 33.1 },
        { maxArea: 6451.6, unitPrice: 25.9 },
        { maxArea: 7741.9, unitPrice: 27.0 },
        { maxArea: 8535.4, unitPrice: 22.1 },
        { maxArea: 12133.0, unitPrice: 24.1 },
        { maxArea: 18393.3, unitPrice: 28.4 },
        { maxArea: 20503.4, unitPrice: 24.5 },
        { maxArea: Infinity, unitPrice: 27.4 }, // 최종 fallback

        // { maxArea: 993.4, unitPrice: 45.3 },
        // { maxArea: 1327.9, unitPrice: 39.2 },
        // { maxArea: 2064.5, unitPrice: 33.6 },
        // { maxArea: 2477.4, unitPrice: 32.9 },
        // { maxArea: 3096.7, unitPrice: 32.2 },
        // { maxArea: 4967.2, unitPrice: 29.1 },
        // { maxArea: 6451.6, unitPrice: 28.9 },
        // { maxArea: 7741.9, unitPrice: 28.7 },
        // { maxArea: 8535.4, unitPrice: 28.1 },
        // { maxArea: 12133.0, unitPrice: 27.1 },
        // { maxArea: 18393.3, unitPrice: 26.4 },
        // { maxArea: 20503.4, unitPrice: 24.5 },
        // { maxArea: Infinity, unitPrice: 25.4 },
    ];

    // 기준 배경 px (디자인 사이즈)
    const BASE_BG_W = 958;
    const BASE_BG_H = 766;

    // 오버레이 비율 계산 (기준 대비)
    const overlayWidthPct = (previewWidth / BASE_BG_W) * 100;
    const overlayHeightPct = (previewHeight / BASE_BG_H) * 100;

    const setItemQuantity = (itemId, quantity) => {
        const parsed = Math.floor(Number(quantity));
        const qty = Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
        setCustomItems(prev => 
            prev.map(it => 
                it.id === itemId ? { ...it, quantity: qty } : it
            )
        );
    };

    const updateItemQuantity = (itemId, delta) => {
        setCustomItems(prev =>
            prev.map(it =>
                it.id === itemId
                    ? { ...it, quantity: Math.max(1, (it.quantity ?? 1) + delta) }
                    : it
            )
        );
    };

    // A3 ~ A0 오버레이
    const PAPER_SIZES_CM = {
        A3: { w: 29.7, h: 42.0 },
        A2: { w: 42.0, h: 59.4 },
        A1: { w: 59.4, h: 84.1 },
        A0: { w: 84.0, h: 119.0 },
    }

    const [paperKey, setPaperKey] = useState(null);
    const [paperRotate, setPaperRotate] = useState(false);

    const paper = paperKey ? PAPER_SIZES_CM[paperKey] : null;

    const paperWcm = paper
        ? (paperRotate ? paper.h : paper.w)
        : 0;

    const paperHcm = paper
        ? (paperRotate ? paper.w : paper.h)
        : 0;

    const paperWpx = paperWcm * CM_TO_PX;
    const paperHpx = paperHcm * CM_TO_PX;

    const paperWidthPct = (paperWpx / BASE_BG_W) * 100;
    const paperHeightPct = (paperHpx / BASE_BG_H) * 100;
    // A3 ~ A0 오버레이 //

    // 계산
    const calculateCumulativePrice = (area) => {
        let remainingArea = area;
        let lastMax = 0;
        let totalPrice = 0;

        for (let i =0; i < priceTiers.length; i++) {
            const tier = priceTiers[i];
            const tierArea = Math.min(tier.maxArea - lastMax, remainingArea);

            if (tierArea <= 0) break;

            totalPrice += tierArea * tier.unitPrice;
            remainingArea -= tierArea;
            lastMax = tier.maxArea;
        }
        return Math.floor(Math.round(totalPrice) / 1000) * 1000;
    }

    // 사이즈 조정바 최대 width 계산
    const getActualMaxWidth = () => {
        if (!aspectRatio) return maxWidth;

        // 높이 제한에 걸리는지 확인
        const widthByHeight = maxHeight * aspectRatio;

        // 둘 중 작은 값이 실제 최대값
        return Math.min(maxWidth, widthByHeight);
    };

    const getActualMinHeight = () => {
        if (!aspectRatio) return MIN_WIDTH;
        return MIN_WIDTH / aspectRatio;
    };

    const getActualMaxHeight = () => {
        if (!aspectRatio) return maxHeight;
        const heightByWidth = maxWidth / aspectRatio;
        return Math.min(maxHeight, heightByWidth);
    };

    const actualMaxWidth = getActualMaxWidth();
    const actualMaxHeight = getActualMaxHeight();

    // 최종 비용 계산(배송비)
    const SHIPPING_FEE = 3000; // 기본 배송비
    const FREE_SHIPPING_THRESHOLD = 50000; // - 이상 무료
    
    // 가격 계산 로직 추가
    const totalPriceWithoutShipping = customItems.reduce((acc, item) => {
        const area = item.width * item.height;
        const qty = item.quantity ?? 1;
        return acc + calculateCumulativePrice(area) * qty;
    }, 0);

    const totalPrice = totalPriceWithoutShipping >= FREE_SHIPPING_THRESHOLD
        ? totalPriceWithoutShipping
        : totalPriceWithoutShipping + SHIPPING_FEE;

    const totalPriceWithoutShippingDiscounted = customItems.reduce(
        (acc, item) => {
            const qty = item.quantity ?? 1;
            return acc + getDiscountedUnitPrice(item.price, partnerDiscount) * qty;
        },
        0
    );

    useEffect(() => {
        if (pid) {
            axios.get(`${API}/product/detail?pid=${pid}`)
                .then(res => setProduct(res.data))
                .catch(err => console.error("상품 상세 조회 실패", err));

            axios.get(`${API}/product/top-images?pid=${pid}`)
                .then(res => {
                    setTopImages(res.data);

                    if (res.data.length === 0) return;

                    const url = res.data[0];
                    setMainImage(url);
                        
                    const img = new Image();
                        img.src = url;

                        img.onload = () => {
                            const ratio = img.width / img.height;
                            setAspectRatio(ratio);

                            const maxW = ratio >= 1 ? 200.7 : 101.6;
                            const maxH = ratio >= 1 ? 101.6 : 200.7;

                            setMaxWidth(maxW);
                            setMaxHeight(maxH);

                            let startW = getMidWidth(MIN_WIDTH, maxW, maxH, ratio);
                            let startH = parseFloat((startW / ratio).toFixed(1));

                            if (startH > maxH) {
                                startH = maxH;
                                startW = parseFloat((startH * ratio).toFixed(1));
                            }

                            setWidth(startW);
                            setHeight(startH);
                            setWidthInput(String(Math.floor(startW)));
                            setHeightInput(String(Math.floor(startH)));

                            const area = startW * startH;
                            const price = calculateCumulativePrice(area);

                            setCustomItems([{
                            id: "main-painting",
                            imageSrc: url,
                            aspectRatio: ratio,
                            width: startW,
                            height: startH,
                            maxWidth: maxW,
                            maxHeight: maxH,
                            price,
                            finishType: 'glossy',
                            quantity: 1,
                        }]);

                        setSelectedItemId("main-painting");

                        activateSizeAdjustHint();

                        setTimeout(() => syncInputFromSelected({
                            id: "main-painting",
                            imageSrc: url,
                            aspectRatio: ratio,
                            width: startW,
                            height: startH,
                            maxWidth: maxW,
                            maxHeight: maxH,
                            price
                        }), 0);
                    };
                })
                .catch(err => console.error("이미지 목록 조회 실패", err));
                
        }
    }, [pid]);

    // 실시간으로 항목들의 사이즈 변경
    useEffect(() => {
        if (!selectedItemId) return;

        const current = customItems.find(it => it.id === selectedItemId);
        if (!current) return;

        const newArea = width * height;
        const newPrice = calculateCumulativePrice(newArea);

        setCustomItems(prev => 
            prev.map(item => 
                item.id === selectedItemId
                ? { ...item, width, height, price: newPrice}
                : item
            )
        );
    }, [width, height, selectedItemId]);

    if (!product) return <div className="p-10">상품 정보를 불러오는 중입니다...</div>;

    const productInfo = [
        { label: "작가", value: `${product.author}` },
        { label: "배송방법", value: "택배" },
        { label: "배송비", value: "3,000원 (50,000원 이상 구매 시 무료)" },
    ];

    const sizePriceMap = {
        wall: {
            "11 X 14": 45000,
            "12 X 17": 52000,
            "16 X 16": 60000,
            "16 X 20": 68000,
            "16 X 24": 72000,
            "20 X 20": 76000,
            "20 X 24": 90000,
            "24 X 24": 110000,
            "20 X 30": 130000,
            "24 X 32": 160000,
            "24 X 40": 185000,
            "30 X 40": 210000,
            "28 X 47": 240000,
            "40 X 40": 280000,
            "40 X 47": 320000,
            "40 X 71": 450000,
            "40 X 79": 520000
        },
        table: {
            "5 X 7": 25000,
            "7 X 7": 30000,
            "6 X 8": 30000,
            "7 X 8": 32000,
            "7 X 10": 34000,
            "8 X 10": 35000,
        },
        clock: {
            "14 X 14" : 50000
        }
    };

    // 액자 타입 선택 시 실행
    const handleFrameTypeClick = (type) => {
        setFrameType(type);
        setSelectedSize("");
    };

    const handleSizeSelect = (e) => {
        const size = e.target.value;

        if(!frameType) {
            toast.error('액자 타입을 선택해 주세요.');
            return;
        }

        setSelectedSize(size);
        const price = sizePriceMap[frameType][size];

        if (selectedItems.find(item => item.size === size && item.frameType === frameType)) {
            toast.error("이미 선택된 사이즈입니다.");
            return;
        }

        setSelectedItems(prev => [...prev, { size, frameType, quantity: 1, price }]);
    };

    const updateQuantity = (size, delta) => {
        setSelectedItems(prev => 
            prev.map(item =>
                item.size === size
                    ? { ...item, quantity: Math.max(1, item.quantity + delta) }
                    : item
            )
        );
    };

    const removeItem = (size) => {
        setSelectedItems(prev => prev.filter(item => item.size !== size));
    };

    // const totalPrice = selectedItems.reduce((sum, item) => sum + item.quantity * item.price, 0);


    // 위시리스트
    const handleAddToWishlist = () => {
        if (!member || !member.id) {
            toast.warn("로그인 후 이용해주세요.");
            return;
        }

        axios.post(`${API}/wishlist/add-if-not-exists`, {
            id : member.id,
            pid: parseInt(pid),
            category : category,
        })
        .then(() => {
            if (window.confirm('관심상품에 추가되었습니다. 목록을 보러 가시겠습니까?')) {
                navigate('/wishList');
            }
        })
        .catch(err=> {
            if (err.response?.status === 409) {
                if (window.confirm("이미 관심상품에 등록된 상품입니다. 관심상품 페이지로 이동하시겠습니까?")) {
                    navigate('/wishList');
                    return;
                }
                toast.info("이미 관심상품에 등록된 상품입니다.");
                return;
            }
            console.error("추가 실패", err);
            toast.error("관심상품 추가에 실패했습니다.");
        });
    };

    // 장바구니 담기
    const handleAddToCart = async () => {
        if (!member?.id) {
            toast.warn("로그인 후 이용해주세요.");
            return;
        }

        if (customItems.length === 0) {
            toast.error("사이즈를 먼저 조정해 주세요.");
            return;
        }

        const payload = customItems.map(item => ({
            id: member.id,
            pid: parseInt(pid),
            title: product.title,
            author: product.author,
            price: item.price,
            category: `${category}`,
            thumbnail: item.imageSrc,
            size: toInchSize(item.width, item.height),
            finishType: item.finishType ?? 'glossy',
            quantity: item.quantity ?? 1,
        }));

        try {
            await axios.post(`${API}/cart/insert`, payload);
                if (window.confirm("장바구니에 추가되었습니다. 장바구니로 이동할까요?")) {
                    navigate('/cart');        
                }
        } catch (err) {
            console.error("장바구니 추가 실패", err);
            toast.error("장바구니 추가에 실패했습니다.");
        }
    };

    // 바로 구매하기 (Buy It Now)
    const handleBuyNow = () => {
        if (!member?.id) {
            setShowGuestChoice(true);
            return;
        }

        const orderData = customItems.map(item => ({
            id: member.id,
            pid: parseInt(pid),
            title: product.title,
            author: product.author,
            price: item.price,
            thumbnail: item.imageSrc,
            size: toInchSize(item.width, item.height),
            category: `${category}`,
            finishType: item.finishType ?? 'glossy',
            quantity: item.quantity ?? 1,
        }));
        navigate('/orderForm', { state: { orderItems: orderData } });
    }

    const toggleFinishType = (itemId) => {
        setCustomItems(prev => 
            prev.map(item => 
                item.id === itemId
                    ? {
                        ...item,
                        finishType: item.finishType === 'matte' ? 'glossy' : 'matte'
                    }
                    : item
            )
        )
    }

    return (
        <div className="flex-col md:mt-10">
            {/* 가이드 */}
            <div className="hidden md:block">
                <div className='flex justify-center mt-12 items-start'>
                    <div className="flex flex-col items-center w-[80px]">
                        <div className='
                                md:w-9 w-[clamp(24px,4.693vw,36px)] 
                                md:h-9 h-[clamp(24px,4.693vw,36px)] 
                                rounded-full bg-[#D0AC88] text-white 
                                flex items-center justify-center font-semibold'>
                            1
                        </div>
                        <span 
                            className='
                                md:text-sm text-[clamp(10px,1.82vw,14px)]
                                mt-2 text-600 font-medium text-center'
                        >
                            사이즈 조정
                        </span>
                    </div>

                    <div className="flex items-center h-[36px]">
                        {/* 선 */}
                        <div className="w-[42px] h-[2px] bg-gray-300" />

                        {/* 화살표 */}
                        <div className="
                            w-0 h-0
                            border-t-[4px] border-t-transparent
                            border-b-[4px] border-b-transparent
                            border-l-[6px] border-l-gray-300
                        "
                        />
                    </div>

                    <div className="flex flex-col items-center w-[80px]">
                        <div className='
                                md:w-9 w-[clamp(24px,4.693vw,36px)] 
                                md:h-9 h-[clamp(24px,4.693vw,36px)] 
                                rounded-full bg-[#D0AC88] text-white 
                                flex items-center justify-center font-semibold'>
                            2
                        </div>
                        <span 
                            className='
                                md:text-sm text-[clamp(10px,1.82vw,14px)]
                                mt-2 text-600 font-medium text-center'
                        >
                            결제
                        </span>
                    </div>
                </div>
                <div className="text-center">
                    <p 
                        className="
                            px-3
                            mt-2 text-gray-600
                            md:text-sm text-[clamp(10.5px,1.825vw,14px)]">
                        오른쪽에서 사이즈를 조정해 원하는 크기를 확인하시고 결제를 하면 주문이 완료됩니다
                    </p>
                </div>
            </div>

             <div className="flex md:flex-row flex-col w-full md:h-full h-auto md:overflow-hidden overflow-visible md:mt-4 gap-2 md:gap-5">
                {/* 이미지창 */}
                <div className="relative h-full ">
                    <img 
                        src={bg2}
                        className='
                            w-full h-auto aspect-[958/766]'
                        alt="배경"
                    />

                    {/* A3~A0 종이 오버레이 */}
                    {paperKey && (
                        <div
                            className="absolute z-10 flex items-center justify-center text-gray-400 opacity-80"
                            style={{ 
                                width: `${paperWidthPct}%`,
                                height: `${paperHeightPct}%`,
                                top: '30%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                background: 'rgba(255,255,255)',
                                border: '1px solid rgba(0,0,0,0.15)',
                                boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                                pointerEvents: 'none',
                            }}
                        >
                            <div className="font-bold text-[14px]">
                                {paperKey}
                            </div>
                        </div>
                    )}

                    {/* 입력 사이즈에 따라 겹쳐서 표시 */}
                    <img 
                        src={mainImage}
                        alt="입력한 프레임"
                        className="absolute object-cover"
                        style={{
                            width: `${overlayWidthPct}%`,
                            height: `${overlayHeightPct}%`,
                            top: '30%',
                            left: '50%',
                            transform: `translate(-50%, -50%)`,
                            // boxShadow: '-5px 5px 5px rgba(0, 0, 0, 0.4)',
                            boxShadow: '-5px 5px 5px rgba(193, 155, 110, 0.6)',
                            pointerEvents: 'none'
                        }}
                    />
                </div>

                {/* 결제창 */}
                <div className="
                    h-fit flex flex-col flex-1 min-w-[296px] md:rounded-xl px-3
                    py-[2px] md:py-[15px]
                    md:border-[1px] md:border-[#D0AC88]"
                >
                    <div className="flex flex-col mb-2">

                        {/* 내 의견 */}
                        <div className="flex justify-end gap-1">
                            <button 
                                type="button"
                                className="text-xs bg-gray-100 text-gray-600 border border-gray-500 px-2 py-1 rounded-full w-fit hover:bg-gray-200"
                                onClick={() => {
                                    // 현재 상품 작가로 이동 (작가 작품 목록)
                                    if (category === "masterPiece") {
                                        navigate(`/main_Items?type=${category}&author=${encodeURIComponent(product.author)}`);
                                    } else {
                                        navigate(`/main_Items?type=${category}&label=${encodeURIComponent(product.author)}`);
                                    }
                                    
                                }}
                                >
                                다른 작품보기
                            </button>
                            {category === "masterPiece" && (
                                <button 
                                    type="button"
                                    className="text-xs bg-gray-100 text-gray-600 border border-gray-500 px-2 py-1 rounded-full w-fit hover:bg-gray-200"
                                    onClick={() => {
                                        // 작가 목록(기본 화면)으로 이동
                                        navigate(`/main_Items?type=${category}`);
                                    }}
                                    >
                                    다른 작가보기
                                </button>
                            )}
                        </div>
                        <span className="md:mt-3 text-base font-bold">{product.title}</span>
                        <div className="md:mt-1 text-sm text-gray-500"> {product.author}</div>
                    </div>

                    {/* 사이즈 입력 */}
                    <div className="flex flex-col">
                        <label className="block md:mt-2 text-base font-semibold">사이즈 조정</label>
                        
                        {/* <p className="text-sm text-gray-500 mt-2">원하는 사이즈(cm)를 입력해 주세요</p> */}

                        <div className="flex gap-3 items-start mt-1 h-fit">
                            <div className="flex flex-col w-full h-fit">
                                <span className="text-sm text-gray-500 mb-1">가로 (cm)</span>
                                <input
                                    type="text"
                                    value={widthInput}
                                    onChange={(e) => {
                                        dismissSizeAdjustHint();
                                        const onlyNumber = e.target.value.replace(/\D/g, '');
                                        setWidthInput(onlyNumber);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            e.currentTarget.blur();
                                        }

                                        // type="number"에서 허용되는 'e', '+', '-'도 막기
                                        if (["e", "E", "+", "-"].includes(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                    onBlur={() => {
                                        const v = parseFloat(widthInput);
                                        if (isNaN(v)) {
                                        setWidthInput(String(Math.floor(width)));
                                        return;
                                        }
                                        handleWidthChange({ target: { value: v } });
                                    }}
                                    onWheel={(e) => e.preventDefault()}
                                    inputMode="numeric"
                                    className={`w-full border border-gray-500 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#D0AC88] ${
                                        showSizeAdjustHint
                                            ? 'size-adjust-hint-input border-2'
                                            : 'border border-gray-500'
                                    }`}
                                />
                                <input
                                    type="range"
                                    min={MIN_WIDTH}
                                    max={actualMaxWidth}
                                    step="0.1"
                                    value={width}
                                    onChange={(e) => {
                                        dismissSizeAdjustHint();
                                        const value = parseFloat(e.target.value);
                                        if (!isNaN(value)) handleWidthChange(e);
                                    }}
                                    className="mt-[2px] w-full accent-[#D0AC88]"
                                />
                            </div>
                            
                            <span className="text-xl font-semibold text-gray-700 mt-10">x</span>

                            <div className="flex flex-col w-full">
                                <span className="text-sm text-gray-500 mb-1">세로 (cm) </span>
                                <input
                                    type="text"
                                    value={heightInput}
                                    onChange={(e) => {
                                        dismissSizeAdjustHint();
                                        const onlyNumber = e.target.value.replace(/\D/g, '');
                                        setHeightInput(onlyNumber);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            e.currentTarget.blur();
                                        }
                                        if (["e", "E", "+", "-"].includes(e.key)) {
                                            e.preventDefault();
                                        }
                                    }}
                                    onBlur={() => {
                                        const v = parseFloat(heightInput);
                                        if (isNaN(v)) {
                                            setHeightInput(String(Math.floor(height)));
                                            return;
                                        }
                                        handleHeightChange({ target: { value: v } });
                                    }}
                                    onWheel={(e) => e.preventDefault()}
                                    inputMode="numeric"
                                    className={`w-full border rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#D0AC88] ${
                                        showSizeAdjustHint
                                            ? 'size-adjust-hint-input border-2'
                                            : 'border border-gray-500'
                                    }`}
                                />
                                <span className=" text-xs text-right text-gray-600">
                                    (약 { Math.floor(width / 2.54) } x { Math.floor(height / 2.54) } inch)
                                </span>
                            </div>
                        </div>
                        
                        <span 
                            className={`mt-1 text-[13.5px] ${
                                showSizeAdjustHint
                                    ? 'size-adjust-hint-text'
                                    : 'text-gray-500'
                            }`}
                        >
                            바를 움직이거나 직접 입력해 사이즈를 조정하세요
                        </span>

                        <div className="w-full flex justify-between mt-2 gap-2">
                            {['A3', 'A2', 'A1', 'A0'].map(k => (
                                <button
                                    key={k}
                                    type="button"
                                    onClick={() => setPaperKey(prev => (prev === k ? null : k))}
                                    className={`
                                        flex-1 h-[34px] rounded-md border text-sm font-semibold
                                        ${paperKey === k ? 'bg-[#ecd2af] text-white border-[#ecd2af]' : 'bg-white text-gray-500 opacity-90 border-gray-300 hover:bg-[#ecd2af] hover:text-white hover:border-[#ecd2af]'}    
                                    `}
                                >
                                    {k}
                                </button>
                            ))}
                            <button 
                                className="flex-1 h-[34px] rounded-md border text-sm font-semibold bg-white text-gray-500 opacity-90 border-gray-300 hover:bg-[#ecd2af] hover:text-white hover:border-[#ecd2af]"
                                onClick={() => {
                                    if (!paperKey) {
                                        toast.warn("A3~A0 중 하나를 먼저 선택해주세요.");
                                    }
                                    setPaperRotate(v => !v);
                                }}
                            >
                                {paperRotate === true ?  "가로" : "세로"}
                            </button>
                        </div>

                        {/* {paperKey && (
                            <button
                                type="button"
                                onClick={() => setPaperRotate(v => !v)}
                                className="mt-2 text-xs text-gray-600 underline"
                            >
                                종이 방향 바꾸기 (가로/세로)
                            </button>
                        )} */}

                        <hr className='mt-3 border-[1px] border-gray-200 opacity-80' />
                        
                        {/* 결제 목록 */}
                        {customItems.length > 0 && (
                            // <div className='max-h-[300px] overflow-y-scroll mt-3 space-y-2'>
                            //     {customItems.map((item, idx) => (
                            <>
                                <div className="mt-2 ml-1 flex items-center justify-between">
                                    <span
                                        className={`
                                            inline-flex items-center text-[12px] font-semibold
                                            ${isCustomOrderFull ? 'text-[#a67a3e]' : 'text-gray-600'}
                                        `}
                                    >
                                        등록 {customItems.length} / {MAX_CUSTOM_ORDER_ITEMS}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={handleAddOption}
                                        disabled={isCustomOrderFull}
                                        className={`
                                            w-6 h-6 mr-1 border rounded-full flex items-center justify-center font-bold transition
                                            ${isCustomOrderFull
                                                ? 'text-gray-300 border-gray-200 cursor-not-allowed'
                                                : 'text-[#d0ac88] border-[#d0ac88] bg-white hover:text-white hover:bg-[#ecd2af]'
                                            }
                                        `}
                                        aria-label="상품 추가"
                                        title={isCustomOrderFull ? `최대 ${MAX_CUSTOM_ORDER_ITEMS}개까지 등록 가능합니다.` : '상품 추가'}
                                    >
                                        +
                                    </button>
                                </div>
                                <div className='max-h-[300px] overflow-y-scroll mt-1 space-y-2'>
                                    {customItems.map((item, idx) => (
                                        <div key={item.id} 
                                            onClick={() => setSelectedItemId(item.id)} 
                                            className={`flex items-start gap-2 border rounded-xl p-[8px] shadow-sm cursor-pointer bg-white transition
                                                ${selectedItemId === item.id ? 'border-[#D0AC88] bg-[#fffaf3]' : 'hover:bg-[#fdf4ea]'}`}>
                                            <img 
                                                src={item.imageSrc}
                                                alt={`미리보기 ${idx + 1}`}
                                                className='w-[70px] h-[70px] object-cover object-center rounded-md border'
                                            />

                                            {/* 우측 영역 */}
                                            <div className="flex-1 min-w-0 h-full">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className='flex-1 h-fit text-start'>
                                                        <p className='text-[12.5px] font-semibold text-gray-800'>
                                                            {Math.floor(item.width)} x {Math.floor(item.height)}cm
                                                        </p>
                                                        <p className="mt-[-4px] mb-[4px]">
                                                            <SitePriceRow
                                                                unitPrice={item.price}
                                                                quantity={item.quantity ?? 1}
                                                                neutralClassName={`${SITE_PRICE_TEXT} text-gray-800`}
                                                            />
                                                        </p>
                                                    </div>

                                                    {/* 삭제 버튼: 2개 이상일 때만 노출 */}
                                                    {canDeleteItem && (
                                                        <button
                                                            type="button"
                                                            className='w-6 h-6 shrink-0 text-red-500 hover:text-white hover:bg-red-500 border border-red-300 rounded-full flex items-center justify-center transition'
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const deleteId = item.id;

                                                                setCustomItems(prev => {
                                                                    const newItems = prev.filter((it) => it.id !== deleteId);

                                                                    if (selectedItemId === deleteId) {
                                                                        const next = newItems[0];
                                                                        if (next) setSelectedItemId(next.id);
                                                                    }
                                                                    return newItems;
                                                                });
                                                            }}
                                                        >
                                                            ×
                                                        </button>
                                                    )}
                                                </div>

                                                {/* 수량 변경 버튼 */}
                                                <div
                                                    className="flex items-center gap-1.5 mb-1"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        type="button"
                                                        className="w-6 h-6 border rounded-md bg-white hover:bg-gray-100 text-[14px] font-bold flex items-center justify-center"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateItemQuantity(item.id, -1);
                                                        }}
                                                    >
                                                        -
                                                    </button>
                                                    <input 
                                                        type="number" 
                                                        min={1}
                                                        value={item.quantity ?? 1}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onChange={(e) => {
                                                            e.stopPropagation();
                                                            const { value } = e.target;
                                                            if (value === '') return;
                                                            setItemQuantity(item.id, value);
                                                        }}
                                                        onBlur={(e) => {
                                                            e.stopPropagation();
                                                            setItemQuantity(item.id, e.target.value || 1);
                                                        }}
                                                        className="w-10 h-6 border rounded-md bg-white text-center text-[13px] font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="w-6 h-6 border rounded-md bg-white hover:bg-gray-100 text-[14px] font-bold flex items-center justify-center"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            updateItemQuantity(item.id, 1);
                                                        }}
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                <div className="flex justify-end">
                                                    <div className="w-full flex flex-row">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (item.finishType !== 'matte') return;
                                                                toggleFinishType(item.id);
                                                            }}
                                                            className={`
                                                                flex-1 w-full h-[26px] rounded-md border text-[13px] font-semibold rounded-r-none
                                                                ${ item.finishType !== 'matte' ? 'bg-[#ecd2af] text-white border-[#ecd2af]' : 'bg-white text-gray-500 opacity-90 border-gray-300 hover:bg-gray-100'}    
                                                            `}
                                                        >
                                                            유광
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (item.finishType === 'matte') return;
                                                                toggleFinishType(item.id);
                                                            }}
                                                            className={`
                                                                flex-1 w-full h-[26px] rounded-md border border-l-0 text-[13px] font-semibold rounded-l-none
                                                                ${ item.finishType === 'matte' ? 'bg-[#ecd2af] text-white border-[#ecd2af]' : 'bg-white text-gray-500 opacity-90 border-gray-300 hover:bg-gray-100'}    
                                                            `}
                                                        >
                                                            무광
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* <div className="flex gap-2 mt-2">
                            <button
                                type="button"
                                className="w-full h-[36px] rounded-md border border-[#D0AC88] font-semibold hover:bg-[#fff5ea]"
                                onClick={handleAddOption}
                            >
                                +
                            </button>
                        </div> */}

                        {/* <hr className='mt-3 border-[1px] border-gray-200 opacity-80' /> */}
                        <div className="flex flex-col items-end mt-3">
                            <span className="text-[13px] font-semibold text-gray-600">
                                무료배송
                            </span>
                            {/* <span className="text-sm text-gray-600">
                                상품가: {totalPriceWithoutShipping.toLocaleString()}원
                            </span> */}
                            <div className="text-[12.5px] font-semibold text-[#a57647]">
                                {/* 제작 1~3일 배송 1~2일 (주문후 2~5일 수령) */}
                                주문 후 평균 2~5일 내 수령
                            </div>
                            <span className="text-base font-semibold text-gray-700">
                                총 결제금액 :{' '}
                                <span className=" text-[#a57647]">
                                <SitePriceTotal
                                    original={totalPriceWithoutShipping}
                                    discounted={totalPriceWithoutShippingDiscounted}
                                    className={`${SITE_PRICE_TEXT} font-semibold text-[#a57647]`}
                                />
                                </span>
                            </span>
                        </div>
                        <div className="text-right">
                            {/* {totalPriceWithoutShipping < FREE_SHIPPING_THRESHOLD && (
                                <span className='text-[11.5px] text-green-600 mt-1'>(5만원 이상 구매 시 무료배송 적용)</span>
                            )} */}
                            {/* <div className="text-[13px] font-semibold text-[#a57647]">
                                제작 1~3일 배송 1~2일 (주문후 2~5일 수령)
                            </div> */}
                            
                            <div className="text-[11px] text-gray-500">
                                {/* ※ 이미지를 기준으로 비율이 자동 조정됩니다<br /> */}
                                <span>※ 제작 과정에서 ±1cm 오차가 발생할 수 있습니다</span>
                            </div>
                        </div>
                        {/* 버튼 */}
                        <div className='flex flex-col w-full gap-2 mt-2'>
                            <div ref={buyButtonSectionRef}>
                                <button 
                                    className='flex items-center justify-center w-full h-[50px] bg-[#D0AC88] text-white'
                                    onClick={(e) => handleBuyNow()}>
                                    바로구매
                                </button>
                                <div className="flex flex-row">
                                    <button 
                                        className='flex items-center justify-center w-1/2 xl:h-[66px] lg:h-[clamp(60px,5.16vw,66px)] md:h-[52px] h-[50px] bg-white text-[#D0AC88] border-[#D0AC88] border-[1px]' 
                                        onClick={handleAddToCart}>장바구니</button>
                                    <button 
                                        className='flex items-center justify-center w-1/2 xl:h-[66px] lg:h-[clamp(60px,5.16vw,66px)] md:h-[52px] h-[50px] bg-white text-[#D0AC88] border-[#D0AC88] border-[1px]'
                                        onClick={handleAddToWishlist}>관심상품
                                    </button>
                                </div>
                            </div>
                            {/* 
                            <div className="flex gap-2">
                                <button 
                                    className='flex items-center justify-center w-[144px] h-[66px] bg-white text-[#D0AC88] border-[#D0AC88] border-[1px]' 
                                    onClick="">장바구니</button>
                                <button 
                                    className='flex items-center justify-center w-[144px] h-[66px] bg-white text-[#D0AC88] border-[#D0AC88] border-[1px]'
                                    onClick="">관심상품</button>
                            </div> 
                            */}

                            {/* 네이버 / 카카오 결제 */}
                            {/* <div className='flex flex-col gap-2 font-semibold'>
                                <div className="flex items-center justify-center h-[50px] border-[1px] border-[#1ecd52] gap-2"><img src={icon_naver} className="h-[24px]" /><button>결제하기</button></div>
                                <div className="flex items-center justify-center h-[50px] border-[1px] border-[#ffde02] gap-2"><img src={icon_kakao} className="h-[24px]" /><button>결제하기</button></div>
                            </div> */}
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex justify-center mt-20 mb-[200px]">
                {product && <ProductDetailTabs product={product} />}
            </div>

            {/* 구매 버튼 클릭 시 선택지 */}
            {showGuestChoice && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                <div className="
                    bg-white p-8 rounded-lg shadow-lg
                    w-[90%] max-w-md sm:max-w-lg text-center
                ">
                <p className="
                    md:text-lg text-[clamp(14px,2.3455vw,18px)]
                    mb-6 font-bold">구매 방식을 선택해주세요</p>

                <button
                    onClick={() => {
                        const pendingOrderItems = customItems.map((it) => ({
                            pid: parseInt(pid),
                            title: product.title,
                            author: product.author,
                            price: it.price,
                            thumbnail: it.imageSrc,
                            size: toInchSize(it.width, it.height),
                            category: `${category}`,
                            quantity: it.quantity ?? 1,
                            cid: null,
                            finishType: it.finishType ?? 'glossy',
                        }));

                        navigate('/userLogin', {
                            state: {
                                pendingOrderItems,
                                returnTo: `${location.pathname}${location.search}`,
                            },
                        });
                    }}
                    className="
                        md:text-base text-[clamp(12px,2.085vw,16px)]
                        w-full py-3 mb-3 bg-[#D0AC88] text-white rounded-md"
                >
                    로그인 후 구매하기
                </button>

                <button
                    onClick={() => {
                    setShowGuestChoice(false);

                    const orderData = customItems.map((it) => ({
                        pid: parseInt(pid),
                        title: product.title,
                        author: product.author,
                        price: it.price,
                        thumbnail: it.imageSrc,
                        size: toInchSize(it.width, it.height),
                        category: `${category}`,
                        quantity: it.quantity ?? 1,
                        cid: null,
                        finishType: it.finishType ?? 'glossy',
                    }));

                    navigate('/orderForm', { state : { orderItems: orderData, isGuest: true } });
                    }}
                    className="
                        md:text-base text-[clamp(12px,2.085vw,16px)]
                        w-full py-3 bg-gray-200 rounded-md "
                >
                    비회원으로 구매하기
                </button>

                <button
                    onClick={() => setShowGuestChoice(false)}
                    className="
                        md:text-sm text-[clamp(11px,1.8252vw,14px)]
                        mt-4 text-gray-500 hover:underline"
                >
                    취소
                </button>
                </div>
            </div>
            )}

            {/* 하단 고정바 */}
            {showBottomBuy && (
                <div className="fixed md:hidden bottom-0 left-0 right-0 z-[20]">
                    <div className="w-full">
                        <button 
                            className='flex items-center justify-center w-full h-[50px] bg-[#D0AC88] text-white'
                            onClick={(e) => handleBuyNow()}>
                            바로구매
                        </button>
                        <div className="flex flex-row">
                            <button 
                                className='flex items-center justify-center w-1/2 xl:h-[66px] lg:h-[clamp(60px,5.16vw,66px)] md:h-[52px] h-[50px] bg-white text-[#D0AC88] border-[#D0AC88] border-[1px]' 
                                onClick={handleAddToCart}>장바구니</button>
                            <button 
                                className='flex items-center justify-center w-1/2 xl:h-[66px] lg:h-[clamp(60px,5.16vw,66px)] md:h-[52px] h-[50px] bg-white text-[#D0AC88] border-[#D0AC88] border-[1px]'
                                onClick={handleAddToWishlist}>관심상품
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default None_Custom_Detail;