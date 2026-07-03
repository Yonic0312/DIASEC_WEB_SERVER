import { useNavigate } from 'react-router-dom';
import { useState, useRef } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Find_Pwd = () => {
    const API = process.env.REACT_APP_API_BASE;
    const [contactType, setContactType] = useState('email');
    const [id, setId] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // focus
    const idRef = useRef(null);
    const nameRef = useRef(null);
    const emailRef = useRef(null);
    const phoneRef = useRef(null);

    const handleFindPwd = async (e) => {
        e.preventDefault();

        if (loading) return;

        if (!id) {
            idRef.current.focus();
            toast.error('아이디를 입력해 주세요.');
            return;
        }

        if (!name) {
            nameRef.current.focus();
            toast.error('이름을 입력해 주세요.');
            return;
        }

        if (contactType==="email" && !email) {
            emailRef.current.focus();
            toast.error('이메일을 입력해 주세요.');
            return;
        }

        if (contactType === 'phone') {
            if (!phone) {
                phoneRef.current?.focus();
                toast.error("휴대폰 번호를 입력해 주세요.");
                return;
            }

            const phoneRegex = /^\d{2,3}-\d{3,4}-\d{4}$/;
            if (!phoneRegex.test(phone)) {
                phoneRef.current?.focus();
                toast.error("휴대폰 번호는 하이픈(-)을 포함해 입력해 주세요.");
                return;
            }
        }

        try {
            setLoading(true);

            const response = await axios.post(`${API}/member/findPwd`, {
                id: id,
                name: name,
                email: email ? email : null,
                phone: phone ? phone : null
            });

            // 응답 데이터는 문자열로 ID가 옴

            if (response) {
                navigate('/find_Pwd_success', {
                    state: {
                        found: response.data,
                    }
                });
            }
        } catch (error) {
            toast.error('해당 정보로 등록된 계정이 없습니다.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center justify-center">
            <form onSubmit={handleFindPwd}>
                <div className="flex flex-col pt-20">
                    <span className="flex sm:text-xl text-[18px] font-bold sm:pb-2 justify-center">비밀번호 찾기</span>

                    <div className="flex mt-4 mb-2">
                        <div className="flex flex-col w-full gap-2">
                            <div className="flex items-center justify-center">
                                <div className='flex items-center sm:text-base text-[14px] justiy-center' onClick={() => setContactType('email')}>
                                    <input type="radio" name="contact" value="email" checked={contactType === 'email'} onChange={() => setContactType('email')} className='sm:h-4 h-3 sm:w-[14px] w-[14px]'/>
                                    <span>&nbsp;이메일</span>
                                </div>
                                <div className='flex items-center sm:text-base text-[14px]' onClick={() => setContactType('phone')}>
                                    <input type="radio" name="contact" value="phone" checked={contactType === 'phone'} onChange={() => setContactType('phone')} className='ml-2 sm:h-4 h-3 sm:w-[14px] w-[14px]'/>
                                    <span>&nbsp;휴대폰번호</span>
                                </div>
                            </div>
                            <div className="flex flex-col sm:w-full w-[226px] justify-between sm:text-base text-[14px]">
                                <span>아이디 </span> 
                                <input type="text" ref={idRef} value={id} onChange={(e) => setId(e.target.value)} className="px-2 border-gray-300 border-[1px] w-full h-8"></input>
                            </div>
                            <div className="flex flex-col sm:w-full w-[226px] justify-between sm:text-base text-[14px]">
                                <span>이름 </span> 
                                <input type="text" ref={nameRef} value={name} onChange={(e) => setName(e.target.value)} className="px-2 border-gray-300 border-[1px] w-full h-8"></input>
                            </div>
                            <div className="flex flex-col sm:w-full w-[226px] justify-between sm:text-base text-[14px]">
                                <span>{contactType === 'email' ? '이메일' : '휴대폰번호'}</span>
                                {contactType === 'email' ? (
                                    <input type="text" ref={emailRef} value={email} onChange={(e) => setEmail(e.target.value)} className="px-2 border-gray-300 border-[1px] w-full h-8"></input>
                                ) : (
                                    <input type="text" ref={phoneRef} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-1234-5678" className="px-2 border-gray-300 border-[1px] w-full h-8"></input>
                                )}
                            </div>
                            <div className="flex w-full justify-center">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full h-10 bg-black text-white sm:text-sm text-[12px]"
                                > 
                                    {loading ? '처리 중...' : '확인'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-row gap-2 mb-3 justify-center">
                        <button 
                            type="button"
                            className="
                                border-[1px] w-1/2 h-[40px] 
                                sm:text-sm text-[12px]" 
                            onClick={() => navigate('/userLogin')}
                        >
                            로그인 
                        </button>
                        <button
                            type="button"
                            className="
                                border-[1px] w-1/2 h-[40px] 
                                sm:text-sm text-[12px]" 
                            onClick={() => navigate('/find_Id')}
                        > 
                            아이디 찾기
                        </button>
                    </div> 
                </div>
            </form>
        </div>
    );
};

export default Find_Pwd;