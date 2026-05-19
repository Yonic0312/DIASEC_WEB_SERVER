import { useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom'
import { MemberContext } from'../../../context/MemberContext'
import { toast } from 'react-toastify';
import axios from 'axios';

const ChangePwd = () => {
    const API = process.env.REACT_APP_API_BASE;
    const navigate = useNavigate();
    const { member, setMember } = useContext(MemberContext);
    const [id, setId] = useState('');
    const [nowPassword, setNowPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const newPasswordRef = useRef(null);

    useEffect(() => {
        if (member) {
            setId(member.id || '');
        }
    }, [member]);

    const handleChangePasswordSubmit = async (e) => {
        e.preventDefault();

        if (!member?.id) {
            toast.error('로그인이 필요한 서비스입니다');
            navigate('/userLogin');
            return;
        }

        if (!nowPassword || !newPassword || !confirmPassword) {
            toast.error('모든 비밀번호를 입력해주세요.');
            return
        } else if (!isValidPassword(newPassword)) {
            toast.error('비밀번호는 영문 대소문자, 숫자, 특수문자 중 2가지 이상 조합이며 8~16자여야 합니다.');
            newPasswordRef.current?.focus();
            return;
        } else if (newPassword !== confirmPassword) {
            toast.error("새 비밀번호가 일치하지 않습니다.");
            newPasswordRef.current?.focus();
            return;
        } else if (nowPassword === newPassword) {
            toast.error("새 비밀번호가 현재 비밀번호와 같습니다.");
            newPasswordRef.current?.focus();
            return
        }

        try {
            await axios.post(`${API}/member/modify-password`, {
                id,
                currentPassword : nowPassword,
                newPassword,
            }, { withCredentials: true });

            toast.success('비밀번호가 성공적으로 변경되었습니다.');
            setNewPassword('');
            setNowPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('비밀번호 변경 실패', error);
            toast.error('비밀번호 변경에 실패했습니다.');
        }
    };

    

    // 비밀번호 형식 체크
    const isValidPassword = (password) => {
        if (password.length < 8 || password.length > 16) return false;

        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        const count = [hasLower, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;
        return count >= 2;
    };

    return (
        <div className="flex flex-col w-full items-center">
            <form onSubmit={handleChangePasswordSubmit}>
                <div className="flex items-center justify-between">
                    <span className="
                        md:text-lg text-[clamp(16px,2.346vw,18px)]
                        font-bold pb-2 md:pb-6"
                    >
                            | 비밀번호 변경
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
                <div className="
                    text-sm
                    flex flex-col border-[1px] 
                    sm:px-10 px-4
                    sm:py-12 py-4
                    rounded-md shadow-md">
                    <span 
                        className="
                            font-semibold mb-1">아이디</span>
                    <span 
                        className="
                            font-medium text-gray-800 mb-4">{id}</span>
                    <span 
                        className="
                            font-semibold">현재 비밀번호</span>
                    <input type="password" value={nowPassword} onChange={(e) => setNowPassword(e.target.value)} 
                        className="
                            w-[250px]
                            sm:h-[40px] h-8
                            p-2 border-black border-[1px] border-opacity-15 mb-4"></input>

                    <span 
                        className="
                            font-semibold">새 비밀번호</span>
                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} ref={newPasswordRef} 
                        className="
                            w-[250px]
                            sm:h-[40px] h-8
                            p-2 border-black border-[1px] border-opacity-15"></input>
                    <span 
                        className="
                            text-[12px]
                            mb-4 
                            text-gray-500">
                        (영문/숫자/특수문자 중 2종 이상, 8~16자)
                    </span>

                    <span 
                        className="
                            font-semibold">새 비밀번호 확인</span>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} 
                        className="
                            w-[250px]
                            sm:h-[40px] h-8
                            p-2 border-black border-[1px] border-opacity-15"></input>

                    <div className="flex justify-center mt-5 gap-4">
                        {/* <button type="button" 
                            className="
                                w-1/2 
                                sm:h-[40px] h-[30px]
                                bg-[#ffffff] text-[#000000] border-[1px] border-[#000000] font-bold" onClick={() => navigate('/')}>다음에 변경</button> */}
                        <button type="submit" 
                            className="
                                w-1/2 
                                sm:h-[40px] h-[30px]
                                bg-[#555555] text-[#fbf7f0] border-[1px] border-[#555555] rounded font-bold">비밀번호 변경</button>
                    </div>
                </div>
            </form>
        </div>
    )
}

export default ChangePwd