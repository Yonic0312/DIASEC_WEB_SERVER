import { useNavigate } from 'react-router-dom';

const Join_success = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center w-full mt-20">
      <div className="bg-white border rounded-2xl p-10 text-center w-[90%] max-w-md">
        <h2 className="sm:text-2xl text-xl font-bold mb-4">회원가입 완료!</h2>
        <p className="sm:text-base text-[12px] text-gray-700 mb-6">
          회원가입이 정상적으로 완료되었습니다.
          <br />이제 다양한 서비스를 이용해보세요.
        </p>

        <div className="flex flex-col sm:flex-row sm:text-base text-[14px]  gap-3 justify-center">
          <button
            onClick={() => navigate('/userLogin')}
            className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition"
          >
            로그인 하러가기
          </button>
          <button
            onClick={() => navigate('/')}
            className="border border-black text-black px-6 py-2 rounded hover:bg-gray-100 transition"
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
};

export default Join_success;
