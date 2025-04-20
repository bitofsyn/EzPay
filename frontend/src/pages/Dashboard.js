import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi";
import { getDashboardInfo, getRecentTransactions } from "../api/UserAPI";
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
        const dashboardRes = await getDashboardInfo();
        const dashboardData = dashboardRes.data;
        setUser(dashboardData.user);
  
        const accountList = dashboardData.account ? [dashboardData.account] : [];
        setAccounts(accountList);
  
        // 계좌가 있으면 거래 내역을 동시에 요청
        if (dashboardData.account?.accountId) {
          const accountId = dashboardData.account.accountId;
  
          const [txRes] = await Promise.all([
            getRecentTransactions(accountId),
          ]);
  
          setTransactions(txRes.data);
        }
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

  const handleViewAllTransactions = () => {
    navigate("/transactions");
  };

  if (isLoading) {
    // Skeleton UI 적용
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
        <div className="w-full max-w-lg bg-white rounded-xl p-6 animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
          <div className="h-10 bg-gray-300 rounded w-full"></div>
        </div>
        <div className="w-full max-w-lg bg-white rounded-xl p-6 mt-6 animate-pulse">
          <div className="h-6 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
          <div className="h-48 bg-gray-300 rounded"></div>
        </div>
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
            <div key={idx} className="min-w-full bg-white rounded-xl p-6 border">
              <p className="text-sm text-left text-gray-500">계좌정보</p>
              <p className="text-lg font-semibold">{formatAccountNumber(acc.accountNumber)}</p>
              <p className="text-sm text-gray-500">{acc.bankName}</p>
              <div className="mt-4 flex justify-between items-center">
                <p className="text-2xl font-bold text-gray-800">
                  {acc.balance.toLocaleString()} 원
                </p>
                <button
                  className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg font-semibold transition"
                  onClick={() => navigate("/send")}
                >
                  이체
                </button>
              </div>
            </div>
          ))}

          {/* 계좌 추가하기 카드 */}
          <div className="min-w-full bg-white rounded-xl p-6 border text-center flex flex-col justify-center items-center">
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
      <div className="w-full max-w-lg bg-white rounded-xl border p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-800">최근 거래 내역</h3>
        <div
          className="mt-4 max-h-[480px] overflow-y-auto pr-1"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <style>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {transactions.length > 0 ? (
            <ul className="space-y-3">
              {transactions.map((tx, index) => {
                const isSent = tx.senderAccount.accountId === accounts[0]?.accountId;
                return (
                  <li
                    key={index}
                    className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center hover:shadow-sm transition"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {isSent ? "송금" : "입금"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.transactionDate).toLocaleString()}
                      </p>
                    </div>
                    <div
                      className={`text-sm font-semibold ${isSent ? "text-red-500" : "text-green-600"
                        }`}
                    >
                      {isSent ? "-" : "+"}
                      {tx.amount.toLocaleString()} 원
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-center text-gray-500 text-sm py-6">
              <span className="text-2xl">💸</span>
              <p className="mt-2">최근 거래 내역이 없습니다</p>
            </div>
          )}
        </div>

        {/* 거래 더보기 버튼 */}
        <div className="mt-4 text-center">
          <button
            onClick={handleViewAllTransactions}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            전체 거래 보기 →
          </button>
        </div>
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
            <li className="text-gray-700 hover:text-blue-600 cursor-pointer" onClick={() => { setIsMenuOpen(false); navigate("/accounts"); }}>전체계좌조회</li>
            <li className="text-gray-700 hover:text-blue-600 cursor-pointer">통합거래내역조회</li>
            <li className="text-gray-700 hover:text-blue-600 cursor-pointer" onClick={() => { setIsMenuOpen(false); navigate("/transactions"); }}>거래 내역조회</li>
            <li className="text-gray-700 hover:text-blue-600 cursor-pointer" onClick={() => { setIsMenuOpen(false); navigate("/send"); }}>이체</li>
            <li className="text-gray-700 hover:text-blue-600 cursor-pointer" onClick={() => { setIsMenuOpen(false); navigate("/settings"); }}>환경설정</li>
            <li className="text-red-600 hover:text-red-700 cursor-pointer" onClick={handleLogout}>로그아웃</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
