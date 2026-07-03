import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Admin_BizConsultList = () => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();
    const [consults, setConsults] = useState([]);
    const [filtered, setFiltered] = useState([]);

    const [filters, setFilters] = useState({
        keyword: '',
        startDate: '',
        endDate: '',
        status: '전체',
    });

    useEffect(() => {
        axios
            .get(`${API}/admin/biz-consult/list`, { withCredentials: true })
            .then((res) => {
                setConsults(res.data);
                setFiltered(res.data);
            })
            .catch(() => {});
    }, [API]);

    const resetFilters = () => {
        setFilters({ keyword: '', startDate: '', endDate: '', status: '전체' });
    };

    const applyFilters = () => {
        const keyword = filters.keyword.toLowerCase().trim();
        const result = consults.filter((item) => {
            const inKeyword =
                !keyword || 
                (item.companyName || '').toLowerCase().includes(keyword) ||
                (item.deptManagerTitle || '').toLowerCase().includes(keyword) ||
                (item.email || '').toLowerCase().includes(keyword);
            
            const inDateRange =
                (!filters.startDate || item.createdAt >= filters.startDate) &&
                (!filters.endDate || item.createdAt <= filters.endDate + 'T23:59:59');

            const itemStatus = item.status || '미완료';
            const inStatus =
                filters.status === '전체' || itemStatus === filters.status;
            
                return inKeyword && inDateRange && inStatus;
        });
        setFiltered(result);
    };

    useEffect(() => {
        applyFilters();
    }, [filters, consults]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    const pageGroupSize = 10;

    const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
    const currentGroup = Math.floor((currentPage - 1) / pageGroupSize);
    const groupStart = currentGroup * pageGroupSize + 1;
    const groupEnd = Math.min(groupStart + pageGroupSize - 1, totalPages);

    const currentItems = filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const formatDate = (createdAt) => {
        if (!createdAt) return '-';
        return new Date(createdAt).toLocaleDateString('ko-KR', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
        })
            .replace(/\. /g, '.')
            .replace(/\.$/, '');
    };

    return (
        <div className="w-full mx-auto mt-20 px-6">
            <h2 className="text-center text-3xl font-bold mb-8">기업컨설팅 관리</h2>

            <div className="flex flex-wrap gap-3 items-center text-sm mb-4">
                <input
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                    className="border p-2"
                />
                <span>~</span>
                <input 
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                    className="border p-2"
                />
                <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="border p-2"
                >
                    <option value="전체">전체</option>
                    <option value="미완료">미완료</option>
                    <option value="완료">완료</option>
                </select>
                <input 
                    type="text"
                    placeholder="회사명 / 담당자 / 이메일 검색"
                    value={filters.keyword}
                    onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                    className="border p-2 w-64"
                />
                <button
                    type="button"
                    className="px-4 py-2 font-bold bg-blue-500 text-white"
                    onClick={resetFilters}
                >
                    초기화
                </button>
            </div>

            <table className="w-full border text-center">
                <thead>
                    <tr className="bg-gray-300">
                        <th className="border p-2 w-12">No</th>
                        <th className="border p-2">회사명</th>
                        <th className="border p-2">부서/담당자</th>
                        <th className="border p-2">이메일</th>
                        <th className="border p-2">작성일</th>
                        <th className="border p-2">상태</th>
                        <th className="border p-2">관리</th>
                    </tr>
                </thead>
                <tbody>
                    {currentItems.length === 0 ? (
                        <tr>
                            <td colSpan={7} className="border p-4 text-gray-500">
                                등록된 기업컨설팅 신청이 없습니다.
                            </td>
                        </tr>
                    ) : (
                        currentItems.map((item, i) => {
                            const rowNo = filtered.length - ((currentPage - 1) * itemsPerPage + i);
                            const goDetail = () => navigate(`/admin_biz-consult/view/${item.id}`);
                            return (
                                <tr 
                                    key={item.id} 
                                    className="hover:bg-gray-50"
                                    onClick={goDetail}
                                >
                                    <td className="border p-2">{rowNo}</td>
                                    <td className="border p-2">{item.companyName}</td>
                                    <td className="border p-2">{item.deptManagerTitle || '-'}</td>
                                    <td className="border p-2">{item.email || '-'}</td>
                                    <td className="border p-2">{formatDate(item.createdAt)}</td>
                                    <td className="border p-2">
                                        <span
                                            className={
                                                (item.status || '미완료') === '완료'
                                                    ? 'text-gray-500'
                                                    : 'text-amber-700 font-medium'
                                            }
                                        >
                                            {item.status || '미완료'}
                                        </span>
                                    </td>
                                    <td className="border p-2">
                                        <button
                                            type="button"
                                            className="text-blue-600 hover:underline"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                goDetail();
                                            }}
                                        >
                                            상세
                                        </button>
                                    </td>
                                </tr>
                            )
                        })
                    )}

                </tbody>
            </table>

            <div className="flex justify-center items-center gap-2 mt-10 mb-10 text-sm">
                <button
                    type="button"
                    onClick={() => setCurrentPage(Math.max(1, groupStart - pageGroupSize))}
                    disabled={groupStart === 1}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black"
                >
                    {'<<'}
                </button>
                <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black"
                >
                    {'<'}
                </button>
                {Array.from({ length: groupEnd - groupStart + 1 }, (_, idx) => groupStart + idx).map(
                    (page) => (
                        <button
                            key={page}
                            type="button"
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 flex items-center justify-center rounded-full ${
                                currentPage === page
                                    ? 'bg-black text-white'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            {page}
                        </button>
                    )
                )}
                <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages,prev + 1 ))}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black"
                >
                    {'>'}
                </button>
                <button
                    type="button"
                    onClick={() => setCurrentPage(Math.min(totalPages, groupStart + pageGroupSize))}
                    disabled={groupEnd === totalPages}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-black"
                >
                    {'>>'}
                </button>
            </div>
        </div>
    );
};

export default Admin_BizConsultList;