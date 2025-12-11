import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { FaSignInAlt, FaUserPlus } from "react-icons/fa";

const Home: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (user) {
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-blue-300">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-lg w-full text-center">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-4">EzPay 송금 시스템</h1>
        <p className="text-gray-600 mb-6">쉽고 빠른 송금, EzPay와 함께하세요.</p>

        <div className="mt-4 space-y-6">
          <button
            className="w-full flex items-center justify-center space-x-2 bg-green-500 text-white py-3 rounded-xl font-semibold transition hover:bg-green-600"
            onClick={() => navigate("/login")}
          >
            <FaSignInAlt size={20} />
            <span>로그인</span>
          </button>

          <button
            className="w-full flex items-center justify-center space-x-2 bg-gray-700 text-white py-3 rounded-xl font-semibold transition hover:bg-gray-800"
            onClick={() => navigate("/signup")}
          >
            <FaUserPlus size={20} />
            <span>회원가입</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
