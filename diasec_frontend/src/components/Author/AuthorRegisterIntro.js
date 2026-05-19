import { useEffect, useContext, useState} from 'react';
import { useNavigate } from 'react-router-dom';
import { MemberContext } from '../../context/MemberContext';
import { toast } from 'react-toastify';
import axios from 'axios';

const AuthorRegisterIntro = () => {
    const navigate = useNavigate();
    const API = process.env.REACT_APP_API_BASE;
    const { member } = useContext(MemberContext);

    const [status, setStatus] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        if (!member?.id) return;

        const fetchAuthorStatus = async() => {
            try {
                const res = await axios.get(`${API}/author/status`, {
                    params: { memberId: member.id },
                    withCredentials: true 
                });
                const data = res.data || {};

                // role/author_status 둘 다 확인
                if (data.author_status === 'APPROVED') {
                    navigate(`/authorPage/${member.id}`);
                    return;
                }

                setStatus(data.author_status || null);
                setRejectReason(data.author_reject_reason || '');
            } catch (err) {
                console.error(err);
            }
        };
        fetchAuthorStatus();
    }, [API, navigate]);

    return (
        <div 
            className="
                md:text-base text-[clamp(11px,2.085vw,16px)]
                max-w-4xl mx-auto px-6 my-20 text-gray-800">
            <h1 
                className="
                    md:text-3xl text-[clamp(16px,3.91vw,30px)]
                    text-center font-bold mb-8">작가 등록 안내</h1>

            {/* 반려 안내 */}
            {status === 'REJECTED' && (
                <section className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                    <div 
                        className="
                            md:text-base text-[clamp(11px,2.085vw,16px)]
                            font-semibold text-red-700 mb-1">
                                작가 등록이 반려되었습니다. 재신청해 주시기 바랍니다.
                    </div>
                    <div 
                        className="
                            md:text-sm text-[clamp(9.5px,1.8252vw,14px)]
                            text-red-700 whitespace-pre-wrap">
                        {'사유 : ' + rejectReason || '반려 사유가 제공되지 않았습니다.'}
                    </div>
                </section>
            )}

            {/* 검토중 안내 */}
            {status === 'PENDING' && (
                <section 
                    className="
                        md:text-base text-[clamp(11px,2.085vw,16px)]
                        mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div className="font-semibold text-amber-800">관리자 검토 중입니다.</div>
                    <div 
                        className="
                            md:text-sm text-[clamp(9.5px,1.8252vw,14px)]
                            text-amber-800">영업일 기준 1~3일 내에 결과가 안내됩니다.</div>
                </section>
            )}

            <section 
                className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm mb-10">
                <p>
                    나만의 작품을 등록해보세요! 승인된 작가는 작품을 판매할 수 있으며,
                    <span className="font-bold text-black"> 판매 시 13% 수익</span>을 정산해드립니다.
                </p>
                <ul 
                    className="
                        md:text-sm text-[clamp(11px,1.8252vw,14px)]
                        mt-1 list-disc pl-6 space-y-2 text-gray-700">
                    <li>작가 등록 후 관리자의 승인을 거쳐 작가 전용 페이지가 생성됩니다.</li>
                    <li>작가 페이지에서 자신의 작품을 등록할 수 있으며, 등록된 작품은 검토 후 승인됩니다.</li>
                    <li>판매 수익은 매월 말 기준으로 정산됩니다.</li>
                    <li>작가 등록은 무료이며 언제든 수정 또는 탈퇴할 수 있습니다.</li>
                </ul>
            </section>

            {status !== 'PENDING' && (
                <div className="text-center">
                    <button
                        onClick={() => {
                            if (!member) {
                                toast.warn('로그인 후 이용해주세요.');
                                return;
                            }
                            navigate('/authorRegisterForm')
                        }}
                        className="
                            md:text-sm text-[clamp(11px,1.8252vw,14px)]
                            px-6 py-3 bg-black text-white rounded-md hover:bg-gray-800 transition"
                    >
                        작가 등록 신청하기
                    </button>
                </div>
            )}
        </div>
    )
}

export default AuthorRegisterIntro;