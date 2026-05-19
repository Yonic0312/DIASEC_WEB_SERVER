import { useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MemberContext } from '../../context/MemberContext'
import { Member_Nav_Sections } from './Member_Nav_Sections';


const Member_Sidebar = () => {
    const API = process.env.REACT_APP_API_BASE;
    const { member, setMember } = useContext(MemberContext);
    const navigate = useNavigate();
    const location = useLocation();
    const isActive = (path) => {
        if (path === '/mypage/retouch') return location.pathname.startsWith('/mypage/retouch');
        return location.pathname === path;
    };

    const handleLogout = () => {
        if(window.confirm('로그아웃을 하시겠습니까?')){
            axios.post(`${API}/member/logout`, { withCredentials: true})
                .then(() => {
                    setMember(null);
                    toast.success('로그아웃되었습니다.');
                    navigate('/');
                })
                .catch((err) => {
                    console.error("로그아웃 실패", err);
                    toast.error('로그아웃에 실패했습니다. 잠시 후 다시 시도해 주세요.');
            });
        }
    };

    const go = (path, state) => {
        if (state) navigate(path, { state });
        else navigate(path);
    };

    return (
        <>
            <div className="w-[clamp(150px,15.39vw,200px)] flex justify-center">
                {member ? (
                    <div className="flex flex-col text-left sm:gap-3 gap-2 shrink-0">
                        <button
                            type="button"
                            className="
                                md:text-[21px] text-[clamp(11px,2.3455vw,18px)]
                                mt-[-1px] mb-3 font-bold text-left cursor-pointer"
                            onClick={() => navigate('/mypage')}
                        >
                            마이페이지
                        </button>
                        
                        {Member_Nav_Sections.map((section) => (
                            <div key={section.title} className="contents">
                                <span className="md:text-lg text-[clamp(11px,2.3455vw,18px)] font-bold">
                                    {section.title}
                                </span>
                                {section.items.map((item) => {
                                    if (item.onlyWeb && member.provider !== 'web') return null;
                                    return (
                                        <button
                                            key={item.label}
                                            type="button"
                                            className={`md:text-sm text-[clamp(9px,1.8252vw,14px)] text-left ${
                                                isActive(item.path)
                                                    ? 'text-black font-semibold opacity-100'
                                                    : 'opacity-65'
                                            }`}
                                            onClick={() => go(item.path, item.state)}
                                        >
                                            {item.label}
                                        </button>
                                    )
                                })}
                            </div>
                        ))}
                        <button
                            type="button"
                            className="text-left md:text-sm text-[clamp(9px,1.8252vw,14px)] opacity-65"
                            onClick={handleLogout}
                        >
                            로그아웃
                        </button>
                    </div>
                ) : (
                    <div></div>
                )}
            </div>
        </>
    );
};

export default Member_Sidebar;