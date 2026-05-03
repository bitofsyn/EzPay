import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiX } from "react-icons/fi";
import { getDashboardInfo, getInsights, getRecentNormalizedTransactions } from "../api/UserAPI";
import DashboardHeader from "../components/DashboardHeader";
import { formatAccountNumber, formatCurrency, formatDate } from "../utils/formatters";
import { clearUserData } from "../utils/storage";
import { User, Account, Transaction, NormalizedTransactionRecord, Insight } from "../types";
import { Skeleton, TransactionListSkeleton } from "../components/Skeleton";

interface DashboardAccount extends Account {
  main?: boolean;
  bankName?: string;
}

type DashboardTransaction = Transaction;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<DashboardAccount[]>([]);
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [normalizedTransactions, setNormalizedTransactions] = useState<NormalizedTransactionRecord[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // localStorage/sessionStorage에서 사용자 정보 가져오기
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const fetchUserData = async () => {
      try {
        const dashboardRes = await getDashboardInfo();
        console.log("dashboard 응답:", dashboardRes);

        // 응답 구조: { status: "success", data: { account: [...], transactions: [...], user: {...} } }
        const accountList = dashboardRes.data?.account || [];
        const txFromDashboard = dashboardRes.data?.transactions || [];
        setAccounts(accountList);
        setTransactions(txFromDashboard as DashboardTransaction[]);

        // user 정보도 응답에서 가져오기
        if (dashboardRes.data?.user) {
          setUser(dashboardRes.data.user);
        }

        const dashboardUserId = dashboardRes.data?.user?.userId ?? user?.userId;
        if (dashboardUserId) {
          const normalized = await getRecentNormalizedTransactions(dashboardUserId, 5);
          const insightCards = await getInsights(dashboardUserId);
          setNormalizedTransactions(normalized);
          setInsights(insightCards);
        }
      } catch (error) {
        console.error("데이터 가져오기 오류:", error);
        clearUserData();
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  // 대표 계좌를 맨 앞에 정렬
  const mainAccount = accounts.find(acc => acc.main);
  const otherAccounts = accounts.filter(acc => !acc.main);
  const sortedAccounts = mainAccount ? [mainAccount, ...otherAccounts] : accounts;
  const visibleCards = sortedAccounts.slice(0, 3);
  const totalSlides = visibleCards.length + 1;

  const handleDotClick = (index: number) => {
    setSelectedIndex(index);
  };

  const handleLogout = () => {
    clearUserData();
    navigate("/login");
  };

  const handleViewAllTransactions = () => {
    navigate("/transactions");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
        {/* 헤더 스켈레톤 */}
        <div className="w-full max-w-lg flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>

        {/* 계좌 카드 스켈레톤 */}
        <div className="w-full max-w-lg bg-white rounded-xl p-6 border">
          <Skeleton className="h-4 w-16 mb-2" />
          <Skeleton className="h-6 w-40 mb-1" />
          <Skeleton className="h-4 w-24 mb-4" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-16 rounded-xl" />
          </div>
        </div>

        {/* 인디케이터 스켈레톤 */}
        <div className="flex justify-center mt-4 space-x-2">
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-3 rounded-full" />
          <Skeleton className="h-3 w-3 rounded-full" />
        </div>

        {/* 거래 내역 스켈레톤 */}
        <div className="w-full max-w-lg bg-white rounded-xl border p-6 mt-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <TransactionListSkeleton count={4} />
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
              <p className="text-sm text-left text-gray-500">연결된 계좌</p>
              <p className="text-lg font-semibold">{formatAccountNumber(acc.accountNumber)}</p>
              <p className="text-sm text-gray-500">{acc.bankName}</p>
              <div className="mt-4 flex justify-between items-center">
                <p className="text-2xl font-bold text-gray-800">
                  {formatCurrency(acc.balance)}
                </p>
                <button
                  className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl shadow-md font-semibold transition-all"
                  onClick={() => navigate("/transactions")}
                >
                  거래 분석
                </button>
              </div>
            </div>
          ))}

          {/* 계좌 추가하기 카드 */}
          <div className="min-w-full bg-white rounded-xl p-6 border text-center flex flex-col justify-center items-center">
            <p className="text-gray-600 mb-4">분석할 계좌를 더 연결해보세요</p>
            <button
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl font-semibold"
              onClick={() => navigate("/create-account")}
            >
              계좌 연결하기
            </button>
          </div>
        </div>

        {/* 인디케이터 */}
        <div className="flex justify-center mt-4 space-x-2">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <div
              key={idx}
              onClick={() => handleDotClick(idx)}
              className={`w-3 h-3 rounded-full cursor-pointer ${idx === selectedIndex ? "bg-blue-500" : "bg-gray-300"}`}
            />
          ))}
        </div>
      </div>

      <div className="w-full max-w-lg bg-white rounded-xl border p-6 mt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">자동 인사이트</h3>
            <p className="text-sm text-gray-500 mt-1">동기화된 거래를 기준으로 소비 패턴을 요약합니다.</p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {insights.length > 0 ? (
            insights.map((insight, index) => (
              <div
                key={`${insight.type}-${index}`}
                className={`rounded-xl border p-4 ${
                  insight.severity === "warning"
                    ? "border-amber-200 bg-amber-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-gray-800">{insight.title}</p>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                    insight.severity === "warning"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-slate-200 text-slate-700"
                  }`}>
                    {insight.severity === "warning" ? "주의" : "정보"}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-600">{insight.summary}</p>
                <p className="mt-3 text-xs text-gray-500">
                  {insight.evidenceLabel}: <span className="font-medium text-gray-700">{insight.evidenceValue}</span>
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-500">
              아직 생성된 인사이트가 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 최근 거래 내역 */}
      <div className="w-full max-w-lg bg-white rounded-xl border p-6 mt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">최근 거래 내역</h3>
            <p className="text-sm text-gray-500 mt-1">동기화된 실제 거래 데이터를 우선 표시합니다.</p>
          </div>
        </div>
        <div className="mt-4 max-h-[480px] overflow-y-auto pr-1">
          {normalizedTransactions.length > 0 ? (
            <ul className="space-y-3">
              {normalizedTransactions.map((tx) => {
                const isOutflow = tx.direction === "OUTFLOW";
                return (
                  <li key={tx.normalizedTransactionId ?? tx.providerTransactionId} className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center hover:shadow-sm">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{isOutflow ? "출금" : "입금"}</p>
                      <p className="text-xs text-gray-500">
                        {tx.merchantName || tx.description || "거래 설명 없음"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDate(tx.postedAt || tx.authorizedAt || "")}
                      </p>
                    </div>
                    <div className={`text-sm font-semibold ${isOutflow ? "text-rose-500" : "text-sky-600"}`}>
                      {isOutflow ? "-" : "+"}
                      {formatCurrency(tx.amount)}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : transactions.length > 0 ? (
            <ul className="space-y-3">
              {transactions.map((tx, index) => {
                const isSent = tx.senderAccount.accountId === sortedAccounts[0]?.accountId;
                return (
                  <li key={index} className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center hover:shadow-sm">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{isSent ? "출금" : "입금"}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(tx.transactionDate)}
                      </p>
                    </div>
                    <div className={`text-sm font-semibold ${isSent ? "text-rose-500" : "text-sky-600"}`}>
                      {isSent ? "-" : "+"}
                      {formatCurrency(tx.amount)}
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
        className={`fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 transition-opacity duration-300 ${isMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
        onClick={() => setIsMenuOpen(false)}
      >
        <div
          className={`fixed top-0 right-0 h-full bg-white shadow-lg p-4 w-64 max-w-xs transform transition-transform duration-300 ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">메뉴</h2>
            <button onClick={() => setIsMenuOpen(false)}>
              <FiX size={24} className="text-gray-700" />
            </button>
          </div>
          <ul className="mt-6 space-y-4">
            <li className="text-gray-700 hover:text-blue-600 cursor-pointer" onClick={() => { setIsMenuOpen(false); navigate("/accounts"); }}>연결 계좌 보기</li>
            <li className="text-gray-700 hover:text-blue-600 cursor-pointer" onClick={() => { setIsMenuOpen(false); navigate("/calendar"); }}>월별 소비 통계</li>
            <li className="text-gray-700 hover:text-blue-600 cursor-pointer" onClick={() => { setIsMenuOpen(false); navigate("/ai-assistant"); }}>AI 인사이트 설명</li>
            <li className="text-gray-700 hover:text-blue-600 cursor-pointer" onClick={() => { setIsMenuOpen(false); navigate("/transactions"); }}>거래 내역 조회</li>
            <li className="text-gray-700 hover:text-blue-600 cursor-pointer" onClick={() => { setIsMenuOpen(false); navigate("/create-account"); }}>계좌 연결</li>
            <li className="text-gray-700 hover:text-blue-600 cursor-pointer" onClick={() => { setIsMenuOpen(false); navigate("/settings"); }}>환경설정</li>
            <li className="text-red-600 hover:text-red-700 cursor-pointer" onClick={handleLogout}>로그아웃</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
