import { useState, useEffect } from "react";
import { toast } from 'react-toastify';

const EventModal = ({ onClose, onSuccess, event }) => {
    const API = process.env.REACT_APP_API_BASE;

    const isEdit = !!event;

    const [form, setForm] = useState({
        title: event?.title || "",
        status: event?.status || "ongoing",
        content: event?.content || "",
    });

    // 오늘로 날짜 "YYYY-MM-DD" 형식의 문자열로 반환하는 함수
    const getToday = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

    // 시작일 상태 초기화
    const [startDate, setStartDate] = useState(() => {
        // event?period가 있으면(수정 모드일 경우) 기존 시작일 유지
        if(event?.period) return event.period.split("~")[0];
        // 그렇지 않으면 오늘 날짜로 초기화
        return getToday();
    });

    const [endDate, setEndDate] = useState(
        event?.period?.includes("당사") ? "" : event?.period?.split("~")[1] || ""
    );
    const [noEndDate, setNoEndDate] = useState(
        event?.period?.includes("당사") || false
    );

    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [detailFile, setDetailFile] = useState(null);

    // 미리보기용 기존 이미지 경로
    const [previewThumbnail, setPreviewThumbnail] = useState(event?.thumbnailUrl || "");
    const [previewDetail, setPreviewDetail] = useState(event?.detailImageUrl || "");

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!startDate) {
            toast.error("시작일을 설정해주세요.");
            return;
        }

        const period = endDate
            ? `${startDate}~${endDate}`
            : `${startDate}~당사 별도 공지 전 까지`;

        const formData = new FormData();
        formData.append(
            "event",
            new Blob(
                [JSON.stringify({ ...form, period, eventId: event?.eventId })],
                { type: "application/json" }
            )
        );

        if (thumbnailFile) formData.append("thumbnail", thumbnailFile);
        if (detailFile) formData.append("detail", detailFile);

        try {
            await fetch(`${API}/event/${isEdit ? "update" : "insert"}`, {
                method: "POST",
                body: formData,
                credentials: "include",
            });

            toast.success(isEdit ? "이벤트가 수정되었습니다." : "이벤트가 등록되었습니다.");
            onSuccess();
            onClose();
        } catch (err) {
            console.error("처리 실패", err);
            toast.error("오류 발생");
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-[10000]">
            <div className="bg-white p-6 rounded-lg w-full max-w-md relative shadow-xl">
                <h3 className="text-lg font-bold mb-4">
                    {isEdit ? "이벤트 수정" : "이벤트 등록"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="제목"
                        value={form.title}
                        onChange={(e) =>
                            setForm({ ...form, title: e.target.value })
                        }
                        className="w-full border px-3 py-2 rounded"
                        required
                    />
                    <div className="flex gap-2 items-center">
                        <input
                            type="date"
                            className="flex-1 border px-3 py-2 rounded"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            required
                        />
                        <span className="self-center">~</span>
                        <input
                            type="date"
                            className={`flex-1 border px-3 py-2 rounded ${noEndDate ? "bg-gray-100" : ""}`}
                            value={noEndDate ? "" : endDate}
                            onChange={(e) => {
                                setEndDate(e.target.value);
                                setNoEndDate(false);
                            }}
                            disabled={noEndDate}
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setNoEndDate(!noEndDate);
                                if (!noEndDate) setEndDate("");
                            }}
                            className="text-xs text-blue-600 underline ml-2"
                        >
                            {noEndDate ? "종료일 설정하기" : "종료일 없음"}
                        </button>
                    </div>
                    {noEndDate && (
                        <div className="text-xs text-gray-500 mt-1">
                            종료일이 설정되지 않았습니다.{" "}
                            <b>"당사 별도 공지 전까지"</b>로 저장됩니다.
                        </div>
                    )}
                    <select
                        value={form.status}
                        onChange={(e) =>
                            setForm({ ...form, status: e.target.value })
                        }
                        className="w-full border px-3 py-2 rounded"
                    >
                        <option value="ongoing">진행중</option>
                        <option value="ended">종료</option>
                    </select>
                    <textarea
                        placeholder="내용"
                        value={form.content}
                        onChange={(e) =>
                            setForm({ ...form, content: e.target.value })
                        }
                        className="w-full border px-3 py-2 rounded h-24"
                    />

                    {/* 썸네일 이미지 */}
                    <div>
                        <label className="block text-sm mb-1">썸네일 이미지 {isEdit && "(선택)"}</label>
                        {previewThumbnail && (
                            <img
                                src={previewThumbnail}
                                alt="썸네일 미리보기"
                                className="mb-2 w-full max-h-40 object-contain"
                            />
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                setThumbnailFile(file);
                                setPreviewThumbnail(URL.createObjectURL(file)); // 기존 이미지 숨김
                            }}
                            className="w-full"
                            required={!isEdit}
                        />
                    </div>

                    {/* 상세 이미지 */}
                    <div>
                        <label className="block text-sm mb-1">상세 이미지 {isEdit && "(선택)"}</label>
                        {previewDetail && (
                            <img
                                src={previewDetail}
                                alt="상세 미리보기"
                                className="mb-2 w-full max-h-40 object-contain"
                            />
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                setDetailFile(file);
                                setPreviewDetail(URL.createObjectURL(file));
                            }}
                            className="w-full"
                            required={!isEdit}
                        />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-500">
                            취소
                        </button>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
                            {isEdit ? "수정" : "등록"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventModal;
