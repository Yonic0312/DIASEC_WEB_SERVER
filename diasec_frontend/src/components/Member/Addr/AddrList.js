import { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom'
import axios from 'axios';
import { MemberContext } from '../../../context/MemberContext';
import { toast } from 'react-toastify';

const AddrList = () => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();
    const { member } = useContext(MemberContext);
    const [addresses, setAddresses] = useState([]); // 서버에서 리스트 저장 배열
    const [selectedCnos, setSelectedCnos] = useState([]); // 사용자가 체크박스를 체크한 목록
    const isAllChecked = addresses.length > 0 && selectedCnos.length === addresses.length;

    useEffect(() => {
        if (!member?.id) return;

        const fetchAddresses = async () => {
            try {
                const res = await axios.get(`${API}/address/${member.id}`, { 
                    withCredentials: true,
                });
                setAddresses(res.data);
            } catch (err) {
                console.error('배송지 불러오기 실패:', err);
            }
        };
        fetchAddresses();
    }, [member]);

    // 체크박스 핸들러 추가 (selectedCnos에 추가/삭제)
    const handleCheckboxChange = (cno) => {
        setSelectedCnos(prev => {
            if (prev.includes(cno)) {
                return prev.filter(id => id !== cno); // cno번만 남기기
            } else {
                return [...prev, cno];
            }
        });
    };

    // 체크박스 전체 클릭
    const handleAllCheck = () => {
        if (isAllChecked) {
            // 전체 해제
            setSelectedCnos([]);
        } else {
            // 전체 선택
            setSelectedCnos(addresses.map(addr => addr.cno));
        }
    }

    const handleDeleteSelected = async () => {
        if (selectedCnos.length === 0) {
            toast.error("삭제할 주소를 선택해주세요.");
            return;
        }

        if (!window.confirm(`${selectedCnos.length}개 주소를 삭제하시겠습니까?`)) return;

        try {
            await Promise.all(
                selectedCnos.map(cno => 
                    axios.delete(`${API}/address/${cno}`, { withCredentials: true })
                )
            );
            // 삭제 완료 후 리스트 갱신
            setAddresses(prev => prev.filter(addr => !selectedCnos.includes(addr.cno)));
            setSelectedCnos([]); // 선택 초기화
            toast.success('삭제가 완료되었습니다.');
        } catch (err) {
            console.error('삭제 실패:', err);
            toast.error('삭제에 실패했습니다.');
        }
    }

    return (
        <div className="flex flex-col w-full max-w-[1100px] mb-20 
            mr-2 ml-2 md:ml-0"
        >
            <div className="flex items-center justify-between">
                <span className="
                    md:text-xl text-[clamp(14px,2.607vw,20px)]
                    font-bold pb-6">| 배달 주소록 관리
                </span>

                <button
                    type="button"
                    onClick={() => navigate('/mypage')}
                    className="
                        md:hidden
                        self-start flex items-center gap-1 mb-3
                        text-[13px] text-gray-600 hover:text-gray-900
                    "
                >
                    <span className="text-base leading-none">←</span>
                    마이페이지
                </button>
            </div>

            <div className="flex items-center justify-between bg-gray-50 border rounded-lg px-4 py-3 mb-3">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                    <input 
                        type="checkbox"
                        checked={isAllChecked}
                        className="w-4 h-4"
                    />
                    전체 선택
                </label>
                <span className="text-sm text-gray-500">총 {addresses.length}개</span>
            </div>
            
            {addresses.length === 0 ? (
                <div className="text-center text-gray-500 py-10">
                    등록된 배송지가 없습니다.
                </div>
            ) : (
                addresses.map((addr) => (
                    <div 
                        key={addr.cno}
                        onClick={() => navigate(`/addrModify/${addr.cno}`)}
                        className="border rounded-xl bg-white p-4 mb-3 shadow-sm cursor-pointer hover:bg-gray-50"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-[15px] font-semibold text-gray-800 truncate">{addr.label}</span>
                                    {addr.isDefault === true && (
                                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">
                                            기본
                                        </span>
                                    )}
                                </div>
                                <div className="mt-1 text-[13px] text-gray-600">
                                    {addr.recipient} · {addr.phone}
                                </div>
                            </div>
                            <input 
                                type="checkbox"
                                onClick={(e) => e.stopPropagation()}
                                checked={selectedCnos.includes(addr.cno)}
                                onChange={() => handleCheckboxChange(addr.cno)}
                                className="
                                    w-5 h-5 
                                    mt-1"
                            />
                        </div>

                        <div className="mt-3 text-[13px] text-gray-700 break-words">
                            ({addr.postcode}) {addr.address} {addr.detailAddress}
                        </div>
                    </div>
                ))
            )}

            <div 
                className="
                    text-[12px]
                    flex items-center justify-center mt-5 gap-4">
                <button 
                    className="
                        flex sm:px-3 sm:py-2 px-2 py-2
                        rounded-[4px] border-[1px] border-black" onClick={handleDeleteSelected}> 선택 주소록 삭제 </button>
                <button 
                    className="
                        flex sm:px-3 sm:py-2 px-2 py-2 text-white bg-black
                        rounded-[4px] border-[1px] border-black" onClick={() => navigate('/addrRegister')}> 배송지등록 </button>
            </div>
        </div>
    );
};

export default AddrList;