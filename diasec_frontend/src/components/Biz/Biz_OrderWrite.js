import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'
import axios from 'axios';
import { toast } from 'react-toastify';

const Biz_OrderWrite = () => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();
    const [form, setForm] = useState({
        title: '',
        companyName: '',
        managerName: '',
        phone: '',
        email: '',
        size: '',
        message: '',
        password: '',
        isSecret: true,
        requestEstimate: false,
    });

    const [files, setFiles] = useState([]);
    // 상세주소 검색
    const [scriptLoaded, setScriptLoaded] = useState(false); 
    const detailInputRef = useRef(null); // 상세주소로 포커스 이동용
    // 주소
    const [postcode, setPostcode] = useState('');
    const [address, setAddress] = useState('');
    const [detailAddress, setDetailAddress] = useState('');

    // 사이즈
    const sizePriceMap = {
        "11 X 14": 45000, "12 X 17": 52000, "16 X 16": 60000, "16 X 20": 68000,
        "16 X 24": 72000, "20 X 20": 76000, "20 X 24": 90000, "24 X 24": 110000,
        "20 X 30": 130000, "24 X 32": 160000, "24 X 40": 185000, "30 X 40": 210000,
        "28 X 47": 240000, "40 X 40": 280000, "40 X 47": 320000, "40 X 71": 450000,
        "40 X 79": 520000,
    }

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

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleFileChange = (e) => {
        const selected = Array.from(e.target.files);
        if (selected.length > 5) {
            toast.warn("최대 5개 파일까지만 업로드할 수 있습니다.");
            return;
        }

        const valid = selected.filter(file => ['image/jpeg', 'image/png'].includes(file.type));
        if (valid.length !== selected.length) {
            toast.error("jpg 또는 png 파일만 업로드 가능합니다.");
            return;
        }

        setFiles(valid);
    };

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

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.title) return toast.warn("제목을 입력해주세요.");

        if (!form.companyName) return toast.warn("회사명을 입력해주세요.");

        if (!form.managerName) return toast.warn("담당자명을 입력해주세요.");

        if (!form.phone) return toast.warn("연락처를 입력해주세요.");

        if (!form.email) return toast.warn("이메일을 입력해주세요.");
        
        if (postcode == '' || address == '' || detailAddress == '') return toast.warn('주소를 모두 입력해주세요.');

        if (!form.dueDate) return toast.warn("수령 희망일을 지정해주세요.");

        if (!form.message) return toast.warn('요청사항을 입력해주세요.');

        if (form.isSecret && !form.password) return toast.warn('비밀번호를 입력해주세요.');

        const data = new FormData();
        Object.entries(form).forEach(([key, val]) => {
            // inSecret과 requestEstimate는 숫자 (1/0)로 변환
            if (key === 'isSecret') data.append('isSecret', val ? '1' : '0');
            else if (key === 'requestEstimate') data.append('requestEstimate', val ? '1' : '0');
            else data.append(key, val)
        });

        data.append('postcode', postcode);
        data.append('address', address);
        data.append('detailAddress', detailAddress);
        (files || []).forEach((file) => data.append('files', file));

        try {
            await axios.post(`${API}/biz/register`, data);
            toast.success('주문 요청이 등록되었습니다!');
            navigate('/bizOrderBoard');
        } catch (err) {
            toast.error('등록 중 오류가 발생했습니다.');
        }
    }

    // 수령 희망일 (+7일)
    const getMindDueDate = () => {
        const today = new Date();
        today.setDate(today.getDate() + 7);
        return today.toISOString().split("T")[0];
    }

    return (
        <div className="w-full px-4 mt-20">
            <div className='max-w-3xl mx-auto'>
                <h2 
                    className="
                        md:text-3xl text-[clamp(16px,3.91vw,30px)]
                        text-center font-bold mb-10">기업주문 요청 글쓰기</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {[ 
                        { label: '제목', name: 'title'},
                        { label: '회사명', name: 'companyName'},
                        { label: '사업자등록번호 (선택)', name: 'businessNumber'},
                        { label: '담당자 이름', name: 'managerName'},
                        { label: '연락처', name: 'phone'},
                        { label: '이메일', name: 'email'},
                    ].map(({ label, name, ...rest }) => (
                        <div key={name}>
                            <label className="block text-sm mb-1">
                                {label} {name !== 'businessNumber' && <span className="text-red-500">*</span>}
                            </label>
                            <input 
                                name={name}
                                onChange={handleChange}
                                className="w-full border p-2"
                                {...rest}
                            />
                        </div>
                    ))}
                    
                    {/* 주소 */}
                    <div>
                        <label className="block text-sm mb-1">주소<span className="text-red-500">*</span></label>
                        <div className="flex gap-2 mb-2">                            
                            <input value={postcode} readOnly placeholder="우편번호" className="w-40 border p-2" />
                            <button type="button" onClick={openPostcodePopup} className="px-3 py-2 border bg-white text-sm" >주소검색</button>
                        </div>
                        <input value={address} readOnly placeholder="기본주소" className="w-full border p-2 mb-2" />
                        <input ref={detailInputRef} value={detailAddress} onChange={(e) => setDetailAddress(e.target.value)} placeholder="상세주소" className="w-full border p-2" />
                    </div>

                    <div>
                        <label className="block text-sm mb-1">
                            수령 희망일<span className="text-red-500">*</span> <span className="text-gray-500 text-xs">(주문일 기준 최소 7일 이후부터 지정 가능합니다.)</span>
                        </label>
                        <input 
                        name="dueDate" 
                        type="date" 
                        min={getMindDueDate()} 
                        onChange={handleChange} 
                        className="w-full border p-2" />                    
                    </div>

                    <div>
                        <label className="block text-sm mb-2 font-semibold">주문 가능한 사이즈 목록 (벽걸이 액자)</label>
                        <div 
                            className="
                                md:text-base text-sm
                                grid grid-cols-2 sm:grid:cols-3 md:grid-cols-4 gap-2 
                                bg-gray-50 border p-3 rounded test-sm">
                            {Object.entries(sizePriceMap).map(([size, price]) => (
                                <div key={size} className="flex">
                                    <span>{size}</span>
                                    <span>&nbsp;({price.toLocaleString()}원)</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <label>요청 사항<span className="text-red-500">*</span></label>
                        <textarea name="message" placeholder="사이즈와 수량등 자유롭게 적어주세요." onChange={handleChange} className="w-full border p-2" />
                    </div>

                    <div>
                        <label className='block text-sm mb-1'>첨부파일</label>
                        <input type="file" accept=".jpg,.jpeg,.png" multiple onChange={handleFileChange} />
                        <p className="text-xs text-gray-500 mt-1">jpg, png 파일만 업로드 가능 (최대 5개)</p>
                    </div>

                    {files.length > 0 && (
                        <ul className="text-sm mt-2 list-disc ml-4 text-gray-600">
                            {files.map((file, idx) => <li key={idx}>{file.name}</li>)}
                        </ul>
                    )}

                    <div className="flex flex-col items-start gap-3">
                        <div>
                            <input type="checkbox" name="isSecret" checked={form.isSecret} onChange={handleChange} />
                            <span>비밀글로 설정</span>
                        </div>
                        {form.isSecret  && (
                            <div className="flex flex-col gap-1">
                                <input 
                                    name="password" 
                                    placeholder="비밀번호 (글 조회 시 필요)" 
                                    type="password"  
                                    onChange={handleChange} 
                                    className="border p-2 w-64" 
                                />
                                <span className="text-xs text-gray-500">
                                    비밀글로 설정 시, 이 비밀번호로만 열람 가능합니다.
                                </span>
                            </div>
                        )}
                    </div>

                    
                    <div 
                        className="
                            md:text-base text-sm
                            flex md:flex-col flex-row gap-2">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="w-full border border-gray-300 text-gray-700 py-3 rounded md:mb-2 hover:bg-gray-100"
                            >
                            이전으로 돌아가기
                        </button>   

                        <button type="submit" className="w-full bg-black text-white py-3 rounded">등록하기</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default Biz_OrderWrite;