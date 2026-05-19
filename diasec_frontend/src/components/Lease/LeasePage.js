import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from "react-router-dom";
import icon_kakao from '../../assets/button/icon_kakao.png'
import icon_naver from '../../assets/button/icon_naver.png'
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'react-toastify';
import axios from 'axios';

const LeasePage = () => {
    const API = process.env.REACT_APP_API_BASE;
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);

    const [labels, setLabels] = useState([]);
    const [products, setProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [category, setCategory] = useState('명화');
    const [selectedProductId, setSelectedProductId] = useState(null);


    // 초기 로딩 + 카테고리 변경 시 데이터 불러오기
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await axios.get(`${API}/product/list?category=${categoryMap[category]}`);
                setProducts(res.data);
                setCurrentPage(1);
            } catch (err) {
                console.error("상품 목록 불러오기 실패:", err);
            }
        };
        fetchProducts();
    }, [category]);

    // 페이징
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const totalPages = Math.max(1, Math.ceil(products.length / itemsPerPage));
    const currentItems = products.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const pageGroupSize = 10;
    const currentGroup = Math.floor((currentPage - 1) / pageGroupSize);
    const groupStart = currentGroup * pageGroupSize + 1;
    const groupEnd = Math.min(groupStart + pageGroupSize - 1, totalPages);

    // 마우스 호버 상태 저장(img)
    const [hoveredPid, setHoveredPid] = useState(null);

    const categoryList = ['명화', '사진/일러스트', '풍수그림', '작가갤러리']

    const categoryMap = {
        '명화' : 'masterPiece',
        '사진/일러스트' : 'photoIllustration',
        '풍수그림' : 'fengShui',
        '작가갤러리' : 'authorCollection'
    }

    // 작가 검색창
    const [authorSearch, setAuthorSearch] = useState(''); // 작가 검색창
    const author = queryParams.get("author");
    const [selectedLabel, setSelectedLabel] = useState(author || '');
    const [selectedPeriod, setSelectedPeriod] = useState(''); // 시대

    // 라벨 목록 가져오기
    useEffect(() => {
        if (categoryMap[category]) {
            axios.get(`${API}/collections`)
                .then(res => {
                    const col = res.data.find(c => c.name === categoryMap[category]);
                    if (col) {
                        return Promise.all([
                            axios.get(`${API}/collections/items?collectionId=${col.id}`),
                            axios.get(`${API}/product/list?category=${categoryMap[category]}`)
                        ]) 
                    } else {
                        return [], [];
                    }
                })
                .then(([labelRes, productRes]) => {
                    const labelItems = labelRes.data || [];
                    const productList = productRes.data || [];

                    // label별 상품 수 세기
                    const countMap = {};
                    productList.forEach(p => {
                        countMap[p.author] = (countMap[p.author] || 0 ) + 1;
                    });

                    // 라벨 목록에 count 추가
                    const enrichedLabels = labelItems.map(item => ({
                        ...item,
                        count: countMap[item.label] || 0
                    }));
                    
                    setLabels(enrichedLabels);
                    setAllProducts(productList);
                    setProducts(productList);
                })
                .catch(err => {
                    console.error("라벨 불러오기 실패", err);
                    setLabels([]);
                });
        }
    }, [categoryMap[category]]);

    useEffect(() => {
        if (author && allProducts.length > 0) {
            const filtered = allProducts.filter(p => p.author === author);
            setProducts(filtered);
            setSelectedLabel(author);
        } else if (!author && allProducts.length > 0) {
            setProducts(allProducts);
            setSelectedLabel('');
        }
    }, [author, allProducts]);

    // 라벨 클릭 시 필터된 상품 목록 가져오기
    const handleLabelClick = (label) => {
        setSelectedLabel(label);
        setCurrentPage(1);
        axios.get(`${API}/product/filter`, {
            params: {
                category: categoryMap[category],
                author: label
            }
        }).then(res => {
            setProducts(res.data);
        }).catch(err => {
            console.error("필터 상품 불러오기 실패", err);
        });
    };

    // 리스 옵션 담긴 상품 배열 추가
    const [selectedItems, setSelectedItems] = useState([]);
    
    // 상품 클릭 시 추가하는 함수
    const handleAddLeaseItem = (product) => {
        const newId = uuidv4();
        const newItem = {
            id: newId,
            pid: product.pid,
            title: product.title,
            author: product.author,
            imageUrl: product.imageUrl,
            quantity: 1,
            size: '소',
            period: '3개월',
            returnMethod: '택배'
        };

        // 기존 선택 배열에 newItem을 추가하여 갱신합니다
        setSelectedItems(prev => [...prev, newItem]);

        // 첫 아이템이거나 현재 선택된 아이템이 없는 경우 자동 선택
        if (!selectedProductId) {
            setSelectedProductId(newId);
        }
    }

    // 상품 개수 계산
    const adjustQuantity = (id, delta) => {
        setSelectedItems(prev => {
            const updated = prev
                .map(item => {
                    if (item.id === id) {
                        const newQuantity = item.quantity + delta;
                        if (newQuantity <= 0) return null; // 제거할 항목은 null로 반환
                        return { ...item, quantity: newQuantity };
                    }
                    return item;
            })
            .filter(Boolean) // null 제거

            // 선택한 항목이 사라졌다면 자동으로 다른 항목 선택 or 초기화
            if (!updated.find(item => item.id === selectedProductId)) {
                const nextId = updated.length > 0 ? updated[0].id : null;
                setSelectedProductId(nextId);
            }

            return updated;
        });
    }

    // 선택 항목 업데이트 함수
    const updateSelectedItem = (field, value) => {
        if (selectedItems === null) return;
        setSelectedItems(prev => 
            prev.map(item => 
                item.id === selectedProductId ? { ...item, [field]: value } : item
            )
        );
    };

    const priceTable = {
        size: {
            '소': 10000,
            '중': 20000,
            '대': 30000
        },
        period: {
            '3개월': 1,
            '6개월': 1.8,
            '12개월': 3.2,
            '24개월' : 6
        },
        depositPerItem: 5000
    }

    // 리스 비용 및 총 결제금액 계산 함수 추가
    const calculateLeaseCost = () => {
        if (selectedItems.length === 0) {
            return {
                lease: 0,
                deposit: 0,
                shippingFee: 0,
                isFreeShipping: true,
                total: 0
            }
        }

        let totalLease = 0; // 리스 비용 초기화
        let totalDeposit = 0; // 보증금 비용 초기화

        selectedItems.forEach(item => {
            const sizePrice = priceTable.size[item.size] || 0; // 선택한 사이즈에 따라 가격 책정
            const periodMultiplier = priceTable.period[item.period] || 1; // 선택한 리스 기간에 따라 가격 책정
            const itemLease = sizePrice * periodMultiplier * item.quantity; // 사이즈가격 * 기간 배수 * 수량
            const itemDeposit = priceTable.depositPerItem * item.quantity; // 보증금 1개당 5,000원

            totalLease += itemLease;
            totalDeposit += itemDeposit;
        });

        const isFreeShipping = totalLease >= 50000;
        const shippingFee = isFreeShipping ? 0 : 3000;

        return {
            lease: totalLease,
            deposit: totalDeposit,
            shippingFee,
            isFreeShipping,
            total: totalLease + totalDeposit + shippingFee
        };
    };

    // 결제
    const handleGoToOrder = () => {
        if (selectedItems.length === 0) {
            toast.error("선택된 상품이 없습니다.");
            return;
        }

         const leaseCosts = calculateLeaseCost();
         const isFreeShipping = leaseCosts.lease >= 50000;
         const shippingFee = isFreeShipping ? 0 : 5000;

         const leaseOrderItems = selectedItems.map(item => ({
            pid: item.pid,
            title: item.title,
            quantity: item.quantity,
            size: item.size,
            price: Math.round(priceTable.size[item.size] * priceTable.period[item.period]),
            period: item.period,
            category: "lease",
            thumbnail: item.imageUrl,
            deposit: priceTable.depositPerItem * item.quantity
         }));

         navigate("/orderForm", {
            state: {
                orderItems: leaseOrderItems,
                totalDeposit: leaseCosts.deposit,
                shippingFee: shippingFee
            }
        });
    };

    // 삭제 함수
    const handleDeleteItem = (id) => {
        setSelectedItems(prev => {
            const updated = prev.filter (item => item.id !== id);
            // 현재 선택된 항목이 삭제된 경우, 첫 번째 항목을 자동 선택
            if (!updated.find(item => item.id === selectedProductId)) {
                setSelectedProductId(updated[0]?.id || null);
            }
            return updated;
        });
    };

    return (
        <div className="w-full mt-20">
            <h2 className="text-center text-3xl font-bold mb-10">리스</h2>
            
            <div className="flex justify-between gap-10">
                {/* 상품 리스트 */}
                <div className="w-full">
                    {/* 카테고리 선택 */}
                    <div className="flex justify-center gap-4">
                        {categoryList.map(cat => (
                            <span
                                key={cat}
                                onClick={() => setCategory(cat)}
                                className={`cursor-pointer px-4 py-1 border-b-2 ${
                                    category === cat ? 'border-black font-bold' : 'border-transparent text-gray-500'
                                }`}
                            >
                                {cat}
                            </span>
                        ))}
                    </div>

                    {/* 명화 시대별 라벨 필터 */}
                    {categoryMap[category] === "masterPiece" && (
                        <div>
                            <div className='flex flex-wrap gap-3 text-gray-600 mt-4'>
                                {[
                                    "전체",
                                    "르네상스 (~1600)",
                                    "바로크·로코코 (1600~1750)",
                                    "근대 초기 (~19세기 전반)",
                                    "인상주의 (~19세기 후반)",
                                    "근대 미술 (~20세기 초)",
                                    "현대 미술 (~1945 이후)",
                                    "동시대 미술 (~1980년대 이후)"
                                ].map((period, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setSelectedPeriod(period === "전체" ? "" : period);
                                            setSelectedLabel('');
                                        }}
                                        className={`text-[11.4px] font-medium ${
                                            (selectedPeriod === "" && period === "전체") || selectedPeriod === period 
                                            ? 'text-black border-black border-b-2' 
                                            : 'border-transparent' }
                                            border-b-2 hover:border-black hover:text-black transition`}
                                    >
                                        {period}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 검색창 */}
                    <div className='flex justify-end mt-2'>
                        <div className='relative w-[240px]'>
                            <input 
                                type="text"
                                placeholder="작가·주제를 검색하세요"
                                value={authorSearch}
                                onChange={(e) => setAuthorSearch(e.target.value)}
                                className='w-full pl-10 pr-4 py-[6px] rounded-full border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#D0AC88]'
                            />
                            <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinjoin="round" d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 103.75 3.75a7.5 7.5 0 0012.9 12.9z"></path>
                            </svg>
                        </div>
                    </div>

                    {/* 작가 라벨 목록 */}
                    {['masterPiece', 'fengShui', 'authorCollection', 'photoIllustration'].includes(categoryMap[category]) && (
                        <div className='w-full grid grid-cols-4 text-[13.5px] border-t border-l border-black border-opacity-5
                                        max-h-[115px] mt-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300'
                        >
                            {labels.length === 0 ? (
                                <div>라벨이 없습니다.</div>
                            ) : (
                                labels
                                    .filter(item => {
                                        const matchesPeriod = !selectedPeriod || item.times === selectedPeriod;
                                        const matchesSearch = item.label.toLowerCase().includes(authorSearch.toLowerCase());
                                        return matchesPeriod && matchesSearch;
                                    })
                                    .map((item, index) => (
                                    <div
                                        key={index}
                                        className='flex items-center px-2 justify-start h-11 border-r border-b border-black border-opacity-5 hover:bg-[#555555] hover:text-white'
                                        onClick={() => handleLabelClick(item.label)}
                                    >
                                        {item.label}
                                        <span className='text-gray-400'>({item.count})</span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                    
                    <div className="mt-6 text-sm text-[#CDC9C3]"> 상품 <span className="text-[#555555]">{products.length}</span>개</div>
                
                    <div className="grid grid-cols-4 mt-5">
                        {currentItems.map((product) => {
                            const isHoverd = hoveredPid === product.pid;

                            return (
                                <div
                                    key={product.pid}
                                    className="flex flex-col w-[200px] h-auto mb-5 cursor-pointer"
                                    onClick={() => handleAddLeaseItem(product)}
                                    onMouseEnter={() => setHoveredPid(product.pid)}
                                    onMouseLeave={() => setHoveredPid(null)}
                                >   
                                    {/* 기본 이미지 */}
                                    <div className="flex justify-center items-center w-[200px] h-[200px] overflow-hidden rounded-2xl bg-[#f5f5f5]">
                                        <div className="w-full h-full">
                                            <img 
                                                className="h-[100%] w-[100%] object-contain"
                                                style={{ boxShadow: '8px 8px 10px rgba(0,0,0,0.2)'}} 
                                                src={isHoverd ? product.hoverImageUrl : product.imageUrl} 
                                                alt={product.title} 
                                            />
                                        </div>
                                    </div>

                                    <span className="font-bold text-sm mt-4">{product.title}</span>
                                    <span className="text-xs font-bold text-[#CDC9C3]">{product.author}</span>
                                    <hr className="my-1" />
                                    {/* <span className="text-right font-bold text-[#555555]">{product.price.toLocaleString()}원</span> */}
                                </div>
                            );
                        })}
                    </div>

                    {/* 페이징 */}
                    <div className="flex justify-center items-center gap-2 mt-4 text-sm">
                        <button 
                            onClick={() => setCurrentPage(Math.max(1, groupStart - pageGroupSize))}
                            disabled={groupStart === 1}
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black"
                        >
                            {'<<'}
                        </button>
                        
                        <button 
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black"
                        >
                            {'<'}
                        </button>

                        {Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i).map(page => (
                            <button key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 flex items-center justify-center rounded-full ${
                                    currentPage === page ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
                                    }`}>
                            {page}
                            </button>
                        ))}

                        <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black"
                        >
                            {'>'}
                        </button>

                        <button onClick={() => setCurrentPage(Math.min(totalPages, groupStart + pageGroupSize))}
                            disabled={groupEnd === totalPages}
                            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black"
                        >
                            {'>>'}
                        </button>
                    </div>
                </div>

                {/* 우측 옵션 */}
                <div className="w-[440px] h-[900px] border border-black rounded-xl p-6 flex flex-col justify-between">
                    {/* 상단: 선택 요약 */}
                    <div>
                        <h3 className="text-xl font-bold mb-4">리스 옵션</h3>

                        <div className="max-h-[300px] overflow-y-auto h-full space-y-3 mb-4 pr-1">
                            {selectedItems.length == 0 && (
                                <div className="h-full text-center flex justify-center items-center border-2 rounded-lg text-sm text-gray-400 py-6">
                                    선택한 상품이 없습니다.<br />
                                    좌측에서 상품을 클릭해 추가해보세요!
                                </div>
                            )}

                            {selectedItems.map((item, index) => {
                                const isSelected = selectedProductId === item.id;
                                
                                return (
                                    <div key={item.id} className={`cursor-pointer transition-all 
                                        ${isSelected ? 'bg-gray-200 border-gray-300 py-2' : 'py-2'}`}
                                        onClick={() => setSelectedProductId(item.id)}
                                    >
                                        <div className="flex gap-4">
                                            <div className="w-[100px] h-[100px] bg-gray-100 rounded overflow-hidden">
                                                {/* 썸네일 이미지 자리 */}
                                                <img className="w-full h-full object-cover" src={item.imageUrl} alt={item.title} />
                                            </div>
                                            <div className="flex flex-col justify-between">
                                                <div>
                                                    <p className="text-sm font-semibold">작품 제목</p>
                                                    <p className="text-xs text-gray-500">작가명</p>
                                                </div>

                                                {/* 수량 조절 */}
                                                <div className="flex items-center gap-3 mt-1">
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            adjustQuantity(item.id, -1)}} 
                                                        className="flex items-center justify-center w-5 h-5 border rounded">-</button>
                                                    <span className="text-[13px]">{item.quantity}</span>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            adjustQuantity(item.id, 1)}} 
                                                        className="flex items-center justify-center w-5 h-5 border rounded">+</button>
                                                    <button
                                                        className="ml-auto text-sm text-gray-400 hover:text-red-500"
                                                         onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteItem(item.id);
                                                        }}>
                                                        ✕
                                                    </button>
                                                </div>

                                                {/* 사이즈 및 리스 기간 표시 */}
                                                <div className="mt-1 text-xs text0-gray-400">
                                                    <p>선택 사이즈: {item.size}</p>
                                                    <p>리스 기간: {item.period}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* 사이즈 선택 */}
                        <div className="mb-4">
                            <p className="font-semibold mb-2 text-sm">사이즈 선택</p>
                            <div className="grid grid-cols-3 gap-2 text-sm">
                                {["소", "중", "대"].map((size, i) => (
                                    <button key={i} 
                                        className={`px-2 py-1 border border-gray-300 rounded 
                                            ${selectedItems.find(item => item.id === selectedProductId)?.size === size
                                            ? 'bg-black text-white' 
                                            : ''} `}
                                        onClick={() => updateSelectedItem('size', size)}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 리스 기간 선택 */}
                        <div className="mb-4">
                            <p className="font-semibold mb-2 text-sm">리스 기간</p>
                            <div className="flex gap-2 text-sm">
                                {["6개월", "12개월"].map((period, i) => (
                                    <button 
                                        key={i} 
                                        className={`px-4 py-1 border border-gray-300 rounded
                                            ${selectedItems.find(item => item.id === selectedProductId)?.period === period
                                            ? 'bg-black text-white' 
                                            : ''} `}
                                        onClick={() => updateSelectedItem('period', period)}
                                    >
                                        {period}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 하단: 결제 요약 */}
                    <div className="flex flex-col border-t pt-4 gap-[6.5px]">
                        {(() => {
                            const { lease, deposit, shippingFee, isFreeShipping, total } = calculateLeaseCost();
                            return (
                                <>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span>리스 비용</span>
                                        <span className="font-bold">{lease.toLocaleString()}원</span>
                                    </div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span>보증금</span>
                                        <span className="font-bold">{deposit.toLocaleString()}원</span>
                                    </div>

                                    <div className="flex justify-between text-sm mb-2">
                                        <span>배송비</span>
                                        <span className="font-bold">
                                            {isFreeShipping ? (
                                                <span className="text-green-600">무료</span>
                                            ) : (
                                                `${shippingFee.toLocaleString()}원`
                                            )}
                                        </span>
                                    </div>

                                    <div className="flex justify-between text-base font-semibold mb-6">
                                        <span>총 결제 금액</span>
                                        <span className="text-black">{(total).toLocaleString()}원</span>
                                    </div>
                                    <button className="w-full py-3 bg-black text-white rounded-xl hover:bg-gray-800"
                                        onClick={handleGoToOrder}>
                                        결제하기
                                    </button>
                                </>
                            );
                        })()}
                        <div className="flex items-center justify-center h-[50px] border-[1px] border-[#1ecd52] gap-2"><img src={icon_naver} className="h-[24px]" /><button>결제하기</button></div>
                        <div className="flex items-center justify-center h-[50px] border-[1px] border-[#ffde02] gap-2"><img src={icon_kakao} className="h-[24px]" /><button>결제하기</button></div>
                    </div>
                </div>
            </div>

            {/* 리스 안내 및 유의사항 */}
            <div className="mt-10 pt-12 text-gray-800">
                <h3 className="text-2xl font-bold mb-10 tracking-tight border-b pb-4 border-gray-300">안내 및 유의사항</h3>

                {/* 리스 정책 */}
                <section className="mb-16">
                    <h4 className="text-xl font-semibold mb-6 text-gray-900">리스 정책</h4>
                    <ul className="space-y-4 pl-6 text-sm list-disc marker:text-gray-400">
                        <li>
                            <span className="font-medium text-gray-700">반납 연장 시 추가 요금</span> - 종료일 3일 전까지 연장 신청 시, 동일 조건의 월 리스 요금이 부과됩니다.
                        </li>
                        <li>
                            <span className="font-medium text-gray-700">파손·분실 시 보상 기준</span> - 손상 수준에 따라 수리비 또는 정가 기준 보상금이 청구됩니다.
                        </li>
                        <li>
                            <span className="font-medium text-gray-700">배송비 부담</span> -
                            최초 배송 및 반납 택배비는 기본적으로 고객 부담입니다.
                            <span className="block text-gray-600">
                                단, <span className="font-semibold text-black">리스 총 금액이 50,000원 이상</span>인 경우 최초 배송비가 무료로 지원됩니다. (방문 반납도 무료)
                            </span>
                        </li>

                        <li>
                            <span className="font-medium text-gray-700">보증금 반환</span> - 리스 종료 후 5영업일 이내 상태 확인 후 계좌로 환불됩니다.
                        </li>
                        <li>
                            <span className="font-medium text-gray-700">구매 전환 혜택</span> - 리스 종료 후 구매 시 일부 리스 금액이 차감됩니다.
                        </li>
                        <li>
                            <span className="font-medium text-gray-700">반납 주소</span> - 경기 고양시 덕양구 통일로 140 (동산동, 삼송테크노밸리) A동 355호
                        </li>
                        <li>
                            <span className="font-medium text-gray-700">반납 방법</span> - 선불 택배 발송 또는 방문 반납 (사전 연락 권장)
                        </li>
                        <li>
                            <span className="font-medium text-gray-700">연장 방법</span> - 동일 옵션으로 재구매하시면 기존 주문과 연동해 드립니다.
                        </li>
                    </ul>
                </section>

                {/* 고객 고려사항 */}
                <section>
                    <h4 className="text-xl font-semibold mb-6 text-gray-900">고객 고려사항</h4>
                    <ul className="space-y-4 pl-6 text-sm list-disc marker:text-gray-400">
                        <li>
                            <span className="font-medium text-gray-700">계약서 작성</span> - 주문 완료 후 전자계약서 링크를 통해 서명해야 최종 접수됩니다.
                        </li>
                        <li>
                            <span className="font-medium text-gray-700">동의서 제출</span> - 리스 정책 및 개인정보 수집·이용 동의가 포함된 전자 양식이 제공됩니다.
                        </li>
                    </ul>
                </section>
            </div>
        </div>
    );
}

export default LeasePage;