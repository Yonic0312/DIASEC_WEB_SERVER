import { useNavigate, useLocation } from 'react-router-dom';

const Find_Pwd_success = () => {
    const { state } = useLocation();
    const navigate = useNavigate();

    const maskId = (id) => {
        if (!id) return '';
        if (id.length <= 4) {
            const mid = Math.floor(id.length / 2);
            return id.slice(0, mid - 1) + '**' + id.slice(mid + 1);
        }
        const visibleFront = id.slice(0, 2);
        const visibleBack = id.slice(-2);
        const masked = '*'.repeat(id.length - 4);
        return `${visibleFront}${masked}${visibleBack}`;
    };

    return (
        <div className="flex justify-center mt-20 px-4">
            <div className="w-full max-w-md bg-white rounded-xl p-6">
                <h2 className="sm:text-2xl text-xl font-bold text-center sm:mb-6 mb-3">비밀번호 찾기 완료</h2>
                <hr />
                {state?.found ? (
                    <p className="sm:text-base text-[13.5px] mt-6 sm:mb-8 mb-3 text-center leading-relaxed">
                        <span className="font-semibold text-blue-600">{maskId(state.found.id)}</span> 회원님, <br />
                        임시 비밀번호를 <br />
                        <span className="font-semibold text-blue-600">{state.found.email}</span>
                        <br />로 안전하게 전송해드렸습니다. <br />
                        <br />
                        로그인 후 반드시 <span className="font-medium text-red-500">비밀번호를 변경</span>해주세요.
                    </p>
                ) : (
                    <p className="text-red-500 text-center py-6">비밀번호 찾기 정보를 확인할 수 없습니다.</p>
                )}
                <hr />
                <div className="mt-6 flex justify-center gap-3">
                    <button
                        className="px-4 py-2 sm:text-sm text-[12px] rounded border border-black bg-black text-white hover:bg-gray-800"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate('/userLogin');
                        }}
                    >
                        로그인
                    </button>
                    <button
                        className="px-4 py-2 sm:text-sm text-[12px] rounded border hover:bg-gray-100"
                        onClick={(e) => {
                            e.preventDefault();
                            navigate('/find_Pwd');
                        }}
                    >
                        다시 찾기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Find_Pwd_success;
