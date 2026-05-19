import { useEffect, useMemo, useContext, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { MemberContext } from '../../context/MemberContext';

const STATUS_TABS = [
    { key: 'PENDING', label: '심사중'},
    { key: 'APPROVED', label: '승인'},
    { key: 'REJECTED', label: '반려'},
    { key: 'SETTLEMENT', label: '정산내역'},
];

const AuthorPage = () => {
    const { member } = useContext(MemberContext);
    const API = process.env.REACT_APP_API_BASE;
    const { id: memberId } = useParams(); // 파라미터 가져오기

    // 모달
    const [previewOpen, setPreviewOpen] = useState(false); // 이미지 클릭시

    // 정산
    const [settlements, setSettlements] = useState([]);
    const PAID_STATUSES = ['결제완료', '배송준비중', '배송중', '배송완료'];

    // 정산 조회 함수
    const fetchSettlements = async () => {
        try {
            const res = await axios.get(`${API}/author/settlements`, {
                params: { author: profile?.author_name }
            });
            const data = (res.data || []).filter(it => PAID_STATUSES.includes(it.order_status));
            setSettlements(data);
        } catch (err) {
            console.error(err);
        }
    }

    // 프로필
    const [profile, setProfile] = useState(null);
    const [editOpen, setEditOpen] = useState(false);
    const [editNick, setEditNick] = useState('');
    const [editIntro, setEditIntro] = useState('');
    const [editAuthor_profile_image, setEditAuthor_profile_image] = useState(null);

    // 작품
    const [activeTab, setActiveTab] = useState('PENDING');
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);

    // 업로드
    const [uploadOpen, setUploadOpen] = useState(false);
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadFile, setUploadFile] = useState(null);

    // 기존
    const [page, setPage] = useState(1);

    // 페이징
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // ✅ OrderList 기준 반응형 적용
    const [pageGroupSize, setPageGroupSize] = useState(
    window.innerWidth < 640 ? 5 : 10
    );

    useEffect(() => {
    const handleResize = () => {
        setPageGroupSize(window.innerWidth < 640 ? 5 : 10);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
    }, []);

    const dataList = activeTab === 'SETTLEMENT' ? settlements : images;
    const totalPages = Math.max(1, Math.ceil(dataList.length / itemsPerPage));

    const currentGroup = Math.floor((currentPage - 1) / pageGroupSize);
    const groupStart = currentGroup * pageGroupSize + 1;
    const groupEnd = Math.min(groupStart + pageGroupSize - 1, totalPages);

    const currentItems = dataList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
    );

    const renderPagination = () => (
        <div 
            className="
                md:text-sm text-[clamp(10px,1.8252vw,14px)]
                flex justify-center items-center sm:gap-2 gap-[1px] mt-10 mb-10">
            <button 
                onClick={() => setCurrentPage(Math.max(1, groupStart - pageGroupSize))}
                disabled={groupStart === 1}
                className="
                    sm:w-8 w-6
                    sm:h-8 h-6     
                    flex items-center justify-center text-gray-500 hover:text-black"
            >
                {'<<'}
            </button>

            <button 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="
                    sm:w-8 w-6
                    sm:h-8 h-6 
                    flex items-center justify-center text-gray-500 hover:text-black"
            >
                {'<'}
            </button>

            {Array.from({ length: groupEnd - groupStart + 1 }, (_, i) => groupStart + i).map(page => (
                <button key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`
                            sm:w-8 w-6
                            sm:h-8 h-6
                            flex items-center justify-center rounded-full ${
                        currentPage === page ? 'bg-black text-white' : 'text-gray-700 hover:bg-gray-100'
                        }`}>
                {page}
                </button>
            ))}

            <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="
                    sm:w-8 w-6
                    sm:h-8 h-6 
                    flex items-center justify-center text-gray-500 hover:text-black"
            >
                {'>'}
            </button>

            <button onClick={() => setCurrentPage(Math.min(totalPages, groupStart + pageGroupSize))}
                disabled={groupEnd === totalPages}
                className="
                    sm:w-8 w-6
                    sm:h-8 h-6 
                    flex items-center justify-center text-gray-500 hover:text-black"
            >
                {'>>'}
            </button>
        </div>
    );

    // 프로필 조회
    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${API}/author/profile`, { params: { memberId } });
            setProfile(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    // 작품 목록 조회 (상태 + 페이징)
    const fetchImages = async (status = activeTab) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/author/images`, {
                params: { memberId, status },
            });
            setImages(res.data.items || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // 작품 수정/삭제
    const [selectedWork, setSelectedWork] = useState(null);
    const [editWorkTitle, setEditWorkTitle] = useState('');
    const [editWorkFile, setEditWorkFile] = useState(null);
    const [reviewNote, setReviewNote] = useState(''); // 반려사유

    const pageItems = useMemo(() => {
        const start = (page - 1) * itemsPerPage;
        return images.slice(start, start + itemsPerPage);
    }, [images, page]);


    // 처음 로드 시 데미 데이터 세팅
    useEffect(() => {
        if (!memberId) return;
        fetchProfile();
    }, [memberId]);

    // 탭 변경 -> 1페이지부터 재조회
    const handleTabChange = (status) => {
        setActiveTab(status);
        fetchImages(status, 1);
    }

    // 정산내역 조회
    useEffect(() => {
        if (!profile?.author_name) return;
        if ( activeTab === 'SETTLEMENT' ) {
            fetchSettlements();
        }
    }, [activeTab, profile]);

    // 수정 모달 열기
    const openEditModal = () => {
        setEditNick(profile?.nickname || '');
        setEditIntro(profile?.author_intro || '');
        setEditAuthor_profile_image(null);
        setEditOpen(true);
    }

    // 프로필 수정
    const handleProfileUpdate = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("memberId", memberId);
        formData.append("nickname", editNick);
        formData.append("authorName", profile.author_name);
        formData.append("authorIntro", profile.author_intro);
        if (editAuthor_profile_image) formData.append("author_profile_image", editAuthor_profile_image);

        try {
            await axios.post(`${API}/author/profile/update`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            alert("프로필이 수정되었습니다.");
            setEditOpen(false);
            fetchProfile();
        } catch (err) {
            console.error(err);
            alert('수정 실패');
        }
    };

    // 업로드
    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) return alert('이미지 파일을 선택해주세요.');

        const formData = new FormData();
        formData.append('memberId', memberId);
        formData.append('title', uploadTitle || '');
        formData.append('file', uploadFile);

        try {
            await axios.post(`${API}/author/images`, formData, {
                headers: { 'Content-Type' : 'multipart/form-data' },
            });
            alert('업로드되었습니다. (심사중)');
            setUploadOpen(false);
            setUploadTitle('');
            setUploadFile(null);
            fetchImages(activeTab, 1);
        } catch (err) {
            console.error(err);
            alert('업로드 실패');
        }
    };

    // 페이지 이동
    const goPrev = () => {
        if (page > 1) fetchImages(activeTab, page - 1);
    };
    const goNext = () => {
        if (page < totalPages) fetchImages(activeTab, page + 1);
    };

    // 탭이 바뀌면 목록 새로고침 (최초 1회 포함)
    useEffect(() => {
        if (!memberId) return;
        fetchImages(activeTab, 1);
    }, [memberId, activeTab]);

    if (!profile) {
        return <div className="max-w-5xl mx-auto px-6 py-16 text-gray-500">로딩 중...</div>
    }

    // 날짜 변경 포맷
    const formatYYMMDD = (input) => {
        const kst = new Date(new Date(input).toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
        const yy = String(kst.getFullYear()).slice(2);
        const mm = String(kst.getMonth() + 1).padStart(2, '0');
        const dd = String(kst.getDate()).padStart(2, '0');
        return `${yy}.${mm}.${dd}`;
    }

    return (
        <div className="max-5xl mx-auto md:px-6 py-10">
            {/* 프로필 */}
            <div className="flex md:flex-row flex-col items-center justify-between">
                <div className="
                        flex items-center gap-4     
                        md:mb-0 mb-4">
                    <img
                        src={profile.author_profile_image}
                        alt={profile.nickname}
                        className="
                            md:w-20 w-14
                            md:h-20 h-14
                            rounded-full object-cover border"
                    />
                    <div>
                        <div 
                            className="
                                md:text-xl text-[clamp(14px,2.607vw,20px)]
                                font-bold">{profile.author_name}</div>
                        <div 
                            className="
                                md:text-sm text-[clamp(11px,1.8252vw,14px)] 
                                text-gray-500">{profile.author_intro}</div>
                    </div>
                </div>
                <div 
                    className="
                        md:text-base text-[clamp(11px,2.085vw,16px)]
                        flex gap-2">
                    <button
                        onClick={openEditModal}
                        className="px-3 py-2 border rounded hover:bg-gray-50"
                    >
                        프로필 수정
                    </button>
                    <button
                        onClick={() => setUploadOpen(true)}
                        className="px-3 py-2 bg-black text-white rounded hover:bg-gray-800"
                    >
                        작품 등록
                    </button>
                </div>
            </div>

            {/* 탭 */}
            <div className="flex justify-center mt-8 border-b gap-6">
                {STATUS_TABS.map(t => (
                    <button
                        key={t.key}
                        className={`
                                md:text-sm text-[clamp(11px,1.8252vw,14px)]
                                pb-3 -mb-px border-b-2 
                                ${
                            activeTab === t.key
                                ? 'border-black text-black font-medium'
                                : 'border-transparent text-gray-500 hover:text-black'
                        }`}
                        onClick={() => handleTabChange(t.key)}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {activeTab === 'SETTLEMENT' ? (
                <div className="mt-6">
                    {settlements.length === 0 ? (
                        <div className="text-gray-400">정산할 항목이 없습니다.</div>
                    ) : (
                        <table 
                            className="
                                w-full border 
                                md:text-sm text-[clamp(11px,1.8252vw,14px)]">
                            <thead>
                                <tr className="bg-gray-100">
                                    <th className="border px-2 py-1">상품명</th>
                                    <th className="border px-2 py-1">수량</th>
                                    <th className="border px-2 py-1">정산금</th>
                                    <th className="border px-2 py-1">주문일</th>
                                    <th className="border px-2 py-1">정산</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map(item => (
                                    <tr key={item.item_id} className="text-center"
                                    >
                                        <td className="border md:px-2 py-1">{item.title}</td>
                                        <td className="border md:px-2 py-1">{item.quantity}</td>
                                        <td className="border md:px-2 py-1">{(item.price * item.quantity * 0.13).toLocaleString()}원</td>
                                        <td className="border md:px-2 py-1">
                                            {formatYYMMDD(item.created_at)}
                                        </td>

                                        <td className="border px-2 py-1">
                                            {item.settlement_date ? (
                                                member?.role === 'ADMIN' ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        {/* 정산 완료 날짜 */}
                                                        <span className="text-green-600">
                                                            {new Date(item.settlement_date).toLocaleDateString('ko-KR')} 완료
                                                        </span>

                                                        {/* 정산 취소 버튼 */}
                                                        <button
                                                            onClick={async () => {
                                                                if (!window.confirm('이 항목의 정산을 취소하시겠습니까?')) return;
                                                                try {
                                                                    await axios.post(`${API}/author/settle/cancel`, {
                                                                        itemId: item.item_id
                                                                    });
                                                                    alert('정산이 취소되었습니다.');
                                                                    fetchSettlements();
                                                                } catch (err) {
                                                                    console.error(err);
                                                                    alert('정산 취소 실패');
                                                                }
                                                            }}
                                                            className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-xs"
                                                        >
                                                            정산취소
                                                        </button>
                                                    </div>
                                                ) : (
                                                <span className="text-green-600">
                                                    {new Date(item.settlement_date).toLocaleDateString('ko-KR')} 완료
                                                </span>
                                                )
                                            ) :
                                            member?.role === 'ADMIN' ? (

                                                <button 
                                                    onClick={async () => {
                                                        if (!window.confirm('이 항목을 정산 처리하시겠습니까?')) return;
                                                        try {
                                                            await axios.post(`${API}/author/settle`, {
                                                                itemId: item.item_id
                                                            });
                                                            alert('정산이 완료되었습니다.');
                                                            fetchSettlements();
                                                        } catch (err) {
                                                            console.error(err);
                                                            alert('정산 처리 실패');
                                                        }
                                                    }}
                                                    className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600"
                                                >
                                                    정산하기
                                                </button>
                                            ) : (
                                                <button
                                                    disabled
                                                    className="px-2 py-1 bg-gray-300 text-gray-600 rounded cursor-not-allowed"
                                                >
                                                    정산 대기
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {/* 페이징 */}
                    {member?.role === 'ADMIN' ? renderPagination() : ''}

                </div>
            ) : (
                // 기존 작품 그리드
                <div className="mt-6">
                    {loading ? (
                        <div className="text-gray-500">불러오는 중...</div>
                    ) : images.length === 0 ? (
                        <div className="text-gray-400">표시할 작품이 없습니다.</div>
                    ) : (
                        <>
                            <div className="grid md:grid-cols-4 grid-cols-2 gap-5">
                                {currentItems.map(item => (
                                    <div 
                                        key={item.img_id} 
                                        className="border rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer"
                                        onClick={() => {
                                            setSelectedWork(item);
                                            setEditWorkTitle(item.title || '');
                                            setEditWorkFile(null);
                                        }}    
                                    >
                                        <div className="relative flex items-center justify-center">
                                            <img src={item.image_url} alt={item.title} className="p-2 w-auto h-44 object-contain "/>
                                            <span className={`absolute top-2 left-2 text-[10px] px-2 py-1 rounded ${
                                                item.status === 'APPROVED' ? 'bg-green-600 text-white' :
                                                item.status === 'REJECTED' ? 'bg-red-600 text-white' :
                                                'bg-amber-500 text-white'
                                            }`}>
                                                {item.status}
                                            </span>
                                        </div>
                                        <div className="px-3 py-2">
                                            <div className="text-sm font-medium truncate">{item.title || '무제'}</div>
                                            {item.status === 'REJECTED' && item.reject_reason && (
                                                <div className="mt-1 text-[12px] text-red-600 line-clamp-2">
                                                    반려 사유: {item.reject_reason}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 페이징 */}
                            {renderPagination()}
                        </>
                    )}
                </div>
            )}
            

            {/* 작가 프로필 수정 모달 */}
            {editOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <form
                        onSubmit={handleProfileUpdate}
                        className="bg-white p-6 rounded-lg w-96"
                    >
                        <h3 className="text-lg font-bold mb-4">프로필 수정</h3>

                        {/* 닉네임 */}
                        <label className="block mb-2 text-sm font-medium">닉네임</label>
                        <input
                            type="text"
                            value={editNick}
                            onChange={(e) => setEditNick(e.target.value)}
                            className="w-full border px-2 py-1 mb-4"
                        />

                        {/* 소개글 */}
                        <label className="block mb-2 text-sm font-medium">소개글</label>
                        <textarea
                            value={editIntro}
                            onChange={(e) => setEditIntro(e.target.value)}
                            className="w-full border px-2 py-1 mb-4"
                            rows="3"
                        />

                        {/* 대표 이미지 */}
                        <label className="block mb-2 text-sm font-medium">대표 이미지</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setEditAuthor_profile_image(e.target.files[0])}
                            className="mb-4"
                        />

                        {/* 버튼 */}
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setEditOpen(false)}
                                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                            >
                                취소
                            </button>

                            <button
                                type="submit"
                                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                저장
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* 작품 업로드 모달 */}
            {uploadOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <form onSubmit={handleUpload} className="bg-white p-6 rounded-lg w-96">
                        <h3 className="text-lg font-bold mb-4">작품 등록</h3>

                        <label className="block mb-2 text-sm font-medium">제목</label>
                        <input
                            type="text"
                            value={uploadTitle}
                            onChange={(e) => setUploadTitle(e.target.value)}
                            className="w-full border px-2 py-1 mb-4"
                            placeholder="제목(선택)"
                        />

                        <label className="block mb-2 text-sm font-medium">이미지 파일</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setUploadFile(e.target.files[0])}
                            className="mb-4"
                        />

                        <div className="flex justify-end gap-2">
                            <button 
                                type="button"
                                onClick={() => setUploadOpen(false)}
                                className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400">
                                취소
                            </button>
                            <button
                                type="submit"
                                className="px-3 py-1 bg-black text-white rounded hover:bg-gray-800"
                            >
                                업로드
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* 작품 수정 삭제 모달 */}
            {selectedWork && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                    onClick={() => setSelectedWork(false)}
                >
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault();
                            const formData = new FormData();
                            formData.append('imgId', selectedWork.img_id);
                            formData.append('title', editWorkTitle);
                            if (editWorkFile) formData.append('file', editWorkFile);

                            try {
                                await axios.post(`${API}/author/images/update`, formData, {
                                    headers: { 'Content-Type': 'multipart/form-data' },
                                });
                                alert('작품이 수정되었습니다.');
                                setSelectedWork(null);
                                fetchImages(activeTab, page);
                            } catch (err) {
                                console.error(err);
                                alert('수정 실패');
                            }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white p-6 rounded-lg w-96"
                    >
                        <h3 className="text-lg font-bold mb-4">작품 수정</h3>

                        {/* 현재 상태 뱃지 */}
                        <span className={`text-xs px-2 py-1 rounded
                            ${selectedWork.status === 'APPROVED' ? 'bg-green-600 text-white' :
                                selectedWork.status === 'REJECTED' ? 'bg-red-600 text-white' :
                                'bg-amber-500 text-white'}`}>
                            {selectedWork.status}
                        </span>

                        {/* 반려 사유 표시 */}
                        {selectedWork.status === 'REJECTED' && selectedWork.reject_reason && (
                            <div className="mb-3 text-xs text-red-600">
                                반려 사유: {selectedWork.reject_reason}
                            </div>
                        )} 

                        <div className="mb-4 flex items-center justify-center border">
                            <img 
                                src={editWorkFile ? URL.createObjectURL(editWorkFile) : selectedWork.image_url}
                                alt={selectedWork.title || 'preview'}
                                className="w-auto h-48 object-contain rounded"
                                onClick={() => setPreviewOpen(true)}
                            />
                        </div>

                        <label className="block mb-2 text-sm font-medium">제목</label>
                        <input 
                            type="text"
                            value={editWorkTitle}
                            onChange={(e) => setEditWorkTitle(e.target.value)}
                            className="w-full border px-2 py-1 mb-4"
                        />

                        <label className="block mb-2 text-sm font-medium">이미지 변경</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setEditWorkFile(e.target.files[0])}
                            className="mb-4"
                        />

                        {/* 관리자 심사 영역 */}
                        {member?.role === 'ADMIN' && (
                            <div className="mb-4 rounded border p-3 bg-gray-50">
                                <div className="text-sm font-medium mb-2">작품 심사</div>
                                <div className="flex gap-2 mb-2">
                                    <button
                                        type="button"
                                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                                        onClick={async () => {
                                            if (!window.confirm('이 작품을 승인하시겠습니까?')) return;
                                            try {
                                                await axios.post(`${API}/author/images/${selectedWork.img_id}/approve`);
                                                alert('승인되었습니다.');
                                                setSelectedWork(null);
                                                fetchImages(activeTab, page);
                                            } catch (err) {
                                                console.error(err);
                                                alert('승인 실패');
                                            }
                                        }}
                                    >
                                        승인
                                    </button>

                                    <button
                                        type="button"
                                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                                        onClick={async () => {
                                            const note = reviewNote || window.prompt('반려 사유를 입력해주세요 (선택)') || '';
                                            if (!window.confirm('이 작품을 반려하시겠습니까?')) return;
                                            try {
                                                await axios.post(`${API}/author/images/${selectedWork.img_id}/reject`, { note });
                                                alert('반려되었습니다.');
                                                setSelectedWork(null);
                                                setReviewNote('');
                                                fetchImages(activeTab, page);
                                            } catch (err) {
                                                console.error(err);
                                                alert('반려 실패');
                                            }
                                        }}
                                    >
                                        반려
                                    </button>

                                    <button
                                        type="button"
                                        className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
                                        onClick={async () => {
                                            if (!window.confirm('이 작품을 심사중으로 상태를 변경하시겠습니까?')) return;
                                            try {
                                                await axios.post(`${API}/author/images/${selectedWork.img_id}/pending`);
                                                alert('심사중으로 상태가 변경되었습니다.');
                                                setSelectedWork(null);
                                                setReviewNote('');
                                                fetchImages(activeTab, page);
                                            } catch (err) {
                                                console.error(err);
                                                alert('심사중으로 상태 변경 실패');
                                            }
                                        }}
                                    >
                                        심사중
                                    </button>
                                </div>

                                {/* 반려 사유 입력 칸 (선택) */}
                                <textarea
                                    value={reviewNote}
                                    onChange={(e) => setReviewNote(e.target.value)}
                                    placeholder="반려  사유 (선택)"
                                    rows={3}
                                    className="w-full border rounded px-2 py-1 text-sm"
                                />

                                <span className="text-orange-500 text-sm">※ 작품을 승인하고 꼭 상품 등록을 해주세요!</span> <br/>
                                <span className="text-orange-500 text-sm">(이미지 클릭 → 우클릭으로 저장)</span> 
                            </div>
                        )}

                        <div className="flex justify-between">
                            <button
                                type="button"
                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                onClick={async () => {
                                    if (!window.confirm('정말 삭제하시겠습니까?')) return;
                                    try {
                                        await axios.delete(`${API}/author/images/${selectedWork.img_id}`);
                                        alert('삭제되었습니다.');
                                        setSelectedWork(null);
                                        fetchImages(activeTab, page);
                                    } catch (err) {
                                        console.error(err);
                                        alert('삭제 실패');
                                    }
                                }}
                            >
                                삭제
                            </button>
                            
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedWork(null)}
                                    className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    className="ml-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    저장
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* 수정창 이미지 모달 */}
            {previewOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
                    onClick={() => setPreviewOpen(false)}
                >   
                    <img 
                        src={editWorkFile ? URL.createObjectURL(editWorkFile) : selectedWork.image_url}
                        alt={selectedWork.title || 'preview-large'}
                        className="max-w-full max-h-full object-contain rounded shadow-lg"
                    />
                </div>
            )}
        </div>
    )
}

export default AuthorPage;