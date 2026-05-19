import { useNavigate, useLocation } from 'react-router-dom';

const Find_Id_success = () => {
    const { state } = useLocation(); // 전달된 상태값(id, name 포함)
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
        <div className="flex w-fit mx-auto justify-center mt-20">
            <div className="w-full max-w-md bg-white rounded-xl p-6">
                <h2 className="
                    sm:text-2xl text-xl font-bold text-center sm:mb-6 mb-3">아이디 찾기 완료</h2>
                <hr />
                {state?.found ? (
                    <p className="sm:text-base text-[13.5px] mt-6 mb-8 text-center leading-relaxed">
                        <span className="font-semibold text-blue-600">{state.found.name}</span> 회원님의 아이디는 <br />
                        <span className="font-semibold text-blue-600">{maskId(state.found.id)}</span> 입니다.
                    </p>
                ) : (
                    <p className="text-red-500 text-center py-6">아이디 정보가 없습니다.</p>
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
                        비밀번호 찾기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Find_Id_success;
