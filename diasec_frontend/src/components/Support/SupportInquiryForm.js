import { useState, useContext, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MemberContext } from '../../context/MemberContext';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FolderDot } from 'lucide-react';

const SupportInquiryForm = () => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();
    const location = useLocation();
    const {member, setMember} = useContext(MemberContext); 

    const mode = location.state?.mode;
    const inquiry = location.state?.inquiry;
    const returnTo = location.state?.returnTo || -1;

    const [images, setImages] = useState([]);

    const [form, setForm] = useState({
        type: '',
        title: '',
        content: '',
        files: []
    });

    const reverseCategoryMap = useMemo(() => ({
        member: '회원 문의',
        order: '주문 / 결제문의',
        cancel: '취소 / 환불문의',
        design: '시안 / 수정문의',
        shipping: '배송 / 제작문의',
        etc: '기타 문의',
        product: '기타 문의',
    }), []);

    // 수정으로 들어오면 기본값 채우기
    useEffect(() => {
        if (mode !== "edit") return;
        if (!inquiry) return;

        setForm(prev => ({
            ...prev,
            type: reverseCategoryMap[inquiry.category] || '기타 문의',
            title: inquiry.title || '',
            content: inquiry.content || '',
        }));

        const oldImgs = (inquiry.imageUrls || []).map(url => ({
            kind: "old",
            url: url.trim(),
        }));

        setImages(oldImgs);
    }, [mode, inquiry, reverseCategoryMap]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });
    };


    // 이미지 상태 관리 함수
    const handleFiles = (e) => {
        const newFiles = Array.from(e.target.files);

        const newItems = newFiles.map(file => ({
            kind: "new",
            file,
            preview: URL.createObjectURL(file),
        }));

        const combined = [...images, ...newItems];

        if (combined.length > 3) {
            toast.error('이미지는 최대 3개까지만 등록할 수 있습니다.');
            newItems.forEach(it => URL.revokeObjectURL(it.preview));
            return;
        }

        setImages(combined);

        e.target.value = "";
    };

    const handleDeleteImage = (index) => {
        setImages(prev => {
            const copy = [...prev];
            const removed = copy.splice(index, 1)[0];
            if (removed?.kind === "new") URL.revokeObjectURL(removed.preview);
            return copy;
        });
    };

    const handleReorder = (result) => {
        if (!result.destination) return;

        setImages(prev => {
            const arr = Array.from(prev);
            const [moved] = arr.splice(result.source.index, 1);
            arr.splice(result.destination.index, 0, moved);
            return arr;
        });
    };

    const handleSubmit = async () => {
        if (!form.type.trim() || !form.title.trim() || !form.content.trim()) {
            toast.error('모든 항목을 입력해주세요.');
            return;
        }

        try {
            if (mode === "edit") {
                const fd = new FormData();
                fd.append("title", form.title);
                fd.append("content", form.content);
                fd.append("category", categoryMap[form.type] || "etc");
                fd.append("isPrivate", "0");

                images
                    .filter(it => it.kind === "old")
                    .forEach(it => fd.append("keepUrls", it.url));

                images
                    .filter(it => it.kind === "new")
                    .forEach(it => fd.append("images", it.file));

                await axios.patch(`${API}/inquiry/my/${inquiry.iid}/with-images`, fd, {
                    withCredentials: true,
                    headers: { "Content-Type": "multipart/form-data" },
                });    

                toast.success("문의가 수정되었습니다!");
                navigate(returnTo);
                return;
            }

            const formData = new FormData();
            formData.append('pid', 0);
            formData.append('id', member?.id);
            formData.append('title', form.title);
            formData.append('content', form.content);
            formData.append('category', categoryMap[form.type] || 'etc');
            formData.append('isPrivate', 0);

            images
                .filter(it => it.kind === "new")
                .forEach(it => formData.append("images", it.file));

            await axios.post(`${API}/inquiry/insert`, formData, {
                headers: { 'Content-Type': 'multipart/form-data', },
                withCredentials: true,
            });

            toast.success('문의가 등록되었습니다!');
            navigate(returnTo);
        } catch (err) {
            console.error(err);
            toast.error('처리에 실패했습니다.');
        }
    };

    const categoryMap = {
        '회원 문의' : 'member',
        '주문 / 결제문의' : 'order',
        '취소 / 환불문의' : 'cancel',
        '시안 / 수정문의' : 'design',
        '배송 / 제작문의' : 'shipping',
        '기타 문의' : 'etc'
    }

    return(
        <div className="flex flex-col w-full max-w-[1100px] mb-20 
            mr-2 ml-2 md:ml-0"
        >   
            <div 
                className="
                    full 
                    md:p-7 p-[clamp(0.5rem,3.65vw,1.75rem)]
                    md:space-y-6 space-y-[clamp(8px,7.49vw,24px)]
                    border border-gray-200 shadow-md rounded-lg`">
                <h2 
                    className="
                        md:text-xl text-[clamp(14px,3.128vw,24px)]
                        font-bold text-center mb-6"
                >문의하기</h2>

                <div className="space-y-6">
                    {/* 문의 유형 */}
                    <div>
                        <label 
                            className="
                                md:text-sm text-[clamp(11px,1.824vw,14px)]
                                block font-medium mb-1">문의 유형</label>
                        <select
                            name="type"
                            value={form.type}
                            onChange={handleChange}
                            className="
                                md:text-sm text-[clamp(11px,1.824vw,14px)]
                                w-full border px-3 py-2 rounded"
                        >
                            <option value="">문의 유형 선택</option>
                            <option>회원 문의</option>
                            <option>주문 / 결제문의</option>
                            <option>취소 / 환불문의</option>
                            <option>시안 / 수정문의</option>
                            <option>배송 / 제작문의</option>
                            <option>기타 문의</option>
                        </select>
                    </div>

                    {/* 제목 */}
                    <div>
                        <label 
                            className="
                                md:text-sm text-[clamp(11px,1.824vw,14px)]
                                block font-medium mb-1">문의 제목</label>
                        <input
                            type="text"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            className="
                                md:text-sm text-[clamp(11px,1.824vw,14px)]
                                w-full border px-3 py-2 rounded"
                        />
                    </div>

                    {/* 내용 */}
                    <div>
                        <label 
                            className="
                                md:text-sm text-[clamp(11px,1.824vw,14px)]
                                block font-medium mb-1">문의 내용</label>
                        <textarea 
                            name="content"
                            value={form.content}
                            onChange={handleChange}
                            rows={5}
                            className='
                                md:text-sm text-[clamp(11px,1.824vw,14px)]
                                w-full border px-3 py-2 rounded resize-none'
                        />
                    </div>

                    {/* 파일 첨부 */}
                    <div>
                        <label 
                            className='
                                md:text-sm text-[clamp(11px,1.824vw,14px)]
                                block font-medium mb-1'>첨부파일</label>
                        <div className='relative'>
                            <input 
                                type="file"
                                multiple
                                accept="image/png, image/jpeg"
                                onChange={handleFiles}
                                className="absolute w-full h-full opacity-0 cursor-pointer"
                            />
                            <div 
                                className="
                                    md:text-sm text-[clamp(11px,1.824vw,14px)]
                                    border px-3 py-2 text-center bg-gray-100 hover:bg-gray-200">
                                이미지 선택
                            </div>
                        </div>
                        <p 
                            className="
                                md:text-sm text-[clamp(11px,1.824vw,14px)]
                                text-gray-400 mt-1">2MB 이하 이미지(png, jpg) 최대 3개</p>

                        {/* 미리보기 + 정렬 */}
                        {images.length > 0 && (
                            <DragDropContext onDragEnd={handleReorder}>
                                <Droppable droppableId="inquiryImages" direction="horizontal">
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="flex gap-3 mt-3 flex-wrap"
                                        >
                                            {images.map((it, index) => (
                                                <Draggable 
                                                    key={(it.kind === "old" ? it.url : it.preview) + index} 
                                                    draggableId={(it.kind === "old" ? it.url : it.preview) + index}  
                                                    index={index}
                                                >
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className="relative"
                                                        >
                                                            <img
                                                                src={it.kind === "old" ? encodeURI(it.url) : it.preview}
                                                                alt={`img-${index}`}
                                                                className="md:w-20 w-[clamp(40px,10.43vw,80px)] md:h-20 h-[clamp(40px,10.43vw,80px)] object-cover border"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteImage(index)}
                                                                className="absolute top-0 right-0 bg-black text-white text-xs px-1"
                                                            >
                                                                ✕
                                                            </button>
                                                            <div className="text-xs text-center mt-1">#{index + 1}</div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        )}
                    </div>

                    {/* 버튼 */}
                    <div className="flex gap-4 justify-end mt-8">
                        <button 
                            className="
                                md:text-sm text-[clamp(11px,1.824vw,14px)]
                                px-4 py-2 border rounded" onClick={() => navigate(-1)}
                        >
                            돌아가기
                        </button>
                        <button 
                            className="
                                md:text-sm text-[clamp(11px,1.824vw,14px)]
                                px-5 py-2 bg-black text-white rounded" onClick={handleSubmit}>
                            등록하기
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default SupportInquiryForm;