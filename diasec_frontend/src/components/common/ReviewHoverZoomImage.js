import { useRef } from 'react';

const LENS_SIZE = 170;
const ZOOM = 2.7;

const ReviewHoverZoomImage = ({ src, alt, onOpenFull }) => {
    const boxRef = useRef(null);
    const imgRef = useRef(null);
    const lensRef = useRef(null);
    const hintRef = useRef(null);

    const hideLens = () => {
        const lens = lensRef.current;
        if (lens) lens.style.visibility = 'hidden';
        const hint = hintRef.current;
        if (hint) hint.style.opacity = '1';
    };

    const handleMove = (e) => {
        if (window.matchMedia('(hover: none)').matches) return;

        const img = imgRef.current;
        const box = boxRef.current;
        const lens = lensRef.current;
        if (!img || !box || !lens || !img.naturalWidth) return;

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
            hideLens();
            return;
        }

        lens.style.visibility = 'visible';
        lens.style.left = `${ox + x - LENS_SIZE / 2}px`;
        lens.style.top = `${oy + y - LENS_SIZE / 2}px`;
        lens.style.backgroundSize = `${dw * ZOOM}px ${dh * ZOOM}px`;
        lens.style.backgroundPosition = `${-(x * ZOOM - LENS_SIZE / 2)}px ${-(y * ZOOM - LENS_SIZE / 2)}px`;

        const hint = hintRef.current;
        if (hint) hint.style.opacity = '0';
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
            onMouseLeave={hideLens}
        >
            <img
                ref={imgRef}
                src={src}
                alt={alt}
                className="w-full h-full object-contain block"
                draggable={false}
            />
            
            <div
                ref={lensRef}
                className="absolute rounded-full border-2 border-white shadow-lg pointer-events-none hidden md:block"
                style={{
                    visibility: 'hidden',
                    width: LENS_SIZE,
                    height: LENS_SIZE,
                    backgroundImage: `url(${src})`,
                    backgroundRepeat: 'no-repeat',
                }}
            />
            <span 
                ref={hintRef}
                className="absolute bottom-2 right-2 rounded-full bg-black/55 px-2 py-0.5 text-[11px] text-white pointer-events-none transition-opacity"
            >
                클릭하면 전체 확대
            </span>
        </div>
    );
};

export default ReviewHoverZoomImage;
