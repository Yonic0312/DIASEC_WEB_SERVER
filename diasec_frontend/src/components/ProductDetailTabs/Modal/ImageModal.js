import { useState } from 'react';

const ImageModal = ({ images, currentIndex, onClose, onSelect }) => {
    if (!images || images.length === 0) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
            onClick={onClose}
        >   
            <div
                className="relative bg-white p-6 rounded shadow-md"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-[500px] h-[500px] flex items-center justify-center bg-black bg-opacity-5 rounded mb-4">
                    <img
                        src={images[currentIndex]}
                        alt={`미리보기 ${currentIndex}`}
                        className="max-w-full max-h-full object-contain"
                    />
                </div>

                {/* 썸네일 */}
                <div className="flex gap-2 mt-2 justify-center">
                    {images.map((img, idx) => (
                        <img 
                            key={idx}
                            src={img}
                            alt={`썸네일 ${idx}`}
                            className={`w-16 h-16 object-cover border rounded curosr-pointer ${
                                idx === currentIndex ? 'ring-2 ring-black' : ''
                            }`}
                            onClick={() => onSelect(idx)}
                        />
                    ))}
                </div>

                <button 
                    onClick={onClose} 
                    className="absolute top-2 right-2 text-black text-xl"
                >
                    ✕
                </button>
            </div>
        </div>
    );
};

export default ImageModal;
