/**
 * [배포·동기화 주의] 운영 서버는 나이스페이(PG) 결제 연동이 붙어 있어 로컬 저장소와 다를 수 있습니다.
 * 로컬에서 작업한 이 파일을 서버에 그대로 덮어쓰면 카드/가상계좌 주문 플로우가 깨질 수 있으니 diff 후 병합하세요.
 */

import { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import axios from 'axios';
import { MemberContext } from '../../context/MemberContext'
import BankTransfer from './PaymentMethods/BankTransfer'
import requestCardPayment from './PaymentMethods/CardPayment'
import requestKakaoPay from './PaymentMethods/KakaoPay'
import requestRealTimeTransfer from './PaymentMethods/RealTimeTransfer'
import requestVBankPayment from './PaymentMethods/VBankPayment';
import { toast } from 'react-toastify';
import RetouchModal, {
    CUSTOM_FRAME_RETOUCH_OPTION_LABELS,
} from '../Modal/RetouchModal.js';
import { getDiscountedUnitPrice } from '../../utils/siteDiscount';
import {
    SitePriceRow,
    SitePriceTotal,
    SITE_PRICE_TEXT,
} from '../common/SitePriceDisplay';

const EMAIL_DOMAIN_OPTIONS = ["naver.com", "daum.net", "gmail.com", "nate.com", "hanmail.net"];
const ORDER_RETRY_DRAFT_KEY = 'orderFormRetryDraft';
const ORDER_PAYMENT_FAIL_RECHECK_TOAST_ID = 'order-payment-fail-recheck';
const ORDER_PAYMENT_FAIL_RESTORED_TOAST_ID = 'order-payment-fail-restored';
const ORDER_PAYMENT_FAIL_RESTORE_ERROR_TOAST_ID = 'order-payment-fail-restore-error';

const OrderForm = () => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate(); 
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { member, setMember } = useContext(MemberContext);
    const initialItems = location.state?.orderItems || [];
    
    const [orderItems, setOrderItems] = useState(() => 
        initialItems.map(it => ({
            ...it,
            finishType: it.finishType ?? 'glossy',
            // 보정 기본값 보정 (없으면 0)
            retouchEnabled: it.retouchEnabled ?? 0,
            retouchTypes: it.retouchTypes ?? "",
            retouchNote: it.retouchNote ?? ""
        }))
    );

    const isLoggedInMember = !!member?.id;
    const isGuest = location.state?.isGuest === true || !isLoggedInMember;
    const [guestPwdMatch, setGuestPwdMatch] = useState(null);

    // 비회원 주문조회 비밀번호
    const [guestPassword, setGuestPassword] = useState('');
    const [guestPasswordConfirm, setGuestPasswordConfirm] = useState('');

    useEffect(() => {
        if (!isGuest) return;

        if (!guestPassword || !guestPasswordConfirm) {
            setGuestPwdMatch(null);
            return;
        }

        setGuestPwdMatch(guestPassword === guestPasswordConfirm);
    }, [isGuest, guestPassword, guestPasswordConfirm]);

    const [paymentMethod, setPaymentMethod] = useState('');

    // 기본 로그인 사용자 정보
    const [phone1, setPhone1] = useState('010');
    const [phone2, setPhone2] = useState('');
    const [phone3, setPhone3] = useState('');
    const [ordererName, setOrdererName] = useState('');
    const [ordererPhone, setOrdererPhone] = useState('');
    const [credit, setCredit] = useState('');
    const [buyerRequest, setBuyerRequest] = useState('');
    const [deliveryMessage, setDeliveryMessage] = useState('');

    // 배송 수신자 번호
    const [recipientPhone1, setRecipientPhone1] = useState('010');
    const [recipientPhone2, setRecipientPhone2] = useState('');
    const [recipientPhone3, setRecipientPhone3] = useState('');

    useEffect(() => {
        if (member) {
            setOrdererName(member.name || '');
            setOrdererPhone(member.phone || '');

            // 전화번호 분할
            if (member.phone) {
                const cleaned = member.phone.replace(/\s+/g, '-');
                const [p1, p2, p3] = cleaned.split('-');
                setPhone1(p1 || '010');
                setPhone2(p2 || '');
                setPhone3(p3 || '');
            }
        }
    }, [member]);

    // 이메일 입력
    const [ emailLocal, setEmailLocal ] = useState('');
    const [ emailDomain, setEmailDomain ] = useState('naver.com');
    const [ customDomain, setCustomDomain ] = useState('');

    useEffect(() => {
        if (member?.email) {
            const [local, domain] = member.email.split('@');
            setEmailLocal(local);

            // 도메인이 셀렉트박스에 없는 값이면 '직접입력'으로 간주
            if (EMAIL_DOMAIN_OPTIONS.includes(domain)) {
                setEmailDomain(domain);
            } else {
                setEmailDomain('직접입력');
                setCustomDomain(domain);
            }
        }
    }, [member]);

    const finalEmail = `${emailLocal}@${emailDomain === '직접입력' ? customDomain : emailDomain}`;
    

    // 배송지 목록 및 기본 배송지 불러오기
    const [addressList, setAddressList] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);

    useEffect(() => {
        if (member?.id) {
            axios.get(`${API}/address/${member.id}`)
                .then(res => {
                    setAddressList(res.data);
                    const defaultAddr = res.data.find(addr => addr.isDefault);
                    if (defaultAddr) {setSelectedAddress(defaultAddr);
                        setRecipient(defaultAddr.recipient || '');
                        setPostcode(defaultAddr.postcode || '');
                        setAddress(defaultAddr.address || '');
                        setDetailAddress(defaultAddr.detailAddress || '');
                        setCredit(defaultAddr.credit);
                    }
                })
                .catch(err => console.error("배송지 불러오기 실패", err));
            
            axios.get(`${API}/member/credit`, { params: { id: member.id }})
                .then(res => {
                    setCredit(res.data.credit || 0);
                })
        }
    }, [member]);

    const [recipient, setRecipient] = useState('');
    const [postcode, setPostcode] = useState('');
    const [address, setAddress] = useState('');
    const [detailAddress, setDetailAddress] = useState('');
    const [isSameAsOrderer, setIsSameAsOrderer] = useState(false);

    useEffect(() => {
        if (!selectedAddress) return;
        
        setRecipient(selectedAddress.recipient || '');
        setPostcode(selectedAddress.postcode || '');
        setAddress(selectedAddress.address || '');
        setDetailAddress(selectedAddress.detailAddress || '');

        const raw = (selectedAddress.recipientPhone || selectedAddress.phone || '').replace(/\s+/g, '-');
        const [p1, p2, p3] = raw.split('-');
        setRecipientPhone1(p1 || '010');
        setRecipientPhone2(p2 || '');
        setRecipientPhone3(p3 || '');
    }, [selectedAddress]);

    useEffect(() => {
        if (!isSameAsOrderer) return;
        setRecipient(ordererName);
        setRecipientPhone1(phone1);
        setRecipientPhone2(phone2);
        setRecipientPhone3(phone3);
    }, [isSameAsOrderer, ordererName, phone1, phone2, phone3]);

    // 보증금 계산
    const totalDeposit = location.state?.totalDeposit || 0;
    const deposit = totalDeposit;

    // 크레딧 계산
    const [usedCredit, setUsedCredit] = useState(0);

    // OrderForm에서 수정 가능한 주문 아이템 상태로 복사
    const [items, setItems] = useState(() => 
        (orderItems || []).map((it) => ({
            ...it,
            finishType: it.finishType ?? 'glossy',
            // customFrames에서 넘어온 값 정규화
            retouchEnabled: it.retouchEnabled ?? 0,
            retouchTypes: it.retouchTypes ?? null,
            retouchNote: it.retouchNote ?? null,
        }))
    );

    // 총합 계산 ( 최종 결제금액 )
    const originalSubtotal = items.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.quantity),
        0
    );
    const totalPrice = items.reduce(
        (sum, item) =>
            sum + getDiscountedUnitPrice(item.price) * Number(item.quantity),
        0
    );
    const deliveryFee = 0;
    const finalPrice = Math.max(totalPrice - usedCredit + deliveryFee + deposit, 0);
    

    // 예시 유효성 검사 (결제 버튼 클릭 시)
    const validateOrder = () => {
        if (!ordererName.trim()) {
            toast.error("주문자 이름을 입력해주세요.");
            return false;
        }

        if (isGuest) {
            if (!guestPassword || guestPassword.length < 6 || guestPassword.length > 20) {
                toast.error("비회원 주문 비밀번호를 입력해주세요. (6자 이상 ~ 20자 이하)");
                return false;
            }

            if (guestPwdMatch === false) {
                toast.error("비회원 주문 비밀번호가 일치하지 않습니다.");
                return false;
            }
        }

        if (!phone2.trim() || !phone3.trim()) {
            toast.error("휴대폰 번호를 입력해주세요.");
            return false;
        }

        if (!emailLocal.trim() || (emailDomain === '직접입력' && !customDomain.trim())) {
            toast.error("이메일을 정확히 입력해주세요.");
            return false;
        }

        if (!recipient.trim() || !postcode.trim() || !address.trim()) {
            toast.error("배송지 정보를 모두 입력해주세요.");
            return false;
        }

        if (!paymentMethod) {
            toast.error("결제수단을 선택해주세요.");
            return false;
        }

        const agreeCheck = document.getElementById("agree");
        if (!agreeCheck?.checked) {
            toast.error("결제 진행 동의에 체크해주세요.");
            return false;
        }
        return true;
    }

    // [결제 / 무통장입금]
    const [bankAccount, setBankAccount] = useState('');
    const [depositor, setDepositor] = useState('');
    const [receiptType, setReceiptType] = useState('');
    const [receiptInfo, setReceiptInfo] = useState(''); // 휴대폰번호 or 사업자 번호
    const [receiptMethod, setReceiptMethod] = useState('휴대폰번호'); // 선택된 방법 (개인일 경우)

    const saveOrderRetryDraft = (method) => {
        const retryDraft = {
            ordererName,
            phone1,
            phone2,
            phone3,
            emailLocal,
            emailDomain,
            customDomain,
            recipient,
            postcode,
            address,
            detailAddress,
            recipientPhone1,
            recipientPhone2,
            recipientPhone3,
            usedCredit,
            paymentMethod: method,
            depositor,
            bankAccount,
            receiptType,
            receiptInfo,
            receiptMethod,
            buyerRequest,
            deliveryMessage,
            guestPassword: isGuest ? guestPassword : '',
            items,
            savedAt: Date.now(),
        };

        sessionStorage.setItem(ORDER_RETRY_DRAFT_KEY, JSON.stringify(retryDraft));
    };

    useEffect(() => {
        const paymentFail = searchParams.get('paymentFail');
        if (!paymentFail) return;

        const raw = sessionStorage.getItem(ORDER_RETRY_DRAFT_KEY);
        if (!raw) {
            toast.error('결제가 완료되지 않았습니다. 주문 정보를 다시 확인해 주세요.', {
                toastId: ORDER_PAYMENT_FAIL_RECHECK_TOAST_ID,
            });
            return;
        }

        try {
            const draft = JSON.parse(raw);
            const restoredItems = Array.isArray(draft.items) ? draft.items : [];
            setItems(restoredItems);
            setOrderItems(restoredItems);

            setOrdererName(draft.ordererName || '');
            setPhone1(draft.phone1 || '010');
            setPhone2(draft.phone2 || '');
            setPhone3(draft.phone3 || '');

            setEmailLocal(draft.emailLocal || '');
            if (EMAIL_DOMAIN_OPTIONS.includes(draft.emailDomain)) {
                setEmailDomain(draft.emailDomain);
                setCustomDomain('');
            } else {
                setEmailDomain('직접입력');
                setCustomDomain(draft.customDomain || '');
            }

            setRecipient(draft.recipient || '');
            setPostcode(draft.postcode || '');
            setAddress(draft.address || '');
            setDetailAddress(draft.detailAddress || '');
            setRecipientPhone1(draft.recipientPhone1 || '010');
            setRecipientPhone2(draft.recipientPhone2 || '');
            setRecipientPhone3(draft.recipientPhone3 || '');

            setUsedCredit(draft.usedCredit || 0);
            setPaymentMethod(draft.paymentMethod || '');
            setDepositor(draft.depositor || '');
            setBankAccount(draft.bankAccount || '');
            setReceiptType(draft.receiptType || '');
            setReceiptInfo(draft.receiptInfo || '');
            setReceiptMethod(draft.receiptMethod || '휴대폰번호');
            setBuyerRequest(draft.buyerRequest || '');
            setDeliveryMessage(draft.deliveryMessage || '');

            if (isGuest) {
                setGuestPassword(draft.guestPassword || '');
                setGuestPasswordConfirm(draft.guestPassword || '');
            }

            toast.error('결제가 완료되지 않아 기존 주문서 정보를 복원했습니다.', {
                toastId: ORDER_PAYMENT_FAIL_RESTORED_TOAST_ID,
            });
        } catch (e) {
            toast.error('결제 실패 후 주문서 복원에 실패했습니다.', {
                toastId: ORDER_PAYMENT_FAIL_RESTORE_ERROR_TOAST_ID,
            });
        }
    }, [searchParams, isGuest]);

    // 상세주소 검색
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const detailInputRef = useRef(null); // 상세주소로 포커스 이동용

    // Daum 우편번호 스크립트 로딩
    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
        script.async = true;
        script.onload = () => setScriptLoaded(true);
        document.body.appendChild(script);
        
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const openPostcodePopup = () => {
        if (!scriptLoaded || !window.daum?.Postcode) {
            toast.error('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
            return;
        }

        new window.daum.Postcode({
            oncomplete: function (data) {
                setPostcode(data.zonecode);
                setAddress(data.roadAddress || data.jibunAddress);

                // ✅ 상세주소 입력창으로 자동 포커스
                setTimeout(() => {
                    detailInputRef.current?.focus();
                }, 100);
            }
        }).open();
    };

    // 주문
    // 가상계좌 발급 요청 -> 응답에서 계좌번호/은행/입금기한 받기 -> 그 정보 포함해서 주문 저장 -> 완료 페이지에서 고객에게 계좌 안내
    const handleOrder = async () => {
        if (!validateOrder()) return;

        // 무통장 입금
        if (paymentMethod === "가상계좌") {
            try {
              saveOrderRetryDraft('가상계좌');
              // 1) 주문 데이터 draft 저장 (카드용 orderData랑 거의 동일, 상태만 다르게)
              const orderData = {
                id: member ? member.id : '',
                ordererName,
                ordererPhone: `${phone1}-${phone2}-${phone3}`,
                email: finalEmail,
                recipient,
                postcode,
                address,
                detailAddress,
                usedCredit,
                paymentMethod: '가상계좌',
                depositor,
                bankAccount,
                receiptType,
                receiptInfo,
                receiptMethod,
                totalPrice,
                totalDeposit,
                finalPrice,
                deliveryFee,
                deliveryMessage,
                buyerRequest,
                recipientPhone: `${recipientPhone1}-${recipientPhone2}-${recipientPhone3}`,
                guestPassword: isGuest ? guestPassword : null,
                nicepayTid: null,
                nicepayOrderId: null,
                payMethodCode: null,
                vbankCode: null,
                vbankName: null,
                vbankAccount: null,
                vbankHolder: null,
                vbankDueDate: null,
                webhookLastStatus: null,
                items: items.map(item => ({
                  cid: item.cid,
                  pid: item.pid,
                  category: item.category,
                  title: item.title,
                  author: item.author,
                  quantity: item.quantity,
                  price: getDiscountedUnitPrice(item.price),
                  period: item.period,
                  size: item.size,
                  thumbnail: item.thumbnail,
                  thumbnailPreview: item.thumbnailPreview,
                  orderStatus: '입금대기',    // ★ 가상계좌는 입금대기
                  deposit: item.deposit,
                  finishType: item.finishType ?? 'glossy',
                  retouchEnabled: item.retouchEnabled ?? 0,
                  retouchTypes: item.retouchEnabled ? (item.retouchTypes ?? null) : null,
                  retouchNote: item.retouchEnabled ? (item.retouchNote ?? null) : null,
                }))
              };
              const res = await axios.post(`${API}/payment/nicepay/vbank/prepare`, orderData);
              if (!res.data.success || !res.data.orderId) {
                toast.error('가상계좌 준비에 실패했습니다.');
                return;
              }
              const draftOrderId = res.data.orderId;
              // 2) JS 결제창 호출 (method: 'vbank')
              requestVBankPayment({
                orderId: draftOrderId,
                ordererName,
                phone: `${phone1}-${phone2}-${phone3}`,
                email: finalEmail,
                // amount: finalPrice, // 테스트 끝나면 500 → finalPrice
                amount: finalPrice, // 테스트 끝나면 500 → finalPrice
                onFail: () => toast.error('가상계좌 발급에 실패했습니다. 다시 시도해주세요.')
              });
            } catch (err) {
              console.error(err);
              toast.error('가상계좌 준비 중 오류가 발생했습니다.');
            }
            return;
        }

        // 카드결제
        if (paymentMethod === '카드결제') {
            saveOrderRetryDraft('카드결제');
            const orderData = {
                id: member ? member.id : '',
                ordererName,
                ordererPhone: `${phone1}-${phone2}-${phone3}`,
                email: finalEmail,
                recipient,
                postcode,
                address,
                detailAddress,
                usedCredit,
                paymentMethod: '카드결제',
                depositor,
                bankAccount,
                receiptType,
                receiptInfo,
                receiptMethod,
                totalPrice,
                totalDeposit,
                finalPrice,
                deliveryFee,
                deliveryMessage,
                buyerRequest,
                recipientPhone: `${recipientPhone1}-${recipientPhone2}-${recipientPhone3}`,
                guestPassword: isGuest ? guestPassword : null,
                nicepayTid: null,
                nicepayOrderId: null,
                payMethodCode: null,
                vbankCode: null,
                vbankName: null,
                vbankAccount: null,
                vbankHolder: null,
                vbankDueDate: null,
                webhookLastStatus: null,
                items: items.map(item => ({
                    cid: item.cid,
                    pid: item.pid,
                    category: item.category,
                    title: item.title,
                    author: item.author,
                    quantity: item.quantity,
                    price: getDiscountedUnitPrice(item.price),
                    period: item.period,
                    size: item.size,
                    thumbnail: item.thumbnail,
                    thumbnailPreview: item.thumbnailPreview,
                    orderStatus: '결제완료',
                    deposit: item.deposit,
                    finishType: item.finishType ?? 'glossy',
                    retouchEnabled: item.retouchEnabled ?? 0,
                    retouchTypes: item.retouchEnabled ? (item.retouchTypes ?? null) : null,
                    retouchNote: item.retouchEnabled ? (item.retouchNote ?? null) : null,
                }))
            };
            try { // 카드 결제 수정하려면 여기 수정하세요
                const res = await axios.post(`${API}/payment/nicepay/prepare`, orderData);
                if (!res.data.success || !res.data.orderId) {
                    toast.error('결제 준비에 실패했습니다.');
                    return;
                }
                const draftOrderId = res.data.orderId;
                requestCardPayment({
                    orderId: draftOrderId,
                    ordererName,
                    phone: `${phone1}-${phone2}-${phone3}`,
                    email: finalEmail,
                    amount: finalPrice, // 테스트용 500원 (운영 시 finalPrice로 변경)
                    onFail: () => toast.error('결제가 실패했습니다. 다시 시도해주세요.')
                });
            } catch (err) {
                console.error(err);
                toast.error('결제 준비 중 오류가 발생했습니다.');
            }
            return;
        }

        // 카카오페이 결제
        if (paymentMethod === '카카오페이') {
            requestKakaoPay({
                ordererName,
                phone: `${phone1}-${phone2}-${phone3}`,
                email: finalEmail,
                amount: finalPrice,
                onSuccess: async () => {
                    await submitOrder();
                },
                onFail: () => {
                    toast.error('결제가 실패했습니다. 다시 시도해주세요.');
                }
            });
            return;
        }

        // 실시간계좌이체(토스) 결제
        if (paymentMethod === '실시간계좌이체') {
            requestRealTimeTransfer({
                ordererName,
                phone: `${phone1}-${phone2}-${phone3}`,
                email: finalEmail,
                amount: finalPrice,
                onSuccess: async () => {
                    await submitOrder();
                },
                onFail: () => {
                    toast.error('결제가 실패했습니다. 다시 시도해주세요.');
                }
            });
            return;
        }
    }

    const submitOrder = async (paymentExtra = {}) => {

        const finalPaymentMethod = paymentExtra.paymentMethod || paymentMethod;
        const finalOrderStatus = finalPaymentMethod === "가상계좌" ? "입금대기" : "결제완료";
        
        const orderData = {
            id: member ? member.id : '',
            ordererName,
            ordererPhone: `${phone1}-${phone2}-${phone3}`,
            email:finalEmail,
            recipient,
            postcode,
            address,
            detailAddress,
            usedCredit,

            paymentMethod: finalPaymentMethod,

            depositor,
            bankAccount,
            receiptType,
            receiptInfo,
            receiptMethod,
            totalPrice,
            totalDeposit,
            finalPrice,
            deliveryFee,
            deliveryMessage,
            buyerRequest,
            recipientPhone: `${recipientPhone1}-${recipientPhone2}-${recipientPhone3}`,
            guestPassword: isGuest ? guestPassword : null,

            // 나이스페이 결제 정보
            nicepayTid: paymentExtra.nicepayTid || null,
            nicepayOrderId: paymentExtra.nicepayOrderId || null,
            payMethodCode: paymentExtra.payMethodCode || null,

            // 가상계좌 정보
            vbankCode: paymentExtra.vbankCode || null,
            vbankName: paymentExtra.vbankName || null,
            vbankAccount: paymentExtra.vbankAccount || null,
            vbankHolder: paymentExtra.vbankHolder || null,
            vbankDueDate: paymentExtra.vbankDueDate || null,

            // 웹훅 상태
            webhookLastStatus: paymentExtra.webhookLastStatus || null,

            items: items.map(item => ({
                cid: item.cid,
                pid: item.pid,
                category : item.category,
                title: item.title,
                author: item.author,
                quantity: item.quantity,
                price: getDiscountedUnitPrice(item.price),
                period: item.period,
                size: item.size,
                // 맞춤액자는 주문 확정 시 multipart 파일로 업로드 후 서버에서 URL 세팅
                thumbnail: item.category === 'customFrames' ? null : item.thumbnail,
                thumbnailPreview: item.category === 'customFrames' ? null : item.thumbnailPreview,
                orderStatus: finalOrderStatus,
                deposit: item.deposit,
                finishType: item.finishType ?? 'glossy',

                // 보정
                retouchEnabled: item.retouchEnabled ?? 0,
                retouchTypes: item.retouchEnabled ? (item.retouchTypes ?? null) : null,
                retouchNote: item.retouchEnabled ? (item.retouchNote ?? null) : null,
            }))
        };

        

        try {
            const formData = new FormData();
            formData.append('orderJson', JSON.stringify(orderData));

            items.forEach((item) => {
                if (item.category === 'customFrames' && item.thumbnailFile instanceof File) {
                    formData.append('customFrameFiles', item.thumbnailFile);
                }
                if (item.category === 'customFrames' && item.thumbnailPreviewFile instanceof File) {
                    formData.append('customFramePreviewFiles', item.thumbnailPreviewFile);
                }
            });

            const response = await axios.post(`${API}/order/insert`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                sessionStorage.removeItem(ORDER_RETRY_DRAFT_KEY);
                // 장바구니 삭제
                if (!isGuest && member?.id) {
                    await axios.post(`${API}/order/deleteList`, {
                        id: member.id,
                        cidList: orderItems.map(item => item.cid),         
                });
            }

                toast.success("주문이 완료되었습니다.");

                navigate('/orderComplete', {
                    state: {
                        oid: response.data.oid,
                        paymentMethod: finalPaymentMethod,
                        finalPrice,
                        address: `${address} ${detailAddress}`,
                        guestPassword: isGuest ? guestPassword : null,

                        // 무통장일 때 보여줄 정보
                        bankTransferInfo: finalPaymentMethod === "가상계좌" ? {
                            bankAccount: paymentExtra.vbankAccount || '',
                            bankName: paymentExtra.vbankName || '',
                            holder: paymentExtra.vbankHolder || '',
                            dueDate: paymentExtra.vbankDueDate || '',
                            receiptType,
                            receiptMethod,
                            receiptInfo,
                        } : null
                    }
                });
            } else {
                toast.error("주문에 실패했습니다. 다시 시도해주세요.");
            }
        } catch (error) {
            console.error("주문 요청 실패:", error);
            toast.error("서버 오류로 주문을 처리할 수 없습니다.");
        }
    }

    // 인치 -> cm 변환
    const convertInchToCm = (size) => {
        if (!size) return "";
        if (!size.includes('X')) return size;
        const [inchW, inchH] = size.split(/[xX]/).map(s => s.trim());
        const cmW = (parseFloat(inchW) * 2.54).toFixed(1);
        const cmH = (parseFloat(inchH) * 2.54).toFixed(1);
        return `${inchW} x ${inchH} (${cmW}cm x ${cmH}cm)`;
    }

    const convertCategoryName = (category) => {
        if (category === "masterPiece") {
            return "명화";
        } else if (category === "fengShui") {
            return "풍수그림";
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

    // 보정 모달
    const isCustomFrames = (item) => item.category === 'customFrames';
    
    // 모달 입력용 로컬 state
    // const [mRetouchEnabled, setMRetouchEnabled] = useState(0);
    // const [mRetouchTypes, setMRetouchTypes] = useState([]);
    // const [mRetouchNote, setMRetouchNote] = useState("");

    const retouchOptions = [
        "피부 보정", 
        "얼굴 디테일 보정", 
        "얼굴 라인·몸매 보정", 
        "이미지 역광 및 색감보정", 
        "불필요한 배경 삭제 및 변경",
        "업스케일링 (흐릿한 사진 선명보정)",
    ];

    // 보정 요청 모달 상태
    const [retouchTargetIndex, setRetouchTargetIndex] = useState(null);
    const [retouchModalOpen, setRetouchModalOpen] = useState(false);
    // const [editingIndex, setEditingIndex] = useState(null);

    const [retouchDraft, setRetouchDraft] = useState({
        enabled: true,
        types: [],
        note: '',
    });

    const openRetouchModal = (idx) => {
        const target = items[idx];
    
        const enabled = (target.retouchEnabled ?? 0) === 1;
    
        const labelSet = new Set(CUSTOM_FRAME_RETOUCH_OPTION_LABELS);
        const typesArr = (
            target.retouchTypes && typeof target.retouchTypes === 'string'
                ? target.retouchTypes.split(',').map((s) => s.trim()).filter(Boolean)
                : Array.isArray(target.retouchTypes)
                    ? target.retouchTypes
                    : []
        ).filter((t) => labelSet.has(t));
    
        setRetouchTargetIndex(idx);
        setRetouchDraft({
            enabled: true,
            types: enabled ? typesArr : [],
            note: enabled ? (target.retouchNote ?? '') : '',
        });
        setRetouchModalOpen(true);
    };

    const cancelRetouchFromModal = () => {
        if (retouchTargetIndex === null) return;
    
        const target = items[retouchTargetIndex];
        const hasRetouch =
            Number(target?.retouchEnabled ?? 0) === 1 ||
            (target?.retouchTypes ?? '').toString().trim().length > 0 ||
            (target?.retouchNote ?? '').toString().trim().length > 0;
        
        if (!hasRetouch) {
            closeRetouchModal();
            return;
        }
    
        setItems((prev) =>
            prev.map((it, idx) => {
                if (idx !== retouchTargetIndex) return it;
                return {
                    ...it,
                    retouchEnabled: 0,
                    retouchTypes: null,
                    retouchNote: null,
                };
            })
        );
    
        setRetouchModalOpen(false);
        setRetouchTargetIndex(null);
        toast.success('보정 요청이 취소되었습니다.');
    };

    const closeRetouchModal = () => {
        setRetouchModalOpen(false);
        setRetouchTargetIndex(null);
    };

    const saveRetouch = () => {
        if (retouchTargetIndex === null) return;
    
        if (retouchDraft.types.length === 0) {
            toast.warn('보정 항목을 하나 이상 선택해주세요.');
            return;
        }
    
        setItems((prev) =>
            prev.map((it, idx) => {
                if (idx !== retouchTargetIndex) return it;
    
                const enabledVal = 1;
                const typesStr = retouchDraft.types.join(', ');
                const noteStr = retouchDraft.note ?? '';
    
                return {
                    ...it,
                    retouchEnabled: enabledVal,
                    retouchTypes: typesStr,
                    retouchNote: noteStr,
                };
            })
        );
    
        setRetouchModalOpen(false);
        setRetouchTargetIndex(null);
        toast.success("요청사항이 접수되었습니다. 보정 완료 시 문자로 안내해 드리겠습니다.");
    };

    // const toggleRetouchType = (label) => {
    //     setMRetouchTypes(prev => 
    //         prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label]
    //     );
    // };

    // const saveRetouchModal = () => {
    //     if (editingIndex === null) return;

    //     // enabled가 0이면 types/note 비우는 게 안전
    //     const nextEnabled = Number(mRetouchEnabled);

    //     const nextItem = {
    //         ...orderItems[editingIndex],
    //         retouchEnabled: nextEnabled,
    //         retouchTypes: nextEnabled ? mRetouchTypes.join(',') : "",
    //         retouchNote: nextEnabled ? (mRetouchNote ?? "") : ""
    //     };

    //     setOrderItems(prev => prev.map((it, idx) => (idx === editingIndex ? nextItem : it)));
    //     setRetouchModalOpen(false);
    //     setEditingIndex(null);
    // }

    return (
        <div className="flex flex-col w-full items-center mt-20">
            <div 
                className="
                    flex 
                    text-[20px] md:text-[24px]
                    font-bold pb-2 justify-center mb-5">주문/결제</div>

            <div className="
                w-full font-bold mb-2
                text-[16px] md:text-[18px]"
            >
                <span className="ml-2">주문상품</span>
                <hr />
            </div>

            {/* <div className="
                flex flex-row w-full text-center px-5 mt-4 font-medium 
                text-[13px] md:text-base">
                <div className="w-[60%]"><span>상품정보</span></div>
                <div className="w-[15%]"><span>수량</span></div>
                <div className="w-[25%]"><span>주문금액</span></div>
            </div> */}
            
            {/* 물건 */}
            <div className="flex flex-col gap-2 w-full max-h-[200px] md:max-h-[300px] overflow-y-scroll">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className="
                            flex flex-row w-full h-full
                            px-2 md:px-5 
                            py-2">
                        <div className="
                            flex w-[58%] h-fit
                            gap-[6px] md:gap-3"
                        >
                            <img src={item.thumbnailPreview || item.thumbnail}  
                                className="
                                    shrink-0
                                    md:w-[100px] w-[clamp(70px,13.03vw,100px)]
                                    md:h-[100px] h-[clamp(70px,13.03vw,100px)]" alt={item.title} />
                            <div 
                                className="
                                    flex flex-col justify-between
                                    text-[13px] md:text-base
                                ">
                                <div className="flex flex-col">
                                    <span className="
                                        font-semibold line-clamp-1">{item.title}
                                    </span>
                                    <span className="text-gray-500 text-[12px]">
                                        {item.author}
                                    </span>
                                </div>
                            
                                <div 
                                    className="
                                        flex flex-col items-start
                                        text-[12px] md:text-[14px]"
                                >
                                    {/* <span className="
                                        font-semibold 
                                        md:text-sm text-[clamp(10px,1.8252vw,14px)]">
                                            {item.price.toLocaleString()}원
                                    </span> */}

                                    <span className="text-gray-500">
                                        {convertCategoryName(item.category)} / {item.finishType === 'matte' ? '무광' : '유광'}
                                    </span>
                                    <span className="text-gray-500">
                                        사이즈 : {convertInchToCm(item.size)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="
                            flex justify-end items-end w-[12%]
                            md:text-xl text-[clamp(14px,2.607vw,20px)]"
                        >
                            <span className="font-medium">
                                {item.quantity}개
                            </span>
                        </div>

                        <div className="flex justify-end items-end w-[30%] text-end flex-1">
                            <div className="flex flex-col justify-between h-full">
                                {/* 보정 확인 수정 버튼 */}
                                {isCustomFrames(item) && (
                                    <div className='w-full h-full'>
                                        <div className={`
                                                top-0 text-[12px] 
                                                ${Number(item.retouchEnabled) === 1 ? 'text-black' : 'text-gray-500'} `}
                                        >
                                            {/* <span className="font-semibold">보정:</span>{" "} */}
                                            <button
                                                type="button"
                                                onClick={() => openRetouchModal(index)}
                                                className='ml-1 px-2 py-1 rounded border text-[clamp(10px,1.56vw,12px)] hover:bg-gray-50'
                                            >
                                                {Number(item.retouchEnabled) === 1 ?  '보정 수정' : '보정 요청'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <SitePriceRow
                                    unitPrice={item.price}
                                    quantity={Number(item.quantity)}
                                    neutralClassName={`${SITE_PRICE_TEXT} font-bold`}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {/* 물건 */}
            <hr/>

            <div className="
                w-full mt-10 font-bold 
                text-[16px] md:text-[18px]"
            >
                <span className="ml-2">주문자 정보</span>
            </div>

            <div className="
                w-full mx-auto mb-10
                md:text-base text-[clamp(11px,2.085vw,16px)]
            ">
                <hr/>
                <div className="
                    flex md:flex-row flex-col md:items-center items-start
                    mt-3 mx-3 mb-3">
                    <div className="w-[150px] 
                        text-[13px] md:text-base"
                    >
                        주문자 이름
                    </div>
                    <input 
                        type="text" 
                        value={ordererName} 
                        onChange={(e) => setOrdererName(e.target.value)} 
                        className="
                        text-[13px] md:text-base    
                        md:w-[200px] w-full border-[1px] h-8 px-2"
                    />
                </div>

                <hr/>

                <div className="
                    flex md:flex-row flex-col md:items-center items-start 
                    mt-3 mx-3 mb-3">
                    <div className="w-[150px] 
                        text-[13px] md:text-base">
                        주문자 연락처
                    </div>
                    <div className="md:w-auto w-full flex gap-1">
                        <select className="
                            text-[13px] md:text-base
                            md:w-[100px] w-1/3 gap-1 h-8 border border-gray-300" 
                            value={phone1} 
                            onChange={(e) => setPhone1(e.target.value)}
                        >
                            <option value="010">010</option>
                            <option value="011">011</option>
                            <option value="016">016</option>
                            <option value="017">017</option>
                            <option value="018">018</option>
                            <option value="019">019</option>
                        </select>
                        <input 
                            type="text" 
                            value={phone2} 
                            onChange={(e) => setPhone2(e.target.value)} 
                            maxLength="4" 
                            inputMode="numeric" 
                            className="
                                text-[13px] md:text-base
                                md:w-[100px] w-1/3 h-8 border border-gray-300 pl-2"
                        />
                        <input 
                            type="text" 
                            value={phone3} 
                            onChange={(e) => setPhone3(e.target.value)} 
                            maxLength="4" 
                            inputMode="numeric" 
                            className="
                                text-[13px] md:text-base
                                md:w-[100px] w-1/3 h-8 border border-gray-300 pl-2"
                        />
                    </div>
                </div>

                <hr/>

                <div className="flex md:flex-row flex-col items-start mt-3 ml-3 mb-3">
                    <div className="
                        w-[150px] 
                        text-[13px] md:text-base"
                    >
                        이메일
                    </div>
                        <div className="
                            flex flex-col 
                            text-[13px] md:text-base"
                        >
                            <div className="flex flex-row items-end">
                                <input 
                                    type="text" 
                                    value={emailLocal} 
                                    onChange={(e) => setEmailLocal(e.target.value)} 
                                    className="
                                        text-[13px] md:text-base
                                        md:w-[200px] w-1/2 border-[1px] h-8 pl-2" 
                                />
                                <span className="text-[15px] md:mx-2 mx-1">@</span>
                                {emailDomain === '직접입력' ? (
                                    <input type="text" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} className="md:w-[200px] w-1/2 border-[1px] h-8 pl-2" 
                                    />
                                ) : (
                                    <input type="hidden" value={emailDomain} readOnly className="md:w-[200px] w-1/2 border-[1px] h-8 pl-2" />
                                )}

                                <select className="md:w-[200px] w-1/2 border-[1px] h-8" value={emailDomain} onChange={(e) => setEmailDomain(e.target.value)}>
                                    <option value="naver.com">naver.com</option>
                                    <option value="daum.net">daum.net</option>
                                    <option value="gmail.com">gmail.com</option>
                                    <option value="nate.com">nate.com</option>
                                    <option value="hanmail.net">hanmail.net</option>
                                    <option value="직접입력">직접입력</option>
                                </select>    
                            </div>
                    </div>
                </div>

                {isGuest && ( 
                    <>
                        <hr/>
                        <div className="flex md:flex-row flex-col items-start mt-3 ml-3 mb-3">
                            <div className="w-[150px]">
                                <span className="text-[13px] md:text-base">
                                    주문조회 비밀번호
                                </span>
                            </div>
                            <div className="flex flex-col">
                                <input
                                    type="password"
                                    value={guestPassword}
                                    onChange={(e) => setGuestPassword(e.target.value)}
                                    className="
                                        text-[13px] md:text-base    
                                        md:w-[200px] w-full border-[1px] h-8 px-2"
                                />
                                <span className="
                                    mt-1
                                    md:text-xs text-[11px]">
                                    (6자 이상 20자 이하)
                                </span>
                            </div>
                        </div>

                        <hr/>
                        <div className="flex md:flex-row flex-col items-start mt-3 ml-3 mb-3 ">
                            <div className="
                                w-[150px] 
                                text-[13px] md:text-base"
                            >
                                비밀번호 확인
                            </div>
                            <div className="flex flex-col">
                                <input
                                    type="password"
                                    value={guestPasswordConfirm}
                                    onChange={(e) => setGuestPasswordConfirm(e.target.value)}
                                    className="
                                        text-[13px] md:text-base
                                        md:w-[200px] border-[1px] h-8 px-2"
                                />

                                {/* 실시간 일치 여부 표시 */}
                                {guestPwdMatch === false && (
                                    <span className="text-[11px] text-red-500 mt-1">비밀번호가 일치하지 않습니다.</span>
                                )}
                                {guestPwdMatch === true && (
                                    <span className="text-[11px] text-green-600 mt-1">비밀번호가 일치합니다.</span>
                                )}
                            </div>
                        </div>
                    </>    
                )}


                {/* 물건이 커스텀일 경우 (구분을 pid가 -1, -2인걸로 구분함) */}
                {/* {items.some(item => item.category === 'wall' || item.category === 'table') && (
                    <div className="flex flex-row items-center mt-3 ml-3 mb-3">
                        <div className="w-[150px] text-sm">
                            이미지
                        </div>
                        <span className="text-xs ml-1">
                            결제 후 
                            <span className="text-sm font-semibold text-blue-700"> d2one@naver.com</span>
                            으로 이미지 파일을 보내주세요 (<span className="underline px-1 text-yellow-700">탁상용, 벽걸이 액자 주문시</span>)
                        </span>
                    </div>
                )} */}
                <hr/>
            </div>
            <hr/>

            <div className="
                w-full mt-10 font-bold 
                text-[16px] md:text-[18px]">
                <span className="ml-2">배송 정보</span>
            </div>

            <div className="w-full mx-auto mb-10">
                <hr/>
                {member ? (
                <div className="
                    flex md:flex-row flex-col md:items-center items-start 
                    mt-3 mx-3 mb-3">
                    <div className="w-[150px]">
                        <label className="md:text-base text-[clamp(11px,2.085vw,16px)]">내 배송지</label>
                    </div>
                    <select className="md:w-[600px] w-full px-2 border-[1px] h-8 mt-1 text-[13px]"
                        onChange={(e) => {
                            const selected = addressList.find(addr => addr.cno === Number(e.target.value));
                            setIsSameAsOrderer(false);
                            setSelectedAddress(selected);
                        }}
                        value={selectedAddress?.cno ?? (addressList.find(a => a.is_default)?.cno || '')}>
                        {addressList.length === 0 && (
                            <option value="" disabled hidden>- 저장된 배송지를 선택하세요</option>
                        )}
                        {addressList.length > 0 &&
                            addressList.map(addr => (
                                <option key={addr.cno} value={addr.cno}>
                                    [{addr.label}] {addr.recipient} / {addr.address} {addr.detailAddress}
                                </option>
                        ))}
                        {addressList.length === 0 && (
                            <option value="">리스트가 없습니다</option>
                        )}
                    </select>
                </div>
                ) : (
                    <div></div>
                )}

                <hr/>
                <div className="
                    flex md:flex-row flex-col md:items-center items-start 
                    text-[13px] md:text-base
                    mt-3 mx-3 mb-3">
                    <div className="
                        w-[150px]
                        flex md:flex-col flex-row md:items-start items-center md:gap-1 gap-2
                        text-[13px] md:text-base"
                    >
                        <span>받는 사람</span>
                        <label className="inline-flex items-center gap-1 cursor-pointer select-none text-[12px] text-gray-600 font-normal">
                            <input
                                type="checkbox"
                                checked={isSameAsOrderer}
                                onChange={(e) => {
                                    setIsSameAsOrderer(e.target.checked);
                                    if (e.target.checked) {
                                        setSelectedAddress(null);
                                    }
                                }}
                            />
                            <span>주문자와 동일</span>
                        </label>
                    </div>
                    <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)}
                        disabled={isSameAsOrderer}
                        className="md:w-[200px] w-full border-[1px] h-8 px-2" />
                </div>

                <hr/>

                <div className="
                    flex md:flex-row flex-col md:items-center items-start
                    text-[13px] md:text-base
                    mt-3 ml-3 mb-3">
                    <div className="w-[150px]"
                    >
                        주소
                    </div>
                    <div className="
                        md:w-auto w-full flex flex-col gap-2 pr-2">
                        <div className="flex">
                            <input type="text"  value={postcode} readOnly placeholder="우편번호" 
                                className="md:w-[200px] w-1/2 border-[1px] h-8 pl-2" />
                            <button className="
                                h-8 bg-black text-white rounded border-opacity-15 
                                md:px-4 px-2 md:ml-3 ml-1" 
                                onClick={openPostcodePopup}
                            >
                                주소검색
                            </button>
                        </div>
                        <input type="text" value={address} readOnly placeholder="기본주소" className="border-[1px] md:w-[400px] w-full h-8 px-2" />
                        <input type="text" value={detailAddress} onChange={(e) => setDetailAddress(e.target.value)} placeholder="나머지 주소(선택 입력 가능)" className="border-[1px] h-8 px-2" />
                    </div>
                </div>

                <hr/>

                <div className="
                    text-[13px] md:text-base
                    flex md:flex-row flex-col md:items-center items-start 
                    mt-3 ml-3 mb-3">
                    <div className="w-[150px]"
                    >
                        휴대전화
                    </div>
                    <div className="
                        flex md:w-auto w-full gap-1">
                        <select 
                            className=" w-[100px] h-8 border border-gray-300 pl-2"
                            value={recipientPhone1}    
                            onChange={(e) => setRecipientPhone1(e.target.value)}
                            disabled={isSameAsOrderer}
                        >
                                <option>010</option>
                                <option>011</option>
                                <option>016</option>
                                <option>017</option>
                                <option>018</option>
                                <option>019</option>
                        </select>
                        <input 
                            type="text" 
                            value={recipientPhone2}
                            onChange={(e) => setRecipientPhone2(e.target.value)}
                            disabled={isSameAsOrderer}
                            maxLength="4" 
                            inputMode="numeric" 
                            className="w-[100px] h-8 border border-gray-300 pl-2"
                        />
                        <input 
                            type="text" 
                            value={recipientPhone3}
                            onChange={(e) => setRecipientPhone3(e.target.value)}
                            disabled={isSameAsOrderer}
                            maxLength="4" 
                            inputMode="numeric" 
                            className="w-[100px] h-8 border border-gray-300 pl-2"/>
                    </div>
                </div>

                <hr/>

                <div className="
                    flex md:flex-row flex-col md:items-center items-start 
                    text-[13px] md:text-base
                    mt-3 mx-3 mb-3">
                    <div className="
                        min-w-[150px]
                        text-[13px] md:text-base"
                    >
                        배송 메세지
                    </div>
                    <input 
                        type="text" 
                        className="w-full border-[1px] h-8 px-2" 
                        value={deliveryMessage}
                        onChange={(e) => setDeliveryMessage(e.target.value)}
                    />
                </div>
                <hr/>

                <div className="
                    flex md:flex-row flex-col md:items-center items-start 
                    text-[13px] md:text-base
                    mt-3 mx-3 mb-3">
                    <div className="min-w-[150px]"
                    >
                        구매자 요청사항
                    </div>
                    <input 
                        type="text" 
                        className="w-full border-[1px] h-8 px-2" 
                        value={buyerRequest}
                        onChange={(e) => setBuyerRequest(e.target.value)}
                    />
                </div>
                <hr/>
            </div>
            <hr/>
            
            {member && (
                <>
                    <div className="
                        w-full mt-10 font-bold
                        text-[16px] md:text-[18px]">
                        <span className="ml-2">할인 / 부가결제 </span>
                    </div>

                    <div className="w-full mx-auto mb-10">
                        <hr/>
                        <div className="
                            flex md:flex-row flex-col md:items-center items-start
                            text-[13px] md:text-base
                            mt-3 ml-3 mb-3">
                            <div className="w-[150px]">
                                적립금
                            </div>
                            <div>
                                <div className="flex flex-row items-center">
                                    <input type="text" inputMode="numeric" className="w-full md:w-[120px] border-[1px] h-8 pl-2 mr-1" value={usedCredit} 
                                        onChange={(e) => {
                                            const input = Number(e.target.value);
                                            const maxCredit = Number(member?.credit || 0);

                                            if (input > maxCredit) {
                                                toast.error("보유 적립금보다 많이 입력할 수 없습니다.");
                                                setUsedCredit(maxCredit);
                                            } else if (input < 0) {
                                                setUsedCredit(0);
                                            } else {
                                                setUsedCredit(input);
                                            }
                                    }}/>
                                    <span>원</span>
                                </div>
                                <span className="
                                    text-[12px] md:text-[14px]
                                    text-right text-gray-500"
                                > (보유 : {Number(credit || 0).toLocaleString()}원)</span>
                            </div>
                        </div>
                        
                        <hr/>
                    </div>
                </>
            )}
            <div 
                className="
                    w-full mt-10 font-bold pl-2
                    text-[16px] md:text-[18px]">
                <span>결제수단</span>
            </div>

            <div className="w-full mb-10">
                <hr/>
                <div className="
                    flex flex-row h-[50px] items-center mt-3 mb-3 mx-3
                    text-[13px] md:text-base">
                    {/* 내부 값은 '카드결제' 유지 (결제 분기·저장 필드와 동일). 표시만 카드+간편결제 안내 */}
                    {[
                        { value: '가상계좌', label: '가상계좌' },
                        { value: '카드결제', label: '카드·간편결제' },
                    ].map(({ value, label }) => (
                    <button
                        key={value}
                        onClick={() => setPaymentMethod(value)}
                        className={`w-[50%] h-full border-[1px] ${paymentMethod === value ? 'bg-black text-white' : 'bg-white text-black'}`}>
                        {label}
                    </button>
                    ))}
                </div>

                {/* 💡 이 아래 부분에 각각 컴포넌트를 조건부로 렌더링합니다 */}
                {paymentMethod === "가상계좌" && (
                    <BankTransfer 
                        bankAccount={bankAccount} setBankAccount={setBankAccount}
                        depositor={depositor} setDepositor={setDepositor}
                        receiptType={receiptType} setReceiptType={setReceiptType}
                        receiptMethod={receiptMethod} setReceiptMethod={setReceiptMethod}
                        receiptInfo= {receiptInfo} setReceiptInfo={setReceiptInfo} // 휴대폰번호 or 사업자 번호
                    />
                )}

                {paymentMethod === "카카오페이" && (
                    <div className="
                        flex flex-col p-2 gap-2
                        md:text-sm text-[clamp(11px,1.8252vw,14px)]">
                        <span className="flex">- 카카오페이는 카카오톡에서 카드 등록 후 간단하게 비밀번호만으로 결제할 수 있는 빠르고 편리한 모바일 결제 서비스입니다.</span>
                        <span className="flex">- 카카오머니로 결제 시, 현금영수증 발급은 ㈜카카오페이에서 발급가능합니다.</span>
                        <span className="flex">- 카카오페이 간편결제 혜택 및 할부 적용 여부는 해당 카드사 정책에 따라 변경될 수 있습니다.</span>
                        <span className="flex">- 자세한 내용은 카카오페이에서 제공하는 카드사별 정책을 확인해주세요.</span>
                    </div>
                )}
            </div> 
            
            <div className="
                w-full mt-10 pl-2 font-bold
                text-[16px] md:text-[18px]">
                <span>결제금액 </span>
            </div>

            <div className="
                w-full mx-auto mb-10
                text-[13px] md:text-base">
                <hr/>
                <div className="flex flex-row items-center justify-between mt-3 mx-3 mb-3">
                    <div className="w-[150px]">
                        주문 금액
                    </div>
                    <SitePriceTotal
                        original={originalSubtotal}
                        discounted={totalPrice}
                        className={SITE_PRICE_TEXT}
                    />
                </div>
                <hr />
                {deposit > 0 && (
                    <>
                        <div className="flex flex-row items-center justify-between mt-3 mx-3 mb-3">
                            <div className="w-[150px] text-sm">
                                보증금
                            </div>
                            <span> {deposit.toLocaleString()} 원</span>
                        </div>
                        <hr />
                    </>
                )}
                
                <div className="flex flex-row items-center justify-between mt-3 mx-3 mb-3">
                    <div className="w-[150px]">
                        배송비
                    </div>
                    {/* <span> {deliveryFee.toLocaleString()} 원</span> */}
                    <span className="text-green-600">무료배송</span>
                </div>
                <hr />
                <div className="flex flex-row items-center justify-between mt-3 mx-3 mb-3">
                    <div className="w-[150px]">
                        할인
                    </div>
                    <span> {usedCredit.toLocaleString()} 원</span>
                </div>
                <hr />
                <div className="flex flex-row items-center justify-between mt-3 mx-3 mb-3 font-semibold">
                    <div className="w-[150px]">
                        최종 결제 금액
                    </div>
                    <span> {finalPrice.toLocaleString()} 원</span>
                </div>
                <hr/>

                <div className='flex items-center ml-3 mt-4'>
                    <input type="checkbox" id="agree" className="w-4 h-4 mr-2" />
                    <label htmlFor="agree">
                        결제 정보를 확인하였으며, 구매 진행에 동의합니다.
                    </label>
                </div>

                <div className='w-full h-[50px] px-3 mt-5'
                    onClick={handleOrder}>
                    <button className="w-full h-[50px] bg-black text-white "> <span className='font-semibold'>{finalPrice.toLocaleString()}원</span> 결제하기 </button>
                </div>
            </div>

            {/* ✅ 보정 요청 모달 (Main_CustomFrames UI 그대로) */}
            <RetouchModal
                open={retouchModalOpen}
                onClose={closeRetouchModal}
                onSave={saveRetouch}
                draft={retouchDraft}
                setDraft={setRetouchDraft}
                secondaryFooter={{
                    label: '보정 취소',
                    onClick: cancelRetouchFromModal,
                }}
            />
        </div>
    )
}

export default OrderForm