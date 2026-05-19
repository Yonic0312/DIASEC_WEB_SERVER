import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable} from '@hello-pangea/dnd';

const Admin_NoticeEditor = ({ existingImages = [], onImagesChange }) => {
    const [newImages, setNewImages] = useState([]);
    const [currentImages, setCurrentImages] = useState([]);

    useState(() => {
        const formatted = existingImages.map((img, idx) => 
        typeof img === 'string'
            ? { id: `existing-${idx}`, type: 'existing', url: img }
            : img
        );
        setCurrentImages(formatted);
    }, [existingImages]);

    const handleImageAdd = (e) => {
        const files = Array.from(e.target.files);
        const newFileObjs = files.map((file, idx) => ({
            id: `new-${Date.now()}-${idx}`,
            type: 'new',
            file,
        }));
        setCurrentImages(prev => [...prev, ...newFileObjs]);
    };

    const handleDelete = (id) => {
        setCurrentImages(prev => prev.filter(img => img.id !== id));
    };

    const onDragEnd = (result) => {
        if (!result.destination) return;
        const items = Array.from(currentImages);
        const [moved] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, moved);
        setCurrentImages(items);
    };

    useEffect(() => {
        if (onImagesChange) {
            onImagesChange(currentImages);
        }
    }, [currentImages]);

    return (
        <div className="space-y-4">
            <div>
                <input type="file" multiple onChange={handleImageAdd} className="hidden" id="img-upload" />
                <label htmlFor="img-upload" className="border px-4 py-2 cursor-pointer bg-gray-100 hover:bg-gray-200 inline-block">
                    이미지 추가
                </label>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="image-list" direction="horizontal">
                    {(provided) => (
                        <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-wrap gap-2">
                            {currentImages.map((img, index) => (
                                <Draggable key={img.id} draggableId={img.id} index={index}>
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="relative">
                                            <img
                                                src={img.type === 'existing' ? img.url : URL.createObjectURL(img.file)}    
                                                alt={img.type}
                                                className="w-24 h-24 object-cover border rounded"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(img.id)}
                                                className="absolute top-0 right-0 bg-black text-white text-xs px-1 rounded"
                                            >
                                                ✕
                                            </button>
                                            <div className='text-xs text-center mt-1 '>#{index + 1}</div>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    )

}

export default Admin_NoticeEditor;