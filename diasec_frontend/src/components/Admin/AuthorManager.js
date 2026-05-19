import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const STATUS_OPTIONS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'NONE', 'PENDING_ONLY'];

const fmt = (dt) => (dt ? new Date(dt).toLocaleString() : '-');

const AuthorManager = () => {
    const navigate = useNavigate();
    const API = process.env.REACT_APP_API_BASE;

    // 필터/검색
    const [status, setStatus] = useState('ALL');
    const [keyword, setKeyword] = useState('');

    // 목록 & 로딩
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);

    // 심사 대기중인 사람 수
    const [pendingAuthorCount, setPendingAuthorCount] = useState(0);

    const fetchPendingAuthorCount = async () => {
        try {
            const res = await axios.get(`${API}/author/pending-count`, { withCredentials: true });
            setPendingAuthorCount(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchPendingAuthorCount();
    }, []);

    // 상세 모달
    const [open, setOpen] = useState(false);
    const [detail, setDetail] = useState(null);  // member row
    const [images, setImages] = useState([]);    // author_image[]
    const [actionNote, setActionNote] = useState('');
    const [previewImage, setPreviewImage] = useState(null);

    const fetchList = async () => {
        try {
        setLoading(true);
        const res = await axios.get(`${API}/author/authors`, {
            params: {
            status: (status === 'ALL' || status === 'PENDING_ONLY') ? undefined : status,
            keyword: keyword?.trim() || undefined,
            },
            withCredentials: true,
        });
        let list = res.data || [];
        
        // 심사중인 작품만 보기 옵션 적용
        if (status === 'PENDING_ONLY') {
            list = list.filter(r => (r.pending_count ?? 0) > 0);
        }

            setRows(list);
            fetchPendingAuthorCount();
        } catch (e) {
            console.error(e);
            alert('목록 조회 실패');
        } finally {
            setLoading(false);
        }
    };

    // 심사중 작품 개수
    const pendingTotal = rows.reduce((sum, r) => sum + (r.pending_count ?? 0), 0);

    const openDetail = async (row) => {
        setDetail(row);
        setOpen(true);
        setActionNote('');
    };

    const doApprove = async () => {
        if (!detail) return;
        if (!window.confirm(`${detail.author_name || detail.nickname || detail.id} 작가를 승인하시겠어요?`)) return;
        try {
        await axios.post(`${API}/author/approve`, {
            id: detail.id,
            author_name: detail.author_name,
            author_profile_image: detail.author_profile_image,
            note: actionNote || '',
        }, { withCredentials: true });
        alert('승인되었습니다.');
        setOpen(false);
        fetchList();
        } catch (e) {
        console.error(e);
        alert('승인 실패');
        }
    };

    const doNoUnderReview = async () => {
        if (!detail) return;
        if (!window.confirm(`${detail.author_name || detail.nickname || detail.id} 작가 신청을 심사전으로 상태를 변경하시겠어요?`)) return;
        try {
        await axios.post(`${API}/author/noUnderReview`, {
            id: detail.id,
            note: actionNote || '',
        }, { withCredentials: true });
        alert('심사전으로 상태를 변경했습니다.');
        setOpen(false);
        fetchList();
        } catch (e) {
        console.error(e);
        alert('심사전으로 상태 변경 실패');
        }
    }

    const doUnderReview = async () => {
        if (!detail) return;
        if (!window.confirm(`${detail.author_name || detail.nickname || detail.id} 작가 신청을 심사중으로 상태를 변경하시겠어요?`)) return;
        try {
        await axios.post(`${API}/author/underReview`, {
            id: detail.id,
            note: actionNote || '',
        }, { withCredentials: true });
        alert('심사중으로 상태를 변경했습니다.');
        setOpen(false);
        fetchList();
        } catch (e) {
        console.error(e);
        alert('심사중으로 상태 변경 실패');
        }
    }

    const doReject = async () => {
        if (!detail) return;
        if (!window.confirm(`${detail.author_name || detail.nickname || detail.id} 작가 신청을 반려하시겠어요?`)) return;
        try {
        await axios.post(`${API}/author/reject`, {
            id: detail.id,
            note: actionNote || '',
            author_profile_image: detail.author_profile_image,
        }, { withCredentials: true });
        alert('반려되었습니다.');
        setOpen(false);
        fetchList();
        } catch (e) {
        console.error(e);
        alert('반려 실패');
        }
    };

    useEffect(() => {
        fetchList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [status]);

    // 페이징
        const itemsPerPage = 10;
        const [currentPage, setCurrentPage] = useState(1);
        const totalPages = Math.max(1, Math.ceil(rows.length / itemsPerPage));
        const currentItems = rows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

        const pageGroupSize = 10;
        const currentGroup = Math.floor((currentPage - 1) / pageGroupSize);
        const groupStart = currentGroup * pageGroupSize + 1;
        const groupEnd = Math.min(groupStart + pageGroupSize - 1, totalPages);

    return (
        <div className="p-6 w-full">
        <h2 className="text-2xl font-bold mb-4">작가 신청 관리</h2>

        {/* 필터/검색 바 */}
        <div className="flex flex-wrap items-center gap-2 mb-4"> 
            <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border rounded px-3 py-2"
            >
                {STATUS_OPTIONS.map(s => 
                    <option key={s} value={s}>
                        {
                            s === 'ALL' ? '전체' : 
                            s === 'PENDING' ? `심사중 (${pendingAuthorCount}명)` : 
                            s === 'APPROVED' ? "승인됨" : 
                            s === 'REJECTED' ? '반려됨' : 
                            s === 'NONE' ? '미신청' : 
                            s === 'PENDING_ONLY' ? `심사대기 작품 (${pendingTotal}개)` : ''
                        }
                    </option>
                )}
            </select>

            <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchList()}
            placeholder="ID/이름/작가명 검색"
            className="border rounded px-3 py-2 w-[240px]"
            />

            <button
            onClick={fetchList}
            className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800"
            >
            조회
            </button>

            <span className="text-gray-400">(심사 대기 인원 : {pendingAuthorCount}명 / 작품 {pendingTotal}개)</span>
        </div>

        {/* 목록 */}
        <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
                <thead className="bg-gray-100">
                    <tr>
                    <th className="text-left p-3">회원ID</th>
                    <th className="text-left p-3">이름</th>
                    <th className="text-left p-3">작가명</th>
                    <th className="text-left p-3">상태</th>
                    <th className="text-left p-3">심사대기 작품</th>
                    <th className="text-left p-3">승인된 작품</th>
                    <th className="text-left p-3">정산대기 건수</th>
                    <th className="text-left p-3">정산완료 건수</th>
                    <th className="text-left p-3">포트폴리오</th>
                    <th className="text-center p-3">정보수정</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                        <td colSpan={10} className="p-6 text-center text-gray-500">로딩 중…</td>
                        </tr>
                    ) : rows.length === 0 ? (
                        <tr>
                        <td colSpan={10} className="p-6 text-center text-gray-400">데이터가 없습니다</td>
                        </tr>
                    ) : (
                        currentItems.map((r) => (
                        <tr
                            key={r.id}
                            onClick={() => navigate(`/authorPage/${r.id}`)}
                            className="border-t hover:bg-gray-50 cursor-pointer"
                        >
                            <td className="p-3">{r.id}</td>
                            <td className="p-3">{r.name || '-'}</td>
                            <td className="p-3">{r.author_name || '-'}</td>
                            <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs ${
                                r.author_status === 'APPROVED' ? 'bg-green-100 text-green-600' :
                                r.author_status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                                r.author_status === 'PENDING' ? 'bg-amber-100 text-amber-600' :
                                'bg-gray-100 text-gray-600'
                            }`}>
                                {r.author_status === 'PENDING' ? '심사중' :
                                r.author_status === 'APPROVED' ? '승인됨' :
                                r.author_status === 'REJECTED' ? '반려됨' : '미신청'}
                            </span>
                            </td>
                            <td className="p-3">{r.pending_count ?? 0}점</td>
                            <td className="p-3">{r.approved_count ?? 0}점</td>
                            <td className="p-3">
                            {r.settlement_pending_count ?? 0}건 ({(r.settlement_pending_amount ?? 0).toLocaleString()}원)
                            </td>
                            <td className="p-3">
                            {(r.ok_settlement_pending_count ?? 0).toLocaleString()}건 ({(r.ok_settlement_pending_amount ?? 0).toLocaleString()}원)
                            </td>
                            <td className="p-3">
                            {r.portfolio_url ? (
                                <a
                                href={r.portfolio_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-blue-600 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                                >
                                열기
                                </a>
                            ) : '-'}
                            </td>
                            <td className="p-3 text-center">
                            <button
                                onClick={(e) => {
                                e.stopPropagation();
                                openDetail(r);
                                }}
                                className="px-3 py-1 border rounded hover:bg-gray-100"
                            >
                                자세히
                            </button>
                            </td>
                        </tr>
                        ))
                    )}
                    </tbody>
            </table>
        </div>
        
        {/* 페이징 */}
            <div className="flex justify-center items-center gap-2 mt-10 mb-10 text-sm">
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

        {/* 상세 모달 */}
        {open && detail && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white w-[780px] max-w-[96vw] rounded-2xl shadow-lg overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                <div className="font-semibold">작가 신청 상세</div>
                <button className="text-gray-400 hover:text-black" onClick={() => setOpen(false)}>✕</button>
                </div>

                <div className="p-6 grid grid-cols-2 gap-6 text-sm">
                <div className="space-y-2">
                    <div><span className="text-gray-500">회원ID</span> : {detail.id}</div>
                    <div><span className="text-gray-500">이름</span> : {detail.name || '-'}</div>
                    <div><span className="text-gray-500">연락처</span> : {detail.phone || '-'}</div>
                    <div><span className="text-gray-500">이메일</span> : {detail.email || '-'}</div>
                    <div><span className="text-gray-500">작가명</span> : {detail.author_name || '-'}</div>
                    <div><span className="text-gray-500">소개</span> : {detail.author_intro || '-'}</div>
                    <div><span className="text-gray-500">슬로건</span> : {detail.tagline || '-'}</div>
                    <div><span className="text-gray-500">포트폴리오</span> : {detail.portfolio_url
                    ? <a href={detail.portfolio_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">열기</a>
                    : '-'}</div>
                </div>

                <div className="space-y-2">
                    <div className="font-medium mb-2">정산 계좌</div>
                    <div className="rounded border p-3 bg-gray-50">
                    <div><span className="text-gray-500">예금주</span> : {detail.account_holder || '-'}</div>
                    <div><span className="text-gray-500">은행</span> : {detail.bank_name || '-'}</div>
                    <div><span className="text-gray-500">계좌번호</span> : {detail.account_number || '-'}</div>
                    </div>

                    <div className="font-medium mt-4">대표 이미지</div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <div key={detail.id} className="border rounded overflow-hidden">
                            <img 
                                src={detail.author_profile_image} 
                                className="w-full h-36 object-cover cursor-pointer" 
                                onClick={() => setPreviewImage(detail.author_profile_image)}
                            />
                        </div>
                    </div>
                </div>
                </div>

                <div className="px-6">
                <textarea
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    placeholder="관리자 메모 (선택: 승인/반려 사유)"
                    className="w-full border rounded px-3 py-2 text-sm"
                    rows={3}
                />
                </div>

                <div className="flex justify-end gap-2 px-6 py-4 border-t">
                <button onClick={() => setOpen(false)} className="px-4 py-2 border rounded hover:bg-gray-100">닫기</button>
                <button onClick={doNoUnderReview} className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500">미신청</button>
                <button onClick={doUnderReview} className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">심사중</button>
                <button onClick={doReject} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">반려됨</button>
                <button onClick={doApprove} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-800">승인됨</button>
                </div>
            </div>
            </div>
        )}

        {/* 이미지 확대 모달 */}
        {previewImage && (
            <div
                className="fixed inset-0 bg-black/70 flex items-center justify-center z-[999]"
                onClick={() => setPreviewImage(null)}
            >
                <img
                    src={previewImage}
                    alt="Preview"
                    className="max-w-[90vw] max-h-[90vh] rounded-lg shadow-lg"
                />
            </div>
        )}
        </div>
    );
};

export default AuthorManager;
