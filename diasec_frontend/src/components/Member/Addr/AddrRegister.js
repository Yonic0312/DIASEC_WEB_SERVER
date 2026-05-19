import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MemberContext } from '../../../context/MemberContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const AddrRegister = () => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();
    const { member, setMember } = useContext(MemberContext);

    const [label, setLabel] = useState('');
    const [recipient, setRecipient] = useState('');
    const [postcode, setPostcode] = useState('');
    const [address, setAddress] = useState('');
    const [detailAddress, setDetailAddress] = useState('');
    const [phone1, setPhone1] = useState('010');
    const [phone2, setPhone2] = useState('');
    const [phone3, setPhone3] = useState('');
    const [isDefault, setIsDefault] = useState(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);

    const detailInputRef = useRef(null); // 상세주소로 포커스 이동용

    // Daum 우편번호 스크립트 로딩
    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
        script.async = true;
        script.onload = () => setScriptLoaded(true);
        document.body.appendChild(script);
        
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const openPostcodePopup = () => {
        if (!scriptLoaded || !window.daum?.Postcode) {
            toast.error('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
            return;
        }

        new window.daum.Postcode({
            oncomplete: function (data) {
                setPostcode(data.zonecode);
                setAddress(data.roadAddress || data.jibunAddress);

                // ✅ 상세주소 입력창으로 자동 포커스
                setTimeout(() => {
                    detailInputRef.current?.focus();
                }, 100);
            }
        }).open();
    };

    const handleRegister = async () => {
        if (!label || !recipient || !postcode || !address || !phone2 || !phone3) {
            toast.error('필수 입력값을 모두 작성해주세요.');
            return;
        }

        try {
            const formData = {
                id:member.id, label, recipient, postcode, address, detailAddress, phone: `${phone1}-${phone2}-${phone3}`, isDefault
            };

            await axios.post(`${API}/address/add`, formData, {
                withCredentials: true,
            });

            toast.success('배송지가 등록되었습니다.');
            navigate('/addrList');
        } catch (err) {
            console.error(err);
            toast.error('배송지 등록에 실패했습니다.');
        }
    };

    return (
        <div className="flex flex-col w-full">
            <div className="flex flex-col w-full">
                <span 
                    className="
                        sm:text-xl text-[14px]
                        font-bold pb-6">| 배송 주소록 등록</span>
            </div>

            <div className="w-full mx-auto mb-10">
                <hr/>
                <div className="
                    flex md:flex-row flex-col md:items-center items-start
                    mt-3 mx-3 mb-3">
                    <div 
                        className="
                            min-w-[150px] sm:text-sm text-[10px]">
                        배송지명 <span className="font-bold text-red-500">*</span>
                    </div>
                    <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} 
                        className="
                        sm:text-base text-[11px]
                        md:w-[134px] w-full
                        flex border-[1px] h-8 pl-2" />
                </div>
                <hr/>
                <div className="
                    flex md:flex-row flex-col md:items-center items-start 
                    mt-3 mx-3 mb-3">
                    <div className="min-w-[150px] sm:text-sm text-[10px]">
                        성명 <span className="font-bold text-red-500">*</span>
                    </div>
                    <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} 
                        className="
                        sm:text-base text-[11px]
                        md:w-[134px] w-full
                        flex border-[1px] h-8 pl-2" />
                </div>
                <hr/>
                <div className="
                    flex md:flex-row flex-col md:items-center items-start
                    mt-3 mx-3 mb-3">
                    <div className="md:w-[150px] w-[60px] sm:text-sm text-[10px]">
                        주소 <span className="font-bold text-red-500">*</span>
                    </div>
                    <div className="flex flex-col md:w-auto w-full gap-2">
                        <div className="flex w-full">
                            <input type="text" value={postcode}  onChange={(e) => setPostcode(e.target.value)} placeholder="우편번호" readOnly 
                                className="
                                    sm:text-base text-[9.5px]
                                    md:w-[191px] w-1/2
                                    flex border-[1px] h-8 sm:pl-2 pl-[4px]" />
                            <button type="button" onClick={openPostcodePopup} 
                                className="
                                    min-w-[70px] h-8
                                    md:text-sm text-[9px]
                                    bg-black text-white px-4 sm:ml-3 ml-[8px]">주소검색</button>
                        </div>
                        <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="기본주소" readOnly 
                            className="
                                sm:text-base text-[9.5px]
                                md:w-[340px] w-full
                                flex border-[1px] h-8 sm:pl-2 pl-[2px]" />
                        <input type="text" value={detailAddress} onChange={(e) => setDetailAddress(e.target.value)} placeholder="나머지 주소(선택 입력 가능)" 
                            className="
                                sm:text-base text-[9.5px]
                                md:w-[340px] w-full
                                flex border-[1px] h-8 sm:pl-2 pl-[2px]" />
                    </div>
                </div>
                <hr/>
                <div className="
                    flex md:flex-row flex-col md:items-center items-start
                    mt-3 mx-3 mb-3">
                    <div className="sm:w-[150px] w-[60px] sm:text-sm text-[10px]">
                        휴대전화 <span className="font-bold text-red-500">*</span>
                    </div>
                    <div className="flex gap-1 w-full">
                        <select value={phone1} onChange={(e) => setPhone1(e.target.value)} 
                            className="md:w-[70px] w-1/3 sm:text-base text-[11px] h-8 border border-gray-300 sm:pl-2">
                                <option>010</option>
                                <option>011</option>
                                <option>016</option>
                                <option>017</option>
                                <option>018</option>
                                <option>019</option>
                        </select>
                        <input type="text" value={phone2} onChange={(e) => setPhone2(e.target.value)} maxLength="4" inputMode="numeric" 
                            className="md:w-[60px] w-1/3 h-8 sm:text-base text-[11px] border border-gray-300 text-center"/>
                        <input type="text" value={phone3} onChange={(e) => setPhone3(e.target.value)} maxLength="4" inputMode="numeric" 
                            className="md:w-[60px] w-1/3 h-8 sm:text-base text-[11px] border border-gray-300 text-center"/>
                    </div>
                </div>
                <hr/>
                <div className="flex flex-row items-center mt-3 mx-3 mb-3 text-sm gap-2">
                    <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} 
                        className="border-[1px] sm:h-7 h-4" />
                    <span className="sm:text-sm text-[11px]">기본 배송지로 저장</span>
                </div>
                <hr/>
                <div className="flex justify-center gap-2 mt-4 mx-auto">
                    <button 
                        className="sm:text-sm text-[11px]
                                    flex sm:px-8 px-4 sm:py-3 py-2 rounded-[4px] border-[1px] border-black" 
                        onClick={() => navigate('/addrList')}> 취소 </button>
                    <button 
                        onClick={handleRegister} 
                        className="sm:text-sm text-[11px]
                                    flex text-white bg-black sm:px-8 px-4 sm:py-3 py-2 rounded-[4px] border-[1px] border-black"> 등록 </button>
                </div>
            </div>
        </div>
    )
}

export default AddrRegister;