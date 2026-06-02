import { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { resolveTrackingLookupUrl } from '../../utils/deliveryTrackingUrls';
import thumbCustom from '../../assets/CustomFrames/customFrames.png';

const Order_Detail = () => {
    const API = process.env.REACT_APP_API_BASE;
    const FILE_BASE = API.replace('/api', '');
    const printRef = useRef();
    const navigate = useNavigate();
    const location = useLocation();
    const backQuery = location.search;
    const orderCountFromState = location.state?.orderCount || 1;
    const { itemId } = useParams();
    const [order, setOrder] = useState(null);

    // 리스 정보 수정
    const [showLeaseModal, setShowLeaseModal] = useState(false);
    const [leaseStart, setLeaseStart] = useState('');
    const [leaseEnd, setLeaseEnd] = useState('');

    // 모달 입력 필드 상태 정의
    const [trackingCompany, setTrackingCompany] = useState('한진택배');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [bankName, setBankName] = useState('');
    const [accountNumber, setAccountNumber] = useState('');
    const [accountHolder, setAccountHolder] = useState('');

    const [customCompany, setCustomCompany] = useState(''); // 직접 입력일 때 사용하는 변수

    // 비회원 비밀번호 수정
    const [showGuestPwModal, setShowGuestPwModal] = useState(false);
    const [newGuestPw, setNewGuestPw] = useState('');
    const [confirmGuestPw, setConfirmGuestPw] = useState('');

    const [generatedGuestPw, setGeneratedGuestPw] = useState('');

    const handleGuestPwUpdate = async () => {
        if (newGuestPw !== confirmGuestPw) {
            toast.error("비밀번호가 일치하지 않습니다.");
            return;
        }

        try {
            const res = await fetch(`${API}/order/guest-reset-password`, {
                method: "POST",
                headers: { 'Content-Type': "application/json" },
                body: JSON.stringify({
                    oid: order.oid,
                    phone: order.recipientPhone
                })
            });
            const data = await res.json();
            if  (data.success) {
                setGeneratedGuestPw(data.newPassword);
                toast.success(`임시 비밀번호가 발급되었습니다 :  ${data.newPassword}`);
            } else {
                toast.error("변경 실패: " + data.message);
            }
        } catch (err) {
            console.error("비회원 비밀번호 수정 오류", err);
            toast.error("서버 오류");
        }
    }
    
    // 주문상태 변경
    const statusOptions = [
        '전체', '입금대기', '결제완료', '배송준비중', '배송중', '배송완료', 
        '취소', '교환신청', '교환회수완료', '교환배송중', '교환완료', 
        '반품신청', '반품회수완료', '환불처리중', '환불완료'
    ];

    const SHOULD_DELETE_CLAIM_FILES_STATUS = new Set(['교환완료','환불완료']);

    const deleteClaimFilesIfNeeded = async (item) => {
        if (!item?.itemId) return;
        if (!item.claimFiles?.length) return;

        const res = await fetch(`${API}/admin/order/delete-claim-files`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ itemId: item.itemId }),
        });

        const data = await res.json();
        if (!data.success) throw new Error(data.message || '클레임 이미지 삭제 실패');
        return data.deleted ?? 0;
    };

    // 진행상태 업데이트
    const handleStatusChange = async (itemId, newStatus, id, usedCredit, oid) => {
        const item = order?.items?.[0];
        if (!item) return;

        // 1) 상태 변경 confirm
        const ok = window.confirm(`주문 상태를 "${newStatus}"(으)로 변경할까요?`);
        if (!ok) return;

        const hasClaimFiles = item?.claimFiles?.length > 0;
        const willDeleteClaimFiles = 
            hasClaimFiles && SHOULD_DELETE_CLAIM_FILES_STATUS.has(newStatus);

        // 2) 교환완료/환불완료로 바꾸고, 첨부 이미지가 있으면 추가 confirm
        if (willDeleteClaimFiles) {
            const ok2 = window.confirm(
                `이 상태로 변경하면 클레임 첨부 이미지가 서버에서 삭제됩니다.\n` +
                `백업이 필요하면 먼저 이미지를 다운로드하세요.\n` + 
                `(삭제 후 복구 불가)\n진행할까요?`
            );
            if (!ok2) return;
        }

        if (newStatus === '배송완료' && item.category === 'customFrames') {
            const ok3 = window.confirm(
                '맞춤액자 고해상 원본 이미지는 서버에서 삭제됩니다. (복구 불가)\n' +
                '150px 썸네일은 배송완료 시점으로부터 최대 30일 보관 후 자동 삭제됩니다.\n' +
                '계속할까요?'
            );
            if (!ok3) return;
        }

        try {
            const res = await fetch(`${API}/admin/order/update-status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json'},
            credentials: "include",
            body: JSON.stringify({ itemId, orderStatus: newStatus, id, usedCredit, oid})
        });
        
        const data = await res.json();

        if (!data.success) {
            toast.error("상태 변경 실패");
            return;
        }

        toast.success("상태가 변경되었습니다.");

        if (data.deletedClaimFiles > 0) {
            toast.success(`클레임 첨부 이미지 삭제 (${data.deletedClaimFiles}개)`);
        }
        if (data.refundedAmount > 0) {
            toast.success(`적립금 반환 (+${data.refundedAmount.toLocaleString()}원)`);
        }
        if (data.deletedCustomFrameOriginal > 0) {
            toast.success("맞춤액자 원본 이미지가 삭제되었습니다.");
        }

        reload();
        } catch (err) {
            console.error(err.message || "처리 중 오류") ;
            reload();
        }
    };
    
    // 반품 신청
    const [showReturnForm, setShowReturnForm] = useState(false);
    const [claimType, setClaimType] = useState('반품'); // 교환 / 반품 선택버튼
    const [returnReason, setReturnReason] = useState(''); // 반품 이유
    const [returnDetail, setReturnDetail] = useState(''); // 반품 이유 (상세)

    const handleSubmitReturn = () => {
        if (!returnReason) {
            toast.error('사유를 선택해주세요.');
            return;
        }

        if (claimType === '반품') {
            if (!bankName || !accountNumber || !accountHolder) {
                toast.error('반품일 경우 환불 계좌 정보를 모두 입력해주세요.');
                return;
            }
        }

        fetch(`${API}/order/claim`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: order.id,
                oid: order.oid,
                pid: order.items[0].pid,
                usedCredit :order.usedCredit,
                orderStatus: claimType === '반품' ? '반품신청' : '교환신청',
                reason:returnReason,
                detail: returnDetail,
                ...(claimType === '반품' && {
                bankName,
                accountNumber,
                accountHolder
                })
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                toast.success(`${claimType} 요청이 접수되었습니다.`);
                navigate('/orderList');
            } else {
                toast.error(`${claimType} 요청 실패 : + data.message`);
            }
        })
        .catch(err => toast.error('서버 오류'));
    }

    // 아이템 불러오기
    useEffect(() => {
        reload();
    }, [itemId]);

    const [showModal, setShowModal] = useState(false);

    const isAnyModalOpen = showModal || showGuestPwModal;

    // 모달 열림 시 배경 스크롤 잠금
    useEffect(() => {
        if (!isAnyModalOpen) return;

        const scrollY = window.scrollY;
        const prevOverflow = document.body.style.overflow;

        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';

        const onKey = (e) => {
            if (e.key !== 'Escape') return;
            if (showModal) setShowModal(false);
            else if (showGuestPwModal) setShowGuestPwModal(false);
        };
        window.addEventListener('keydown', onKey);

        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.left = '';
            document.body.style.right = '';
            document.body.style.width = '';
            document.body.style.overflow = prevOverflow;
            window.scrollTo(0, scrollY);
        };
    }, [isAnyModalOpen, showModal, showGuestPwModal]);

    const reload = () => {
        axios.get(`${API}/order/detail/${itemId}`)
            .then(res => setOrder(res.data))
            .catch(err => console.error("주문 상세 불러오기 실패", err));
    }

    const [shippingDraft, setShippingDraft] = useState({
        ordererName: '',
        ordererPhone: '',
        email: '',
        recipient: '',
        recipientPhone: '',
        postcode: '',
        address: '',
        detailAddress: '',
        deliveryMessage: '',
        buyerRequest: '',
    });
    const [shippingSaving, setShippingSaving] = useState(false);

    useEffect(() => {
        if (!order) return;
        setShippingDraft({
            ordererName: order.ordererName ?? '',
            ordererPhone: order.ordererPhone ?? '',
            email: order.email ?? '',
            recipient: order.recipient ?? '',
            recipientPhone: order.recipientPhone ?? '',
            postcode: order.postcode ?? '',
            address: order.address ?? '',
            detailAddress: order.detailAddress ?? '',
            deliveryMessage: order.deliveryMessage ?? '',
            buyerRequest: order.buyerRequest ?? '',
        });
    }, [order]);

    if (!order) return <div className="text-center py-20 text-gray-500">로딩 중...</div>;

    const item = order.items[0];
    const status = item?.orderStatus || '';

    const handleSaveShipping = async () => {
        setShippingSaving(true);
        try {
            const res = await fetch(`${API}/admin/order/update-shipping`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    itemId: item.itemId,
                    ...shippingDraft,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success('배송지 정보가 저장되었습니다.');
                reload();
            } else {
                toast.error(data.message || '저장에 실패했습니다.');
            }
        } catch (err) {
            console.error(err);
            toast.error('서버 오류');
        } finally {
            setShippingSaving(false);
        }
    };

    const steps = ['입금대기', '결제완료', '배송준비중', '배송중', '배송완료'];
    const currentStepIndex = steps.indexOf(order.items[0].orderStatus);

    // 모달 값 저장 함수
    const handleSave = () => {
        if(!trackingCompany || trackingCompany.trim() === '') {
            toast.error('택배사를 선택하거나 입력해 주세요.');
            return;
        }

        if(!trackingNumber || trackingNumber.trim() === '') {
            toast.error('운송장번호를 입력해 주세요.');
            return;
        }

        // 기타 선택 시에는 trackingCompany가 여전히 "기타"일 수 있으므로 직접 입력값으로 대체 필요
        let finalTrackingCompany = trackingCompany;
        if (trackingCompany === '기타') {
            if (customCompany === '' || !customCompany) {
                toast.error('택배사를 직접 입력해 주세요.');
                return;
            }

            finalTrackingCompany = trackingCompany === '기타' ? customCompany.trim() : trackingCompany;

            if (!finalTrackingCompany) {
                toast.error('택배사를 선택하거나 입력해 주세요.');
                return;
            }
        }

        fetch(`${API}/admin/order/update-detail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                itemId: order.items[0].itemId,
                trackingCompany: finalTrackingCompany,
                trackingNumber
            }),
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                toast.success('저장되었습니다.')
                if (data.smsTried) {
                    if (data.smsSent) {
                        toast.success('고객에게 배송 알림 문자를 전송했습니다.');
                    } else {
                        toast.warn(`배송 알림 문자 전송 실패: ${data.smsMessage || '설정을 확인해주세요.'}`);
                    }
                }
                setShowModal(false);
                reload();
            }
        })
        .catch(err => console.error("상세정보 저장 실패", err));
    }

    // 인쇄하기
    const handlePrint = () => {
        const printContents = printRef.current.innerHTML;
        const printWindow = window.open('', '', 'width=1000,height=800');

        printWindow.document.write(`
            <html>
            <head>
                <title>주문서</title>
                <style>
                    * {
                    box-sizing: border-box;
                }

                body {
                    font-family: Arial, "Malgun Gothic", sans-serif;
                    padding: 10px 16px;
                    color: #111;
                    line-height: 1.5;
                    font-size: 12px;
                }

                .no-print {
                    display: none !important;
                }

                .print-wrap {
                    width: 100%;
                }

                .print-title {
                    font-size: 24px;
                    font-weight: 700;
                    margin-bottom: 6px;
                }

                .print-sub {
                    font-size: 12px;
                    color: #555;
                    margin-bottom: 20px;
                }

                .print-section {
                    margin-top:12px;
                    border: 1px solid #d9d9d9;
                    padding: 0px 12px 10px;
                    border-radius:8px;
                    page-break-inside: avoid;
                }

                .print-section-title {
                    font-size: 16px;
                    font-weight: 700;
                    margin-bottom: 10px;
                }

                .print-grid-2 {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 8px 20px;
                }

                .print-row {
                    margin-bottom: 4px;
                }

                .print-label {
                    font-weight: 700;
                    margin-right: 6px;
                }

                .print-product-box {
                    display: flex;
                    gap: 16px;
                    align-items: flex-start;
                }

                .print-thumb { 
                    width: 110px;
                    height: 110px;
                    object-fit: cover;
                    border: 1px solid #ddd;
                }

                .print-badge {
                    display: inline-block;
                    padding: 2px 8px;
                    border: 1px solid #999;
                    border-radius: 999px;
                    font-size: 11px;
                    margin-right: 6px;
                }

                .print-note-box {
                    min-height: 70px;
                    border: 1px dashed #bbb;
                    padding: 10px;
                    margin-top: 8px;
                }

                .print-check-row {
                    display: flex; 
                    gap: 18px;
                    flex-wrap: wrap;
                    margin-top: 8px;
                }

                .print-check-item {
                    min-width: 120px;
                }

                @media print {
                    body {
                        padding: 0;
                    }

                    .print-section {
                        break-inside: avoid;
                    }
                }
                </style>
            </head>
            <body>
                ${printContents}
            </body>
            </html>
        `);

        printWindow.document.close();

        const images = printWindow.document.images;

        if (images.length === 0) {
            printWindow.focus();
            printWindow.print();
            printWindow.close();
            return;
        }

        let loadedCount = 0;

        const tryPrint = () => {
            loadedCount += 1;
            if (loadedCount === images.length) {
                setTimeout(() => {
                    printWindow.focus();
                    printWindow.print();
                    printWindow.close();
                }, 300);
            }
        };

        for (let i = 0; i < images.length; i++) {
            const img = images[i];

            if (img.complete) {
                tryPrint();
            } else {
                img.onload = tryPrint;
                img.onerror = tryPrint;
            }
        }
    }
    // 인치 -> cm 변환 + P/C 규격 표시
    const convertInchToCm = (size) => {
        if (!size || typeof size !== "string") return size;

        const match = size.match(/([\d.]+)\s*[xX]\s*([\d.]+)/);
        if (!match) return size;

        const wInch = parseFloat(match[1]);
        const hInch = parseFloat(match[2]);

        if (isNaN(wInch) || isNaN(hInch)) return size;

        const wCm = Math.round(wInch * 2.54);
        const hCm = Math.round(hInch * 2.54);

        const pW = Math.max(0, wCm - 10);
        const pH = Math.max(0, hCm - 10);

        const cW = Math.max(0, wCm + 3);
        const cH = Math.max(0, hCm + 3);

        return `${wCm} x ${hCm} cm | P: ${pW} x ${pH} | C: ${cW} x ${cH}`;
    }

    const convertCategoryName = (category) => {
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

    // 주문 삭제 함수
    const handleDeleteOrder = async () => {
        if (!window.confirm("정말로 이 주문을 삭제하시겠습니까?")) return;

        try {
            const response = await fetch(`${API}/order/delete`, {
                method: "POST",
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    oid: order.oid,
                    items: order.items.map(item => ({
                        category: item.category,
                        thumbnail: item.thumbnail,
                        thumbnailPreview: item.thumbnailPreview
                    }))
                })
            });

            const data = await response.json();
            if (data.success) {
                toast.success("주문이 삭제되었습니다.");
                navigate(`/admin/order_Status${backQuery}`);
            } else {
                toast.error("삭제 실패: " + data.message);
            }
        } catch (error) {
            console.error("주문 삭제 중 오류 발생", error);
            toast.error("서버 오류");
        }
    }

    // 리스 저장
    const handleLeaseSave = () => {
        if (!leaseStart || !leaseEnd) {
            toast.error("리스 시작일과 종료일을 모두 입력해주세요.");
            return;
        }

        fetch(`${API}/admin/order/update-lease-period`, {
            method: 'POST',
            headers: { 'Content-Type' : 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                itemId: order.items[0].itemId,
                leaseStart,
                leaseEnd
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                toast.success("리스 기간이 저장되었습니다.");
                setShowLeaseModal(false);
                reload();
            } else {
                toast.error("저장 실패: " + (data.message || ""));
            }
        })
        .catch(err => {
            console.error("리스 기간 저장 실패", err);
            toast.error("서버 오류");
        });
    };

    // 고객 업로드 보여주기 (원본 없으면 150px 썸네일)
    const customFrameThumb =
        (order.items[0].thumbnail || order.items[0].thumbnailPreview)
            ? (
                (order.items[0].thumbnail || order.items[0].thumbnailPreview).startsWith('http')
                    ? (order.items[0].thumbnail || order.items[0].thumbnailPreview)
                    : `${FILE_BASE}${order.items[0].thumbnail || order.items[0].thumbnailPreview}`
            )
            : thumbCustom;

    // const hasCustomUploadImage = !!order.items[0].thumbnail;
            
    const displayThumb = 
        order.items[0].category === 'customFrames' 
            ? customFrameThumb
            : ( 
                order.items[0].thumbnail?.startsWith('http')
                    ? order.items[0].thumbnail
                    : `${FILE_BASE}${order.items[0].thumbnail}`
            );

    const handleDeleteCustomThumbnail = async () => {
        if (!order?.items?.[0]) return;
        if (!window.confirm("150px 썸네일을 서버에서 삭제할까요? (복구 불가)")) return;
        try {
            const res = await fetch(`${API}/admin/order/delete-custom-thumbnail`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId: order.items[0].itemId }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success("썸네일이 삭제되었습니다.");
                reload();
            } else {
                toast.error("삭제 실패: " + (data.message || ""));
            }
        } catch (e) {
            console.error(e);
            toast.error("서버 오류");
        }
    };
    // 맞춤액자 이미지 제거
    const handleDeleteCustomImage = async () => {
        if (!order?.items?.[0]) return;

        if (!window.confirm("맞춤액자 고해상 원본 이미지를 서버에서 삭제할까요? (복구 불가)")) return;

        try {
            const res = await fetch(`${API}/admin/order/delete-custom-image`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    itemId: order.items[0].itemId,
                }),
            });

            const data = await res.json();
            if (data.success) {
                toast.success("고해상 원본 이미지가 삭제되었습니다.");
                reload();
            } else {
                toast.error("삭제 실패: " + (data.message || ""));
            }
        } catch (e) {
            console.error(e);
            toast.error("서버 오류");
        }
    }

    const renderClaimInfo = () => {
        const item = order?.items?.[0];
        if (!item) return null;

        const isClaim = [
            '교환신청', '교환회수완료', '교환배송중', '교환완료',
            '반품신청', '반품회수완료', '환불처리중', '환불완료',
        ].includes(item.orderStatus);

        if (!isClaim) return null;

        return (
            <div className="mt-4 p-4 rounded-lg border bg-white">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-gray-900">클레임 접수 내용</div>
                    <span className="px-2 py-0.5 text-xs rounded-full border bg-gray-50 text-gray-700">
                        {item.orderStatus}
                    </span>
                </div>

                <div className="mt-3 space-y-2 text-sm text-gray-800">
                    <div className="flex gap-2">
                        <div className="w-12 text-gray-500">사유</div>
                        <div className="font-semibold">{item.reason || '-'}</div>
                    </div>

                    <div className="flex gap-2">
                        <div className="w-12 text-gray-500">상세</div>
                        <div className="whitespace-pre-line">{item.detail || '-'}</div>
                    </div>

                    {(item.orderStatus.includes('반품') || item.orderStatus.includes('환불')) &&
                        (item.bankName || item.accountNumber || item.accountHolder) && (
                            <div className="pt-2 mt-2 border-t">
                                <div className="text-xs font-semibold text-gray-700 mb-1">환불 계좌</div>
                                <div className="text-sm">
                                    {item.bankName} / {item.accountNumber} / {item.accountHolder}
                                </div>
                            </div>
                        )}

                        {item.claimFiles?.length > 0 && (
                            <div className="pt-2 mt-2 border-t">
                                <div className="text-xs font-semibold text-gray-700 mb-2">첨부 이미지</div>
                                <div className="grid grid-cols-6 gap-2">
                                    {item.claimFiles.map(f => (
                                        <a key={f.fileId} href={f.fileUrl} target="_blank" rel="noreferrer">
                                            <img src={f.fileUrl} alt="claim" className="w-20 h-20 object-cover rounded border" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                </div>
            </div>
        )
    }

    return (
        <div className="print-wrap w-full bg-white px-8 py-6 border border-gray-200"
            ref={printRef}
        >
            {/* Title */}
            <div>
                <div className='flex items-center justify-between'>
                    <div>
                        <h2 className="print-title text-2xl font-bold mb-2">주문 상세 내역</h2>
                        <p className="print-sub text-sm text-gray-500">
                            주문번호: <span className="font-medium">{order.oid}</span> | 주문일자 {order.createdAt?.slice(0, 16)}
                        </p>
                    </div>
                    <div className="flex gap-1 no-print">
                        {order.items[0].category === 'customFrames' && order.items[0]?.thumbnail && (
                            <button
                                className="px-2 py-1 text-[11px] font-medium border bg-gray-700 text-white rounded-xl hover:bg-gray-800 transition"
                                onClick={handleDeleteCustomImage}
                            >
                                원본 삭제
                            </button>
                        )}

                        {order.items[0].category === 'customFrames' && order.items[0]?.thumbnailPreview && (
                            <button
                                className="px-2 py-1 text-[11px] font-medium border bg-amber-700 text-white rounded-xl hover:bg-amber-800 transition"
                                onClick={handleDeleteCustomThumbnail}
                            >
                                썸네일 삭제
                            </button>
                        )}

                        {!order.id && (
                            <button
                                className="px-2 py-1 text-[11px] font-medium border bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                                onClick={() => setShowGuestPwModal(true)}
                            >
                                비회원 비밀번호 수정
                            </button>
                        )}
                        <button 
                        className="px-2 py-1 text-[11px] font-medium border bg-red-500 text-white border-white rounded-xl hover:text-gray-300  transition"
                        onClick={handleDeleteOrder}    
                    >
                            주문내역 삭제
                        </button>
                        <select
                            value={order.items[0].orderStatus}
                            onClick={(e) => e.stopPropagation()} 
                            onChange={(e) => handleStatusChange(order.items[0].itemId, e.target.value, order.id, order.usedCredit, order.oid)}
                            className="border rounded px-2 py-1 text-sm">
                        {statusOptions.map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                        </select>

                        <button
                            onClick={() => handlePrint()}
                            className="px-3 py-1 border rounded bg-white text-sm hover:bg-gray-100"
                        >
                            인쇄하기
                        </button>

                        <button 
                            className="px-2 py-1 text-[11px] font-medium border bg-orange-500 text-white border-white rounded-xl hover:text-gray-300  transition" 
                            onClick={() => {
                                    const item = order.items[0];
                                    const existingCompany = (item.trackingCompany || '').trim();
                                    const knownCompanies = [
                                        "CJ대한통운", "롯데택배", "한진택배", "우체국택배",
                                        "쿠팡로지스틱스", "로젠택배", "경동택배"
                                    ];
                                    if (existingCompany && knownCompanies.includes(existingCompany)) {
                                        setTrackingCompany(existingCompany);
                                        setCustomCompany('');
                                    } else if (existingCompany) {
                                        setTrackingCompany('기타');
                                        setCustomCompany(existingCompany);
                                    } else {
                                        setTrackingCompany('한진택배');
                                        setCustomCompany('');
                                    }
                                    setTrackingNumber((item.trackingNumber || '').trim());
                                    setBankName(bankName || '');
                                    setAccountNumber(accountNumber || '');
                                    setAccountHolder(accountHolder || '');

                                    setShowModal(true);
                            }}> 
                            운송장 정보 수정
                        </button>

                        {order.items[0].category === 'lease' && (
                            <button 
                                className="px-2 py-1 text-[11px] font-medium border bg-green-600 text-white border-white rounded-xl hover:text-gray-300 transition"
                                onClick={() => {
                                    setLeaseStart(order.items[0].leaseStartDate?.slice(0, 10) || '');
                                    setLeaseEnd(order.items[0].leaseStartDate?.slice(0, 10) || '');
                                    setShowLeaseModal(true);
                                }}>
                                리스정보 수정
                            </button>
                        )}

                        <button 
                            className="px-2 py-1 text-[11px] font-medium border bg-black text-white border-gray-500 rounded-xl hover:text-gray-300  transition" 
                            onClick={() => navigate(`/admin/order_Status${backQuery}`)}> 
                            이전으로
                        </button>
                    </div>
                </div>
            </div>

            {/* 주문 기본 정보 */}
            <div className="print-section">
                <h3 className="print-section-title font-semibold text-lg">주문 기본 정보</h3>
                <div className="print-grid-2 text-sm text-gray-700">
                    <div><span className="print-label font-medium">주문번호:</span> {order.oid}</div>
                    <div><span className="print-label font-medium">주문상태:</span> {order.items[0].orderStatus}</div>
                    <div><span className="print-label font-medium">주문일시:</span> {order.createdAt?.slice(0, 16)}</div>
                    <div><span className="print-label font-medium">주문수단:</span> {order.paymentMethod}</div>
                    <div><span className="print-label font-medium">주문자명:</span> {order.ordererName}</div>
                    <div><span className="print-label font-medium">주문자 연락처:</span> {order.ordererPhone}</div>
                </div>
            </div>

            {/* 상단 상품 정보 */}
            <div className="print-section">
                <h3 className="print-section-title font-semibold text-lg">상품 / 제작 정보</h3>

                <div className="print-product-box flex gap-6 items-start">
                    <img 
                        src={displayThumb} 
                        alt={order.items[0].title} 
                        className="print-thumb w-28 h-28 object-cover rounded border" 
                    />
                    
                    <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-3">
                            <span className="print-badge">
                                {convertCategoryName(order.items[0].category)}
                            </span>
                            <span className="print-badge">
                                 {item.finishType === 'matte' ? '무광' : '유광'}
                            </span>
                            <span className="print-badge">
                                수량 {order.items[0].quantity}개
                            </span>
                        </div>
 
                        <div className="text-sm text-gray-700 leading-6">
                            <div className="print-label text-black font-bold">
                                {order.items[0].title}
                            </div>

                            <div>
                                <span className="print-label">작가:</span>
                                {order.items[0].author}
                            </div>
                                        
                            <div>
                                <span className="print-label">상품금액:</span>
                                {(order.items[0].price * order.items[0].quantity).toLocaleString()}원
                            </div>

                            <div>
                                <span className="print-label">사이즈:</span>
                                {convertInchToCm(order.items[0].size)}
                            </div>            

                            {/* {order.items[0].category === 'customFrames' && hasCustomUploadImage && (
                                <div className="mt-2">
                                    <span className="print-label">고객 업로드 이미지:</span>
                                    <a
                                        href={customFrameThumb}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-blue-600 underline hover:text-blue-800"
                                    >
                                        보기
                                    </a>
                                </div>
                            )} */}
                        </div>
                    </div>
                </div>
            </div>

            {/* 맞춤액자 사진보정 정보 */}
            {order.items?.[0]?.category === 'customFrames' && (() => {
                const item = order.items[0];

                const retouchEnabled =
                    item.retouchEnabled === 1 || item.retouchEnabled === true;

                const retouchTypes = (item.retouchTypes || '')
                    .split(',')
                    .map(v => v.trim())
                    .filter(Boolean);

                return (
                    <div className="print-section"> 
                        <h3 className="print-section-title font-semibold text-lg">사진 보정 정보</h3>

                        <div className="text-sm leading-6">
                            <div>
                                <span className='print-label'>보정 신청:</span>
                                {retouchEnabled ? '신청' : '미신청'}
                            </div>

                            <div>
                                <span className="print-label">고객 원본 이미지:</span>
                                {item.thumbnail ? '있음' : '없음'}
                            </div>

                            {retouchEnabled && (
                                <>
                                    <div className="mt-2">
                                        <span className="print-label">보정 항목:</span>
                                        {retouchTypes.length > 0 ? retouchTypes.join(', ') : '선택 없음'}
                                    </div>

                                    <div className="mt-2">    
                                        <span className="print-label">요청사항:</span>
                                        <div className="print-note-box whitespace-pre-line">
                                            {item.retouchNote || '없음'}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                );
            })()}
                    
            {/* 반품 입력창 */}
            {showReturnForm && order.items[0].orderStatus !== '반품신청' && (
                <div className="space-y-2 mt-4 text-sm text-gray-700 border rounded p-4 bg-gray-50">
                    <div className="flex items-center gap-4">
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                            <input
                            type="radio"
                            name="claimType"
                            checked={claimType === '교환'}
                            onChange={() => setClaimType('교환')}
                            />
                            교환
                        </label>

                        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                            <input
                            type="radio"
                            name="claimType"
                            checked={claimType === '반품'}
                            onChange={() => setClaimType('반품')}
                            />
                            반품
                        </label>
                    </div>
                    
                    <select
                        className="w-full border px-3 py-2 rounded"
                        value={returnReason}
                        onChange={(e) => setReturnReason(e.target.value)}>
                            <option value="">{claimType}사유를 선택해주세요</option>
                            <option value="단순변심">단순변심</option>
                            <option value="상품불량">상품불량</option>
                            <option value="오배송">오배송</option>
                            <option value="기타">기타</option>
                    </select>

                    <textarea
                        placeholder="상세 사유 입력 (선택사항)"
                        className="w-full border px-3 py-2 rounded"
                        rows={3}
                        value={returnDetail}
                        onChange={(e) => setReturnDetail(e.target.value)}
                    />
                    {claimType === '반품' && (
                    <>
                        <input 
                            type="text"
                            placeholder="은행명"
                            className="w-full border px-3 py-2 rounded"
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                        />
                        <input 
                            type="text"
                            placeholder="계좌번호"
                            className="w-full border px-3 py-2 rounded"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value)}
                        />
                        <input 
                            type="text"
                            placeholder="예금주"
                            className="w-full border px-3 py-2 rounded"
                            value={accountHolder}
                            onChange={(e) => setAccountHolder(e.target.value)}
                        />
                    </>
                    )}

                    <button
                        onClick={handleSubmitReturn}
                        className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 mt-2">
                            요청 접수
                    </button>
                </div>
            )} {/* 반품 입력창 */}
            
            {/* 주문 진행 상황 */}
            <div className='no-print'>
                {/* 주문상태에 따라 상태 메세지 */}
                {order.items[0].orderStatus === '입금대기' && (
                    <>
                        <h3 className="font-semibold mb-4 text-lg">주문 진행 상황</h3>
                        <div className="mt-6 p-4 border rounded bg-yellow-50 text-sm text-yellow-700 font-medium">
                                주문이 정상적으로 접수되었으며, 고객의 입금을 기다리고 있습니다. <br />
                                아래 계좌로 입금이 확인되면 배송 준비를 시작하겠습니다.
                        </div>
                    </>
                )}

                {/* 결제완료 */}
                {order.items[0].orderStatus === '결제완료' && (
                    <>
                        <h3 className="font-semibold mb-4 text-lg">주문 진행 상황</h3>
                        <div className="mt-6 p-4 border rounded bg-yellow-50 text-sm text-yellow-700 font-medium">
                            고객님의 입금이 확인되었습니다. <br />
                            주문은 정상적으로 접수되었으며, 확인 후 순차적으로 배송이 진행될 예정입니다.
                        </div>
                    </>
                )}

                {order.items[0].orderStatus === '취소' && (
                    <div>
                        <h3 className="font-semibold mb-4 text-lg">주문 진행 상황</h3>
                        <div className="p-4 border rounded bg-yellow-50 text-sm text-yellow-700 font-medium">
                            주문이 취소되었습니다.
                        </div>
                    </div>
                )}

                {['교환신청', '교환회수완료', '교환배송중', '교환완료'].includes(order.items[0].orderStatus) && (
                    <div className="no-print">
                        <h3 className="font-semibold mb-4 text-lg">교환 진행 상황</h3>
                        {renderClaimInfo()}
                        <div className="p-4 mt-2 border rounded bg-yellow-50 text-sm text-yellow-700 font-medium">
                            
                            {order.items[0].orderStatus === '교환신청' && (
                            <>
                                교환 요청이 접수되었습니다.<br/>
                                담당자가 신청 내용을 확인한 뒤, 교환 진행이 가능할 경우 회수/발송 안내를 드립니다. <br/>
                                (확인 전에는 상품을 발송하지 마세요.)
                            </>
                            )}
                            {order.items[0].orderStatus === '교환회수완료' && (
                                <>회수 상품이 도착했습니다. 새 상품 준비 중입니다.</>
                            )}
                            {order.items[0].orderStatus === '교환배송중' && (
                                <>
                                    새 상품이 발송되었습니다. 곧 받아보실 수 있습니다.
                                </>
                            )}
                            {order.items[0].orderStatus === '교환완료' && (
                                <>교환이 완료되었습니다. 이용해 주셔서 감사합니다.</>
                            )}
                        </div>
                    </div>
                )}

                {/* 클레임 메세지 */}
                {['반품신청', '반품회수완료', '환불처리중', '환불완료'].includes(order.items[0].orderStatus) && (
                    <div>
                        <h3 className="font-semibold mb-4 text-lg">반품 진행 상황</h3>
                        {renderClaimInfo()}
                        <div className="p-4 mt-2 border rounded bg-yellow-50 text-sm text-yellow-700 font-medium">
                            {order.items[0].orderStatus === '반품신청' && (
                            <>
                                반품 요청이 접수되었습니다.<br/>
                                상품을 아래 주소로 선불 발송해 주세요.<br/><br/>
                                <span className="font-normal text-gray-800">
                                    경기 고양시 덕양구 통일로 140 (동산동, 삼송테크노밸리) A동 355호 <br/>
                                    수신자: 디아섹 / 연락처 : 010-0000-0000
                                </span>
                            </>
                            )}
                            {order.items[0].orderStatus === '반품회수완료' && (
                                <>반품 상품이 도착했습니다. 환불 절차를 진행 중입니다.</>
                            )}
                            {order.items[0].orderStatus === '환불처리중' && (
                                <>환불이 처리 중입니다. 영업일 기준 2~3일 내 입금 예정입니다.</>
                            )}
                            {order.items[0].orderStatus === '환불완료' && (
                                <>환불이 완료되었습니다. 계좌를 확인해 주세요.</>
                            )}
                        </div>
                    </div>
                )}
                
            </div> {/* 주문 진행 상황 */}
            
            {/* 배송 상태 단계 */}
            <div className="no-print">
                {!['입금대기', '결제완료', '취소', '반품신청', '반품회수완료', '환불처리중', '환불완료', 
                    '교환신청', '교환회수완료', '교환배송중', '교환완료'].includes(order.items[0].orderStatus) && (
                    <div>
                        <h3 className="font-semibold mb-4 text-lg">배송 진행 상황</h3>
                        <div className="flex justify-between items-center px-2 relative">
                            {steps.map((step, idx) => (
                                <div key={step} className="flex-1 text-center px-2 relative">
                                    <div className={`w-4 h-4 mx-auto rounded-full ${idx <= currentStepIndex ? 'bg-black' : 'bg-gray-300'} z-10 relative`}></div>
                                    <div className={`text-xs mt-2 ${idx <= currentStepIndex ? 'font-bold text-black' : 'text-gray-400'}`}>{step}</div>
                                    {idx < steps.length - 1 && (
                                        <div className={`absolute top-2 left-1/2 w-full h-[2px] ${idx < currentStepIndex ? 'bg-black' : 'bg-gray-300'}`}></div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* 운송장 표시 */}
                        {order.items[0].trackingNumber && (() => {
                            const trackingUrl = resolveTrackingLookupUrl(
                                order.items[0].trackingCompany,
                                order.items[0].trackingNumber
                            );
                            return (
                            <div className="mt-6 border rounded-lg p-4 bg-gray-50 text-sm text-gray-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="font-semibold text-gray-700">운송장 정보</span>
                                    <a
                                        href={trackingUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline text-xs"
                                    >
                                        배송조회 바로가기
                                    </a>
                                </div>
                                <div className="text-base font-bold text-gray-900">
                                    운송장 번호: {order.items[0].trackingNumber}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                    ※ 택배사 : {order.items[0].trackingCompany}
                                </div>
                            </div>
                            );
                        })()}
                    </div>
                )}
            </div>

            { /* 결제 정보 */}
            <div className="print-section">
                <h3 className="print-section-title font-semibold text-lg">결제 정보</h3>
                <div className="text-sm leading-6">
                    <div>
                        <span className="print-label">결제 수단:</span> {order.paymentMethod}
                    </div>

                    { order.paymentMethod === '무통장입금' && (
                        <>
                            <div>
                                <span className="print-label">입금자명:</span> {order.depositor}
                            </div>
                            <div>
                                <span className="print-label">입금 계좌:</span> {order.bankAccount}
                            </div>
                        </>
                    )}

                    <div>
                        <span className="print-label">총 상품금액:</span> {order.totalPrice.toLocaleString()}원
                    </div>
                    
                    <div>
                        <span className="print-label">적립금 사용:</span> {order.usedCredit.toLocaleString()}원
                    </div>

                    <div>
                        <span className="print-label">배송비:</span> {order.deliveryFee.toLocaleString()}원
                    </div>

                    <div>
                        <span className="print-label">최종 결제금액:</span> 
                        {order.finalPrice.toLocaleString()}원 
                        {orderCountFromState > 1 ? ` (외 ${orderCountFromState - 1}개 상품 포함)` : ''}
                    </div>
                </div>
            </div>

            { /* 배송지 정보 */}
            <div className="print-section">
                <h3 className="print-section-title font-semibold text-lg">배송지 정보</h3>
                <div className="print-grid-2 text-sm text-gray-700">
                    <div>
                        <span className="font-medium">주문자명:</span> {order.ordererName}
                    </div>
                    <div>
                        <span className="font-medium">주문자 연락처:</span> {order.ordererPhone}
                    </div>
                    <div>
                        <span className="font-medium">수령인:</span> {order.recipient || '—'}
                    </div>
                    <div>
                        <span className="font-medium">수령인 연락처:</span> {order.recipientPhone || '—'}
                    </div>
                    <div>
                        <span className="font-medium">이메일:</span> {order.email}
                    </div>
                    <div>
                        <span className="font-medium">우편번호:</span> {order.postcode}
                    </div>

                    <div>
                        <span className="font-medium">주소:</span> {order.address}
                            <>
                                <br />
                                {order.detailAddress}
                            </>
                    </div>

                    {(order.deliveryMessage || order.buyerRequest) && (
                        <div className="sm:col-span-2 space-y-1">
                            {order.deliveryMessage ? (
                                <div>
                                    <span className="font-medium">배송 메시지:</span> {order.deliveryMessage}
                                </div>
                            ) : null}
                            {order.buyerRequest ? (
                                <div>
                                    <span className="font-medium">구매자 요청:</span> {order.buyerRequest}
                                </div>
                            ) : null}
                        </div>
                    )}
                </div>

                <div className="no-print mt-4 border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
                    <h4 className="text-sm font-semibold text-gray-800 mb-3">배송지 정보 수정 (관리자)</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <label className="flex flex-col gap-1">
                            <span className="font-medium text-gray-700">주문자명</span>
                            <input
                                type="text"
                                className="border border-gray-300 rounded px-2 py-1.5 w-full"
                                value={shippingDraft.ordererName}
                                onChange={(e) => setShippingDraft((d) => ({ ...d, ordererName: e.target.value }))}
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="font-medium text-gray-700">주문자 연락처</span>
                            <input
                                type="text"
                                className="border border-gray-300 rounded px-2 py-1.5 w-full"
                                value={shippingDraft.ordererPhone}
                                onChange={(e) => setShippingDraft((d) => ({ ...d, ordererPhone: e.target.value }))}
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="font-medium text-gray-700">수령인</span>
                            <input
                                type="text"
                                className="border border-gray-300 rounded px-2 py-1.5 w-full"
                                value={shippingDraft.recipient}
                                onChange={(e) => setShippingDraft((d) => ({ ...d, recipient: e.target.value }))}
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="font-medium text-gray-700">수령인 연락처</span>
                            <input
                                type="text"
                                className="border border-gray-300 rounded px-2 py-1.5 w-full"
                                value={shippingDraft.recipientPhone}
                                onChange={(e) => setShippingDraft((d) => ({ ...d, recipientPhone: e.target.value }))}
                            />
                        </label>
                        <label className="sm:col-span-2 flex flex-col gap-1">
                            <span className="font-medium text-gray-700">이메일</span>
                            <input
                                type="email"
                                className="border border-gray-300 rounded px-2 py-1.5 w-full"
                                value={shippingDraft.email}
                                onChange={(e) => setShippingDraft((d) => ({ ...d, email: e.target.value }))}
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="font-medium text-gray-700">우편번호</span>
                            <input
                                type="text"
                                className="border border-gray-300 rounded px-2 py-1.5 w-full"
                                value={shippingDraft.postcode}
                                onChange={(e) => setShippingDraft((d) => ({ ...d, postcode: e.target.value }))}
                            />
                        </label>
                        <label className="sm:col-span-2 flex flex-col gap-1">
                            <span className="font-medium text-gray-700">기본 주소</span>
                            <input
                                type="text"
                                className="border border-gray-300 rounded px-2 py-1.5 w-full"
                                value={shippingDraft.address}
                                onChange={(e) => setShippingDraft((d) => ({ ...d, address: e.target.value }))}
                            />
                        </label>
                        <label className="sm:col-span-2 flex flex-col gap-1">
                            <span className="font-medium text-gray-700">상세 주소</span>
                            <input
                                type="text"
                                className="border border-gray-300 rounded px-2 py-1.5 w-full"
                                value={shippingDraft.detailAddress}
                                onChange={(e) => setShippingDraft((d) => ({ ...d, detailAddress: e.target.value }))}
                            />
                        </label>
                        <label className="sm:col-span-2 flex flex-col gap-1">
                            <span className="font-medium text-gray-700">배송 메시지</span>
                            <input
                                type="text"
                                className="border border-gray-300 rounded px-2 py-1.5 w-full"
                                value={shippingDraft.deliveryMessage}
                                onChange={(e) => setShippingDraft((d) => ({ ...d, deliveryMessage: e.target.value }))}
                            />
                        </label>
                        <label className="sm:col-span-2 flex flex-col gap-1">
                            <span className="font-medium text-gray-700">구매자 요청사항</span>
                            <input
                                type="text"
                                className="border border-gray-300 rounded px-2 py-1.5 w-full"
                                value={shippingDraft.buyerRequest}
                                onChange={(e) => setShippingDraft((d) => ({ ...d, buyerRequest: e.target.value }))}
                            />
                        </label>
                    </div>
                    <button
                        type="button"
                        onClick={handleSaveShipping}
                        disabled={shippingSaving}
                        className="mt-4 w-full sm:w-auto px-6 py-2 rounded-lg bg-[#D0AC88] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50"
                    >
                        {shippingSaving ? '저장 중…' : '배송지 정보 저장'}
                    </button>
                </div>
            </div>

            {/* 배송 페이지 모달창 */}
            {showModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[10000] overscroll-none"
                    onTouchMove={(e) => {
                        if (e.target === e.currentTarget) e.preventDefault();
                    }}
                >
                    <div className='bg-white p-6 rounded-lg w-[420px] shadow-lg relative'>
                        <h3 className='text-lg font-bold mb-4'>운송장 정보</h3>
                       
                        {/* 송장 정보 */}
                        <div className="mb-6 border p-4 rounded bg-gray-50">
                            <label className="block text-sm font-medium">택배사</label>
                            <select className="border px-1 py-1 w-full text-sm"
                                value={trackingCompany}
                                onChange={(e) => setTrackingCompany(e.target.value)}>
                                    <option hidden value="">===선택해주세요===</option>
                                    <option value="CJ대한통운">CJ대한통운</option>
                                    <option value="롯데택배">롯데택배</option>
                                    <option value="한진택배">한진택배</option>
                                    <option value="우체국택배">우체국택배</option>
                                    <option value="쿠팡로지스틱스">쿠팡로지스틱스</option>
                                    <option value="로젠택배">로젠택배</option>
                                    <option value="경동택배">경동택배</option>
                                    <option value="기타">직접입력</option>
                            </select>

                            {trackingCompany === '기타' && (
                                <input type="text" value = {customCompany} onChange={e => setCustomCompany(e.target.value)}
                                    className="border mt-2 px-2 py-1 w-full text-sm" placeholder="택배사를 입력하세요." />
                            )}

                            <label className="block text-sm font-medium mt-2">운송장번호</label>
                            <input type="text" value={trackingNumber} onChange={e => setTrackingNumber(e.target.value)} className='border px-2 py-1 w-full text-sm'></input>
                            <p className="text-xs text-gray-500 mt-2">
                                (<span className='font-medium'>배송중</span>, <span className='font-medium'>교환배송중</span> 상태일 때 입력하는 항목입니다)
                            </p>
                        </div>
                        
                        {/* 환불 정보 */}
                        {status?.includes('환불') || status?.includes('반품') ? (
                            <div className="mb-4 border p-4 rounded bg-gray-50">
                                <h4 className='text-sm font-semibold mb-2 text-gray-700'>환불 계좌 정보</h4>
                                <label className="block text-sm font-medium mt-2">은행명</label>
                                <input type="text" value={bankName} onChange={e => setBankName(e.target.value)} className="border px-2 py-1 w-full text-sm" />

                                <label className="block text-sm font-medium mt-2">계좌번호</label>
                                <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)} className="border px-2 py-1 w-full text-sm" />

                                <label className="block text-sm font-medium mt-2">예금주</label>
                                <input type="text" value={accountHolder} onChange={e => setAccountHolder(e.target.value)} className="border px-2 py-1 w-full text-sm" />
                            </div>
                        ) : null}

                        <button 
                            onClick={handleSave}
                            className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                            저장
                        </button>

                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-black">
                        ✕
                        </button>
                    </div>
                </div>
            )}

            {/* 비회원 비밀번호 수정 */}
            {showGuestPwModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 overscroll-none"
                    onTouchMove={(e) => {
                        if (e.target === e.currentTarget) e.preventDefault();
                    }}
                >
                    <div className="bg-white p-6 rounded-lg w-[420px] shadow-lg relative">
                        <h3 className="text-lg font-bold mb-4">비회원 비밀번호 수정</h3>

                        {generatedGuestPw ? (
                            <div className="p-3 mb-4 border rounded bg-gray-100 text-center">
                                <p className="text-sm text-gray-600 mb-1">새 임시 비밀번호</p>
                                <p className="text-xl font-bold texxt-red-600">{generatedGuestPw}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 mb-4">아직 발급된 비밀번호가 없습니다.</p>
                        )}

                        <button
                            onClick={handleGuestPwUpdate}
                            className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                        >
                            임시 비밀번호 발급
                        </button>

                        <button
                            onClick={() => setShowGuestPwModal(false)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-black"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Order_Detail;