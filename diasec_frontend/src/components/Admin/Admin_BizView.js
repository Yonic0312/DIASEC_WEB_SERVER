import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const Info = ({ label, value }) => (
  <div>
    <div className="text-sm text-gray-600">{label}</div>
    <div className="text-gray-900 font-medium">{value}</div>
  </div>
);

const Admin_BizView = () => {
  const API = process.env.REACT_APP_API_BASE;
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [reply, setReply] = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    axios.get(`${API}/biz/view/${id}`)
      .then((res) => {
        setPost(res.data);
        if (res.data.reply) {
          setReply(res.data.reply.content);
          setEditing(true);
        }
      })
      .catch(() => toast.error('글 정보를 불러올 수 없습니다.'));
  }, [id]);

  const handleDelete = () => {
    if (window.confirm('정말 삭제하시겠습니까?')) {
      axios.post(`${API}/biz/delete`, { id })
        .then(() => {
          toast.success('삭제 완료');
          navigate('/admin_BizList');
        });
    }
  };

  const handleReply = () => {
    if (!reply.trim()) return toast.error('내용을 입력해주세요');
    const url = editing ? 'update-reply' : 'insert-reply';
    axios.post(`${API}/biz/${url}`, { id: id, content: reply })
      .then(() => toast.success('저장 완료'));
  };

  const handleDeleteReply = () => {
    if (window.confirm('답변을 삭제하시겠습니까?')) {
      axios.post(`${API}/biz/delete-reply`, { bizId: id })
        .then(() => {
          toast.success('삭제 완료');
          setReply('');
          setEditing(false);
        });
    }
  };

  if (!post) return <div className="p-10 text-center">불러오는 중...</div>;

  return (
    <div className="w-full mx-20">
      <h2 className="text-3xl text-center font-bold mb-10">기업주문 상세보기</h2>

      <hr />

      <div className="flex justify-end gap-3 mt-5">
        <div>
          <button className="bg-white text-gray-800 border-[1px] px-4 py-2 rounded" onClick={() => navigate(-1)}>
            이전으로
          </button>
        </div>
        <div>
          <button className="bg-gray-800 text-white px-4 py-2 rounded" onClick={handleDelete}>
            글 삭제
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-6 mt-10 mb-10">
        <Info label="제목" value={post.title} />
        <Info label="회사명" value={post.companyName} />
        <Info label="담당자 이름" value={post.managerName} />
        <Info label="연락처" value={post.phone} />
        <Info label="이메일" value={post.email} />
        <Info label="사업자등록번호" value={post.businessNumber || '없음'} />
        <Info label="견적서 요청" value={post.requestEstimate ? '예' : '아니오'} />
        <Info label="비밀글 여부" value={post.isSecret ? '비공개' : '공개'} />
        <Info label="희망 납기일" value={post.dueDate || '미지정'} />
      </div>

      <div className="border rounded p-4 mb-6">
        <h3 className="font-bold mb-2">주소</h3>
        <div>[{post.postcode}] <br/> {post.address} <br/> {post.detailAddress}</div>
      </div>

      {post.message && (
        <div className="border rounded p-4 mb-6 bg-gray-50">
          <h3 className="font-bold mb-2">요청사항</h3>
          <div className="whitespace-pre-line">{post.message}</div>
        </div>
      )}

      {post.files?.length > 0 && (
        <div className="border rounded p-4 mb-6">
          <h3 className="font-bold mb-2">첨부 이미지</h3>
          <div className="flex flex-wrap gap-4">
            {post.files.map((file, idx) => (
              <img key={idx} src={file.fileUrl} alt={file.originalName}
                className="w-40 h-40 object-cover border rounded" />
            ))}
          </div>
        </div>
      )}

      <div className="border rounded p-4 mb-8">
        <h3 className="font-bold mb-2">관리자 답변</h3>
        <textarea
          className="w-full h-40 border rounded p-3"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="답변을 입력해주세요"
        />
        <div className="flex justify-end gap-2 mt-2">
          <button className={`${editing ? 'bg-yellow-500' : 'bg-blue-600'} text-white px-4 py-2 rounded`} onClick={handleReply}>
            {editing ? '답변 수정' : '답변 등록'}
          </button>
          {editing && (
            <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={handleDeleteReply}>
              답변 삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin_BizView;
