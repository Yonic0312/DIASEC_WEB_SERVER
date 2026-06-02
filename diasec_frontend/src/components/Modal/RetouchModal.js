import { useState, useEffect } from 'react';
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

const BEFORE_AFTER_DATA = [
    { title: '피부 보정', before: custom1, after: custom2 },
    { title: '치아 보정', before: custom3, after: custom4 },
    { title: '라인 보정', before: custom5, after: custom6 },
    { title: '색감 보정', before: custom7, after: custom8 },
    { title: '배경 정리', before: custom9, after: custom10 },
    { title: '고해상도 업스케일', before: custom11, after: custom12 },
];
export const CUSTOM_FRAME_RETOUCH_OPTION_LABELS = BEFORE_AFTER_DATA.map((v) => v.title);
/**
 * 맞춤액자 보정 요청 모달 — Main_CustomFrames / OrderForm 공용
 *
 * @param {boolean} open
 * @param {() => void} onClose
 * @param {{ enabled: boolean, types: string[], note: string }} draft
 * @param {React.Dispatch<React.SetStateAction<{ enabled: boolean, types: string[], note: string }>>} setDraft
 * @param {() => void} onSave
 * @param {{ label: string, onClick: () => void }} secondaryFooter — 왼쪽 버튼 (보정 취소 / 닫기)
 * @param {boolean} [showEnabledCheckbox=false] — 주문서: 보정 사용 체크박스
 */
const RetouchModal = ({
    open,
    onClose,
    draft,
    setDraft,
    onSave,
    secondaryFooter,
    showEnabledCheckbox = false,
}) => {
    const [activeIndex, setActiveIndex] = useState(0);
    const [showAfter, setShowAfter] = useState(false);
    const retouchOptions = CUSTOM_FRAME_RETOUCH_OPTION_LABELS;
    const current = BEFORE_AFTER_DATA[activeIndex];
    useEffect(() => {
        if (!open) return;
        setActiveIndex(0);
        setShowAfter(false);
    }, [open]);

    // 모달 열림 시 배경 스크롤 잠금 (iOS 포함)
    useEffect(() => {
        if (!open) return;

        const scrollY = window.scrollY;
        const prevOverflow = document.body.style.overflow;

        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';

        const onKey = (e) => {
            if (e.key === 'Escape' && onClose) onClose();
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
    }, [open, onClose]);

    if (!open) return null;
    const overlayClass = 
        'fixed inset-0 bg-black/50 z-[10000] flex items-center justify-center overscroll-none'
    const panelClass = 
        'w-full h-[81%] overflow-y-scroll max-w-lg bg-white shadow-xl py-3 px-4 md:px-4 mx-4'
    const selectionBlocked = showEnabledCheckbox && !draft.enabled;
    return (
        <div 
            className={overlayClass} 
            onTouchMove={(e) => {
                if (e.target === e.currentTarget) e.preventDefault();
            }}
        >
            <div className={panelClass}>
                <div className="relative flex items-start justify-between border-b-[1px]">
                    <div className="absolute left-1/2 -translate-x-1/2">
                        <h3 className="text-lg font-bold text-gray-800">보정 요청</h3>
                    </div>
                    <button
                        type="button"
                        className="ml-auto w-9 h-9 rounded-full hover:bg-gray-100 text-gray-600"
                        onClick={onClose}
                        aria-label="닫기"
                    >
                        ✕
                    </button>
                </div>
                <div className="mt-4">
                    {showEnabledCheckbox && (
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
                            <input
                                type="checkbox"
                                checked={draft.enabled}
                                onChange={(e) =>
                                    setDraft((d) => ({
                                        ...d,
                                        enabled: e.target.checked,
                                        types: e.target.checked ? d.types : [],
                                        note: e.target.checked ? d.note : '',
                                    }))
                                }
                            />
                            이 사진 보정 요청할게요
                        </label>
                    )}
                    <div
                        className={`${selectionBlocked ? 'opacity-50 pointer-events-none' : ''} mt-4`}
                    >
                        <div className={'text-[16px] font-semibold text-gray-700 ml-1 mb-2'}>
                            보정 항목 선택
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {retouchOptions.map((opt) => {
                                const checked = draft.types.includes(opt);
                                return (
                                    <button
                                        key={opt}
                                        type="button"
                                        className={`text-sm px-3 py-2 rounded-xl border transition text-left
                                            ${
                                                checked
                                ? 'border-[#D0AC88] bg-[#fffaf3] text-[#a67a3e]'
                                : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                            }`}
                                        onClick={() => {
                                            setDraft((d) => {
                                                const on = d.types.includes(opt);
                                                const next = on
                                                    ? d.types.filter((t) => t !== opt)
                                                    : [...d.types, opt];
                                                return { ...d, types: next };
                                            });
                                        }}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-4">
                            <div className='text-[16px] font-semibold text-gray-700 ml-1 mb-2'>
                                요청사항
                            </div>
                            <textarea
                                rows={4}
                                value={draft.note}
                                onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
                                placeholder="예) 잡티 제거, 피부톤 자연스럽게, 배경 흰색으로, 역광 완화 등"
                                className="w-full border border-gray-200 rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-[#D0AC88]"
                            />
                                <>
                                    <p className="text-xs text-gray-500 mt-2">
                                        ※ 고난도 보정은 작업 난이도에 따라 추가 비용이 발생할 수 있으며, 상담 후
                                        진행됩니다.
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        ※ 보정 요청 시 추가 작업으로 인해 배송 일정이 다소 지연될 수 있습니다.
                                    </p>
                                    <p className="text-xs text-gray-500 mt-2">
                                        ※ 트리밍(이미지 자르기) 작업은 별도 문의 부탁드립니다.
                                    </p>
                                </>
                        </div>
                    </div>
                </div>
                <div className="mt-5 flex gap-2">
                    {secondaryFooter && (
                        <button
                            type="button"
                            className="flex-1 h-[46px] rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700"
                            onClick={secondaryFooter.onClick}
                        >
                            {secondaryFooter.label}
                        </button>
                    )}
                    <button
                        type="button"
                        className="flex-1 h-[46px] rounded-xl bg-[#D0AC88] text-white hover:opacity-90"
                        onClick={onSave}
                    >
                        저장
                    </button>
                </div>
                <div>
                    <div
                        className="
                        max-w-[380px] border
                        aspect-[1024/1366] mx-auto bg-opacity-60 rounded-lg mt-5
                        xl:p-6 lg:p-5 md:p-4 p-2
                    "
                    >
                        <h3
                            className="
                            text-[clamp(16px,1.759vw,18px)] lg:text-[18px]
                            font-semibold text-center text-[#a67a3e]"
                        >
                            {current.title}
                        </h3>
                        <div className="relative w-full flex justify-center items-center">
                            <img
                                src={showAfter ? current.after : current.before}
                                alt="보정 비교"
                                className="rounded-xl transition duration-500 shadow-lg max-w-full aspect-[1024/1366] object-contain"
                            />
                            <div
                                className="
                                text-[clamp(14px,1.9544vw,15px)] md:text-[clamp(15px,1.564vw,16px)] lg:text-[16px]
                                absolute bottom-2 flex gap-3 px-4 py-2"
                            >
                                <button
                                    type="button"
                                    className={`px-4 py-1 rounded-full font-semibold transition ${
                                        !showAfter
                                            ? 'bg-[#cfab88] text-white'
                                            : 'bg-gray-200 text-gray-700'
                                    }`}
                                    onClick={() => setShowAfter(false)}
                                    onMouseEnter={() => setShowAfter(false)}
                                >
                                    원본사진
                                </button>
                                <button
                                    type="button"
                                    className={`px-4 py-1 rounded-full font-semibold transition ${
                                        showAfter
                                            ? 'bg-[#cfab88] text-white'
                                            : 'bg-gray-200 text-gray-700'
                                    }`}
                                    onClick={() => setShowAfter(true)}
                                    onMouseEnter={() => setShowAfter(true)}
                                >
                                    보정사진
                                </button>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-center gap-2">
                            {BEFORE_AFTER_DATA.map((_, idx) => (
                                <button
                                    key={idx}
                                    type="button"
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
                            mt-4
                            md:text-sm text-[clamp(11px,1.8252vw,14px)]
                            font-medium tracking-wide
                            text-gray-600
                            px-4
                        "
                        >
                            원본사진과 보정사진을{' '}
                            <div>
                                <span className="text-[#a67a3e] ml-1 font-semibold">클릭</span>해 비교해보세요!
                            </div>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default RetouchModal;
