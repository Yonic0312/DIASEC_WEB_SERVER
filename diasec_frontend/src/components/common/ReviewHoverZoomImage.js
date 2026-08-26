import { useRef, useState } from 'react';
import { jsx } from 'react/jsx-runtime';

const LENS_SIZE = 170;
const ZOOM = 2.7;

const ReviewHoverZoomImage = ({ src, alt, onOpenFull }) => {
    const boxRef = useRef(null);
    const imgRef = useRef(null);
    const [lens, setLens] = useState(null);

    const handleMove = (e) => {
        if (window.matchMedia('(hover: none)').matches) return;

        const img = imgRef.current;
        const box = boxRef.current;
        if (!img || !box || !img.naturalWidth) return;

        const boxRect = box.getBoundingClientRect();
        const rw = img.clientWidth;
        const rh = img.clientHeight;
        const scale = Math.min(rw / img.naturalWidth, rh / img.naturalHeight);
        const dw = img.naturalWidth * scale;
        const dh = img.naturalHeight * scale;
        const ox = (rw - dw) / 2;
        const oy = (rh - dh) / 2;

        const x = e.clientX - boxRect.left - ox;
        const y = e.clientY - boxRect.top - oy;

        if (x < 0 || y < 0 || x > dw || y > dh) {
            setLens(null);
            return;
        }

        setLens({
            left: ox + x - LENS_SIZE / 2,
            top: oy + y - LENS_SIZE / 2,
            bgPosX: -(x * ZOOM - LENS_SIZE / 2),
            bgPosY: -(y * ZOOM - LENS_SIZE / 2),
            bgW: dw * ZOOM,
            bgH: dh * ZOOM,
        });
    };

    if (!src) {
        return (
            <div className="w-full aspect-[4/3] rounded-xl border border-gray-200 bg-gray-50" />
        );
    }

    return (
        <div
            ref={boxRef}
            className="relative w-full aspect-[4/3] rounded-xl border border-gray-200 bg-gray-50 overflow-hidden cursor-zoom-in"
            onClick={onOpenFull}
            onMouseMove={handleMove}
            onMouseLeave={() => setLens(null)}
        >
            <img 
                ref={imgRef}
                src={src}
                alt={alt}
                className="w-full h-full object-contain block"
                draggable={false}
            />
            {lens && (
                <div
                    className="absolute rounded-full border-2 border-white shadow-lg pointer-events-none hidden md:block"
                    style={{
                        width: LENS_SIZE,
                        height: LENS_SIZE,
                        left: lens.left,
                        top: lens.top,
                        backgroundImage: `url(${src})`,
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: `${lens.bgW}px ${lens.bgH}px`,
                        backgroundPosition: `${lens.bgPosX}px ${lens.bgPosY}px`,
                    }}
                />
            )}
            {!lens && (
                <span className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white pointer-events-none">
                    클릭하면 전체 확대
                </span>
            )}
        </div>
    );
};

export default ReviewHoverZoomImage;