import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const Info = ({ label, value }) => (
    <div>
        <div className="text-sm text-gray-600">{label}</div>
        <div className="font-medium whitespace-pre-line">{value || '-'}</div>
    </div>
);

const DEFAULT_APPROVE = '업무제휴가 승인되었습니다. 신청 시 동의하신 계약 내용에 따라 업무가 진행됩니다.'
const DEFAULT_REJECT = 
    '제휴 신청에 감사드립니다.\n' +
    '내부 검토 결과,\n' +
    '현재 협업 방향성과 부합하지 않아 이번 제휴는 진행이 어렵습니다.\n' +
    '향후 여건이 맞는 경우 다시 협의할 수 있기를 바랍니다.';

const Admin_BizPartnerView = () => {
    const API = process.env.REACT_APP_API_BASE;
    const { id } = useParams();
    const navigate = useNavigate();
    const [post, setPost] = useState(null);
    const [reply, setReply] = useState('');

    useEffect(() => {
        axios.get(`${API}/admin/biz-partner/view/${id}`, { withCredentials: true })
            .then((res) => {
                setPost(res.data);
                setReply(res.data.adminReply || '');
            })
            .catch(() => toast.error('불러오기 실패'));
    }, [API, id]);

    const handleApprove = () => {
        if (!window.confirm('승인 처리하시겠습니까?')) return;
        axios.post(`${API}/admin/biz-partner/approve`,
            { id: Number(id), adminReply: reply || DEFAULT_APPROVE },
            { withCredentials: true })
            .then(() => { toast.success('승인 완료'); navigate('/admin_BizPartnerList'); })
            .catch(() => toast.error('승인 실패'));
    };

    const handleReject = () => {
        if (!window.confirm('미승인 처리하시겠습니까?')) return;
        axios.post(`${API}/admin/biz-partner/reject`,
            { id: Number(id), adminReply: reply || DEFAULT_REJECT },
            { withCredentials: true })
            .then(() => { toast.success('미승인 처리 완료'); navigate('/admin_BizPartnerList'); })
            .catch(() => toast.error('처리 실패'));  
    };

    if (!post) return <div className="p-10 text-center">불러오는 중...</div>

    return (
        <div className="w-full mx-20 pb-20">
            <h2 className="text-3xl text-center font-bold mb-10">업무제휴 상세</h2>
            <hr />

            <div className="flex justify-end gap-3 mt-5">
                <button onClick={() => navigate(-1)} className="border px-4 py-2 rounded">이전</button>
                {post.status === '대기' && (
                    <>
                        <button onClick={handleApprove} className="bg-[#a67a3e] text-white px-4 py-2 rounded">승인</button>
                        <button onClick={handleReject} className="bg-gray-700 text-white px-4 py-2 rounded">미승인</button>
                    </>
                )}
            </div>

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Info label="업체명" value={post.companyName} />
                <Info label="회원 ID" value={post.memberId} />
                <Info label="회원명" value={post.memberName} />
                <Info label="담당자/직책" value={post.managerNameTitle} />
                <Info label="연락처" value={post.phone} />
                <Info label="이메일" value={post.email} />
                <Info label="업종" value={post.industry} />
                <Info label="상태" value={post.status} />
                <Info label="신청일" value={post.createdAt?.substring(0, 10)} />
                <Info label="누적 거래금액" value={`${Number(post.cumulativeAmount || 0).toLocaleString()}원`} />
                <Info label="예상 등급" value={post.partnerGrade} />
                <Info label="예상 할인율" value={`${post.discountPercent || 0}%`} />
            </div>

            {post.etcRequest && (
                <div className="mt-6">
                    <div className="text-sm text-gray-600 mb-1">기타 요청</div>
                    <div className="p-4 bg-gray-50 border rounded whitespace-pre-line">{post.etcRequest}</div>
                </div>
            )}

            <div className="mt-6">
                <label className="text-sm text-gray-600">답변 내용 (승인/미승인 시 전달)</label>
                <textarea value={reply} onChange={(e) => setReply(e.target.value)}
                    rows={6} className="w-full border p-3 rounded mt-1" />
            </div>
        </div>
    );
};

export default Admin_BizPartnerView;