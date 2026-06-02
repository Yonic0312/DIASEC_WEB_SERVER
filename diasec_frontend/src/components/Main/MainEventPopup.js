import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';


const STORAGE_KEY = 'diasec_main_event_popup_hide_date';

function getLocalDateKey() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export default function MainEventPopup({ events = [] }) {
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);
    const [idx, setIdx] = useState(0);

    useEffect(() => {
        if (!Array.isArray(events) || events.length === 0) return;
        try {
            if (localStorage.getItem(STORAGE_KEY) === getLocalDateKey()) return;
        } catch {

        }
        setOpen(true);
        setIdx(0);
    }, [events]);

    useEffect(() => {
        if (idx >= events.length) setIdx(0);
    }, [events.length, idx]);

    useEffect(() => {
        if (!open || events.length <= 1) return;
        const t = setInterval(
            () => setIdx((i) => (i + 1) % events.length),
            5500
        );
        return () => clearInterval(t);
    }, [open, events.length, idx]);

    const close = useCallback(() => setOpen(false), []);

    const hideToday = useCallback(() => {
        try {
            localStorage.setItem(STORAGE_KEY, getLocalDateKey());
        } catch {

        }
        setOpen(false);
    }, []);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === 'Escape') close();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, close]);

    if (!open || !events.length) return null;

    const ev = events[idx];
    const goDetail = () => {
        if (ev?.eventId != null) {
            navigate(`/mainEventDetail/${ev.eventId}`);
            setOpen(false);
        }
    };

    const prev = () => 
        setIdx((i) => (i - 1 + events.length) % events.length);
    const next = () => setIdx((i) => (i + 1) % events.length);

    return (
        <div
            className="
                fixed z-[60] pointer-events-none
                left-1 sm:left-4 bottom-1 sm:bottom-4
                w-[min(380px,calc(100vw_-_5.5rem))]
                [padding-bottom:env(safe-area-inset-bottom,0px)]
            "
            aria-live="polite"
        >
            <div
                role="dialog"
                aria-modal="false"
                aria-labelledby="main-event-popup-title"
                className="
                    pointer-events-auto w-full max-w-full min-w-0
                    rounded-2xl overflow-hidden
                    bg-[#fff]
                    border border-gray-300
                    shadow-[0_12px_40px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.06)]
                "
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center px-3.5 md:px-4 pt-1 sm:pt-1.5 pb-0.5 sm:pb-1">
                    <p
                        id="main-event-popup-title"
                        className="text-[12px] md:text-[13px] font-bold tracking-wide text-gray-800"
                    >
                        진행 중 이벤트
                    </p>

                    <div className="flex flex-col items-center px-0.5">
                        {events.length > 1 && (
                            <div className="flex justify-cetner gap-1.5">
                                {events.map((_, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        aria-label={`이벤트 ${i + 1}번`}
                                        className={`
                                            h-1.5 rounded-full transition-all duration-300
                                            ${i === idx
                                                ? 'w-5 bg-[#1a1a1a]'
                                                : 'w-1.5 bg-gray-300 hover:bg-gray-400'
                                            }
                                        `}
                                        onClick={() => setIdx(i)}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-1 sm:px-2.5 sm:pb-2">
                    <div
                        className="
                            relative w-full aspect-[2/1] rounded-xl overflow-hidden
                            bg-[#f0ebe3]
                            cursor-pointer group
                        "
                        onClick={goDetail}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                goDetail();
                            }
                        }}
                        role="button"
                        tabIndex={0}
                        aria-label={`${ev?.title || '이벤트'} 상세보기`}
                    >
                        <img
                            src={ev?.thumbnailUrl}
                            alt=""
                            className="w-full h-full object-cover transition duration-300 group-hover:opacity-95"
                        />
                        {events.length > 1 && (
                            <>
                                <button
                                    type="button"
                                    aria-label="이전 이벤트"
                                    className="
                                        absolute left-1.5 top-1/2 -translatey-1/2
                                        w-8 h-8 rounded-full
                                        bg-black/35 text-white flex items-center justify-center
                                        hover:bg-black/50 backdrop-blur-[2px] transition"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        prev();
                                    }}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    aria-label="다음 이벤트"
                                    className="
                                        absolute right-1.5 top-1/2 -translatey-1/2
                                        w-8 h-8 rounded-full
                                        bg-black/35 text-white flex items-center justify-center
                                        hover:bg-black/50 backdrop-blur-[2px] transition"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        next();
                                    }}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div
                    className="
                        flex flex-row sm:items-center justify-between gap-2
                        px-3.5 py-1 sm:py-1.5 md:px-4 sm:border-t border-gray-200
                        bg-[#fff]
                    "
                >
                    <button
                        type="button"
                        className="
                            text-[12px] md:text-[13px] text-gray-500 underline underline-offset-4
                            decoration-gray-400 hover:text-gray-900 hover:decoration-gray-700
                            py-0.5 text-left transition
                        "
                        onClick={hideToday}
                    >
                        오늘 하루 보지 않음
                    </button>
                    <button
                        type="button"
                        className="
                            w-auto shrink-0
                            px-4 py-1 rounded-lg
                            text-[12px] font-semibold
                            bg-[#fff] border text-black
                            hover:bg-black hover:text-white transition
                        "
                        onClick={close}
                    >
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
}