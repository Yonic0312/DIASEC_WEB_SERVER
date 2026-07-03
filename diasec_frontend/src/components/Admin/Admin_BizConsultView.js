import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const formatCsv = (val) => {
    if (!val) return '-';
    return val.split(',').filter(Boolean).join(' / ');
};

const Info = ({ label, value }) => (
    <div>
        <div className="text-sm text-gray-600">{label}</div>
        <div className="text-gray-900 font-medium whitespace-pre-line">{value || '-'}</div>
    </div>
);

const Admin_BizConsultView = () => {
    const API = process.env.REACT_APP_API_BASE;
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);

    useEffect(() => {
        axios
            .get(`${API}/admin/biz-consult/view/${id}`, {withCredentials: true })
            .then((res) => setPost(res.data))
            .catch(() => toast.error('신청 정보를 불러올 수 없습니다.'));
    }, [API, id]);

    const handleComplete = () => {
        if (!window.confirm('이 신청을 완료 처리하겠습니까?')) return;

        axios
            .post(`${API}/admin/biz-consult/complete`, { id: Number(id) }, { withCredentials: true })
            .then(() => {
                toast.success('완료 처리되었습니다.');
                setPost((prev) => ({ ...prev, status: '완료' }));
            })
            .catch(() => toast.error('완료 처리에 실패했습니다.'));
    }

    const handleReopen = () => {
        if (!window.confirm('이 신청을 미완료로 되돌리시겠습니까?')) return;

        axios
            .post(`${API}/admin/biz-consult/reopen`, { id: Number(id) }, { withCredentials: true })
            .then(() => {
                toast.success('미완료로 변경되었습니다.');
                setPost((prev) => ({ ...prev, status: '미완료' }));
            })
            .catch(() => toast.error('미완료 변경에 실패했습니다.'));
    };

    const handleDelete = () => {
        if (!window.confirm('정말 삭제하시겠습니까? 첨부 이미지도 함께 삭제됩니다.')) return;

        axios
            .post(`${API}/admin/biz-consult/delete`, { id }, {withCredentials: true })
            .then(() => {
                toast.success('삭제 완료');
                navigate('/admin_BizConsultList');
            })
            .catch(() => toast.error('삭제에 실패했습니다.'));
    };

    const handleDeleteFile = (oid) => {
        if (!window.confirm('이 이미지를 삭제하시겠습니까?')) return;

        axios
            .post(`${API}/admin/biz-consult/delete-file`, { oid }, { withCredentials: true })
            .then(() => {
                toast.success('이미지가 삭제되었습니다.');
                setPost((prev) => ({
                    ...prev,
                    fileList: prev.fileList.filter((f) => f.oid !== oid),
                }));
            })
            .catch(() => toast.error('이미지 삭제에 실패했습니다.'));
    }

    if (!post) return <div className="p-10 text-center">불러오는 중...</div>

    return (
        <div className="w-full mx-20 pb-20">
            <h2 className="text-3xl text-center font-bold mb-10">기업컨설팅 상세보기</h2>
            <hr />

            <div className="flex justify-end gap-3 mt-5">
                <button
                    type="button"
                    className="bg-white text-gray-800 border px-4 py-2 rounded"
                    onClick={() => navigate(-1)}
                >
                    이전으로
                </button>

                {post.status !== '완료' ? (
                    <button
                        type="button"
                        className="bg-[#a67a3e] text-white px-4 py-2 rounded"
                        onClick={handleComplete}
                    >
                        완료 처리
                    </button>
                ) : (
                    <button
                        type="button"
                        className="bg-amber-600 text-white px-4 py-2 rounded"
                        onClick={handleReopen}
                    >
                        미완료로 되돌리기
                    </button>
                )}

                <button
                    type="button"
                    className="bg-gray-800 text-white px-4 py-2 rounded"
                    onClick={handleDelete}
                >
                    신청 삭제
                </button>
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Info label="회사명" value={post.companyName} />
                <Info label="등록일" value={post.createdAt?.substring(0, 10)} />
                <Info label="부서 / 담당자 / 직함" value={post.deptManagerTitle} />
                <Info label="연락처" value={post.phone} />
                <Info label="이메일" value={post.email} />
                <Info label="수량" value={formatCsv(post.quantity)} />
                <Info label="예산금액" value={formatCsv(post.budget)} />
                <Info label="사이즈" value={formatCsv(post.sizes)} />
                <Info label="작품 종류" value={formatCsv(post.artworkTypes)} />
                <Info label="테마" value={post.themes} />
                <Info 
                    label="분위기" 
                    value={formatCsv(post.atmostpheres || post.atmospheres)} 
                />
                <Info label="설치 장소" value={post.installPlace} />                
            </div>

            {post.etcInquiry && (
                <div className="mt-6">
                    <div className="text-sm text-gray-600 mb-1">기타 문의</div>
                    <div className="p-4 border-l-4 border-blue-400 bg-blue-50 rounded text-gray-800 whitespace-pre-line">
                        {post.etcInquiry}
                    </div>
                </div>
            )}

            {post.fileList?.length > 0 && (
                <div className="mt-8">
                    <div className="text-sm text-gray-600 mb-2">설치공간 사진</div>
                    <div className="flex flex-wrap gap-3">
                        {post.fileList.map((file) => (
                            <div key={file.oid} className="relative">
                                <a
                                    href={file.filePath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <img 
                                        src={file.filePath}
                                        alt={file.originalName || '첨부 이미지'}
                                        className="w-32 h-32 object-cover border rounded"
                                    />
                                </a>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteFile(file.oid)}
                                    className="absolute top-0 right-0 bg-black text-white text-xs px-1.5 py-0.5 rounded-bl hover:bg-red-700"
                                    title="이미지 삭제"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

export default Admin_BizConsultView;