import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiActivity, FiArrowLeft, FiCalendar, FiCreditCard, FiMail, FiPhone, FiUser } from "react-icons/fi";
import toast from "react-hot-toast";
import { getUserAccounts, getUserById, getUserTransactions, updateUserStatus } from "../../api/AdminAPI";
import AdminShell from "../../components/admin/AdminShell";
import { createPreviewUserDetail } from "../../utils/adminPreviewData";
import { isAdminPreviewForbiddenError } from "../../utils/adminView";

type UserStatus = "ACTIVE" | "INACTIVE" | "LOCKED";
type TabType = "accounts" | "transactions";

interface UserInfo {
  userId: number;
  name: string;
  email: string;
  phone?: string;
  status: UserStatus;
  createdAt: string;
}

interface Account {
  accountId: number;
  bankName: string;
  accountNumber: string;
  balance: number;
  main: boolean;
  createdAt: string;
}

interface TransactionAccount {
  accountNumber: string;
}

interface Transaction {
  transactionId: number;
  senderAccount?: TransactionAccount;
  receiverAccount?: TransactionAccount;
  transactionDate: string;
  description?: string;
  amount: number;
}

const AdminUserDetail: React.FC = () => {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("accounts");

  const fetchUserDetails = useCallback(async () => {
    if (!userId) return;
    const numericUserId = parseInt(userId, 10);

    try {
      const [userData, accountsData, transactionsData] = await Promise.all([
        getUserById(numericUserId),
        getUserAccounts(numericUserId),
        getUserTransactions(numericUserId),
      ]);

      setUserInfo(userData as unknown as UserInfo);
      setAccounts(accountsData as unknown as Account[]);
      setTransactions(transactionsData as unknown as Transaction[]);
    } catch (error) {
      if (isAdminPreviewForbiddenError(error)) {
        const previewData = createPreviewUserDetail(numericUserId);
        setUserInfo(previewData.userInfo);
        setAccounts(previewData.accounts);
        setTransactions(previewData.transactions);
        return;
      }

      console.error("사용자 상세 정보 조회 실패:", error);
      const axiosError = error as { response?: { data?: { message?: string } } };
      toast.error(axiosError.response?.data?.message || "사용자 정보를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  const handleStatusChange = async (newStatus: UserStatus) => {
    if (!userId) return;
    if (!window.confirm(`사용자 상태를 ${newStatus}로 변경하시겠습니까?`)) return;

    try {
      await updateUserStatus(parseInt(userId, 10), newStatus);
      toast.success("사용자 상태가 변경되었습니다.");
      fetchUserDetails();
    } catch (error) {
      if (isAdminPreviewForbiddenError(error)) {
        setUserInfo((prev) => (prev ? { ...prev, status: newStatus } : prev));
        return;
      }

      console.error("사용자 상태 변경 실패:", error);
      toast.error("사용자 상태 변경에 실패했습니다.");
    }
  };

  const getStatusBadgeStyle = (status: UserStatus) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-50 text-emerald-700";
      case "INACTIVE":
        return "bg-amber-50 text-amber-700";
      case "LOCKED":
        return "bg-rose-50 text-rose-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const formatAccountNumber = (number?: string) => {
    if (!number) return "-";
    return `${number.slice(0, 2)}-${number.slice(2, 6)}-${number.slice(6)}`;
  };

  return (
    <AdminShell title="사용자 상세 정보" description={userId ? `사용자 ID ${userId}` : "사용자 상세"}>
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => navigate("/admin/users")}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-[0_12px_30px_rgba(15,23,42,0.06)] transition hover:border-slate-300 hover:bg-slate-50"
        >
          <FiArrowLeft size={16} />
          사용자 목록으로
        </button>

        <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          {isLoading ? (
            <div className="py-16 text-center text-sm font-semibold text-slate-400">사용자 정보를 불러오는 중입니다.</div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                  <FiUser size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">이름</p>
                  <p className="mt-1 text-base font-bold text-slate-950">{userInfo?.name || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <FiMail size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">이메일</p>
                  <p className="mt-1 text-base font-bold text-slate-950">{userInfo?.email || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                  <FiPhone size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">전화번호</p>
                  <p className="mt-1 text-base font-bold text-slate-950">{userInfo?.phone || "-"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <FiCalendar size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">가입일</p>
                  <p className="mt-1 text-base font-bold text-slate-950">
                    {userInfo?.createdAt ? new Date(userInfo.createdAt).toLocaleDateString("ko-KR") : "-"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-700">
                  <FiActivity size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">상태</p>
                  <select
                    value={userInfo?.status || ""}
                    onChange={(e) => handleStatusChange(e.target.value as UserStatus)}
                    className={`mt-1 rounded-full px-3 py-1.5 text-xs font-bold outline-none ${getStatusBadgeStyle(
                      userInfo?.status || "ACTIVE",
                    )}`}
                  >
                    <option value="ACTIVE">활성</option>
                    <option value="INACTIVE">비활성</option>
                    <option value="LOCKED">잠금</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab("accounts")}
              className={`flex-1 px-6 py-4 text-sm font-bold transition ${
                activeTab === "accounts" ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiCreditCard />
                계좌 정보 ({accounts.length})
              </div>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("transactions")}
              className={`flex-1 px-6 py-4 text-sm font-bold transition ${
                activeTab === "transactions" ? "bg-slate-950 text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FiActivity />
                거래 내역 ({transactions.length})
              </div>
            </button>
          </div>

          <div className="p-6">
            {activeTab === "accounts" ? (
              accounts.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {accounts.map((account) => (
                    <article key={account.accountId} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-950">{account.bankName}</p>
                          <p className="mt-1 text-sm font-medium text-slate-500">{formatAccountNumber(account.accountNumber)}</p>
                        </div>
                        {account.main && (
                          <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-bold text-cyan-700">주계좌</span>
                        )}
                      </div>
                      <p className="mt-5 text-2xl font-black text-slate-950">{account.balance.toLocaleString("ko-KR")}원</p>
                      <p className="mt-2 text-xs font-medium text-slate-400">
                        개설일 {new Date(account.createdAt).toLocaleDateString("ko-KR")}
                      </p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="py-16 text-center text-sm font-semibold text-slate-400">등록된 계좌가 없습니다.</div>
              )
            ) : transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <article key={transaction.transactionId} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-950">거래 #{transaction.transactionId}</p>
                        <p className="mt-1 text-sm font-medium text-slate-500">
                          {formatAccountNumber(transaction.senderAccount?.accountNumber)} →{" "}
                          {formatAccountNumber(transaction.receiverAccount?.accountNumber)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-cyan-700">{transaction.amount.toLocaleString("ko-KR")}원</p>
                        <p className="mt-1 text-xs font-medium text-slate-400">
                          {new Date(transaction.transactionDate).toLocaleString("ko-KR")}
                        </p>
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{transaction.description || "설명 없음"}</p>
                  </article>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center text-sm font-semibold text-slate-400">거래 내역이 없습니다.</div>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
};

export default AdminUserDetail;
