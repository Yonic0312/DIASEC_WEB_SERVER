import { useState, useEffect } from 'react';
import {DragDropContext, Droppable, Draggable} from '@hello-pangea/dnd';
import { toast } from 'react-toastify';
import axios from 'axios';

const Insert_Product = () => {
    const API = process.env.REACT_APP_API_BASE;
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [author, setAuthor] = useState('');
    const [thumbnails, setThumbnails] = useState([]);
    const [detailImages, setDetailImages] = useState([]); // 상세 이미지 상태 추가
    const [sort_order, setSort_Order] = useState('');
    const [isFixed, setIsFixed] = useState(false);

    const [isDraggingThumb, setIsDraggingThumb] = useState(false);
    const [isDraggingDetail, setIsDraggingDetail] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!title || !category || !thumbnails) {
            toast.error("모든 항목을 입력해주세요.");
            return;
        }

        const formData = new FormData();
        formData.append('title', title);
        formData.append('category', category);
        formData.append('author', author);
        formData.append('sort_order', sort_order);
        
        // 썸네일 여러 장
        thumbnails.forEach((file) => formData.append('topImages', file));
        // 상세 이미지들 추가
        detailImages.forEach((file) => formData.append('detailImages', file));

        try {
            const res = await axios.post(`${API}/product/insert`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                withCredentials: true
            });

            toast.success("등록이 완료되었습니다.");

            if (isFixed) {
                const currentOrder = Number(sort_order);
                const nextOrder = (Number.isFinite(currentOrder) && currentOrder > 0) ? currentOrder + 1 : 0;
                
                setTitle('');
                setSort_Order(nextOrder === '' ? '' : String(nextOrder));
                setThumbnails([]);
                setDetailImages([]);
            } else {
                // 초기화
                setTitle('');
                setCategory('');
                setAuthor('');
                setThumbnails([]);
                setDetailImages([]);
                setSort_Order('');
            }

            
        } catch (err) {
            console.error(err);
            toast.error("등록에 실패했습니다.");
        }
    };

    // 컬렉션 옵션들 불러오기
    const [collections, setCollections] = useState([]);
    const [collectionItems, setCollectionItems] = useState([]);

    // 컬렉션 불러오기
    useEffect(() => {
        axios.get(`${API}/collections`)
            .then(res => setCollections(res.data))
            .catch(err => console.error("컬렉션 목록 불러오기 실패", err));
    }, []);

    // 파일 드롭
    const handleFileDrop = (e, setImages, setIsDragging) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            setImages((prev) => [...prev, ...files]);
        }
    };

    const handleFileChange = (e, setImages) => {
        const files = Array.from(e.target.files);
        setImages((prev) => [...prev, ...files])
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-[400px] mx-auto mb-20">
            <span className="text-center text-2xl mb-1">상품 등록하기</span>
            {/* 고정 버튼 */}
            <button
                type="button"
                onClick={() => setIsFixed(!isFixed)}
                className={`px-3 py-1 rounded text-sm font-semibold transition
                    ${isFixed ? 'bg-[#D0AC88] text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            >
                {isFixed ? '고정 중' : '고정 해제'}
            </button>
            
            <select 
                value={category} 
                onChange={(e) => {
                    const selectedValue = e.target.value;
                    setCategory(e.target.value);
                    const selected = collections.find(c => c.name === selectedValue);
                    if (selected) {
                        axios.get(`${API}/collections/items?collectionId=${selected.id}`)
                            .then(res => setCollectionItems(res.data));
                    }
                }}  
                className="border px-2 py-1" 
            >
                <option hidden value="">카테고리 선택</option>
                {collections.map(c => (
                    <option key={c.id}value={c.name}>{c.displayName}</option>
                ))}
            </select>
            

            {collections.find(col => col.name === category) && (
                <>
                    <select 
                        value={author} 
                        onChange={(e) => setAuthor(e.target.value)} 
                        className="border px-2 py-1"
                    >
                        <option value="">작가 및 주제 선택</option>
                        {collectionItems.map((item, index) => (
                            <option key={index} value={item.label}>{item.label}</option>
                        ))}
                    </select>
                </>
            )}

            <input type="text" placeholder="순위 (0)" value={sort_order} onChange={(e) => setSort_Order(e.target.value)} className="border px-2 py-1" />
            <input type="text" placeholder="상품명" value={title} onChange={(e) => setTitle(e.target.value)} className="border px-2 py-1" />
            
            <span>이미지 썸네일 (드래그로 순서 변경)</span>
            <label
                htmlFor="thumbInput"
                onDragEnter={(e) => {
                    e.preventDefault();
                    setIsDraggingThumb(true);
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDraggingThumb(false);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleFileDrop(e, setThumbnails, setIsDraggingThumb)}
                className={`w-full h-[140px] border-2 border-dashed flex items-center justify-center rounded-lg text-gray-500 cursor-pointer transition
                    ${isDraggingThumb ? 'border-[#D0AC88] bg-[#fff7eb]' : 'border-gray-300 hover:border-[#D0AC88]'}`}
            >
                <input 
                    type="file"
                    id="thumbInput"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, setThumbnails)}
                    className="hidden"
                />
                {isDraggingThumb ? '이미지를 놓으세요' : '여기를 클릭하거나 이미지를 드래그하세요'}
            </label>

            {thumbnails.length > 0 && (
                <DragDropContext 
                    onDragEnd={(result) => {
                        if (!result.destination) return;
                        const updated = Array.from(thumbnails);
                        const [moved] = updated.splice(result.source.index, 1);
                        updated.splice(result.destination.index, 0, moved);
                        setThumbnails(updated);
                    }}
                >
                    <Droppable droppableId="thumbs" direction="horizontal">
                        {(provided) => (
                            <div
                                className="grid grid-cols-4 gap-2"
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                            >
                                {thumbnails.map((file, index) => (
                                    <Draggable key={file.name + index} draggableId={file.name + index} index={index}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className="relative"
                                            >
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt={`thumb-${index}`}
                                                    className='w-24 h-24 object-cover border'
                                                 />
                                                 <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = [...thumbnails];
                                                        updated.splice(index, 1);
                                                        setThumbnails(updated);
                                                    }}
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

            <hr />

            <span>상품 상세 이미지 (드래그 또는 클릭 업로드)</span>
            <label
                htmlFor="detailInput"
                onDragEnter={(e) => {
                    e.preventDefault();
                    setIsDraggingDetail(true);
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    setIsDraggingDetail(false);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleFileDrop(e, setDetailImages, setIsDraggingDetail)}
                className={`w-full h-[140px] border-2 border-dashed flex items-center justify-center rounded-lg text-gray-500 cursor-pointer transition
                ${isDraggingDetail ? 'border-[#D0AC88] bg-[#fff7eb]' : 'border-gray-300 hover:border-[#D0AC88]'}`}
            >
                <input
                    type="file"
                    id="detailInput"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, setDetailImages)}
                    className="hidden"
                />
                {isDraggingDetail ? '이미지를 놓으세요' : '여기를 클릭하거나 이미지를 드래그하세요'}
            </label>

            {detailImages.length > 0 && (
            <DragDropContext onDragEnd={(result) => {
                if (!result.destination) return;

                const newDetails = Array.from(detailImages);
                const [moved] = newDetails.splice(result.source.index, 1);
                newDetails.splice(result.destination.index, 0, moved);
                setDetailImages(newDetails);
            }}>
                <Droppable droppableId="details" direction="horizontal">
                    {(provided) => (
                        <div
                            className="grid grid-cols-4 gap-2 mt-2"
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                        >
                            {detailImages.map((file, index) => (
                                <Draggable key={file.name + index} draggableId={file.name + index} index={index}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className="relative"
                                        >
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`detail-${index}`}
                                                className='w-24 h-24 object-cover border'
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const updated = [...detailImages];
                                                    updated.splice(index, 1);
                                                    setDetailImages(updated);
                                                }}
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


            <button type="submit" className="bg-black text-white px-4 py-2">등록하기</button>
        </form>
    )
}

export default Insert_Product;