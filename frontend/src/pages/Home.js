import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();

  // 사용자가 로그인 상태인지 확인 (임시로 localStorage 사용)
  const isLoggedIn = localStorage.getItem("userToken"); // 백엔드 API 연동 전까지는 localStorage로 테스트

  console.log("HOME : " , isLoggedIn);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-3xl font-bold">EzPay 송금 시스템</h1>
      {isLoggedIn ? (
        <button
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => navigate("/dashboard")}
        >
          대시보드로 이동
        </button>
      ) : (
        <div className="mt-4 space-x-4">
          <button
            className="px-4 py-2 bg-green-500 text-white rounded"
            onClick={() => navigate("/login")}
          >
            로그인
          </button>
          <button
            className="px-4 py-2 bg-gray-700 text-white rounded"
            onClick={() => navigate("/signup")}
          >
            회원가입
          </button>
        </div>
      )}
    </div>
  );
};


export default Home;
