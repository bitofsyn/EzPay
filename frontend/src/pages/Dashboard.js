import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import { getDashboardInfo } from "../api/userAPI";
import DashboardHeader from "../components/DashboardHeader";

const Dashboard = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await getDashboardInfo();
        const dashboardData = res.data;
        console.log("dashboardData :", dashboardData);
        setUser(dashboardData.user);
        setAccounts(dashboardData.account ? [dashboardData.account] : []);
        setTransactions(dashboardData.transactions || []);
      } catch (error) {
        console.error("데이터 가져오기 오류:", error);
        localStorage.removeItem("userToken");
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const formatAccountNumber = (number) => {
    return `${number.slice(0, 2)}-${number.slice(2, 6)}-${number.slice(6)}`;
  };

  const visibleCards = accounts.slice(0, 3);
  const totalSlides = visibleCards.length + 1;

  const handleDotClick = (index) => {
    setSelectedIndex(index);
  };

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600 text-lg">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
      {/* 대시보드 헤더 */}
      <DashboardHeader userName={user?.name} onMenuOpen={() => setIsMenuOpen(true)} />

      {/* 계좌 슬라이드 */}
      <div className="w-full max-w-lg overflow-hidden mt-6">
        <div
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${selectedIndex * 100}%)` }}
        >
          {visibleCards.map((acc, idx) => (
            <div key={idx} className="min-w-full bg-white shadow-md rounded-lg p-6">
              <p className="text-sm text-left text-gray-500">계좌정보</p>
              <p className="text-lg font-semibold">{formatAccountNumber(acc.accountNumber)}</p>
              <p className="text-sm text-gray-500">{acc.bankName}</p>
              <div className="mt-4 flex justify-between items-center">
                <p className="text-2xl font-bold">{acc.balance.toLocaleString()} 원</p>
                <button
                  className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold"
                  onClick={() => navigate("/transfer")}
                >
                  이체
                </button>
              </div>
            </div>
          ))}

          {/* 계좌 추가하기 카드 */}
          <div className="min-w-full bg-white shadow-md rounded-lg p-6 text-center flex flex-col justify-center items-center">
            <p className="text-gray-600 mb-4">현재 계좌가 없습니다.</p>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold"
              onClick={() => navigate("/create-account")}
            >
              계좌 생성하기
            </button>
          </div>
        </div>

        {/* 인디케이터 */}
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <div
              key={idx}
              onClick={() => handleDotClick(idx)}
              className={`w-3 h-3 rounded-full cursor-pointer ${idx === selectedIndex ? "bg-blue-500" : "bg-gray-300"
                }`}
            />
          ))}
        </div>
      </div>

      {/* 거래 내역 */}
      <div className="w-full max-w-lg bg-white shadow-md rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold">최근 거래 내역</h3>
        {transactions.length > 0 ? (
          <ul className="mt-2 space-y-3">
            {transactions.map((tx, index) => (
              <li
                key={index}
                className="p-3 border rounded-lg bg-gray-100 flex justify-between"
              >
                <span className="font-semibold">{tx.description}</span>
                <span>{tx.amount.toLocaleString()} 원</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600 mt-2">거래 내역이 없습니다.</p>
        )}
      </div>

      {/* 메뉴 */}
      <div
        className={`fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 transition-opacity duration-300 
        ${isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div
          className={`fixed top-0 right-0 h-full bg-white shadow-lg p-4 transition-transform duration-300 
          w-64 md:w-1/4 max-w-xs transform ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">메뉴</h2>
            <button onClick={() => setIsMenuOpen(false)}>
              <FiX size={24} className="text-gray-700" />
            </button>
          </div>
          <ul className="mt-6 space-y-4">
            <li
              className="text-gray-700 hover:text-blue-600 cursor-pointer"
              onClick={() => {
                setIsMenuOpen(false);
                navigate("/accounts");
              }}
            >
              전체계좌조회
            </li>
            <li className="text-gray-700 hover:text-blue-600 cursor-pointer">
              통합거래내역조회
            </li>
            <li className="text-gray-700 hover:text-blue-600 cursor-pointer">
              이체
            </li>
            <li className="text-gray-700 hover:text-blue-600 cursor-pointer">
              환경설정
            </li>
            <li
              className="text-red-600 hover:text-red-700 cursor-pointer"
              onClick={handleLogout}
            >
              로그아웃
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
