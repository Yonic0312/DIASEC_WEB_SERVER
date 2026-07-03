import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const Admin_CollectionManager = () => {
    const API = process.env.REACT_APP_API_BASE;
    const [collections, setCollections] = useState([]);
    const [selectedCollectionId, setSelectedCollectionId] = useState('');
    const [items, setItems] = useState([]);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [newLabel, setNewLabel] = useState('');
    const [newCollectionName, setNewCollectionName] = useState('');
    const [newCollectionDisplayName, setNewCollectionDisplayName] = useState('');

    const [editingCollection, setEditingCollection] = useState(null); // 사진
    const [newPeriod, setNewPeriod] = useState(''); // 시대
    const [editingLabel, setEditingLabel] = useState(null); // 작가

    // 명화 시대 추가
    const MASTERPIECE_PERIODS = [ "르네상스", "바로크", "로코코", "신고전주의", "낭만주의", "사실주의", "인상주의", "신인상주의", "후기인상주의", "근대미술" ];
    const KOREANPAINTING = [ "조선 전기", "조선 후기", "기타작가", "민화", "불교" ];
    

    useEffect(() => {
        fetchCollections();
    }, []);

    const fetchCollections = () => {
        axios.get(`${API}/collections`)
        .then(res => {
            setCollections(res.data);

            // 명화 기본 선택
            const masterpiece = res.data.find(col => col.displayName === '명화');
            if (masterpiece) {
                setSelectedCollectionId(masterpiece.id);
            }
        })
        .catch(err => console.error("컬렉션 목록 불러오기 실패", err));
    };

    useEffect(() => {
        if (selectedCollectionId) {
        axios.get(`${API}/collections/items?collectionId=${selectedCollectionId}`)
            .then(res => setItems(res.data))
            .catch(err => console.error("아이템 목록 불러오기 실패", err));
        }
    }, [selectedCollectionId]);

    const handleAddItem = () => {
        if (!selectedCollectionId || !newLabel.trim()) return toast.error("컬렉션과 라벨을 입력해주세요");
        axios.post(`${API}/collections/items/add`, {
        collectionId: selectedCollectionId,
        label: newLabel.trimEnd(),
        times: newPeriod
        }).then(() => {
        setNewLabel('');
        toast.success('라벨 등록을 성공했습니다.');
        return axios.get(`${API}/collections/items?collectionId=${selectedCollectionId}`);
        }).then(res => setItems(res.data))
        .catch(err => console.error("추가 실패", err));
    };

    const handleDeleteItem = (id) => {
        if (!window.confirm('정말 라벨을 삭제하시겠습니까?')) {
            return;
        }
        axios.delete(`${API}/collections/items/delete?id=${id}`)
        .then(() => setItems(prev => prev.filter(item => item.id !== id)))
        .then(() => toast.success('라벨 삭제를 성공했습니다.'))
        .catch(err => console.error("삭제 실패", err));
    };

    const handleCreateCollection = () => {
        if (!newCollectionName.trim() || !newCollectionDisplayName.trim()) {
        toast.error("컬렉션 name, displayName을 모두 입력하세요.");
        return;
        }
        axios.post(`${API}/collections/add`, {
        name: newCollectionName.trim(),
        displayName: newCollectionDisplayName.trim()
        }).then(() => {
        setNewCollectionName('');
        setNewCollectionDisplayName('');
        fetchCollections();
        toast.success('컬렉션 등록을 성공했습니다.');
        }).catch(err => console.error("컬렉션 추가 실패", err));
    };

    const filteredItems = items.filter(item => item.label.includes(searchKeyword));

    const handleDeleteCollection = (id) => {
        if (!window.confirm("정말 컬렉션을 삭제하시겠습니까?")) return;
        axios.delete(`${API}/collections/delete?id=${id}`)
        .then(() => {
            fetchCollections();
            setSelectedCollectionId(null);
            setItems([]);
            toast.success('컬렉션 삭제를 성공했습니다.');
        })
        .catch(err => console.error("컬렉션 삭제 실패", err));
    };

    const handleEditCollection = (col) => {
        setEditingCollection({ ...col });
    };

    const handleEditLabel = (item) => {
        setEditingLabel({ 
            ...item, 
            oldLabel: item.label,
            targetCollectionId: Number(item.collectionId ?? selectedCollectionId),
        });
    };

    const handleSaveCollection = () => {
        if (!editingCollection.name.trim() || !editingCollection.displayName.trim()) {
            toast.error("컬렉션 이름과 표시명을 모두 입력해주세요.");
            return;
        }

        if (!editingCollection.displayName.trim()) return;
        axios.post(`${API}/collections/update`, editingCollection)
        .then(() => {
            setEditingCollection(null);
            fetchCollections();
            toast.success('컬렉션 수정을 성공했습니다.')
        })
        .catch(err => console.error("컬렉션 수정 실패", err));
    };

    const handleSaveLabel = () => {
        const payload = {
            ...editingLabel,
            collectionId: editingLabel.targetCollectionId,
        };

        axios.post(`${API}/collections/update/items`, payload)
        .then(() => {
            setEditingLabel(null);
            toast.success('라벨 수정을 성공했습니다.');
            return axios.get(`${API}/collections/items?collectionId=${selectedCollectionId}`);
        }).then(res => setItems(res.data));
    };
    
    // 컬렉션 등록 모달창
    const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false);

    const isAnyModalOpen = Boolean(editingCollection || editingLabel || isCreatePopupOpen);

    // 모달 열림 시 배경 스크롤 잠금
    useEffect(() => {
        if (!isAnyModalOpen) return;

        const scrollY = window.scrollY;
        const prevOverflow = document.body.style.overflow;

        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';

        const onKey = (e) => {
            if (e.key !== 'Escape') return;
            if (editingLabel) setEditingLabel(null);
            else if (editingCollection) setEditingCollection(null);
            else if (isCreatePopupOpen) setIsCreatePopupOpen(false);
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
    }, [isAnyModalOpen, editingCollection, editingLabel, isCreatePopupOpen]);

    // 라벨 목록 페이징
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const totalPages = Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
    const currentItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // 그룹 단위 페이지 네이션 추가
    const pageGroupSize = 10;
    const currentGroup = Math.floor((currentPage - 1) / pageGroupSize);
    const groupStart = currentGroup * pageGroupSize + 1;
    const groupEnd = Math.min(groupStart + pageGroupSize - 1, totalPages);


    

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">컬렉션 항목 관리</h1>

            <div className="flex justify-between mt-6">
                <h2 className="text-lg font-bold mb-2 border-b pb-1">컬렉션 목록</h2>
                <button
                        onClick={() => setIsCreatePopupOpen(true)}    
                        className="h-fit bg-green-600 text-white px-2 py-1 hover:bg-green-700"
                >
                    컬렉션 생성
                </button>
            </div>
            <div className="mb-5">
                {collections.length === 0 ? (
                    <div className="text-sm text-gray-500 py-2">컬렉션이 없습니다.</div>
                ) : (
                    collections.map(col => (
                    <div key={col.id} className="flex justify-between items-center border p-2 mb-1">
                        <div>
                            <div>{col.displayName}</div>
                            <div className="text-xs text-gray-500">({col.name})</div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => handleEditCollection(col)} className="text-blue-500 text-sm">수정</button>
                            <button onClick={() => handleDeleteCollection(col.id)} className="text-red-500 text-sm">삭제</button>
                        </div>
                    </div>
                    ))
                )}
            </div>

            <hr />

            <div className="flex gap-4 mt-5 mb-2">
                <select
                    value={selectedCollectionId || ''}
                    onChange={e => {
                        const val = e.target.value;
                        setSelectedCollectionId(val === '' ? null : Number(val));
                    }}
                    className="border px-3 py-2"
                    >
                    <option value="" disabled>컬렉션 선택</option>
                    {collections.map(col => (
                        <option key={col.id} value={col.id}>{col.displayName}</option>
                    ))}
                </select>
                <input
                    type="text"
                    placeholder="라벨 검색"
                    value={searchKeyword}
                    onChange={e => setSearchKeyword(e.target.value)}
                    className="border px-3 py-2 w-60"
                />
            </div>
        
            <h2 className="text-lg font-bold mb-2 border-b pb-1">라벨 목록</h2>
            <ul className="border rounded divide-y">
                {currentItems.length === 0 ? (
                    <li className="p-4 text-gray-500 text-sm">항목이 없습니다.</li>
                ) : (
                    currentItems.map(item => (
                    <li key={item.id} className="flex justify-between items-center p-2">
                        <div className="flex items-center gap-3">
                            {item.sortOrder}순위 &nbsp;
                            {item.imageUrl ? (
                                <img src={item.imageUrl} alt="썸네일" className="w-10 h-10 object-cover rounded border" />
                            ) : (
                                <div className="w-10 h-10 bg-gray-200 text-xs flex items-center justify-center rounded border">
                                    없음
                                </div>
                            )}
                            <span>{item.label}</span>
                        </div>
                        <div className="flex gap-2">
                        <button
                            onClick={() => handleEditLabel(item)}
                            className="text-blue-500 hover:underline text-sm"
                        >수정</button>
                        <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-red-500 hover:underline text-sm"
                        >삭제</button>
                        </div>
                    </li>
                    ))
                )}
            </ul>

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
            
            {/* input */}
            <div className='flex mt-6'>
                {collections.find(c => c.id === selectedCollectionId)?.displayName === '명화' && (
                    <select
                        value={newPeriod}
                        onChange={e => setNewPeriod(e.target.value)}
                        className="border px-3 py-2 w-56"
                    >
                        <option value="">시대 선택</option>
                        {MASTERPIECE_PERIODS.map(period => (
                            <option key={period} value={period}>{period}</option>
                        ))}
                    </select>
                )}

                {collections.find(c => c.id === selectedCollectionId)?.displayName === '동양화' && (
                    <select
                        value={newPeriod}
                        onChange={e => setNewPeriod(e.target.value)}
                        className="border px-3 py-2 w-56"
                    >
                        <option value="">시대 선택</option>
                        {KOREANPAINTING.map(period => (
                            <option key={period} value={period}>{period}</option>
                        ))}
                    </select>
                )}

                {selectedCollectionId && (
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="새 라벨 입력"
                            value={newLabel}
                            onChange={e => setNewLabel(e.target.value)}
                            className="border px-3 py-2 w-50"
                        />
                        <button
                            onClick={handleAddItem}
                            className="bg-black text-white px-2 py-1 hover:bg-gray-800"
                        >
                            라벨 등록
                        </button>
                    </div>
                )}
            </div>

            {/* 팝업 - 컬렉션 수정 */}
            {editingCollection && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50 overscroll-none"
                    onTouchMove={(e) => {
                        if (e.target === e.currentTarget) e.preventDefault();
                    }}
                >
                <div className="bg-white p-6 rounded shadow-xl">
                    <h2 className="text-lg font-bold mb-4">컬렉션 수정</h2>

                    <span>컬렉션 표시명</span>
                    <input
                        value={editingCollection.displayName}
                        onChange={e => setEditingCollection({ ...editingCollection, displayName: e.target.value })}
                        className="border px-3 py-2 w-full mb-4"
                        placeholder='컬렉션 표시명 (예: 명화)'
                    />
                    <span>컬렉션 이름</span>
                    <input
                        value={editingCollection.name}
                        onChange={e => setEditingCollection({ ...editingCollection, name: e.target.value })}
                        className="border px-3 py-2 w-full mb-4"
                        placeholder="컬렉션 이름 (예: masterPiece)"
                    />

                    <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingCollection(null)} className="text-sm">취소</button>
                        <button onClick={handleSaveCollection} className="bg-black text-white px-3 py-2 text-sm">저장</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 팝업 - 라벨 수정 */}
            {editingLabel && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-[10000] overscroll-none"
                    onTouchMove={(e) => {
                        if (e.target === e.currentTarget) e.preventDefault();
                    }}
                >
                    <div className="flex-col w-1/2 justify-center bg-white p-6 rounded shadow-xl">
                        <h2 className="text-lg font-bold mb-4">라벨 수정</h2>
                        <div className="flex justify-center mb-4">
                            <img
                                src={editingLabel.imageUrl}
                                alt="이미지를 등록해주세요."
                                className="w-[380px] h-[380px] object-contain border rounded"
                            />
                        </div>

                        <div className="flex gap-2 mb-4">
                            <select
                                value={editingLabel.targetCollectionId ?? ''}
                                onChange={(e) => {
                                    const nextId = Number(e.target.value);
                                    setEditingLabel((prev) => ({
                                        ...prev,
                                        targetCollectionId: nextId,
                                        times: '',
                                    }));
                                }}
                                className="border px-3 py-2 flex-1"
                            >
                                <option value="" disabled>컬렉션 변경</option>
                                {collections.map(col => (
                                    <option key={col.id} value={col.id}>{col.displayName}</option>
                                ))}
                            </select>

                            {/* 시대선택 */}
                            {collections.find(c => c.id === editingLabel.targetCollectionId)?.displayName === '명화' && (
                                <select
                                    value={editingLabel.times || ''}
                                    onChange={e => setEditingLabel({ ...editingLabel, times: e.target.value })}
                                    className="border px-3 py-2 flex-1"
                                >
                                    <option value="">시대 선택</option>
                                    {MASTERPIECE_PERIODS.map(period => (
                                        <option key={period} value={period}>{period}</option>
                                    ))}
                                </select>
                            )}

                            {/* 시대선택 */}
                            {collections.find(c => c.id === editingLabel.targetCollectionId)?.displayName === '동양화' && (
                                <select
                                    value={editingLabel.times || ''}
                                    onChange={e => setEditingLabel({ ...editingLabel, times: e.target.value })}
                                    className="border px-3 py-2 flex-1"
                                >
                                    <option value="">시대 선택</option>
                                    {KOREANPAINTING.map(period => (
                                        <option key={period} value={period}>{period}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* 순서 선택 */}
                        <input
                            type="text"
                            placeholder="노출순서(숫자)"
                            value={editingLabel?.sortOrder ?? ''}
                            onChange={(e) => {
                                const v = e.target.value;
                                if (/^\d*$/.test(v)) {
                                    setEditingLabel({ ...editingLabel, sortOrder: v === '' ? null : Number(v) });
                                }
                            }}
                            className="border px-3 py-2 w-full mb-4"
                        />


                        {/* 라벨명 */}
                        <input
                            value={editingLabel.label}
                            onChange={e => setEditingLabel({ ...editingLabel, label: e.target.value })}
                            className="border px-3 py-2 w-full mb-4"
                        />
                        <input 
                            value={editingLabel.imageUrl || ''}
                            onChange={e => setEditingLabel({ ...editingLabel, imageUrl: e.target.value })}
                            className="border px-3 py-2 w-full mb-4"
                            placeholder="이미지 URL 입력"
                        />
                        {/* 이미지 올리기 */}
                        <input 
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (!file) return;

                                const formData = new FormData();
                                formData.append("file", file);
                                if (editingLabel.imageUrl) {
                                    formData.append("existingUrl", editingLabel.imageUrl); // 기존 이미지 전송
                                }

                                axios.post(`${API}/collections/uploadImage`, formData, {
                                    headers: { 'Content-Type' : 'multipart/form-data'},
                                })
                                .then((res) => {
                                    setEditingLabel({ ...editingLabel, imageUrl: res.data });
                                    toast.success("이미지 업로드 성공");
                                })
                                .catch(() => toast.error("이미지 업로드 실패"));
                            }}
                            clasName="border px-3 py-2 w-full mb-4"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingLabel(null)} className="text-sm">취소</button>
                            <button onClick={handleSaveLabel} className="bg-black text-white px-3 py-2 text-sm">저장</button>
                        </div>
                    </div>
                </div>
            )}

            {isCreatePopupOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-[10000] overscroll-none"
                    onTouchMove={(e) => {
                        if (e.target === e.currentTarget) e.preventDefault();
                    }}
                >
                    <div className="bg-white p-6 rounded shadow-xl">
                        <h2 className="text-lg font-bold mb-4">
                            컬렉션 등록
                        </h2>
                        <input
                            type="text"
                            placeholder="컬렉션 이름 (예: masterPiece)"
                            value={newCollectionName}
                            onChange={e => setNewCollectionName(e.target.value)}
                            className="border px-3 py-2 w-60"
                        />
                        <input
                            type="text"
                            placeholder="컬렉션 표시명 (예: 명화)"
                            value={newCollectionDisplayName}
                            onChange={e => setNewCollectionDisplayName(e.target.value)}
                            className="border px-3 py-2 w-60"
                        />
                        <div className="flex justify-end gap-4 mt-2">
                            <button
                                onClick={() => setIsCreatePopupOpen(false)}
                                className="text-sm"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleCreateCollection}
                                className="bg-black text-white px-4 py-2 text-sm"
                            >
                                컬렉션 등록
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin_CollectionManager;
