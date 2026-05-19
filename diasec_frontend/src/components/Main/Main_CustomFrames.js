/**
 * [배포·동기화 주의] 운영 서버는 나이스페이(PG) 연동·주문 조회 로직이 포함되어 로컬과 다를 수 있습니다.
 */

import { useState, useEffect, useLayoutEffect, useContext, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MemberContext } from '../../context/MemberContext';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';

import bg from '../../assets/CustomFrames/p.png'; // 전에 내가 만든 배경
import bg2 from '../../assets/CustomFrames/p2.png'; // 현재 배경
import ex from '../../assets/CustomFrames/ex.jpg';
import icon_kakao from '../../assets/button/icon_kakao.png';
import icon_naver from '../../assets/button/icon_naver.png';
import mainPage from '../../assets/CustomFrames/상세페이지.jpg';
import ProductDetailTabs from '../ProductDetailTabs/ProductDetailTabs.js';
import { getDiscountedUnitPrice, getSiteDiscountPercent } from '../../utils/siteDiscount';
import {
    SitePriceRow,
    SitePriceTotal,
    SITE_PRICE_TEXT,
} from '../common/SitePriceDisplay';

// 드롭메뉴 사진
import c1 from '../../assets/dropDownMenu/customFrame/c1.jpg';
import c2 from '../../assets/dropDownMenu/customFrame/c2.jpg';
import c3 from '../../assets/dropDownMenu/customFrame/c3.jpg';
import c4 from '../../assets/dropDownMenu/customFrame/c4.jpg';
import c5 from '../../assets/dropDownMenu/customFrame/c5.jpg';
import c6 from '../../assets/dropDownMenu/customFrame/c6.jpg';
import c7 from '../../assets/dropDownMenu/customFrame/c7.jpg';
import c8 from '../../assets/dropDownMenu/customFrame/c8.jpg';
import c9 from '../../assets/dropDownMenu/customFrame/c9.jpg';


// 보정
import custom1 from '../../assets/custom_Frames/1.Skin RetouchB.jpg';
import custom2 from '../../assets/custom_Frames/1.Skin RetouchF.jpg';
import custom3 from '../../assets/custom_Frames/2.Teeth WhiteningB.jpg';
import custom4 from '../../assets/custom_Frames/2.Teeth WhiteningF.jpg';
import custom5 from '../../assets/custom_Frames/3.Object RemovalB.jpg';
import custom6 from '../../assets/custom_Frames/3.Object RemovalF.jpg';
import custom7 from '../../assets/custom_Frames/4.Color CorrectionB.jpg';
import custom8 from '../../assets/custom_Frames/4.Color CorrectionF.jpg';
import custom9 from '../../assets/custom_Frames/5.Background RemovalB.jpg';
import custom10 from '../../assets/custom_Frames/5.Background RemovalF.jpg';
import custom11 from '../../assets/custom_Frames/6.BlurB.jpg';
import custom12 from '../../assets/custom_Frames/6.BlurF.jpg';

const presetImageMap = {
    wedding: c1,
    family: c2,
    pet: c3,
    baby: c4,
    profile: c5,
    store: c6,
    game: c7,
    anime: c8,
    sight: c9,
}

const Main_CustomFrames = () => {
    const {member, setMember} = useContext(MemberContext);
    const isAdmin = member?.role === 'ADMIN';
    const navigate = useNavigate();
    const location = useLocation();
    const [customItems, setCustomItems] = useState([]); // 상품 
    const searchParams = new URLSearchParams(location.search);
    const presetKey = searchParams.get('preset');
    const initialExampleImage = presetImageMap[presetKey] || ex;
    const CUSTOM_FRAME_TAB_PRODUCT = { pid: -3 };

    const [width, setWidth] = useState(35.6);
    const [height, setHeight] = useState(27.9);
    const [imageSrc, setImageSrc] = useState(null);
    const [aspectRatio, setAspectRatio] = useState(null);
    const [defaultCfg, setDefaultCfg] = useState(null);

    useEffect(() => {
        setWidthInput(String(Math.floor(width)));
    }, [width]);

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
    }, []);

    // 모바일 구매버튼 바텀에 스티키//
    
    const [showGuestChoice, setShowGuestChoice] = useState(false);

    // 관리자: cm만 넣어 견적 확인(주문/이미지에 반영 안 함)
    const [adminQuoteModalOpen, setAdminQuoteModalOpen] = useState(false);
    const [adminQuoteW, setAdminQuoteW] = useState('');
    const [adminQuoteH, setAdminQuoteH] = useState('');

    const openAdminQuoteModal = () => {
        setAdminQuoteW(String(Math.floor(width)));
        setAdminQuoteH(String(Math.floor(height)));
        setAdminQuoteModalOpen(true);
    };

    // 사이즈 조절하기 아래 이미지 사진 상품 리스트
    const [selectedItemId, setSelectedItemId] = useState(null);
    const selectedItem = customItems.find(item => item.id === selectedItemId);

    const MIN_WIDTH = 36;

    // 중간 가져오기
    const getMidWidth = (minW, maxW, maxH, ratio) => {
        const actualMaxW = Math.min(maxW, maxH * ratio);

        const midW = (minW + actualMaxW) / 2;

        return parseFloat(midW.toFixed(1));
    };

    // ex 사진에 초기 설정
    useEffect(() => {
        // 새 이미지 객체 생성 (비동기로 이미지 로딩 가능)
        const img = new Image();

        // 이미지 로드가 완료되면 실행되는 함수
        img.onload = () => {
            // 현재 설정된 width / height 값으로 비율을 계산
            const ratio = img.width / img.height;

            const maxW = ratio >= 1 ? 200.7 : 101.6;
            const maxH = ratio >= 1 ? 101.6 : 200.7;

            const startW = getMidWidth(MIN_WIDTH, maxW, maxH, ratio);

            let startH = parseFloat((startW / ratio).toFixed(1));

            if (startH > maxH) {
                startH = maxH;
            }

            const cfg = {
                width: startW,
                height: startH,
                aspectRatio: ratio,
                maxWidth: maxW,
                maxHeight: maxH,
            }

            setDefaultCfg(cfg);

            setWidth(cfg.width);
            setHeight(cfg.height);
            setAspectRatio(cfg.aspectRatio);
            setMaxWidth(cfg.maxWidth);
            setMaxHeight(cfg.maxHeight);
            setImageSrc(null);
            setSelectedItemId(null);

            setWidthInput(String(Math.floor(cfg.width)));
        };
        // 이미지 src를 설정하여 로딩 시작
        img.src = initialExampleImage;
    }, [initialExampleImage]);

    // 아이템 0개면 기본사이즈로 리셋
    const resetToDefault = () => {
        if (!defaultCfg) return;

        setSelectedItemId(null);
        setImageSrc(null);

        setWidth(defaultCfg.width);
        setHeight(defaultCfg.height);
        setAspectRatio(defaultCfg.aspectRatio);
        setMaxWidth(defaultCfg.maxWidth);
        setMaxHeight(defaultCfg.maxHeight);

        setWidthInput(String(Math.floor(defaultCfg.width)));

    };

    // 썸네일 이미지 클릭 시 · 업로드 완료 시 사이즈 수정 UI 반영 (업로드 중 아이템 제외)
    useLayoutEffect(() => {
        if (!selectedItem || selectedItem.isUploading) return;

        setWidth(selectedItem.width);
        setHeight(selectedItem.height);
        setImageSrc(selectedItem.imageSrc);
        setAspectRatio(selectedItem.aspectRatio);
        setMaxWidth(selectedItem.maxWidth);
        setMaxHeight(selectedItem.maxHeight);
        setWidthInput(String(Math.floor(selectedItem.width)));
    }, [selectedItemId, selectedItem?.isUploading]);

    const prevSelectedItemIdRef = useRef(selectedItemId);

    useEffect(() => {
        if (prevSelectedItemIdRef.current !== selectedItemId) {
            prevSelectedItemIdRef.current = selectedItemId;
            return;
        }
        if (!selectedItemId || !aspectRatio) return;
        if (!selectedItem || selectedItem.isUploading) return;
        if (width <= 0 || height <= 0) return;
        const newArea = width * height;
        const newPrice = calculateCumulativePrice(newArea);
        setCustomItems(prev =>
            prev.map(item =>
                item.id === selectedItemId
                    ? (
                        item.width === width && item.height === height && item.price === newPrice
                            ? item
                            : { ...item, width, height, price: newPrice }
                    )
                    : item
            )
        );
    }, [width, height, selectedItemId, aspectRatio]);

    // 길이 조절
    const [maxWidth, setMaxWidth] = useState(200.7);
    const [maxHeight, setMaxHeight] = useState(101.6);

    const MAX_SIZE = 50 * 1024 * 1024; // 이미지 업로드 50MB
    const MAX_CUSTOM_ORDER_ITEMS = 10;
    const PREVIEW_MAX_SIDE_PX = 800;
    const ORDER_THUMB_MAX_SIDE_PX = 150;

    const makePreviewDataUrl = (img, maxSidePx, quality) => {
        const srcW = img.width;
        const srcH = img.height;
        const scale = Math.min(1, maxSidePx / Math.max(srcW, srcH));
        const dstW = Math.max(1, Math.round(srcW * scale));
        const dstH = Math.max(1, Math.round(srcH * scale));
        
        const canvas = document.createElement('canvas');
        canvas.width = dstW;
        canvas.height = dstH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return img.src;

        // 배경색은 부모 레이아웃에서 처리하고 미리보기는 축소만 수행
        ctx.drawImage(img, 0, 0, dstW, dstH);
        return canvas.toDataURL('image/jpeg', quality);
    };

    const dataUrlToFile = (dataUrl, filename) => {
        const arr = dataUrl.split(',');
        const mimeMatch = arr[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    };

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        const tooBig = files.find(f => f.size > MAX_SIZE);
        if (tooBig) {
            toast.error(`50MB 초과 파일이 포함되어 있습니다. \n(${tooBig.name})`);
            e.target.value = "";
            return;
        }

        const remainingSlots = MAX_CUSTOM_ORDER_ITEMS - customItems.length;
        if (remainingSlots <= 0) {
            if (e.target && typeof e.target.value !== 'undefined') {
                e.target.value = "";
            }
            toast.error(`맞춤 액자는 한 번에 최대 ${MAX_CUSTOM_ORDER_ITEMS}개까지 주문할 수 있습니다.`);
            return;
        }

        const filesToProcess = files.slice(0, remainingSlots);
        if (files.length > filesToProcess.length) {
            toast.info(
                `한 번에 최대 ${MAX_CUSTOM_ORDER_ITEMS}개까지 등록할 수 있습니다. 초과분 ${files.length - filesToProcess.length}개는 제외되었습니다.`
            )
        }

        filesToProcess.forEach(file => {
            const tempId = uuidv4();
            // 1) 즉시 임시 카드 추가
            setCustomItems(prev => [
                ...prev,
                {
                    id: tempId,
                    imageSrc: '',
                    thumbnailPreview: '',
                    thumbnailFile: null,
                    thumbnailPreviewFile: null,
                    file: null,
                    aspectRatio: 1,
                    width: 0,
                    height: 0,
                    maxWidth: 200.7,
                    maxHeight: 101.6,
                    price: 0,
                    finishType: 'glossy',
                    retouch: { enabled: false, types: [], note: '' },
                    isUploading: true,
                }
            ]);

            // 파일 선택 초기화 (연속으로 같은 이미지 넣을때)
            if (e.target && typeof e.target.value !== 'undefined') {
                e.target.value = "";
            }

            setSelectedItemId(tempId);

            const objectUrl = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                try {
                    const preview800 = makePreviewDataUrl(img, PREVIEW_MAX_SIDE_PX, 0.88);
                    const preview150 = makePreviewDataUrl(img, ORDER_THUMB_MAX_SIDE_PX, 0.78);
                    const preview150File = dataUrlToFile(preview150, `${uuidv4()}_150.jpg`);
                    setImageSrc(preview800);
                    const ratio = img.width / img.height;
                    const maxWidth = ratio >= 1 ? 200.7 : 101.6;
                    const maxHeight = ratio >= 1 ? 101.6 : 200.7;
                    let width = getMidWidth(MIN_WIDTH, maxWidth, maxHeight, ratio);
                    let height = parseFloat((width / ratio).toFixed(1));
                    if (height > maxHeight) {
                        height = maxHeight;
                        width = parseFloat((height * ratio).toFixed(1));
                    }
                    const area = width * height;
                    const price = calculateCumulativePrice(area);
                    const newItem = {
                        id: tempId,
                        imageSrc: preview800,
                        thumbnailPreview: preview150,
                        thumbnailFile: file,
                        thumbnailPreviewFile: preview150File,
                        file,
                        aspectRatio: ratio,
                        width,
                        height,
                        maxWidth,
                        maxHeight,
                        price,
                        finishType: 'glossy',
                        retouch: { enabled: false, types: [], note: '' },
                        isUploading: false,
                    };
                    // 2) temp -> 완성 아이템 치환
                    setCustomItems(prev => prev.map(it => (it.id === tempId ? newItem : it)));
                    setSelectedItemId(tempId);
                } finally {
                    URL.revokeObjectURL(objectUrl);
                }
            };
            img.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                setCustomItems(prev => prev.filter(it => it.id !== tempId));
                toast.error('이미지를 불러오지 못했습니다.');
            };
            img.src = objectUrl;
        });
    }

    // 입력 완료 후 반영(딜레이 입력)
    const [widthInput, setWidthInput] = useState(String(Math.floor(width)));
    const [toastCooldown, setToastCooldown] = useState(false);

    const showToastOnce = (message) => {
        if (!toastCooldown) {
            toast.error(message);
            setToastCooldown(true);
            setTimeout(() => setToastCooldown(false), 1000);
        }
    };

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
        { maxArea: 993.4, unitPrice: 45.3 },
        { maxArea: 1327.9, unitPrice: 39.2 },
        { maxArea: 2064.5, unitPrice: 33.6 },
        { maxArea: 2477.4, unitPrice: 32.9 },
        { maxArea: 3096.7, unitPrice: 32.2 },
        { maxArea: 4967.2, unitPrice: 29.1 },
        { maxArea: 6451.6, unitPrice: 28.9 },
        { maxArea: 7741.9, unitPrice: 28.7 },
        { maxArea: 8535.4, unitPrice: 28.1 },
        { maxArea: 12133.0, unitPrice: 27.1 },
        { maxArea: 18393.3, unitPrice: 26.4 },
        { maxArea: 20503.4, unitPrice: 24.5 },
        { maxArea: Infinity, unitPrice: 25.4 }, // 최종 fallback
    ];

    // 기준 배경 px (디자인 사이즈)
    const BASE_BG_W = 958;
    const BASE_BG_H = 766;

    // 오버레이 비율 계산 (기준 대비)
    const overlayWidthPct = (previewWidth / BASE_BG_W) * 100;
    const overlayHeightPct = (previewHeight / BASE_BG_H) * 100;

    // A4 ~ A1 오버레이
    const PAPER_SIZES_CM = {
        A4: { w: 21.0, h: 29.7 },
        A3: { w: 29.7, h: 42.0 },
        A2: { w: 42.0, h: 59.4 },
        A1: { w: 59.4, h: 84.1 },
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
    // A4 ~ A1 오버레이 //

    useEffect(() => {
        if (!aspectRatio) return;

        // 가로 이미지면 종이도 가로, 세로 이미지면 종이도 세로
        setPaperRotate(aspectRatio >= 1);
    }, [aspectRatio]);

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

    const actualMaxWidth = getActualMaxWidth();
    const isCustomOrderFull = customItems.length >= MAX_CUSTOM_ORDER_ITEMS;
    const UploadAreaTag = isCustomOrderFull ? 'div' : 'label';

    // 이미지 드래그 앤 드랍 이벤트 핸들러
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isCustomOrderFull) return;
        
        const files = Array.from(e.dataTransfer.files);

        if (files.length > 0) {
            const fakeEvent = { target: { files } };
            handleImageUpload(fakeEvent);
        }
    }

    // 최종 비용 계산(배송비)
    const SHIPPING_FEE = 3000; // 기본 배송비
    const FREE_SHIPPING_THRESHOLD = 50000; // - 이상 무료
    
    // 가격 계산 로직 추가
    // const totalPriceWithoutShipping = customItems.reduce((acc, item) => {
    //     const area = item.width * item.height;
    //     return acc + calculateCumulativePrice(area);
    // }, 0);
    const totalPriceWithoutShipping = customItems.reduce((acc, item) => {
        if (item.isUploading) return acc;
        const area = item.width * item.height;
        return acc + calculateCumulativePrice(area);
    }, 0);

    const totalPrice = totalPriceWithoutShipping >= FREE_SHIPPING_THRESHOLD
        ? totalPriceWithoutShipping
        : totalPriceWithoutShipping + SHIPPING_FEE;
    
    // const totalPriceWithoutShippingDiscounted = customItems.reduce(
    //     (acc, item) => acc + getDiscountedUnitPrice(item.price),
    //     0
    // );
    const totalPriceWithoutShippingDiscounted = customItems.reduce(
        (acc, item) => (item.isUploading ? acc : acc + getDiscountedUnitPrice(item.price)),
        0
    );
    
    // 바로구매 (결제)
    const handleBuyNow = () => {
        if (customItems.length === 0) {
            toast.warn("이미지를 등록해주세요.");
            return;
        }
        if (customItems.length > MAX_CUSTOM_ORDER_ITEMS) {
            toast.warn(`맞춤 액자는 한 번에 최대 ${MAX_CUSTOM_ORDER_ITEMS}개까지 주문할 수 있습니다.`);
            return;
        }

        // 로그인이 안 된 경우 -> 선택 모달 열기
        if (!member?.id) {
            setShowGuestChoice(true);
            return;
        }

        const orderItems = customItems.map(item => {
            const enabledVal = 
                item.retouch?.enabled === true || (item.retouch?.types?.length ?? 0) > 0  ? 1 : 0;

            const typesStr = item.retouch?.types?.join(', ') ?? '';
            const noteStr = item.retouch?.note ?? '';
            
            return {
            id: member.id,
            pid: '-3',
            title: '맞춤 액자',
            price: item.price,
            thumbnail: item.imageSrc,
            thumbnailPreview: item.thumbnailPreview,
            thumbnailFile: item.thumbnailFile,
            thumbnailPreviewFile: item.thumbnailPreviewFile,
            size: toInchSize(item.width, item.height),
            category:'customFrames',
            quantity:'1',
            finishType: item.finishType ?? 'glossy',

            retouchEnabled: enabledVal,
            retouchTypes: enabledVal ? typesStr : null,
            retouchNote: enabledVal ? noteStr : null,
            };
        });
        navigate('/orderForm', { state: { orderItems } });
    }

    // 1024 x 1536 사이즈
    const beforeAfterData = [
        { title: '피부 보정', before: custom1, after: custom2},
        { title: '치아 보정', before: custom3, after: custom4},
        { title: '라인 보정', before: custom5, after: custom6},
        { title: '색감 보정', before: custom7, after: custom8},
        { title: '배경 정리', before: custom9, after: custom10},
        { title: '고해상도 업스케일', before: custom11, after: custom12},
    ];

    const retouchOptions = beforeAfterData.map(v => v.title);

    const [activeIndex, setActiveIndex] = useState(0);
    const [showAfter, setShowAfter] = useState(false);

    // 보정 요청 모달 상태
    const [retouchModalOpen, setRetouchModalOpen] = useState(false);
    const [retouchTargetId, setRetouchTargetId] = useState(null);
    const [retouchDraft, setRetouchDraft] = useState({
        enabled: false,
        types: [],
        note: '',
    })

    const current = beforeAfterData[activeIndex];

    const openRetouchModal = (item) => {
        setRetouchTargetId(item.id);
        const r = item.retouch || {};

        setRetouchDraft({
            enabled: !!r.enabled,
            types: Array.isArray(r.types) ? r.types : [],
            note: r.note ?? '',
        });
        setRetouchModalOpen(true);
    };

    const closeRetouchModal = () => {
        setRetouchModalOpen(false);
        setRetouchTargetId(null);
    };

    const clearRetouch = (itemId) => {
        setCustomItems(prev =>
            prev.map(it => 
            it.id === itemId
                ? { ...it, retouch: { enabled: false, types: [], note: ''}}
                : it
            )
        );
        if (retouchTargetId === itemId) {
            closeRetouchModal();
        }
    };

    const saveRetouch = () => {
        if (!retouchTargetId) return;

        if (retouchDraft.types.length === 0) {
            toast.warn("보정 항목을 하나 이상 선택해주세요.");
            return;
        }

        setCustomItems(prev =>
            prev.map(it =>
                it.id === retouchTargetId 
                    ? { 
                        ...it, 
                        retouch: {
                            enabled: true,
                            types: retouchDraft.types,
                            note: retouchDraft.note ?? '',
                        },
                    } 
                : it
            )
        );

        setRetouchModalOpen(false);
        setRetouchTargetId(null);
        toast.success("요청사항이 저장되었습니다. 보정 완료 시 문자로 안내해 드리겠습니다.");
    }

    const PAPER = {
        A4: { w: 21.0, h: 29.7 },
        A3: { w: 29.7, h: 42.0 },
        A2: { w: 42.0, h: 59.4 },
        A1: { w: 59.4, h: 84.1 },
        };

        const applyPaperPreset = (key) => {
        if (!aspectRatio) {
            toast.warn("이미지를 먼저 등록해주세요.");
            return;
        }

        const p = PAPER[key];

        // 사진 방향에 따라 '가로 길이'를 자동 선택
        const targetWidth = aspectRatio >= 1 ? p.h : p.w; 
        // 가로형이면 긴 변을 가로로(29.7), 세로형이면 짧은 변을 가로로(21)

        handleWidthChange({ target: { value: targetWidth } });
        setWidthInput(String(Math.floor(targetWidth)));
    };

    const WIDTH_PRESETS = [
        { label: "40cm", value: 40 },
        { label: "60cm", value: 60 },
        { label: "80cm", value: 80 },
        { label: "100cm", value: 100 },
        { label: "120cm", value: 120 },
        { label: "150cm", value: 150 },
        { label: "180cm", value: 180 },
        { label: "200cm", value: 200 },
        ];

        const applyWidthPreset = (w) => {
        if (!aspectRatio) {
            toast.warn("이미지를 먼저 등록해주세요.");
            return;
        }
        handleWidthChange({ target: { value: w } });
        setWidthInput(String(Math.floor(w)));
    };

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
        <div className="flex flex-col w-full h-full">
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
                            이미지 등록
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
                            3
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
                        오른쪽에서 이미지 등록을 하신 후 사이즈를 조정해 결제를 하면 주문이 완료됩니다
                    </p>
                </div>
            </div>
            
            <div className="flex md:flex-row flex-col   w-full md:h-full h-auto md:overflow-hidden overflow-visible md:mt-4 gap-2 md:gap-5">
                {/* 이미지창 */}
                <div className="relative h-full ">
                    <img 
                        src={bg2}
                        className='
                            w-full h-auto aspect-[958/766]'
                        alt="배경"
                    />

                    {/* A4~A1 종이 오버레이 */}
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
                        src={imageSrc || initialExampleImage}
                        alt="입력한 프레임"
                        className="absolute object-cover bg-white"
                        style={{
                            width: `${overlayWidthPct}%`,
                            height: `${overlayHeightPct}%`,
                            top: '34%',
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
                    border-x-0 md:border-x-[1px] md:border-y-[1px] md:border-[#D0AC88]"
                >
                    <div className="hidden md:flex justify-center ">
                        <span className="flex text-xl md:text-2xl text-[#6d6d6d] font-bold">맞춤액자</span>
                    </div>

                    {/* <hr className='mt-3 border-[1px] border-gray-200 opacity-80' /> */}

                    {/* 이미지 업로드 */}
                    <div className="md:mt-3">
                        <label className="text-base font-semibold">이미지 등록</label>
                        <div className='md:mt-2'>
                            {/* 숨겨진 파일 업로드 input */}
                            <input 
                                type="file"
                                accept="image/jpeg, image/png"
                                id="fileInput"
                                onChange={handleImageUpload}
                                className="hidden"
                                multiple
                                disabled={isCustomOrderFull}
                            />

                            {/* 드래그 앤 드랍 + 클릭 영역 */}
                            <UploadAreaTag
                                {...(!isCustomOrderFull ? { htmlFor: 'fileInput'} : {})}
                                className={` 
                                    w-full
                                    md:h-[140px] h-[110px]
                                    text-base md:mt-2 md:py-2 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center text-gray-500 mb-2 md:mb-4 cursor-pointer
                                        transition-colors duration-200 
                                        ${ isDragging ? 'border-[#ccc26c] bg-[#fdebd4]' : 'border-dashed border-gray-400'}
                                        ${isCustomOrderFull
                                            ? 'opacity-50 cursor-not-allowed'
                                            : 'cursor-pointer hover:border-[#ccc26c] hover:bg-[#fdebd4]'
                                        }
                                    `}
                                    onDragEnter={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (isCustomOrderFull) return;
                                    setIsDragging(true)
                                }}
                                onDragLeave={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();

                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const {clientX, clientY } = e;

                                    const isOut = (
                                        clientX < rect.left ||
                                        clientX > rect.right ||
                                        clientY < rect.top ||
                                        clientY > rect.bottom
                                    );

                                    if (isOut) {
                                        setIsDragging(false)
                                    }                                  
                                }}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsDragging(false);
                                    if (isCustomOrderFull) return;

                                    const files = Array.from(e.dataTransfer.files);

                                    const tooBig = files.find(f => f.size > MAX_SIZE);
                                    if (tooBig) {
                                        toast.error(`50MB 초과 파일이 포함되어 있습니다 \n(${tooBig.name})`);
                                        return;
                                    }

                                    if (files.length > 0) {
                                        const fakeEvent = { target: { files } };
                                        handleImageUpload(fakeEvent);
                                    }
                                }}
                                >
                                <div 
                                    className="flex flex-col items-center"
                                    onDragEnter={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                    }}
                                >
                                    <svg className="w-8 md:w-10 h-8 md:h-10 text-[#D0AC88] md:mb-2" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 15.75V15a4.5 4.5 0 014.5-4.5h9A4.5 4.5 0 0121 15v.75m-9-4.5V21m0-9l-3 3m3-3l3 3" />
                                    </svg>
                                    <span className="text-sm text-center">
                                            여기를 클릭하거나 <br /> 이미지를 드래그해서 올려주세요 <br />
                                        <span className="text-xs text-gray-500">(JPG, PNG 파일만 가능, 파일당 최대 50MB)</span>
                                        <br />
                                        {/* <span className="text-xs text-[a67a3e] font-medium mt-1 inline-block">
                                            {isCustomOrderFull
                                                ? `최대 ${MAX_CUSTOM_ORDER_ITEMS}개까지 등록되었습니다.`
                                                : `등록 ${customItems.length} / ${MAX_CUSTOM_ORDER_ITEMS}`}
                                        </span> */}
                                    </span>
                                </div>
                            </UploadAreaTag>
                        </div>
                    </div>
                    
                    {/* <hr className='border-[1px] border-gray-200 opacity-80' /> */}

                    {/* 사이즈 입력 */}
                    <div className="flex flex-col">
                        <div className="flex flex-wrap items-center justify-between gap-2 md:mt-2">
                            <label className="text-base font-semibold">사이즈 조정</label>
                            {isAdmin && (
                                <button
                                    type="button"
                                    onClick={openAdminQuoteModal}
                                    className="text-xs font-semibold px-2.5 py-1 rounded-md border border-amber-600 text-amber-900 bg-amber-50 hover:bg-amber-100"
                                >
                                    관리자: 견적 계산
                                </button>
                            )}
                        </div>
                        <div className="flex gap-3 items-end mt-1">
                            <div className="flex flex-col w-full">
                                <span className="text-sm text-gray-500 mb-1">가로 (cm)</span>
                                <input
                                    type="text"
                                    value={widthInput}
                                    onChange={(e) => {
                                        const onlyNumber = e.target.value.replace(/\D/g, '');
                                        setWidthInput(onlyNumber);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();

                                            // const v = parseFloat(widthInput);
                                            // if (isNaN(v)) {
                                            //     setWidthInput(String(Math.floor(width)));
                                            //     return;
                                            // }

                                            // handleWidthChange({ target: { value: v } });
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
                                    className="w-full border border-gray-500 rounded-md px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#D0AC88]"
                                />
                            </div>
                            
                            <span className="text-xl font-semibold text-gray-700">x</span>

                            <div className="flex flex-col w-full">
                                <span className="text-sm text-gray-500 mb-1">세로 (cm) </span>
                                <input
                                    type="number" 
                                    value={Math.floor(height)}
                                    readOnly
                                    className="w-full border border-gray-500 rounded px-3 py-2 text-base bg-gray-100 cursor-not-allowed"
                                />
                            </div>
                        </div>
                        
                        <div className="mt-[4px] flex justify-between">
                            <input
                                type="range"
                                min={MIN_WIDTH}
                                max={actualMaxWidth}
                                step="0.1"
                                value={width}
                                onChange={(e) => {
                                    const value = parseFloat(e.target.value);
                                    if (!isNaN(value)) handleWidthChange(e);
                                }}
                                className="mt-[2px] md:w-[44%] w-[47%] accent-[#D0AC88]"
                            />
                            <span className=" text-xs text-right text-gray-600">
                                    (약 { Math.floor(width / 2.54) } x { Math.floor(height / 2.54) } inch)
                            </span>
                        </div>
                        <span className="mt-1 text-[13.5px] text-gray-500">바를 움직이거나 직접 입력해 사이즈를 조정하세요</span>

                        <div className="w-full flex justify-between mt-2 gap-2">
                            {['A4', 'A3', 'A2', 'A1'].map(k => (
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
                                        toast.warn("A1~A4 중 하나를 먼저 선택해주세요.");
                                    }
                                    setPaperRotate(v => !v);
                                }}
                            >
                                {paperRotate === true ?  "가로" : "세로"}
                            </button>
                        </div>

                        <hr className='mt-3 border-[1px] border-gray-200 opacity-80' />

                        {/* 결제 목록 */}
                        {selectedItem && (
                            <>
                                <span
                                    className={`
                                        mt-2 ml-1 inline-flex items-center text-[12px] font-semibold
                                        ${isCustomOrderFull ? ' text-[#a67a3e]' : ' text-gray-600'}
                                    `}
                                >
                                    등록 {customItems.length} / {MAX_CUSTOM_ORDER_ITEMS}
                                </span>
                                <div className='max-h-[300px] overflow-y-scroll mt-1 space-y-2'>
                                    {customItems.map((item, idx) => (
                                        <div 
                                            key={item.id} 
                                            onClick={() => setSelectedItemId(item.id)} 
                                            className={`relative flex items-center gap-2 border rounded-2xl p-[8px] shadow-sm cursor-pointer bg-white transition
                                                ${selectedItemId === item.id ? 'border-[#D0AC88] bg-[#fffaf3]' : 'hover:bg-[#fdf4ea]'}`}>
                                            {/* 썸네일 */}
                                            <div className='w-[70px] h-[70px] rounded-md border overflow-hidden bg-gray-100 flex items-center justify-center'>
                                                {item.imageSrc ? (
                                                    <img 
                                                        src={item.imageSrc}
                                                        alt={`미리보기 ${idx + 1}`}
                                                        className='w-[70px] h-[70px] object-cover object-center'
                                                    />
                                                ) : (
                                                    <span className="text-[10px] text-gray-500">로딩중</span>
                                                )}
                                            </div>

                                            {/* 우측 영역 */}
                                            <div className='flex-1 min-w-0'>
                                                <div className="flex items-start justify-between md:gap-0 gap-2 min-h-[30px]">
                                                    <div className="min-w-0">
                                                        {item.isUploading ? (
                                                            <p className='text-[12.5px] font-semibold text-gray-700'>
                                                                이미지 렌더링 중...
                                                            </p>
                                                        ) : (
                                                            <>
                                                                <p className='text-[12.5px] font-semibold text-gray-800'>
                                                                    {Math.floor(item.width)} x {Math.floor(item.height)}cm
                                                                </p>
                                                                <p className="mt-[-4px] mb-[4px]">
                                                                    <SitePriceRow
                                                                        unitPrice={item.price}
                                                                        neutralClassName={`${SITE_PRICE_TEXT} text-gray-800`}
                                                                    />
                                                                </p>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* 삭제 버튼 */}
                                                    <button
                                                        className='w-6 h-6 shrink-0 text-red-500 hover:text-white hover:bg-red-500 border border-red-300 rounded-full flex items-center justify-center transition'
                                                        onClick={(e) => {
                                                            e.stopPropagation();

                                                            const deleteId = item.id;

                                                            setCustomItems(prev => {
                                                                const newItems = prev.filter ((it) => it.id !== deleteId);

                                                                // 마지막 아이템 삭제면 즉시 기본 리셋
                                                                if (newItems.length === 0) {
                                                                    setTimeout(() => resetToDefault(), 0);
                                                                    return [];
                                                                }

                                                                if (selectedItemId === deleteId) {
                                                                    const first = newItems[0];

                                                                    setSelectedItemId(first.id);
                                                                    setImageSrc(first.imageSrc);

                                                                    setWidth(first.width);
                                                                    setHeight(first.height);
                                                                    setAspectRatio(first.aspectRatio);
                                                                    setMaxWidth(first.maxWidth);
                                                                    setMaxHeight(first.maxHeight);

                                                                    setWidthInput(String(Math.floor(first.width)));

                                                                    // if (newItems.length > 0) {
                                                                    //     setSelectedItemId(newItems[0].id);
                                                                    //     setImageSrc(newItems[0].imageSrc);
                                                                    // } else {
                                                                    //     setSelectedItemId(null);
                                                                    //     setImageSrc(null);
                                                                    // }
                                                                }

                                                                return newItems;
                                                            });
                                                        }}
                                                        aria-label="삭제"
                                                        title="삭제"
                                                    >
                                                        ×
                                                    </button>
                                                </div>

                                                {/* 보정상태와 버튼 */}
                                                <div className="flex flex-col items-center justify-end gap-1">
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
                                                    
                                                    {/* 보정 상태 뱃지 */}
                                                    <div className="w-full flex flex-row text-center">
                                                        {/* 보정 요청 버튼 */}
                                                        <button
                                                            type="button"
                                                            className={`flex-1 w-full h-[26px] px-2 py-[2px] text-[13px] rounded-l-xl border border-[#D0AC88] text-[#a67a3e] hover:bg-[#fff3e6] transition whitespace-nowrap
                                                                ${!(item.retouch?.enabled && (item.retouch?.types?.length ?? 0) > 0)
                                                                    ? 'bg-[#fff3e6] border-[#D0AC88] text-[#a67a3e] font-semibold'
                                                                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'
                                                                }`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                clearRetouch(item.id);
                                                            }}
                                                        >
                                                            보정 없음
                                                        </button>
                                                        
                                                        <button
                                                            type="button"
                                                            className={`flex-1 w-full h-[26px] text-[13px] px-2 py-[2px] rounded-r-xl border whitespace-nowrap transition
                                                                ${(item.retouch?.enabled && (item.retouch?.types?.length ?? 0) > 0)
                                                                    ? 'bg-[#fff3e6] border-[#D0AC88] text-[#a67a3e] font-semibold hover:bg-[#c49b6e]'
                                                                    : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-100'
                                                                }`}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openRetouchModal(item);
                                                            }}
                                                        >
                                                            {/* {item.retouch?.enabled ? '보정 있음' : '보정 없음'} */}
                                                            {(item.retouch?.enabled && (item.retouch?.types?.length ?? 0) > 0) ? '보정 수정' : '보정 요청'}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        

                        <div className="flex flex-col items-end mt-3">
                            <span className="text-[13px] font-semibold text-gray-600">
                                무료배송
                            </span>
                            {/* <span className="text-sm text-gray-600">
                                상품가: {totalPriceWithoutShipping.toLocaleString()}원
                            </span> */}
                            <div className="text-[13px] font-semibold text-[#a57647]">
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
                            <div className="text-[11px] text-gray-500">
                                {/* ※ 이미지를 기준으로 비율이 자동 조정됩니다<br /> */}
                                <span>※ 제작 과정에서 ±1cm 오차가 발생할 수 있습니다</span>
                            </div>
                        </div>
                        {/* 버튼 */}
                        <div className='flex flex-col w-full gap-2 md:mt-2'>
                            <div ref={buyButtonSectionRef}>
                                <button 
                                    className='flex items-center justify-center w-full h-[50px] bg-[#D0AC88] text-white'
                                    onClick={(e) => handleBuyNow()}>
                                    바로구매
                                </button>
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

            <div className="mt-20 mb-[200px] flex w-full justify-center>">
                <ProductDetailTabs product={CUSTOM_FRAME_TAB_PRODUCT} />
            </div>
                            
            {/* 상세페이지 */}
            {/* <div className="flex justify-center mt-10 w-full h-full">
                <img src={mainPage} alt="상세페이지" className="w-[1000px] h-full" />
            </div> */}
            
            {/* 여기부터 모달창 */}
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
                            const pendingOrderItems = customItems.map((item) => {
                                const enabledVal =
                                    item.retouch?.enabled === true || (item.retouch?.types?.length ?? 0) > 0 ? 1 : 0;
                                const typesStr = item.retouch?.types?.join(', ') ?? '';
                                const noteStr = item.retouch?.note ?? '';

                                return {
                                    pid: '-3',
                                    title: '맞춤 액자',
                                    price: item.price,
                                    thumbnail: item.imageSrc,
                                    thumbnailPreview: item.thumbnailPreview,
                                    thumbnailFile: item.thumbnailFile,
                                    thumbnailPreviewFile: item.thumbnailPreviewFile,
                                    size: toInchSize(item.width, item.height),
                                    category: 'customFrames',
                                    quantity: '1',
                                    finishType: item.finishType ?? 'glossy',
                                    retouchEnabled: enabledVal,
                                    retouchTypes: enabledVal ? typesStr : null,
                                    retouchNote: enabledVal ? noteStr : null,
                                };
                            });

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
                        const orderData = customItems.map(item => {
                            const enabledVal = item.retouch?.enabled ? 1 : 0;
                            const typesStr = item.retouch?.types?.join(', ') ?? '';
                            const noteStr = item.retouch?.note ?? '';

                            return {
                            pid: '-3',
                            title: '맞춤 액자',
                            price: item.price,
                            thumbnail: item.imageSrc,
                            thumbnailPreview: item.thumbnailPreview,
                            thumbnailFile: item.thumbnailFile,
                            thumbnailPreviewFile: item.thumbnailPreviewFile,
                            size: toInchSize(item.width, item.height),
                            category:'customFrames',
                            quantity:'1',
                            finishType: item.finishType ?? 'glossy',

                            retouchEnabled: enabledVal,
                            retouchTypes: enabledVal ? typesStr : null,
                            retouchNote: enabledVal ? noteStr : null,
                            };
                        });

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

            {/* 보정 요청 모달 */}
            {retouchModalOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center md:mt-[74px]"
                    onClick={closeRetouchModal}
                >
                    <div
                        className="w-full h-[90%] overflow-y-scroll max-w-lg bg-white shadow-xl py-3 px-4 md:px-4 mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative flex items-start justify-between border-b-[1px]">
                            <div className="absolute left-1/2 -translate-x-1/2">
                                <h3 className="text-lg font-bold text-gray-800">보정 요청</h3>
                            </div>

                            <button
                                className="ml-auto w-9 h-9 rounded-full hover:bg-gray-100 text-gray-600"
                                onClick={closeRetouchModal}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mt-4">
                            <div className={`mt-4`}>
                                <div className="text-[16px] font-semibold text-gray-700 ml-1 mb-2">보정 항목 선택</div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {retouchOptions.map(opt => {
                                        const checked = retouchDraft.types.includes(opt);
                                        return (
                                            <button
                                                key={opt}
                                                type="button"
                                                className={`text-sm px-3 py-2 rounded-xl border transition text-left
                                                    ${checked ? 'border-[#D0AC88] bg-[#fffaf3] text-[#a67a3e]' : 'border-gray-200 hover:bg-gray-50 text-gray-700'}
                                                `}
                                                onClick={() => {
                                                    setRetouchDraft(d => {
                                                        const on = d.types.includes(opt);
                                                        const next = on ? d.types.filter(t => t !== opt) : [...d.types, opt];
                                                        return {...d, types: next};
                                                    });
                                                }}
                                            >
                                                {opt}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-4">
                                    <div className="text-[16px] font-semibold text-gray-700 ml-1 mb-2">요청사항</div>
                                    <textarea 
                                        rows={4}
                                        value={retouchDraft.note}
                                        onChange={(e) => setRetouchDraft(d => ({ ...d, note: e.target.value }))}
                                        placeholder="예) 잡티 제거, 피부톤 자연스럽게, 배경 흰색으로, 역광 완화 등"
                                        className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#D0AC88]"
                                    />
                                    <p className="text-xs text-gray-500 mt-2">
                                        ※ 고난도 보정은 작업 난이도에 따라 추가 비용이 발생할 수 있으며, 상담 후 진행됩니다.
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        ※ 보정 요청 시 추가 작업으로 인해 배송 일정이 다소 지연될 수 있습니다.
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        ※ 트리밍(이미지 자르기) 작업은 별도 문의 부탁드립니다. 
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 flex gap-2">
                            <button
                                className="flex-1 h-[46px] rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700"
                                onClick={() => clearRetouch(retouchTargetId)}
                            >
                                보정 취소
                            </button>
                            <button
                                className="flex-1 h-[46px] rounded-xl bg-[#D0AC88] text-white hover:opacity-90"
                                onClick={saveRetouch}
                            >
                                저장
                            </button>
                        </div>

                        <div className="mt-4">
                            {/* 보정 비교 */}
                            {/* xl:w-[550px] lg:w-[clamp(380px,33.62vw,430px)] md:w-[clamp(250px,32.257vw,330px)] sm:w-[clamp(230px,32.59vw,250px)]  */}
                            <div className='
                                max-w-[530px] border
                                aspect-[1024/1366] mx-auto bg-opacity-60 rounded-lg
                                pt-0
                                xl:px-6 xl:py-4
                                lg:px-5 lg:py-3
                                px-4 py-2
                            '>
                                <h3 className='
                                    text-[clamp(16px,1.759vw,18px)] lg:text-[18px]
                                    font-semibold text-center  text-[a67a3e] mb-2'
                                >
                                    {current.title}
                                </h3>
                                
                                <div className='relative w-full flex justify-center items-center'>
                                    <img src={
                                        showAfter ? current.after : current.before}
                                        alt="보정 비교" 
                                        className='rounded-xl transition duration-500 max-w-full aspect-[1024/1366] object-contain'
                                    />
                                    <div className='
                                        text-[clamp(14px,1.9544vw,15px)] md:text-[clamp(15px,1.564vw,16px)] lg:text-[16px]
                                        absolute bottom-2 flex gap-3 px-4 py-2'
                                    > {/* transform -translate-x-1/2 너비의 절반만큼 왼쪽으로 간다 */}
                                        <button
                                            className={`
                                                px-4 py-1 rounded-full font-semibold transition ${
                                                !showAfter ? 'bg-[#cfab88] text-white' : 'bg-gray-200 text-gray-700'}`}
                                            onClick = {() => setShowAfter(false)}
                                            onMouseEnter={() => setShowAfter(false)}
                                        >
                                            원본사진
                                        </button>
                                        <button
                                            className={`
                                                px-4 py-1 rounded-full font-semibold transition ${
                                                showAfter ? 'bg-[#cfab88] text-white' : 'bg-gray-200 text-gray-700'
                                            }`}
                                            onClick = {() => setShowAfter(true)}
                                            onMouseEnter={() => setShowAfter(true)}
                                        >
                                            보정사진
                                        </button>
                                    </div>
                                </div>

                                {/* 페이지 네이션 */}
                                <div className="mt-3 flex justify-center gap-2">
                                    {beforeAfterData.map((_, idx) => (
                                        <button
                                            key={idx}
                                            className={`
                                                w-[clamp(15px,2.215vw,17px)] md:w-[clamp(17px,1.954vw,20px)] xl:w-5
                                                h-[clamp(15px,2.215vw,17px)] md:h-[clamp(17px,1.954vw,20px)] xl:h-5
                                                rounded-full transition ${
                                                activeIndex === idx ? 'bg-[#cfab88]' : 'bg-gray-300'
                                            }`}
                                            onClick={() => {
                                                setActiveIndex(idx);
                                                setShowAfter(false);
                                            }}
                                        />
                                    ))}
                                </div>
                                <span
                                    className="
                                        flex flex-col justify-center items-center
                                        mt-3
                                        md:text-sm text-[clamp(11px,1.8252vw,14px)]
                                        font-medium tracking-wide
                                        text-gray-600
                                        px-4
                                    "
                                >
                                    원본사진과 보정사진을 <div><span className="text-[#a67a3e] ml-1 font-semibold">클릭</span>해 비교해보세요!</div>
                                </span>
                                {/* 보정 비교 */}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 하단 고정바 */}
            {showBottomBuy && (
                <div className="fixed md:hidden bottom-0 left-0 right-0 z-[100]">
                    <div className="w-full">
                        <button
                            type="button"
                            className="w-full h-[50px] bg-[#D0AC88] text-white font-semibold"
                            onClick={(e) => handleBuyNow()}
                        >
                            바로구매
                        </button>
                    </div>
                </div>
            )}

            {isAdmin && adminQuoteModalOpen && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/45 p-4"
                    role="presentation"
                    // onClick={() => setAdminQuoteModalOpen(false)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="admin-quote-modal-title"
                        className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 id="admin-quote-modal-title" className="text-lg font-bold text-gray-900 mb-1">
                            맞춤액자 견적 (관리자)
                        </h3>
                        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                            가로·세로(cm)를 입력하면 표시 가격 기준으로 안내합니다. 실제 등록 이미지나 주문에는 적용되지 않습니다.
                        </p>
                        <div className="flex flex-wrap items-end gap-3 mb-4">
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-600 mb-1">가로 (cm)</span>
                                <input 
                                    type="text"
                                    inputMode="decimal"
                                    value={adminQuoteW}
                                    onChange={(e) => setAdminQuoteW(e.target.value.replace(/[^\d.]/g, ''))}
                                    className="w-[110px] border border-gray-400 rounded-md px-2 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#D0AC88]"
                                />
                            </div>
                            <span className="text-lg font-semibold text-gray-500 pb-2">x</span>
                            <div className="flex flex-col">
                                <span className="text-xs text-gray-600 mb-1">세로 (cm)</span>
                                <input 
                                    type="text"
                                    inputMode="decimal"
                                    value={adminQuoteH}
                                    onChange={(e) => setAdminQuoteH(e.target.value.replace(/[^\d.]/g, ''))}
                                    className="w-[110px] border border-gray-400 rounded-md px-2 py-2 text-base focus:outline-none focus:ring-2 focus:ring-[#D0AC88]"
                                />
                            </div>
                        </div>
                        <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 mb-5 min-h-[88px]">
                            {(() => {
                                const pw = Math.floor(parseFloat(String(adminQuoteW).replace(/[^\d.]/g, '')) || 0);
                                const ph = Math.floor(parseFloat(String(adminQuoteH).replace(/[^\d.]/g, '')) || 0);
                                if (pw <= 0 || ph <= 0) {
                                    return (
                                        <p className="text-sm text-gray-500">가로·세로에 숫자를 입력하면 견적이 표시됩니다.</p>
                                    );
                                }
                                const area = pw * ph;
                                const original = calculateCumulativePrice(area);
                                const discounted = getDiscountedUnitPrice(original);
                                const pct = getSiteDiscountPercent();
                                const hasDiscount = discounted < original;
                                return (
                                    <div className="space-y-2">
                                        <p className="text-xs text-gray-600">
                                            면적 {area.toLocaleString()} cm² ({pw} x {ph} cm)
                                        </p>
                                        {hasDiscount ? (
                                            <div className="text-sm md:text-base">
                                                <p className="text-gray-700">
                                                    원가{' '}
                                                    <span className="line-through text-gray-500">
                                                        {original.toLocaleString()}원
                                                    </span>
                                                </p>
                                                <p className="mt-1 font-bold text-[#a67a3e">
                                                    할인가 {discounted.toLocaleString()}원
                                                    <span className="ml-2 font-normal text-xs text-gray-600">
                                                        ({pct}% 할인 적용)
                                                    </span>
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-base font-bold text-gray-900">
                                                견적 {original.toLocaleString()}원
                                            </p>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setAdminQuoteModalOpen(false)}
                                className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                닫기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Main_CustomFrames;