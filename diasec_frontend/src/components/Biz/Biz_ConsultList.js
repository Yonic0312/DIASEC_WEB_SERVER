import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const formatCsv = (val) => {
    if (!val) return '-';
    return val.split(',').filter(Boolean).join(' / ');
};

const BizConsultList = () => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [selectedPostId, setSelectedPostId] = useState(null);
    const [viewableIds, setViewableIds] = useState([]);
    const [detailData, setDetailData] = useState(null);
    const [verifiedPasswords, setVerifiedPasswords] = useState({});

    // 목록 불러오기
    useEffect(() => {
        axios.get(`${API}/biz-consult/list`)
            .then((res) => setPosts(res.data))
            .catch(() => toast.error('목록을 불러오지 못했습니다.'));
    }, [API]);

    const handlePostClick = async (post) => {

        if (selectedPostId === post.id) {
            setSelectedPostId(null);
            setDetailData(null);
            return;
        }

        if (!viewableIds.includes(post.id)) {
            const pw = prompt('비밀번호를 입력하세요.');
            if (!pw) return;

            try {
                const res = await axios.post(`${API}/biz-consult/check-password`, {
                    id: post.id,
                    password: pw
                });
                if (res.data !== true) throw new Error();
                setViewableIds(prev => [...prev, post.id]);
                setVerifiedPasswords(prev => ({ ...prev, [post.id]: pw }));
            } catch (err) {
                toast.error('비밀번호가 일치하지 않습니다.');
                return;
            } 
        } 

        fetchDetail(post.id);
    };

    // 글 상세 조회
    const fetchDetail = async (id) => {
        try {
            const res = await axios.get(`${API}/biz-consult/view/${id}`);
            setSelectedPostId(id);
            setDetailData(res.data);
        } catch (err) {
            toast.error('상세 내용을 불러오지 못했습니다.');
        }
    }

    const handleDelete = async (postId) => {
        if (!window.confirm('정말 삭제하시겠습니까? 첨부 이미지도 함께 삭제됩니다.')) return;

        const pw = verifiedPasswords[postId];
        if (!pw) {
            toast.error('비밀번호 확인이 필요합니다.');
            return;
        }

        try {
            await axios.post(`${API}/biz-consult/delete`, {
                id: postId,
                password: pw,
            });
            toast.success('삭제되었습니다.');

            // 목록에서 해당 글 제거
            setPosts(prev => prev.filter(p => p.id !== postId));

            // 상세 영역 닫기
            setSelectedPostId(null);
            setDetailData(null);

            // 저장해 둔 비밀번호·열람 권한 정리
            setViewableIds(prev => prev.filter(id => id !== postId));
            setVerifiedPasswords(prev => {
                const next = { ...prev };
                delete next[postId];
                return next;
            });
        } catch {
            toast.error('삭제에 실패했습니다.');
        }
    };

    // 페이징 관련 상태
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const totalPages = Math.max(1, Math.ceil(posts.length / itemsPerPage));
    const currentPosts = posts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // 화면 크기에 따라 그룹 크기 변경 (OrderList와 동일)
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

    const currentGroup = Math.floor((currentPage - 1) / pageGroupSize);
    const groupStart = currentGroup * pageGroupSize + 1;
    const groupEnd = Math.min(groupStart + pageGroupSize - 1, totalPages);

    useEffect(() => {
        setSelectedPostId(null);
        setDetailData(null);
        setViewableIds([]);
        setVerifiedPasswords({});
    }, [currentPage]);

    const emptyRowCount = Math.max(0, itemsPerPage - currentPosts.length);

    const renderEmptyRows = () =>
        Array.from({ length: emptyRowCount }).map((_, idx) => (
            <tr key={`empty-row-${idx}`} className="h-[42px] md:h-[44px]">
                <td className="border p-2">&nbsp;</td>
                <td className="border p-2">&nbsp;</td>
                <td className="border p-2">&nbsp;</td>
            </tr>
        ));

    return(
        <div className="flex flex-col w-full mx-auto mt-20 px-4 py-6">
            <h1 
                className="
                    md:text-3xl text-[clamp(16px,3.91vw,30px)]
                    flex justify-center font-bold mb-10
                    ">기업컨설팅 목록</h1>
            
            <div className="flex justify-end">
                <button
                    onClick={() => navigate('/bizConsult')}
                    className="md:text-base text-[clamp(12px,2.086vw,16px)] bg-black text-white px-4 py-2 rounded"
                >
                    신청하기
                </button>
            </div>

            <table 
                className='
                    w-full mt-2 border-collapse border text-center        
            '>
                <thead>
                    <tr 
                        className="
                            md:text-base text-[clamp(10px,2.085vw,16px)]
                            bg-gray-300
                    ">
                        <th className="w-[10%]border p-2 w-12">No</th>
                        <th className="w-[25%] border p-2">날짜</th>
                        <th className="w-[65%] border p-2">회사명</th>
                    </tr>
                </thead>
                <tbody>
                    {currentPosts.length === 0 ? (
                        <>
                            <tr className="h-[42px] md:h-[44px]">
                                <td colSpan="3" className="border p-6 text-gray-500">
                                    등록된 기업컨설팅 신청이 없습니다.
                                </td>
                            </tr>
                            {Array.from({ length: itemsPerPage - 1 }).map((_, idx) => (
                                <tr key={`empty-row-${idx}`} className="h-[42px] md:h-[44px]">
                                    <td className="border p-2">&nbsp;</td>
                                    <td className="border p-2">&nbsp;</td>
                                    <td className="border p-2">&nbsp;</td>
                                </tr>
                            ))}
                        </>
                    ) : (
                        <>
                            {currentPosts.map((post, i) => {
                                const rowNo = posts.length - ((currentPage - 1) * itemsPerPage + i);
                                return (
                                    <React.Fragment key={post.id}>
                                        <tr
                                            className={`h-[42px] md:h-[44px] md:text-base text-[clamp(11px,2.085vw,16px)]
                                                hover:bg-gray-100 cursor-pointer 
                                                ${selectedPostId === post.id ? 'bg-gray-100 ring-1 ring-gray-400' : ''}`}
                                            onClick={() => handlePostClick(post)}
                                        >
                                            <td className="border p-2">{rowNo}</td>
                                            <td className="border p-2">
                                                {new Date(post.createdAt).toLocaleDateString("ko-KR", {
                                                    year: "2-digit",
                                                    month: "2-digit",
                                                    day: "2-digit",
                                                }).replace(/\. /g, ".").replace(/\.$/, "")}
                                            </td>
                                            <td className="border p-2 text-left px-4">
                                                {post.companyName} <span className="ml-1">🔒</span>
                                            </td>
                                        </tr>

                                        {selectedPostId === post.id && detailData && (
                                            <tr>
                                                <td colSpan="3" className="border-b md:px-6 px-4 py-4">
                                                    <div className="md:text-base text-[clamp(12px,2.085vw,16px)] text-left space-y-2">
                                                        <h3 className="md:text-xl text-[clamp(14px,2.607vw,20px)] font-bold">
                                                            {detailData.companyName}
                                                        </h3>
                                                        <hr />
                                                        <p><strong>등록일:</strong> {detailData.createdAt?.substring(0, 10)}</p>
                                                        <p><strong>부서 / 담당자 / 직함:</strong> {detailData.deptManagerTitle}</p>
                                                        <p><strong>연락처:</strong> {detailData.phone}</p>
                                                        <p><strong>이메일:</strong> {detailData.email}</p>
                                                        <p><strong>수량:</strong> {formatCsv(detailData.quantity) || '-'}</p>
                                                        <p><strong>예산금액:</strong> {formatCsv(detailData.budget) || '-'}</p>
                                                        <p><strong>사이즈:</strong> {formatCsv(detailData.sizes)}</p>
                                                        <p><strong>작품 종류:</strong> {formatCsv(detailData.artworkTypes)}</p>
                                                        <p><strong>테마:</strong> {formatCsv(detailData.themes)}</p>
                                                        <p><strong>분위기:</strong> {formatCsv(detailData.atmospheres || detailData.atmostpheres)}</p>
                                                        <p><strong>설치 장소:</strong> {detailData.installPlace || '-'}</p>

                                                        {detailData.etcInquiry && (
                                                            <>
                                                                <p><strong>기타 문의:</strong></p>
                                                                <div className="p-4 border-l-4 border-blue-400 bg-blue-50 rounded text-gray-800 whitespace-pre-line">
                                                                    {detailData.etcInquiry}
                                                                </div>
                                                            </>
                                                        )}

                                                        {detailData.fileList?.length > 0 && (
                                                            <div>
                                                                <p className="font-medium mb-2">설치공간 사진</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {detailData.fileList.map((file) => (
                                                                        <a
                                                                            key={file.oid}
                                                                            href={file.filePath}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                        >
                                                                            <img
                                                                                src={file.filePath}
                                                                                alt={file.originalName}
                                                                                className="w-24 h-24 object-cover border rounded"
                                                                            />
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                         {viewableIds.includes(post.id) && (
                                                            <div className="mt-4 flex justify-end">
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDelete(post.id)
                                                                    }}
                                                                    className="md:text-sm text-[clamp(11px,2vw,14px)] bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                                                                >
                                                                    삭제
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        {renderEmptyRows()}
                        </>
                    )}
                </tbody>
            </table>

            {/* 페이징 UI */}
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

            <p className="text-center text-gray-500 md:text-xs text-[clamp(10px,1.6vw,12px)] mt-6">
                ※ 상담이 완료되면 등록하신 설치공간 사진은 삭제됩니다.
            </p>
        </div>
    )
}

export default BizConsultList;