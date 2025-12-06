import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiUser, FiMail, FiPhone, FiCalendar, FiCreditCard, FiActivity } from "react-icons/fi";
import { getUserById, getUserAccounts, getUserTransactions, updateUserStatus } from "../../api/AdminAPI";
import toast from "react-hot-toast";

const AdminUserDetail = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [userInfo, setUserInfo] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("accounts"); // accounts, transactions

  useEffect(() => {
    fetchUserDetails();
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      const [userRes, accountsRes, transactionsRes] = await Promise.all([
        getUserById(userId),
        getUserAccounts(userId),
        getUserTransactions(userId),
      ]);

      // CommonResponse 구조 처리
      if (userRes.status === "success" && userRes.data) {
        setUserInfo(userRes.data);
      }
      if (accountsRes.status === "success" && accountsRes.data) {
        setAccounts(accountsRes.data);
      }
      if (transactionsRes.status === "success" && transactionsRes.data) {
        setTransactions(transactionsRes.data);
      }
    } catch (error) {
      console.error("사용자 상세 정보 조회 실패:", error);
      toast.error(error.response?.data?.message || "사용자 정보를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!window.confirm(`사용자 상태를 ${newStatus}로 변경하시겠습니까?`)) {
      return;
    }

    try {
      await updateUserStatus(userId, newStatus);
      toast.success("사용자 상태가 변경되었습니다.");
      fetchUserDetails();
    } catch (error) {
      console.error("사용자 상태 변경 실패:", error);
      toast.error("사용자 상태 변경에 실패했습니다.");
    }
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-orange-100 text-orange-800";
      case "LOCKED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatAccountNumber = (number) => {
    if (!number) return "";
    return `${number.slice(0, 2)}-${number.slice(2, 6)}-${number.slice(6)}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admin/users")}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FiArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">사용자 상세 정보</h1>
              <p className="text-sm text-gray-500 mt-1">ID: {userId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 사용자 기본 정보 */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FiUser className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">이름</p>
                <p className="text-base font-medium text-gray-900">{userInfo?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <FiMail className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">이메일</p>
                <p className="text-base font-medium text-gray-900">{userInfo?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <FiPhone className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">전화번호</p>
                <p className="text-base font-medium text-gray-900">{userInfo?.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <FiCalendar className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">가입일</p>
                <p className="text-base font-medium text-gray-900">
                  {new Date(userInfo?.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 rounded-lg">
                <FiActivity className="text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">상태</p>
                <select
                  value={userInfo?.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeStyle(
                    userInfo?.status
                  )}`}
                >
                  <option value="ACTIVE">활성</option>
                  <option value="INACTIVE">비활성</option>
                  <option value="LOCKED">잠금</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="bg-white rounded-xl shadow-sm border mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("accounts")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "accounts"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiCreditCard />
                계좌 정보 ({accounts.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === "transactions"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiActivity />
                거래 내역 ({transactions.length})
              </div>
            </button>
          </div>

          <div className="p-6">
            {/* 계좌 정보 탭 */}
            {activeTab === "accounts" && (
              <div>
                {accounts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {accounts.map((account) => (
                      <div
                        key={account.accountId}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm text-gray-500">{account.bankName}</p>
                          {account.main && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                              대표
                            </span>
                          )}
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatAccountNumber(account.accountNumber)}
                        </p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                          {account.balance?.toLocaleString() || 0} 원
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          개설일: {new Date(account.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    등록된 계좌가 없습니다.
                  </div>
                )}
              </div>
            )}

            {/* 거래 내역 탭 */}
            {activeTab === "transactions" && (
              <div>
                {transactions.length > 0 ? (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {transactions.map((tx) => (
                      <div
                        key={tx.transactionId}
                        className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatAccountNumber(tx.senderAccount?.accountNumber)} →{" "}
                              {formatAccountNumber(tx.receiverAccount?.accountNumber)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(tx.transactionDate).toLocaleString()}
                            </p>
                            {tx.description && (
                              <p className="text-xs text-gray-600 mt-1">{tx.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-600">
                              {tx.amount?.toLocaleString()} 원
                            </p>
                            <p className="text-xs text-gray-500 mt-1">ID: {tx.transactionId}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    거래 내역이 없습니다.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetail;
