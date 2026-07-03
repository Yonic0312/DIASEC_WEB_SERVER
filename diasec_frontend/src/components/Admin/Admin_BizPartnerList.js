import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Admin_BizPartnerList = () => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [filters, setFilters] = useState({ keyword: '', status: '전체' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        axios.get(`${API}/admin/biz-partner/list`, { withCredentials: true })
            .then((res) => { setItems(res.data); setFiltered(res.data); })
            .catch(() => {});
    }, [API]);

    useEffect(() => {
        const kw = filters.keyword.toLowerCase().trim();
        setFiltered(items.filter((item) => {
            const inKw = !kw ||
                (item.companyName || '').toLowerCase().includes(kw) ||
                (item.memberName || '').toLowerCase().includes(kw) ||
                (item.email || '').toLowerCase().includes(kw);
            const inStatus = filters.status === '전체' || item.status === filters.status;
            return inKw && inStatus;
        }));
        setCurrentPage(1);
    }, [filters, items]);

    const currentItems = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('ko-KR') : '-';

    return (
        <div className="w-full mx-20 pb-20">
            <h2 className="text-3xl text-center font-bold mb-10">업무제휴 관리</h2>

            <div className="flex gap-3 mb-4">
                <input placeholder="업체명/회원명/이메일"
                    value={filters.keyword}
                    onChange={(e) => setFilters((f) => ({ ...f, keyword:e.target.value }))} 
                    className="border p-2 rounded flex-1" />
                <select value={filters.status}
                    onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                    className="border p-2 rounded">
                    <option value="전체">전체</option>
                    <option value="대기">대기</option>
                    <option value="승인">승인</option>
                    <option value="미승인">미승인</option>
                </select>
            </div>

            <table className="w-full border-collapse border text-center text-sm">
                <thead className="bg-gray-200">
                    <tr>
                        <th className="border p-2">No</th>
                        <th className="border p-2">업체명</th>
                        <th className="border p-2">회원</th>
                        <th className="border p-2">업종</th>
                        <th className="border p-2">상태</th>
                        <th className="border p-2">신청일</th>
                    </tr>
                </thead>
                <tbody>
                    {currentItems.map((item, i) => (
                        <tr key={item.id} className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => navigate(`/admin_biz-partner/view/${item.id}`)}>
                            <td className="border p-2">{filtered.length - ((currentPage - 1) * itemsPerPage + i)}</td>
                            <td className="border p-2">{item.companyName}</td>
                            <td className="border p-2">{item.memberName}</td>
                            <td className="border p-2">{item.industry}</td>
                            <td className="border p-2">{item.status}</td>
                            <td className="border p-2">{formatDate(item.createdAt)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setCurrentPage(p)}
                        className={`w-8 h-8 rounded-full ${currentPage === p ? 'bg-black text-white' : ''}`}>
                        {p}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Admin_BizPartnerList;