import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const AdminRetouchList = () => {
    const API = process.env.REACT_APP_API_BASE;

    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setMonth(d.getMonth() -3);
        return d.toISOString().slice(0, 10);
    });

    const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));

    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(false);

    // 업로드 중 상태
    const [uploadingItemId, setUploadingItemId] = useState(null);
    const [processingItemId, setProcessingItemId] = useState(null);

    // 미리보기 모달
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImg, setPreviewImg] = useState("");

    const openPreview = (url) => {
        setPreviewImg(url);
        setPreviewOpen(true);
    };


    const fetchList = async () => {
        setLoading(true);
        try {
            const res = await axios.post(
                `${API}/admin/retouch/list`, 
                { startDate, endDate, keyword: "", status: ""},
                { withCredentials: true }
            );
            if (!res.data?.success) throw new Error(res.data?.message || "조회 실패");
            setList(res.data.list || []);
        } catch (e) {
            console.error(e);
            toast.error(e.message || '관리자 보정 목록 조회 실패');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
    }, [startDate, endDate]);

    const statusBadge = (s) => {
        const base = "inline-flex px-2 py-0.5 rounded-full text-xs border";
        if (!s) return <span className={`${base} bg-gray-50 text-gray-600`}>미업로드</span>
        if (s === "WAITING_CUSTOMER")
            return <span className={`${base} bg-gray-50 text-yellow-700 border-yellow-200`}>승인대기</span>
        if (s === "APPROVED")
            return <span className={`${base} bg-green-50 text-green-700 border-green-200`}>승인완료</span>
        if (s === "REJECTED")
            return <span className={`${base} bg-red-50 text-red-700 border-red-200`}>반려</span>
        return <span className={`${base} bg-gray-50 text-gray-700`}>{s}</span>
    }

    const uploadPreview = async (itemId, file) => {
        const form = new FormData();
        form.append("itemId", itemId);
        form.append("file", file);

        const res = await axios.post(
            `${API}/admin/order/retouch/preview-upload`, form,
            { withCredentials: true }
        );

        if (!res.data?.success) throw new Error(res.data?.message || "업로드 실패");
        return res.data;
    };

    // 파일 선택 이벤트 -> 업로드 실행
    const onPickFile = async (itemId, e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // 파일 검증
        if (!file.type.startsWith("image/")) {
            toast.error("이미지 파일만 업로드 가능합니다.");
            e.target.value = "";
            return;
        }
        const maxMB = 30;
        if (file.size > maxMB * 1024 * 1024) {
            toast.error(`파일 용량은 ${maxMB}MB 이하로 업로드해주세요.`);
            e.target.value = "";
            return;
        }

        setUploadingItemId(itemId);
        try {
            const data = await uploadPreview(itemId, file);
            if (data.smsSent) {
                toast.success("프리뷰 업로드 완료 · 고객에게 안내 문자를 발송했습니다.");
            } else if (data.smsTried && !data.smsSent) {
                toast.warn(`프리뷰 업로드 완료 · 문자 발송 실패${data.smsMessage ? ` : ${data.smsMessage}` : ""}`);
            } else {
                toast.success("프리뷰 업로드 완료 → 고객 승인대기로 전환");
            }
            await fetchList();
        } catch (err) {
            console.error(err);
            toast.error(err.message || "업로드 오류");
        } finally {
            setUploadingItemId(null);
            e.target.value = ""
        }
    };

    // 삭제 함수
    const deletePreview = async (itemId) => {
        const res = await axios.post(
            `${API}/admin/order/retouch/preview-delete`,
            { itemId },
            { withCredentials: true }
        );
        if (!res.data?.success) throw new Error(res.data?.message || "삭제 실패");
        return res.data;
    };

    const approveRetouch = async (itemId) => {
        const res = await axios.post(
            `${API}/admin/order/retouch/approve`,
            { itemId },
            { withCredentials: true }
        );
        if (!res.data?.success) throw new Error(res.data?.message || "승인 실패");
        return res.data;
    };

    const clearRetouchRequest = async (itemId) => {
        const res = await axios.post(
            `${API}/admin/order/retouch/clear-request`,
            { itemId },
            { withCredentials: true }
        );
        if (!res.data?.success) throw new Error(res.data?.messgae || "삭제 실패");
        return res.data;
    };

    const canAdminApprove = (row) => row.previewStatus !== "APPROVED";

    const canUpload = (row) => {
        const retouchEnabled = row.retouchEnabled === 1 || row.retouchEnabled === true;
        if (!retouchEnabled) return false;
        if (row.previewStatus === "APPROVED") return false;
        return true;
    };

    const formatRetouchTypes = (types) => {
        if (!types) return "-";
        if (Array.isArray(types)) return types.join(", ");
        return String(types);
    };

    const hasRetouchText = (row) => {
        const types = formatRetouchTypes(row.retouchTypes);
        return (types && types !== "-") || Boolean(row.retouchNote?.trim());
    };

    const formatDatetime = (dateStr) => {
        if (!dateStr) return "-";

        const d = new Date(dateStr);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const min = String(d.getMinutes()).padStart(2, "0");
        return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
    };

    const formatDateOnly = (dateStr) => {
        if (!dateStr) return "-";
        const d = new Date(dateStr);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}.${mm}.${dd}`;
    }

    return (
        <div className="w-full">
            <div className="flex items-end justify-between gap-3 mb-4">
                <div>
                    <h2 className="text-xl font-semibold">관리자 보정(프리뷰) 관리</h2>
                    <p className="text-sm text-gray-500">프리뷰 업로드/삭제 및 고객 승인 상태를 확인합니다.</p>
                </div>

                <div className="flex items-end gap-2">
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 mb-1">시작일</label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="px-2 py-1 border rounded text-sm"
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 mb-1">종료일</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="px-2 py-1 border rounded text-sm"
                        />
                    </div>

                    {/* <button onClick={fetchList} className="px-3 py-2 rounded-md border hover:bg-gray-50" disabled={loading}>
                        조회
                    </button>

                    <button onClick={fetchList} className="px-3 py-2 rounded-md hover:bg-gray-50" disabled={loading}>
                        새로고침
                    </button> */}
                </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 bg-gray-50 text-sm font-medium px-3 py-2 text-center">
                    <div className="col-span-1">주문번호</div>
                    <div className="col-span-1">날짜</div>
                    <div className="col-span-2">주문자</div>
                    <div className="col-span-3">보정요청</div>
                    <div className="col-span-2">프리뷰</div>
                    <div className="col-span-1">상태</div>
                    <div className="col-span-2">처리</div>
                </div>

                {loading ? (
                    <div className="p-6 text-gray-500">불러오는 중...</div>
                ) : list.length === 0 ? (
                    <div className="p-6 text-gray-500">보정 요청 내역이 없습니다.</div>
                ) : (
                    list.map((row) => (
                        <div key={row.itemId} className="grid grid-cols-12 px-3 py-3 border-t text-sm items-start">
                            {/* 주문번호 */}
                            <div className="col-span-1 text-center">
                                <div className="font-medium">{row.oid}</div>    
                                {row.orderDate && <div className="text-xs text-gray-500 mt-1">{row.orderDate}</div>}
                            </div>

                            <div className="col-span-1 text-center">
                                <div>{formatDatetime(row.createdAt)}</div>
                            </div>

                            {/* 주문자 */}
                            <div className="text-center col-span-2">
                                <div>{row.memberId || "-"}</div>
                            </div>
                            
                            {/* 상품/보정요청 */}
                            <div className="col-span-3">
                                {/* <div className="font-medium">{row.title}</div> */}
                                {/* <div className="text-xs text-gray-500 mt-1">
                                    옵션: {row.optionText || '-'}
                                </div> */}
                                <div className="text-xs text-gray-500 mt-1">
                                    {formatRetouchTypes(row.retouchTypes)}
                                </div>
                                {row.retouchNote && (
                                    <div className="mt-1 text-xs text-gray-700 bg-gray-50 border rounded px-2 py-1">
                                        요청사항: {row.retouchNote}
                                    </div>
                                )}

                                {row.previewStatus === "REJECTED" && row.customerFeedback && (
                                    <div className="mt-2 text-xs text-red-600">
                                        고객 반려사유: {row.customerFeedback}
                                    </div>
                                )}
                            </div>
                            
                            {/* 프리뷰 */}
                            <div className="col-span-2 flex flex-col items-center gap-2">
                                {row.previewUrl ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => openPreview(row.previewUrl)}
                                            className="border rounded overflow-hidden hover:opacity-90"
                                            title="클릭하면 크게 보기"
                                        >
                                            <img 
                                                src={row.previewUrl}
                                                alt="preview"
                                                className="w-16 h-16 object-cover"
                                            />
                                        </button>
                                        {/* <a
                                            href={row.previewUrl}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-blue-600 hover:underline"
                                        >
                                            새창으로 보기
                                        </a> */}
                                    </>
                                ) : (
                                    <span className="text-xs text-gray-400">없음</span>
                                )}
                            </div>

                            <div className="col-span-1 text-center pt-2">
                                {statusBadge(row.previewStatus)}
                            </div>
                            
                            {/* 처리 */}
                            <div className="col-span-2 flex flex-col items-stretch gap-1.5 pt-1">
                                {canAdminApprove(row) && (
                                    <button
                                        type="button"
                                        className="px-2 py-1 text-xs rounded border border-green-200 bg-green-50 text-green-800 hover:bg-green-100 disabled:opacity-50"
                                        disabled={processingItemId === row.itemId || uploadingItemId === row.itemId || loading}
                                        onClick={async () => {
                                            const ok = window.confirm("보정을 승인 처리할까요?");
                                            if (!ok) return;
                                            setProcessingItemId(row.itemId);
                                            try {
                                                await approveRetouch(row.itemId);
                                                toast.success("승인 처리 완료");
                                                await fetchList();
                                            } catch (e) {
                                                console.error(e);
                                                toast.error(e.message || "승인 오류");
                                            } finally {
                                                setProcessingItemId(null);
                                            }
                                        }}
                                    >
                                        {processingItemId === row.itemId ? "처리중..." : "승인 처리"}
                                    </button>
                                )}
                                 
                                {canUpload(row) ? (
                                    <label className="inline-flex items-center justify-center px-2 py-1 text-xs border rounded cursor-pointer hover:bg-gray-50">
                                        {uploadingItemId === row.itemId ? "업로드중..." : "프리뷰 업로드"}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            disabled={uploadingItemId === row.itemId || processingItemId === row.itemId}
                                            onChange={(e) => onPickFile(row.itemId, e)}
                                        />
                                    </label>
                                ) : null}

                                {row.previewUrl && (
                                    <button
                                        type="button"
                                        className="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-50 disabled:opacity-50"
                                        disabled={uploadingItemId === row.itemId || processingItemId === row.itemId || loading}
                                        onClick={async () => {
                                            const ok = window.confirm("현재 프리뷰 이미지를 삭제할까요?");
                                            if (!ok) return;
                                            setProcessingItemId(row.itemId);
                                            try {
                                                await deletePreview(row.itemId);
                                                toast.success("프리뷰 삭제 완료");
                                                await fetchList();
                                            } catch (e) {
                                                console.error(e);
                                                toast.error(e.message || "삭제 오류");
                                            } finally {
                                                setProcessingItemId(null);
                                            }
                                        }}
                                    >
                                        프리뷰 삭제
                                    </button>
                                )}

                                {hasRetouchText(row) && (
                                    <button
                                        type="button"
                                        className="px-2 py-1 text-xs rounded border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50"
                                        disabled={uploadingItemId === row.itemId || processingItemId === row.itemId || loading}
                                        onClick={async () => {
                                            const ok = window.confirm("보정 요청 글(유형·메모)을 삭제할까요?\n목록에서도 제거됩니다.");
                                            if (!ok) return;
                                            setProcessingItemId(row.itemId);
                                            try {
                                                await clearRetouchRequest(row.itemId);
                                                toast.success("보정 요청 글 삭제 완료");
                                                await fetchList();
                                            } catch (e) {
                                                console.error(e);
                                                toast.error(e.message || "삭제 오류");
                                            } finally {
                                                setProcessingItemId(null);
                                            }
                                        }}
                                    >
                                        보정글 삭제
                                    </button>
                                )}

                                {!canUpload(row)
                                    && !row.previewUrl
                                    && !canAdminApprove(row)
                                    && !hasRetouchText(row) && (
                                        <span className="text-xs text-gray-400 text-center">-</span>
                                    )
                                }
                            </div>
                        </div>
                    ))
                ) }
            </div>

            {/* 미리보기 모달 */}
            {previewOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setPreviewOpen(false)}>
                    <div className="bg-white rounded-lg p-3 max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-2">
                            <div className="text-sm font-medium">프리뷰 미리보기</div>
                            <button className="text-gray-500 hover:text-black" onClick={() => setPreviewOpen(false)}>✕</button>
                        </div>
                        <img src={previewImg} alt="preview-large" className="max-w-[85vw] max-h-[80vh] object-contain rounded" />
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminRetouchList;