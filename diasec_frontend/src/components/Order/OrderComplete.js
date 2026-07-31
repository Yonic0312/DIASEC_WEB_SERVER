/**
 * [배포·동기화 주의] 운영 서버는 나이스페이(PG) 결제 완료·리다이렉트 처리와 맞물려 로컬과 다를 수 있습니다.
 * 로컬 파일로 서버 쪽을 통째로 덮어쓰지 마세요.
 */

import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API = process.env.REACT_APP_API_BASE;
const ORDER_RETRY_DRAFT_KEY = 'orderFormRetryDraft';

// 비회원 주문은 member id가 비어 있음 (OrderForm: 회원만 member.id 설정)
const isGuestOrderRow = (o) => {
    const id = o?.id;
    return id == null || String(id).trim() === '';
};

const OrderComplete = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const fromState = location.state || {};
    const oidFromQuery = searchParams.get('oid');
    const errorFromQuery = searchParams.get('error');

    const [oid, setOid] = useState(fromState.oid);
    const [paymentMethod, setPaymentMethod] = useState(fromState.paymentMethod);
    const [finalPrice, setFinalPrice] = useState(fromState.finalPrice);
    const [address, setAddress] = useState(fromState.address);
    const [guestPassword] = useState(fromState.guestPassword);
    const [isGuestOrder, setIsGuestOrder] = useState(!!fromState.guestPassword);
    const [bankTransferInfo, setBankTransferInfo] = useState(fromState.bankTransferInfo);
    const [loading, setLoading] = useState(!!oidFromQuery && !fromState.oid);
    const [fetchError, setFetchError] = useState(false);

    useEffect(() => {
        if (!oidFromQuery || fromState.oid) return;

        // navigate state -> sessionStorage(결제 직전 OrderFrom이 저장) 순으로 비밀번호 확보
        let guestPasswordParam = fromState.guestPassword || guestPassword || '';
        if (!guestPasswordParam) {
            try {
                const raw = sessionStorage.getItem(ORDER_RETRY_DRAFT_KEY);
                if (raw) {
                    const draft = JSON.parse(raw);
                    guestPasswordParam = draft.guestPassword || '';
                }
            } catch (_) {
                // ignore
            }
        }

        const params = {};
        if (guestPasswordParam) {
            params.guestPassword = guestPasswordParam;
        }

        axios
            .get(`${API}/order/detail/oid/${oidFromQuery}`, { params })
            .then((res) => {
                const o = res.data;
                setOid(o.oid);
                setPaymentMethod(o.paymentMethod || '카드결제');
                setFinalPrice(o.finalPrice);
                setAddress([o.address, o.detailAddress].filter(Boolean).join(' '));
                setIsGuestOrder(isGuestOrderRow(o));
                if (o.paymentMethod === '가상계좌' && (o.vbankAccount || o.vbankName)) {
                    setBankTransferInfo({
                        bankName: o.vbankName || '',
                        bankAccount: o.vbankAccount || '',
                        holder: o.vbankHolder || '',
                        dueDate: o.vbankDueDate || '',
                    });
                } else {
                    setBankTransferInfo(null);
                }
                sessionStorage.removeItem(ORDER_RETRY_DRAFT_KEY);
            })
            .catch(() => setFetchError(true))
            .finally(() => setLoading(false));
    }, [oidFromQuery, fromState.oid, fromState.guestPassword, guestPassword]);

    if (errorFromQuery === '1') {
        return (
            <div className="w-full min-h-[600px] flex flex-col items-center justify-center px-4 py-10">
                <p className="text-lg font-bold text-red-600">결제가 완료되지 않았습니다.</p>
                <button type="button" className="mt-4 mx-4 py-2 bg-black text-white rounded-md" onClick={() => navigate('/')}>
                    메인으로
                </button>
            </div>
        );
    }
    if (loading) {
        return <div className="w-full min-h-[600px] flex items-center justify-center">로딩 중...</div>
    }
    if (fetchError || !oid) {
        return (
            <div className="w-full min-h-[600px] flex flex-col items-center justify-center px-4 py-10">
                <p>주문 정보를 불러올 수 없습니다.</p>
                <button type="button" className="mt-4 px-4 py-2 bg-black text-white rounded-md" onClick={() => navigate('/')}>
                    메인으로
                </button>
            </div>
        )
    }

    return (
        <div className="w-full min-h-[600px] flex flex-col items-center justify-center px-4 py-10">
            <div className="
                text-[clamp(18px,3.128vw,36px)] md:text-4xl
                font-bold text-center md:mb-4 mb-1"
            >
                주문이 완료되었습니다!
            </div>
            <div className="
                text-gray-600 
                text-[12px] md:text-[14px]
                text-center mb-6 whitespace-pre-line">
                주문해주셔서 감사합니다. <br/>
                    {isGuestOrder
                        ? `비회원 주문은 주문자 휴대폰 번호 + 비밀번호로 조회됩니다. \n[로그인] 화면 맨 아래 「비회원 주문조회」를 이용해 주세요.`
                        : "주문내역은 [마이페이지 > 주문내역]에서 확인하실 수 있습니다."
                    }
            </div>
        

            <div className="
                border rounded-md p-6 bg-white shadow-md w-full max-w-xl
                md:text-base text-[clamp(11px,2.085vw,16px)]
            ">  
                {/* 상단 요약 */}
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-sm text-gray-500">주문번호</p>
                        <p className="text-lg font-extrabold text-red-600 tracking-tight">{oid}</p>
                    </div>

                    <div className="text-right">
                        <p className="text-sm text-gray-500">결제금액</p>
                        <p className="
                            text-[14px] md:text-[16px]
                            font-bold text-gray-900"
                        >
                            {finalPrice?.toLocaleString()}원
                        </p>
                        <p className="
                            text-[12px] md:text-[14px]
                            mb-2"
                        >
                            결제수단: <span className="font-semibold">{paymentMethod}</span>
                        </p>
                    </div>
                </div>            
                
                {paymentMethod === "가상계좌" && bankTransferInfo && (
                    <div className="mt-5 rounded-xl border border-[#D0AC88] bg-[#fffaf3] p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-bold text-[#a57647]">무통장 입금 안내</p>
                                {bankTransferInfo.bankName && (
                                    <p className="mt-2 text-sm text-gray-800">
                                        <span className="font-semibold">은행</span>  
                                        <span className="mx-2 text-gray-300">|</span>  
                                        <span className="font-semibold">{bankTransferInfo.bankName}</span>  
                                    </p>
                                )}
                                <p className="mt-2 text-sm text-gray-800">
                                    <span className="font-semibold">입금계좌</span> 
                                    <span className="mx-2 text-gray-300">|</span>
                                    <span className="font-semibold">{bankTransferInfo.bankAccount}</span>
                                </p>
                                {(bankTransferInfo.holder || bankTransferInfo.depositor) && (
                                    <p className="mt-1 text-sm text-gray-800">
                                        <span className="font-semibold">예금주</span>
                                        <span className="mx-2 text-gray-300">|</span>
                                        <span className="font-semibold">{bankTransferInfo.holder || bankTransferInfo.depositor}</span>
                                    </p>
                                )}
                                {(bankTransferInfo.dueDate || bankTransferInfo.dueText) && (
                                    <p className="mt-2 text-xs text-gray-600">
                                        입금기한: {bankTransferInfo.dueDate || bankTransferInfo.dueText}
                                    </p>
                                )}
                            </div>

                            {/* 복사 버튼 */}
                            <div className="flex flex-col gap-2 shrink-0">
                                <button
                                    type="button"
                                    className="px-3 py-2 rounded-lg border bg-white text-sm hover:bg-gray-50"
                                    onClick={() => {
                                        navigator.clipboard
                                            .writeText(bankTransferInfo.bankAccount || '')
                                            .then(() => toast.success('계좌번호를 복사했습니다.'))
                                            .catch(() => toast.error('복사에 실패했습니다.'));
                                        }}
                                >
                                    계좌 복사
                                </button>

                            </div>
                        </div>
                    </div>
                )}

                {/* 배송지 */}
                <div className="mt-5 pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-1">배송지</p>
                    <p className="
                        text-[13px] md:text-base
                        font-medium text-gray-800 leading-relaxed"
                    >
                        {address}
                    </p>
                </div>


                {/* 비회원 비밀번호 */}
                {isGuestOrder && (
                <p className="mt-2 text-sm text-red-600">
                    ※ 주문자 휴대폰 번호와 비밀번호를 꼭 기억해두세요. 분실 시 고객센터로 문의 바랍니다.
                </p>
            )}
            </div>

            <div className="
                flex gap-4 mt-8
                text-[12px] md:text-[14px]"
            >
                <button
                className="px-4 py-2 bg-black text-white rounded-md"
                onClick={() => navigate('/')}
                >
                메인으로
                </button>
                {isGuestOrder ? (
                    <button
                        className="px-4 py-2 border border-gray-400 text-gray-700 rounded-md"
                        onClick={() => navigate('/guestOrderSearch')}
                    >
                        비회원 주문조회
                    </button>
                ) : (
                    <button
                        className="px-4 py-2 border border-gray-400 text-gray-700 rounded-md"
                        onClick={() => navigate('/orderList')}
                    >
                        주문내역 보기
                    </button>
                )}  
            </div>
        </div>
    );
};

export default OrderComplete;
