import { useState, useContext } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MemberContext } from '../../../context/MemberContext';
import axios from 'axios';
import { toast } from 'react-toastify';

/**
 * @param {Object} props
 * @Param {number|string} [props.pid] - 모달에서 전달 시 URL 없이 사용
 * @param {() => void} [props.onClose] - 닫기/취소 (모달)
 * @param {() => void} [props.onSuccess] - 등록 성공 후 (목록 갱신 등)
 */
const InquiryForm = ({ pid: pidProp, onClose, onSuccess }) => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const pid = pidProp != null && pidProp !== '' ? pidProp : searchParams.get('pid');
    const { member } = useContext(MemberContext);
    const isModal = typeof onClose === 'function';

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    // const [images, setImages] = useState([]);

    // const handleFileChange = (e) => {
    //     const selected = Array.from(e.target.files).slice(0, 3);
    //     setImages(selected);
    // };

    const handleCancel = () => {
        if (isModal) {
            onClose();
            return;
        }
        navigate(-1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title.trim() || !content.trim()) {
            toast.error("제목과 내용을 모두 입력해주세요.");
            return;
        }

        if (pid == null || pid === '') {
            toast.error('상품 정보를 찾을 수 없습니다.');
            return;
        }

        const formData = new FormData();
        formData.append('pid', pid);
        formData.append('id', member?.id);
        formData.append('title', title);
        formData.append('content', content);
        formData.append('category', 'product');
        formData.append('isPrivate', isPrivate ? 1 : 0);

        // images.forEach((img) => {
        //     formData.append('images', img);
        // });

        try {
            await axios.post(`${API}/inquiry/insert`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('문의가 등록되었습니다.');
            // 초기화
            setTitle('');
            setContent('');
            setIsPrivate(false);
            // setImages([]);

            if (onSuccess) {
                onSuccess();
            }
            if (isModal) {
                onClose();
            } else {
                navigate(-1);
            }
        } catch (err) {
            console.error(err);
            toast.error('문의 등록에 실패했습니다.');
        }
    };

    const formWrapClass = isModal
        ? 'space-y-4 p-6'
        : 'mt-20 space-y-4 max-w-xl mx-auto p-6 border rounded';

    return (
        <form onSubmit={handleSubmit} className={formWrapClass}>
            <div className="flex items-start justify-between gap-4">
                <h2 
                    id={isModal ? 'inquiry-modal-title' : undefined}
                    className="text-xl font-semibold"
                >
                    문의 작성
                </h2>
                {isModal && (
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                        aria-label="닫기"
                    >
                        <span className="text-2xl leading-none">&times;</span>
                    </button>
                )}
            </div>

            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목"
                className="w-full border px-3 py-2 rounded"
            />

            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="문의 내용을 입력해주세요"
                rows={5}
                className="w-full border px-3 py-2 rounded resize-none"
            />

            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={() => setIsPrivate((prev) => !prev)}
                />
                <label>비공개 문의</label>
            </div>

            {/* 
            <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="w-full border px-2 py-1"
            />
            <p className="text-sm text-gray-500">최대 3개까지 이미지 첨부 가능</p>

            {images.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                    {images.map((img, idx) => (
                        <img 
                            key={idx} 
                            src={URL.createObjectURL(img)} 
                            alt="preview"
                            className="w-20 h-20 object-cover border rounded" 
                        />
                    ))}
                </div>
            )} */}

            <div className="flex flex-wrap gap-2 pt-2">
                <button
                    type="submit"
                    className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                >
                    등록하기
                </button>
                <button
                    type="button"
                    onClick={handleCancel}
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50"
                >
                    취소
                </button>
            </div>
        </form>
    )
}
export default InquiryForm;
