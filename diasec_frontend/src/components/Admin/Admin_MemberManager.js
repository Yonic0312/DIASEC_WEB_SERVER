import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

const Admin_MemberManager = () => {
    const API = process.env.REACT_APP_API_BASE;
    const [members, setMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [editData, setEditData] = useState({});

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        try {
            const res = await axios.get(`${API}/member/list`);
            setMembers(res.data);
        } catch (err) {
            console.error('회원 목록 불러오기 실패', err);
        }
    }

    const handleRoleChange = async (id, newRole) => {
        try {
            await axios.post(`${API}/member/change-role`, { id, role: newRole });
            fetchMembers();
        } catch (err) {
            console.error('역할 변경 실패', err);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;
        try {
            await axios.post(`${API}/member/delete`, { id });
            fetchMembers();

            toast.success("선택한 회원의 정보가 삭제되었습니다.");
        } catch (err) {
            console.error('삭제 실패', err);
        }
    };

    // 회원 정보 수정
    const handleSave = async () => {
        try {
            await axios.post(`${API}/member/update-member`, editData);
            setSelectedMember(null);
            fetchMembers();
        } catch (err) {
            console.error('수정 실패', err);
            toast.error('수정에 실패했습니다.');
        }
    };

    // 유저 검색
    const [searchKeyword, setSearchKeyword] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const membersPerPage = 10;

    // 역할별로 토글
    const [selectedRole, setSelectedRole] = useState('all');

    // 검색 필터
    const filteredMembers = members.filter(member => {
        const keywordMatch = 
            member.name?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            member.email?.toLowerCase().includes(searchKeyword.toLowerCase()) ||
            member.id?.toLowerCase().includes(searchKeyword.toLowerCase())

        const roleMatch =
            selectedRole === 'all' ||
            member.role?.toLowerCase().replace("role_", "") === selectedRole;
        
        return keywordMatch && roleMatch;
    });

    // 적립금 내역 확인
    const [selectedCreditMember, setSelectedCreditMember] = useState(null); // 멤버 선택
    const [creditHistory, setCreditHistory] = useState([]); // 기록 저장
    const [creditInput, setCreditInput] = useState(''); // 적립금 양
    const [creditDescription, setCreditDescription] = useState(''); // 설명

    const isAnyModalOpen = Boolean(selectedMember || selectedCreditMember);

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
            if (selectedMember) setSelectedMember(null);
            else if (selectedCreditMember) setSelectedCreditMember(null);
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
    }, [isAnyModalOpen, selectedMember, selectedCreditMember]);

    const fetchCreditHistory = async (id) => {
        try {
            const res = await axios.get(`${API}/credit/history/${id}`);
            setCreditHistory(res.data);
        } catch (err) {
            console.error('적립금 내역 불러오기 실패', err);
            setCreditHistory([]);
        }
    }

    // 적립/회수/삭제 처리
    const handleCreditChange = async (type) => {
        if (!creditInput || !creditDescription) {
            toast.error('금액과 설명을 입력하세요.');
            return;
        }

        try {
            await axios.post(`${API}/credit/manual`, {
                id: selectedCreditMember.id,
                amount: Number(creditInput),
                type,
                description: creditDescription
            });
            await fetchCreditHistory(selectedCreditMember.id);
            await fetchMembers();
            
            setCreditInput('');
            setCreditDescription('');
            toast.success('작업을 완료했습니다.');
        } catch (err) {
            toast.error('처리 실패');
        }
    };

    const handleDeleteCredit = async (cid) => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;
        try {
            await axios.delete(`${API}/credit/delete/${cid}`);
            fetchCreditHistory(selectedCreditMember.id);
            toast.success('삭제 성공했습니다.');
        } catch (err) {
            toast.error('삭제 실패');
        }
    }

    // 페이징
    const totalPages = Math.max(1, Math.ceil(filteredMembers.length / membersPerPage));
    
    // 그룹 단위 페이지 네이션
    const pageGroupSize = 10;
    const currentGroup = Math.floor((currentPage - 1) / pageGroupSize);
    const groupStart = currentGroup * pageGroupSize + 1;
    const groupEnd = Math.min(groupStart + pageGroupSize - 1, totalPages);


    const currentMembers = filteredMembers.slice(
        (currentPage - 1) * membersPerPage,
        currentPage * membersPerPage
    );

    return(
        <div className="w-full p-6 bg-white">
            <h2 className="text-2xl font-bold mb-6 border-b pb-2">회원 목록</h2>

            {/* 검색 입력창 */}
            <div className="flex gap-2 items-center mb-6">
                <select
                    value={selectedRole}
                    onChange={(e) => {
                        setSelectedRole(e.target.value);
                        setCurrentPage(1);
                    }}
                    className='border px-3 py-2 text-sm rounded'
                >
                    <option value="all">전체</option>
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                </select>
                <input
                    type="text"
                    placeholder="아이디, 이름 또는 이메일 검색"
                    className="border px-4 py-2 w-80 text-sm rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={searchKeyword}
                    onChange={(e) => {
                        setSearchKeyword(e.target.value);
                        setCurrentPage(1);
                    }}
                />
            </div>

            <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="border p-2">아이디</th>
                        <th className="border p-2">이름</th>
                        <th className="border p-2">이메일</th>
                        <th className="border p-2">가입일</th>
                        <th className="border p-2">번호</th>
                        <th className="border p-2">역할</th>
                        <th className="border p-2">적립금</th>
                        <th className="border p-2">관리</th>
                    </tr>
                </thead>
                <tbody>
                    {currentMembers.map(member => (
                        <tr key={member.id}
                            onClick={() => {
                                setSelectedMember(member);
                                setEditData({ ...member });
                            }}>
                            <td className="border p-2 text-center">{member.id}</td>
                            <td className="border p-2 text-center">{member.name}</td>
                            <td className="border p-2 text-center">{member.email}</td>
                            <td className="border p-2 text-center">{member.createdAt?.slice(0, 10)}</td>
                            <td className="border p-2 text-center">{member.phone ? member.phone : '-'}</td>
                            <td className="border p-2 text-center">
                                <select
                                    value={member.role?.toLowerCase().replace("role_", "") || "user"}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={e => handleRoleChange(member.id, e.target.value)}
                                    className="border p-1"
                                >
                                    <option value="user">user</option>
                                    <option value="admin">admin</option>
                                </select>
                            </td>
                            <td className="border p-2 text-center">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedCreditMember(member);
                                        fetchCreditHistory(member.id);
                                    }}
                                    className="text-blue-600 underline"
                                >
                                    적립금 확인
                                </button>
                            </td>
                            <td className="border p-2 text-center">
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDelete(member.id)
                                    }}
                                    className="text-red-600"
                                >
                                    삭제
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

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



            {/* 멤버 정보 수정창 모달 */}
            {selectedMember && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[10000] overscroll-none"
                    onTouchMove={(e) => {
                        if (e.target === e.currentTarget) e.preventDefault();
                    }}
                >
                    <div className="bg-white p-6 rounded w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4">회원 정보 수정</h3>

                        <input 
                            value={editData.name || ''}
                            onChange={e => setEditData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="이름"
                            className="border w-full p-2 mb-2"
                        />

                        <input
                            value={editData.email || ''}
                            onChange={e => setEditData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="이메일"
                            className="border w-full p-2 mb-2"
                        />

                        <select
                            value={editData.role?.toLowerCase().replace('role_', '') || 'user'}
                            onChange={e => setEditData(prev => ({ ...prev, role: e.target.value }))}
                            className="border w-full p-2 mb-2"
                        >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                        </select>

                        <input
                            type="text"
                            placeholder="임시 비밀번호 (pwd 초기화 시에 만 입력)"
                            value={editData.tempPassword || ''}
                            onChange={e => setEditData(prev => ({ ...prev, tempPassword: e.target.value }))}
                            className="border w-full p-2 mb-2"
                        />
                        <div className="flex justify-between">
                            <button
                                className="bg-orange-500 text-white px-4 py-2 rounded"
                                onClick={async () => {
                                    try {
                                        await axios.post(`${API}/member/reset-password`, {
                                            id: editData.id,
                                            tempPassword: editData.tempPassword,
                                        });
                                        toast.success('비밀번호 초기화 완료!');
                                    } catch (err) {
                                        toast.error('초기화 실패');
                                    }
                                }}
                            >
                                비밀번호 초기화
                            </button>

                            <div className='flex justify-end mb-2 gap-2'>
                                <button className="bg-gray-300 px-4 rounded" onClick={() => setSelectedMember(null)}>닫기</button>
                                <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={handleSave}>저장</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 크레딧 모달창 */}
            {selectedCreditMember && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[10000] overscroll-none"
                    onClick={() => setSelectedCreditMember(null)}
                    onTouchMove={(e) => {
                        if (e.target === e.currentTarget) e.preventDefault();
                    }}
                >
                    <div className="bg-white p-6 rounded w-full h-1/2 max-w-2xl overflow-y-scroll" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4">{selectedCreditMember.name}님의 적립금 관리</h3>

                        <div className="mb-4 text-sm">
                            현재 보유 적립금: <strong>{creditHistory[0]?.credit?.toLocaleString()}원</strong>
                        </div>

                        <table className="w-full text-xs border mb-4">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="p-2 border">날짜</th>
                                    <th className="p-2 border">유형</th>
                                    <th className="p-2 border">금액</th>
                                    <th className="p-2 border">설명</th>
                                    <th className="p-2 border">삭제</th>
                                </tr>
                            </thead>
                            <tbody>
                                {creditHistory.map(item => (
                                    <tr key={item.cid} className="text-center">
                                        <td className="p-2 border">{new Date(item.createdAt).toLocaleDateString()}</td>
                                        <td className="p-2 border">{item.type}</td>
                                        <td className={`p-2 border font-semibold ${item.type === '사용' ? 'text-red-500' : 'text-green-600'}`}>
                                            {item.type === '사용' ? '-' : '+'}{item.amount.toLocaleString()}원
                                        </td>
                                        <td className="p-2 border">{item.description}</td>
                                        <td className="p-2 border">
                                            <button onClick={() => handleDeleteCredit(item.cid)} className="text-red-500 text-xs">
                                                삭제
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="flex gap-2 mb-4">
                            <input 
                                type="number"
                                placeholder="금액"
                                value={creditInput}
                                onChange={(e) => setCreditInput(e.target.value)}
                                className="border p-2 w-[100px]"
                            />
                            <input 
                                type="text"
                                placeholder="설명"
                                value={creditDescription}
                                onChange={(e) => setCreditDescription(e.target.value)}
                                className="border p-2 grow"
                            />
                            <button
                                onClick={() => handleCreditChange('적립')}
                                className="bg-green-600 text-white px-3 py-2 rounded">지급</button>

                            <button
                                onClick={() => handleCreditChange('사용')}
                                className="bg-red-600 text-white px-3 py-2 rounded">회수</button>
                        </div>

                        <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => setSelectedCreditMember(null)}>닫기</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Admin_MemberManager;