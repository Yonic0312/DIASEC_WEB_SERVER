import images1 from '../../assets/images/desk_stand_1.jpg';
import images2 from '../../assets/images/desk_stand_2.jpg';

const DeskStandInfoModal = ({ open, onClose }) => {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/45 p-4 overscroll-none"
            role="presentation"
            onClick={onClose}
            onTouchMove={(e) => {
                if (e.target === e.currentTarget) e.preventDefault();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="desk-stand-modal-title"
                className="bg-white rounded-xl shadow-xl max-w-[650px] w-full p-5 border border-gray-200 relative"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    type="button"
                    aria-label="닫기"
                    className="absolute top-3 right-3 w-8 h-8 rounded-full text-gray-400 hover:text-gray-800 hover:bg-gray-100"
                    onClick={onClose}
                >
                    ✕
                </button>

                <h3
                    id="desk-stand-modal-title"
                    className="text-lg font-bold text-gray-900 pr-8 mb-2"
                >
                    탁상용 안내
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-2">
                    25,000원 이하 상품은 후면에 프레임 대신
                    <strong className="text-gray-900"> 후면 거치대가 2개</strong> 들어갑니다.
                    <br />
                    상단은 벽에 걸 수 있도록, 하단은 세워 둘 수 있도록 구성됩니다.
                </p>
                <p className="text-xs text-gray-500 leading-relaxed mb-4 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2">
                    상단 또는 하단 거치대는 고객 요청사항에 요청하시면 빼고 제작 가능합니다.
                </p>

                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 aspect-square flex flex-col items-center justify-center text-center px-2">
                        <img src={images1} alt="탁상용 사진1" className="w-fit h-full" />
                    </div>
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 aspect-square flex flex-col items-center justify-center text-center px-2">
                        <img src={images2} alt="탁상용 사진2" className="w-fit h-full" />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="mt-5 w-full py-2.5 rounded-lg bg-[#D0AC88] text-white text-sm font-semibold hover:opacity-90"
                >
                    확인
                </button>
            </div>
        </div>
    );
};

export default DeskStandInfoModal;