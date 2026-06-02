import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const Admin_ProductManager = () => {
    const API = process.env.REACT_APP_API_BASE;
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [editData, setEditData] = useState({ topImages: [], detailImages: [] });
    const [editAuthorLabels, setEditAuthorLabels] = useState([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [orderKey, setOrderKey] = useState('pid');
    const [orderDir, setOrderDir] = useState('desc');

    const [selectedCategory, setSelectedCategory] = useState('all');
    const filteredProducts = products
        .filter(p => {
            const keywordMatch = 
                (p.title ?? '').toLowerCase().includes(searchKeyword.toLowerCase()) || 
                String(p.pid ?? '').includes(searchKeyword);

        const categoryMatch = selectedCategory === 'all' || p.category === selectedCategory;
        return keywordMatch && categoryMatch;
    })
    .sort((a, b) => {
        const dir = orderDir === 'asc' ? 1 : -1;

        const num = (v) => {
            const n = Number(v);
            return Number.isFinite(n) ? n : 0;
        };

        if (orderKey === 'pid') return (num(a.pid) - num(b.pid)) * dir;

        if (orderKey === 'sortOrder') {
            // sortOrder: 0(혹은 null)은 맨 뒤로 보내고, 나머지는 오름/내림 적용
            const ao = num(a.sortOrder);
            const bo = num(b.sortOrder);

            const aZero = ao === 0;
            const bZero = bo === 0;

            if (aZero && !bZero) return 1;
            if (!aZero && bZero) return -1;

            return (ao - bo) * dir;
        }

        if (orderKey === 'sales') return (num(a.sales) - num(b.sales)) * dir;

        return 0;
    });

    // 헤더 클릭으로 정렬 토글
    const toggleSort = (key) => {
        setCurrentPage(1);
        setOrderKey(prevKey => {
            if (prevKey === key) {
                setOrderDir(prevDir => (prevDir === 'asc' ? 'desc' : 'asc'));
                return prevKey;
            }
            setOrderDir('desc');
            return key;
        });
    };

    const arrow = (key) => {
        if (orderKey !== key) return '';
        return orderDir === 'asc' ? ' ▲' : ' ▼';
    };

    // 컬렉션 가져오기 (아이템)
    const [collections, setCollections] = useState([]);
    const [selectedCollection, setSelectedCollection] = useState('');
    const [collectionItems, setCollectionItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState('');

    // 첫 로드시 컬렉션 목록 불러오기
    useEffect(() => {
        axios.get(`${API}/product/collections`, { withCredentials: true})
            .then(res => setCollections(res.data))
            .catch(err => console.error("컬렉션 불러오기 실패", err));
    }, []);

    // 컬렉션 선택 시 해당 아이템 불러오기
    useEffect(() => {
        if (selectedCollection) {
            axios.get(`${API}/product/collection-items`, {
                params: { collectionId: selectedCollection },
                withCredentials: true
        })
            .then(res => setCollectionItems(res.data))
            .catch(err => console.error(err));
        } else {
            setCollectionItems([]);
        }
    }, [selectedCollection]);

    // 상품 수정 모달 열림 시 배경 스크롤 잠금
    useEffect(() => {
        if (!selectedProduct) return;

        const scrollY = window.scrollY;
        const prevOverflow = document.body.style.overflow;

        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';

        const onKey = (e) => {
            if (e.key === 'Escape') setSelectedProduct(null);
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
    }, [selectedProduct]);

    // 페이징
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const totalPages = Math.max(1, Math.ceil(filteredProducts.length / itemsPerPage));
    const currentProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // 그룹 단위 페이지 네이션
    const pageGroupSize = 10;
    const currentGroup = Math.floor((currentPage - 1) / pageGroupSize);
    const groupStart = currentGroup * pageGroupSize + 1;
    const groupEnd = Math.min(groupStart + pageGroupSize - 1, totalPages);

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (selectedCollection && selectedItem) {
            const selected = collections.find(c => c.id === parseInt(selectedCollection));
            axios.get(`${API}/product/filter`, {
                params: {
                    category: selected?.name,
                    author: selectedItem
                },
                withCredentials: true
            })
            .then(res => {
                setProducts(res.data);
                setCurrentPage(1);
            })
            .catch(err => console.error('상품 필터링 실패', err));
        }
        else if (selectedCollection && !selectedItem) {
            // 컬렉션만 선택된 경우
            const selected = collections.find(c => c.id === parseInt(selectedCollection));
            axios.get(`${API}/product/filter`, {
                params: { category: selected?.name },
                withCredentials: true
            })
            .then(res => {
                setProducts(res.data);
                setCurrentPage(1);
            })
            .catch(err => console.error('카테고리 상품 불러오기 실패', err));
        }
    }, [selectedCollection, selectedItem]);

    const fetchProducts = async () => {
        try {
            const res = await axios.get(`${API}/product/list`);
            setProducts(res.data);
        } catch (err) {
            console.error('상품 목록 불러오기 실패', err);
        }
    };

    const handleSave = async () => {
        const formData = new FormData();
        formData.append('pid', editData.pid);
        formData.append('title', editData.title);
        formData.append('price', editData.price);
        formData.append('category', editData.category);
        formData.append('author', editData.author ?? '');
        formData.append('sortOrder', editData.sortOrder || 0);
        formData.append('sales', editData.sales);

        // 기존 썸네일 이미지 목록이 없더라도 빈 배열로 처리
        const existingTopUrls = editData.topImages
            .filter(img => img.type === 'existing')
            .map(img => img.url);

        if (existingTopUrls.length > 0) {
            existingTopUrls.forEach(url => formData.append('existingTopUrls', url));
        } else {
            formData.append('existingTopUrls', "");
        }
        
        const existingDetailUrls = editData.detailImages
            .filter(img => img.type === 'existing')
            .map(img => img.url);

        if (existingDetailUrls.length > 0) {
            existingDetailUrls.forEach(url => formData.append('existingDetailUrls', url));
        } else {
            formData.append('existingDetailUrls', "");
        }

        const topImageOrderList = editData.topImages.map((img, index) => ({
            type: img.type,
            value: img.type === 'existing' ? img.url : null,
            order: index + 1,
        }));

        formData.append('topImageOrders', JSON.stringify(topImageOrderList));

        editData.topImages.forEach((img) => {
            if (img.type === 'new') {
                formData.append('newTopImages', img.file);
            }
        });

        const detailImageOrderList = editData.detailImages.map((img, index) => ({
            type: img.type,
            value: img.type === 'existing' ? img.url : null,
            order: index + 1,
        }));
        formData.append('detailImageOrders', JSON.stringify(detailImageOrderList));

        editData.detailImages.forEach((img) => {
            if (img.type === 'new') {
                formData.append('newDetailImages', img.file);
            } 
        });

        await axios.post(`${API}/product/update`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        // 현재 선택된 컬렉션 라벨에 맞게 다시 불러오기
        const selected = collections.find(c => c.id === parseInt(selectedCollection));
        if (selected) {
            const params = { category: selected?.name };
            if (selectedItem) params.author = selectedItem;

            const res = await axios.get(`${API}/product/filter`, { params, withCredentials: true });
            setProducts(res.data);
        } else {
            await fetchProducts();
        }

        toast.success('수정 완료');
        setSelectedProduct(null);
    };

    const categoryMap = {
        masterPiece: '명화',
        koreanPainting: '동양화',
        photoIllustration: '사진/일러스트',
        fengShui: '풍수',
        authorCollection: '작가',
        customFrames: '맞춤액자'
    };

    const handleProductClick = async (product) => {
        const pid = product.pid;
        const [topRes, detailRes] = await Promise.all([
            axios.get(`${API}/product/top-images?pid=${pid}`),
            axios.get(`${API}/product/images?pid=${pid}`)
        ]);

        setEditData({
            ...product,
            square: product.square,
            topImages: topRes.data.map((url, i) => ({ id: `top-${i}`, type: 'existing', url })),
            detailImages: detailRes.data.map((url, i) => ({ id: `detail-${i}`, type: 'existing', url }))
        });

        setSelectedProduct(product);
    };

    useEffect(() => {
        if (!selectedProduct || !editData.category) {
            setEditAuthorLabels([]);
            return;
        }
        const col = collections.find((c) => c.name === editData.category);
        if (!col) {
            setEditAuthorLabels([]);
            return;
        }
        axios
            .get(`${API}/product/collection-items`, {
                params: { collectionId: col.id },
                withCredentials: true,
            })
            .then((res) => setEditAuthorLabels(res.data || []))
            .catch(() => setEditAuthorLabels([]));
    }, [selectedProduct, editData.category, collections, API]);

    const authorOptions = (() => {
        const cur = editData.author;
        const list = [...(editAuthorLabels || [])];
        if (cur && !list.includes(cur)) list.unshift(cur);
        return list;
    })();

    const handleImageReorder = (type, result) => {
        if (!result.destination) return;
        const updated = Array.from(editData[type]);
        const [moved] = updated.splice(result.source.index, 1);
        updated.splice(result.destination.index, 0, moved);
        setEditData(prev => ({ ...prev, [type]: updated }));
    };

    const renderImageSection = (type, label) => {
    const isDraggingKey = type === 'topImages' ? 'isDraggingTop' : 'isDraggingDetail';
    const isDragging = editData[isDraggingKey] || false;

    const handleFileDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setEditData(prev => ({ ...prev, [isDraggingKey]: false }));
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            const mapped = files.map((f, i) => ({
                id: `${type}-new-${Date.now()}-${i}`,
                type: 'new',
                file: f
            }));
            setEditData(prev => ({ ...prev, [type]: [...prev[type], ...mapped] }));
        }
    };

    return (
        <div className="mb-4">
            <span>{label} (드래그 또는 클릭으로 추가 / 순서 변경 가능)</span>
            <label
                onDragEnter={(e) => {
                    e.preventDefault();
                    setEditData(prev => ({ ...prev, [isDraggingKey]: true }));
                }}
                onDragLeave={(e) => {
                    e.preventDefault();
                    setEditData(prev => ({ ...prev, [isDraggingKey]: false }));
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className={`relative w-full h-[140px] border-2 border-dashed flex items-center justify-center rounded-lg text-gray-500 cursor-pointer transition
                    ${isDragging ? 'border-[#D0AC88] bg-[#fff7eb]' : 'border-gray-300 hover:border-[#D0AC88]'}`}
            >
                <input
                    type="file"
                    multiple
                    onChange={(e) => {
                        const files = Array.from(e.target.files);
                        const mapped = files.map((f, i) => ({
                            id: `${type}-new-${Date.now()}-${i}`,
                            type: 'new',
                            file: f
                        }));
                        setEditData(prev => ({ ...prev, [type]: [...prev[type], ...mapped] }));
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                />
                {isDragging ? '이미지를 놓으세요' : '여기를 클릭하거나 이미지를 드래그하세요'}
            </label>

            <DragDropContext onDragEnd={(result) => handleImageReorder(type, result)}>
                <Droppable droppableId={type} direction="horizontal">
                    {(provided) => (
                        <div
                            className="grid grid-cols-4 gap-2 mt-3"
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                        >
                            {editData[type]?.map((img, index) => (
                                <Draggable key={img.id} draggableId={img.id} index={index}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className="relative flex flex-col items-center"
                                        >
                                            <div className="relative">
                                                <img
                                                    src={img.type === 'existing'
                                                        ? img.url
                                                        : URL.createObjectURL(img.file)}
                                                    alt={`${type}-${index}`}
                                                    className="w-28 h-28 object-cover border rounded"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = [...editData[type]];
                                                        updated.splice(index, 1);
                                                        setEditData(prev => ({
                                                            ...prev,
                                                            [type]: updated
                                                        }));
                                                    }}
                                                    className="absolute top-1 right-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1">
                                                #{index + 1}
                                            </div>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>
        </div>
    );
};

    return (
        <div className="w-full p-6 bg-white">
            <h2 className="text-2xl font-bold mb-6 border-b pb-2">상품 목록</h2>
            <div className="flex items-center gap-2 mb-6">
                {/* 컬렉션 선택 */}
                <select
                    value={selectedCollection}
                    onChange={(e) => {
                        setSelectedCollection(e.target.value);
                        setSelectedItem('');
                    }}
                    className="border px-3 py-2 text-sm rounded"
                >
                    <option value="" disabled>컬렉션 선택</option>
                    <option value="all">전체</option>
                    
                    {collections.map(c => (
                        <option key={c.id} value={c.id}>{c.display_name}</option>
                    ))}
                </select>

                {/* 아이템 선택 */}
                <select
                    value={selectedItem}
                    onChange={e => setSelectedItem(e.target.value)}
                    className="border px-3 py-2 text-sm rounded"
                    disabled={!collectionItems.length}
                >
                    <option value="" disabled>아이템 선택</option>
                    {collectionItems.map((item, i) => (
                        <option key={i} value={item}>{item}</option>
                    ))}
                </select>

                <input
                    type="text"
                    placeholder="상품명 또는 코드 검색"
                    className="border px-4 py-2 w-80 text-sm rounded shadow-sm focus:ring-2 focus:ring-blue-400"
                    value={searchKeyword}
                    onChange={(e) => {
                        setSearchKeyword(e.target.value);
                        setCurrentPage(1);
                    }}
                />
            </div>
            <table className="w-full text-sm border table-fixed">
                <thead className="bg-gray-100">
                    <tr>
                        <th 
                            className="border p-2 w-[10%] cursor-pointer select-none bg-[#ECD2AF]"
                            onClick={() => toggleSort('pid')}
                        >
                            상품코드{arrow('pid')}
                        </th>
                        <th 
                            className="border p-2 w-[7%] cursor-pointer select-none bg-[#ECD2AF]"
                            onClick={() => toggleSort('sortOrder')}
                        >
                            순서{arrow('sortOrder')}
                        </th>
                        <th 
                            className="border p-2 w-[10%] cursor-pointer select-none bg-[#ECD2AF]"
                            onClick={() => toggleSort('sales')}
                        >
                            판매량{arrow('sales')}
                        </th>
                        <th className="border p-2 w-[10%]">카테고리</th>
                        <th className="border p-2 w-[15%]">라벨(작가)</th>
                        <th className="border p-2 w-[15%]">썸네일</th>
                        <th className="border p-2 w-auto">상품명</th>
                    </tr>
                </thead>
                <tbody>
                    {currentProducts.map(product => (
                        <tr key={product.pid} onClick={() => handleProductClick(product)} className="cursor-pointer hover:bg-gray-50">
                            <td className="border p-2 text-center">{product.pid}</td>
                            <td className="border p-2 text-center">{product.sortOrder}</td>
                            <td className="border p-2 text-center">{product.sales}</td>

                            <td className="border p-2 text-center">
                                {categoryMap[product.category] || product.category}
                            </td>
                            <td className="border p-2 text-center">
                                {categoryMap[product.author] || product.author}
                            </td>
                            <td className="border p-2 text-center">
                                {product.imageUrl ? (
                                    <img src={product.imageUrl} alt="썸네일" className="w-20 h-20 object-cover rounded-md mx-auto border" />
                                ) : (
                                    <span className='text-gray-400 text-xs'>없음</span>
                                )}
                            </td>
                            <td className="border p-2 text-center">{product.title}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {/* 페이징 */}
            <div className="flex justify-center gap-2 mt-4 md:mt-8 text-sm">
                {(() => {
                    const maxVisible = 5;
                    let startPage = Math.max(currentPage - 2, 1);
                    let endPage = Math.min(startPage + maxVisible - 1, totalPages);

                    if (endPage - startPage < maxVisible - 1) {
                        startPage = Math.max(endPage - maxVisible + 1, 1);
                    }

                    const pageNumbers = Array.from(
                        { length: endPage - startPage + 1 },
                        (_, i) => startPage + i
                    );

                    return (
                        <div className="flex justify-center gap-1 text-sm font-medium">  
                            {/* 맨 처음 */}
                            <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                                className={`w-8 h-8 border rounded-full flex items-center justify-center 
                                    ${currentPage === 1 
                                        ? 'text-gray-300 border-gray-200' 
                                        : 'text-gray-700 hover:bg-gray-100 border-gray-300'}`}>
                                {'<<'}
                            </button>
                            {/* 이전 */}
                            <button
                                onClick={() => setCurrentPage(prev => prev -1)}
                                disabled={currentPage === 1}
                                className={`w-8 h-8 border rounded-full flex items-center justify-center 
                                    ${currentPage === 1 
                                        ? 'text-gray-300 border-gray-200' 
                                        : 'text-gray-700 hover:bg-gray-100 border-gray-300'}`}>
                                {'<'}
                            </button>

                            {/* 숫자 */}
                            {pageNumbers.map((pageNum) => (
                                <button
                                    key={pageNum}
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`w-8 h-8 rounded-full border flex items-center justify-center
                                        ${currentPage === pageNum 
                                            ? 'bg-black text-white border-black' 
                                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}`}>
                                    <span>{pageNum}</span>
                                </button>
                            ))}

                            {/* 다음 */}
                            <button
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                disabled={currentPage >= totalPages}
                                className={`w-8 h-8 border rounded-full flex items-center justify-center 
                                    ${currentPage === totalPages 
                                        ? 'text-gray-300 border-gray-200' 
                                        : 'text-gray-700 hover:bg-gray-100 border-gray-300'}`}>
                                {'>'}
                            </button>
                            {/* 마지막 */}
                            <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage === totalPages}
                                className={`w-8 h-8 border rounded-full flex items-center justify-center 
                                    ${currentPage === totalPages 
                                        ? 'text-gray-300 border-gray-200' 
                                        : 'text-gray-700 hover:bg-gray-100 border-gray-300'}`}>
                                {'>>'}
                            </button>
                        </div>
                    )
                })()}
            </div>

            {selectedProduct && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[10000] overscroll-none"
                    onTouchMove={(e) => {
                        if (e.target === e.currentTarget) e.preventDefault();
                    }}
                >
                    <div className="bg-white p-6 rounded w-full max-w-2xl max-h-[95vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold mb-4">상품 정보 수정</h3>
                        <div className="flex flex-col gap-2 text-sm">
                            <label>
                                상품명
                                <input value={editData.title || ''} onChange={e => setEditData(prev => ({ ...prev, title: e.target.value }))} className="border p-2 w-full mt-1 mb-2" />
                            </label>
                            <label>
                                카테고리
                                <select value={editData.category || ''} onChange={e => setEditData(prev => ({ ...prev, category: e.target.value }))} className="border p-2 w-full mt-1 mb-1">
                                    <option value="전체">전체</option>
                                    <option value="masterPiece">명화</option>
                                    <option value="koreanPainting">동양화</option>
                                    <option value="photoIllustration">사진/일러스트</option>
                                    <option value="fengShui">풍수</option>
                                    <option value="authorCollection">작가별</option>
                                    <option value="customFrames">맞춤액자</option>
                                </select>
                            </label>
                            <label>
                                작가(라벨)
                                <select 
                                    className="border p-2 w-full mt-1 mb-1"
                                    value={editData.author ?? ''}
                                    onChange={(e) =>
                                        setEditData((prev) => ({ ...prev, author: e.target.value }))
                                    }
                                >
                                    <option value="">선택 안 함</option>
                                    {authorOptions.map((name) => (
                                        <option key={name} value={name}>
                                            {name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label>
                                노출 순서 (숫자 작을수록 상단 / 0은 등록 순서대로 정렬)
                                <input
                                    type="text"
                                    value={editData.sortOrder || 0}
                                    onChange={e => {
                                        const value = e.target.value;
                                        // 숫자만 허용
                                        if (/^\d*$/.test(value)) {
                                            setEditData((prev) => ({ ...prev, sortOrder: value }));
                                        }
                                        setEditData(prev => ({ ...prev, sortOrder: e.target.value }))}}
                                    className="border p-2 w-full mt-1 mb-2"
                                    placeholder="순서 (숫자만)"
                                />
                            </label>
                            <label>
                                판매량 (실제 판매량 임의 조정X)
                                <input
                                    type="text"
                                    value={editData.sales || 0}
                                    onChange={e => {
                                        const value = e.target.value;
                                        // 숫자만 허용
                                        if (/^\d*$/.test(value)) {
                                            setEditData((prev) => ({ ...prev, sales: value }));
                                        }
                                        setEditData(prev => ({ ...prev, sales: e.target.value }))}}
                                    className="border p-2 w-full mt-1 mb-2"
                                    placeholder="순서 (숫자만)"
                                />
                            </label>
                        </div>
                        {renderImageSection('topImages', '썸네일 이미지')}
                        {renderImageSection('detailImages', '상세 이미지')}
                        <div className="flex justify-between gap-2 mt-4">
                            <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={async () => {
                                if (!window.confirm('정말 삭제하시겠습니까?')) return;
                                try {
                                    await axios.post(`${API}/product/delete`, null, { params: { pid: selectedProduct.pid } });
                                    toast.success('삭제 완료');
                                    setSelectedProduct(null);

                                    // 현재 필터 조건에 따라 다시 불러오기
                                    const selected = collections.find(c => c.id == parseInt(selectedCollection));
                                    if (selected) {
                                        const params = { category: selected.name };
                                        if (selectedItem) params.author = selectedItem;

                                        const res = await axios.get(`${API}/product/filter`, { params, withCredentials: true });
                                        setProducts(res.data);
                                    } else {
                                        await fetchProducts();
                                    }
                                } catch (err) {
                                    console.error('삭제 실패', err);
                                    toast.error('삭제 실패');
                                }
                            }}>삭제</button>
                            <div className="flex gap-2">
                                <button className="flex bg-gray-300 text-gray-700 px-4 py-2 rounded" onClick={() => setSelectedProduct(null)}>닫기</button>
                                <button className="flex bg-blue-600 text-white px-4 py-2 rounded" onClick={handleSave}>저장</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin_ProductManager;
