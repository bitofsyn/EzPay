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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-slate-100 via-blue-50 to-cyan-100 px-4">
      <div className="bg-white shadow-lg rounded-2xl p-8 max-w-xl w-full text-center border border-slate-200">
        <div className="inline-flex items-center rounded-full bg-cyan-50 px-4 py-1 text-sm font-medium text-cyan-700 mb-5">
          Connected Finance Insights
        </div>
        <h1 className="text-4xl font-extrabold text-gray-800 mb-4">EzPay</h1>
        <p className="text-lg font-semibold text-slate-700 mb-3">
          실제 거래 데이터를 연결해 소비 패턴을 이해하는 개인 금융 분석 앱
        </p>
        <p className="text-gray-600 mb-6 leading-7">
          계좌를 연결하고, 거래를 동기화하고, 월별 소비 변화와 이상 지출 징후를 자동으로 확인하세요.
        </p>

        <div className="mt-4 space-y-6">
          <button
            className="w-full flex items-center justify-center space-x-2 bg-slate-900 text-white py-3 rounded-xl font-semibold transition hover:bg-slate-800"
            onClick={() => navigate("/login")}
          >
            <FaSignInAlt size={20} />
            <span>로그인</span>
          </button>

          <button
            className="w-full flex items-center justify-center space-x-2 bg-cyan-600 text-white py-3 rounded-xl font-semibold transition hover:bg-cyan-700"
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
