import { useNavigate } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    // 임시 로그인 처리 (백엔드 연동 전)
    localStorage.setItem("userToken", "dummyToken");
    navigate("/dashboard");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h2 className="text-2xl font-bold">로그인</h2>
      <button
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        onClick={handleLogin}
      >
        로그인하기
      </button>
    </div>
  );
};

export default Login;
