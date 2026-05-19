import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const AddrModify = () => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();
    const { cno } = useParams();
    const [phone1, setPhone1] = useState('010');
    const [phone2, setPhone2] = useState('');
    const [phone3, setPhone3] = useState('');

    const [form, setForm] = useState({
        label: '',
        recipient: '',
        phone: '',
        postcode: '',
        address: '',
        detailAddress: '',
        isDefault: false,
    });

    useEffect(() => {
        axios.get(`${API}/address/one/${cno}`, { withCredentials: true })
            .then((res) => {
                const data = res.data;
                setForm(res.data);

                // phone 분리
                if (data.phone) {
                    const [p1, p2, p3] = data.phone.split('-');
                    setPhone1(p1 || '010');
                    setPhone2(p2 || '');
                    setPhone3(p3 || '');
                }
            })
            .catch((err) => console.error('배송지 불러오기 실패:', err));
    }, [cno]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    // daum 주소 api
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const detailInputRef = useRef(null);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = "//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
        script.async = true;
        script.onload = () => setScriptLoaded(true);
        document.body.appendChild(script);

        return () => {
            document.body.removeChild(script);
        };
    }, []);

    const openPostcodePopup = () => {
        if (!scriptLoaded || !window.daum?.Postcode) {
            toast.error("주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        new window.daum.Postcode({
            oncomplete: (data) => {
                setForm(prev => ({
                    ...prev,
                    postcode: data.zonecode,
                    address: data.roadAddress || data.jibunAddress,
                }));

                // 상세주소 입력창에 자동 포커싱
                setTimeout(() => {
                    detailInputRef.current?.focus();
                }, 100);
            }
        }).open();
    }

    const handleSubmit = async () => {
        try {
            const finalForm = {
                ...form,
                phone: `${phone1}-${phone2}-${phone3}`,
            };

            await axios.post(`${API}/address/update`, finalForm, {withCredentials: true});
            toast.success('수정 완료');
            navigate('/addrList', { replace: true});
        } catch (err) {
            console.error('수정 실패:', err);
            toast.error('수정 실패');
        }
    };

    return (
        <div className="flex flex-col w-full">
            <div className="flex flex-col w-full">
                <span 
                    className="
                        md:text-xl text-[clamp(14px,2.607vw,20px)]
                        font-bold pb-6">| 배송 주소록 수정</span>
            </div>

            <div className="w-full mx-auto mb-10">
                <hr/>
                <div className="flex flex-row items-center mt-3 ml-3 mb-3">
                    <div className="
                        md:w-[150px] w-[clamp(60px,23.4vw,150px)]
                        md:text-sm text-[clamp(10px,2.19vw,14px)]">
                        배송지명 <span className="font-bold text-red-500">*</span>
                    </div>
                    <input name="label" value={form.label || ''} onChange={handleChange} 
                        className="
                        md:text-sm text-[clamp(10px,2.19vw,14px)]
                        md:w-[145px] w-[134px]
                        flex border-[1px] h-8 pl-2" />
                </div>
                <hr/>
                <div className="flex flex-row items-center mt-3 ml-3 mb-3">
                    <div 
                        className="
                            md:w-[150px] w-[clamp(60px,23.4vw,150px)]
                            md:text-sm text-[clamp(10px,2.19vw,14px)]">
                        성명 <span className="font-bold text-red-500">*</span>
                    </div>
                    <input name="recipient" value={form.recipient || ''} onChange={handleChange} 
                        className="
                        md:text-sm text-[clamp(10px,2.19vw,14px)]
                        md:w-[145px] w-[134px]
                        flex border-[1px] h-8 pl-2" />
                </div>
                <hr/>
                <div className="flex flex-row items-center mt-3 ml-3 mb-3">
                    <div className="
                            md:w-[150px] w-[clamp(60px,23.4vw,150px)] 
                            md:text-sm text-[clamp(10px,2.19vw,14px)]">
                        주소 <span className="font-bold text-red-500">*</span>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex">
                            <input name="postcode" readOnly value={form.postcode || ''} onChange={handleChange} placeholder="우편번호" 
                                className="
                                    md:text-base text-[clamp(11px,2.085vw,16px)]
                                    md:w-[191px] w-[clamp(70px,30.03vw,191px)]
                                    flex border-[1px] h-8 sm:pl-2 pl-[4px]" />
                            <button type="button" onClick={openPostcodePopup} 
                                className="
                                    h-8
                                    md:text-sm text-[clamp(11px,1.8252vw,14px)]
                                    bg-black text-white px-4 sm:ml-3 ml-[8px]">주소검색</button>
                        </div>
                        <input name="address" readOnly value={form.address || ''} onChange={handleChange} placeholder="기본주소" 
                            className="
                                md:text-base text-[clamp(11px,2.085vw,16px)]
                                md:w-[340px] w-[clamp(145px,53.2vw,340px)]
                                flex border-[1px] h-8 sm:pl-2 pl-[2px]" />
                        <input name="detailAddress" value={form.detailAddress || ''} onChange={handleChange} placeholder="나머지 주소(선택 입력 가능)" ref={detailInputRef} 
                            className="
                                md:text-base text-[clamp(11px,2.085vw,16px)]
                                md:w-[340px] w-[clamp(145px,53.2vw,340px)]
                                flex border-[1px] h-8 sm:pl-2 pl-[2px]" />
                    </div>
                </div>
                <hr/>
                <div className="flex flex-row items-center mt-3 ml-3 mb-3">
                    <div className="
                            md:w-[150px] w-[clamp(60px,23.4vw,150px)]
                            md:text-sm text-[clamp(10px,2.19vw,14px)]">
                        휴대전화 <span className="font-bold text-red-500">*</span>
                    </div>
                    <select value={phone1} onChange={(e) => setPhone1(e.target.value)} 
                        className="
                            md:text-base text-[clamp(11px,2.08vw,16px)]
                            md:w-[70px] w-[clamp(43px,10.9vw,70px)] h-8 border border-gray-300 sm:pl-2">
                            <option>010</option>
                            <option>011</option>
                            <option>016</option>
                            <option>017</option>
                            <option>018</option>
                            <option>019</option>
                    </select>
                    <span className="mx-[2px]">-</span>
                    <input type="text" value={phone2 || ''} onChange={(e) => setPhone2(e.target.value)} maxLength="4" inputMode="numeric" 
                        className="
                            md:w-[60px] w-[clamp(40.5px,9.34vw,60px)] 
                            h-8 border border-gray-300 text-center
                            md:text-base text-[clamp(11px,2.08vw,16px)]
                        "/>
                    <span className="mx-[2px]">-</span>
                    <input type="text" value={phone3 || ''} onChange={(e) => setPhone3(e.target.value)} maxLength="4" inputMode="numeric" 
                        className="
                            md:w-[60px] w-[clamp(40.5px,9.34vw,60px)] 
                            h-8 border border-gray-300 text-center
                            md:text-base text-[clamp(11px,2.08vw,16px)]
                            "/>
                </div>
                <hr/>
                <div className="flex flex-row items-center mt-3 ml-3 mb-3 text-sm gap-2">
                    <input type="checkbox" name="isDefault" checked={form.isDefault} onChange={handleChange} 
                        className="border-[1px] md:h-7 h-[clamp(16px,4.14vw,28px)]" />
                    <span className="md:text-sm text-[clamp(9px,1.825vw,14px)]">기본 배송지로 저장</span>
                </div>
                <hr/>
                <div className="flex justify-center gap-2 mt-4 mx-auto">
                    <button 
                        className="
                            md:text-sm text-[clamp(9px,1.825vw,14px)] 
                            md:px-8 px-[clamp(1rem,4.17vw,2rem)]
                            flex sm:py-3 py-2 rounded-[4px] border-[1px] border-black" 
                        onClick={() => navigate('/addrList')}> 취소 </button>
                    <button 
                        className="
                            md:text-sm text-[clamp(9px,1.825vw,14px)]
                            md:px-8 px-[clamp(1rem,4.17vw,2rem)]
                            flex text-white bg-black sm:py-3 py-2 rounded-[4px] border-[1px] border-black"
                        onClick={handleSubmit}> 수정 </button>
                </div>
            </div>
        </div>
    )
}

export default AddrModify;