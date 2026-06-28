import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  Bell,
  ChevronDown,
  SearchX,
} from "lucide-react";
import { getMyAccounts, getTransactionHistory } from "../api/UserAPI";
import { Account, Transaction } from "../types";
import { getUserData } from "../utils/storage";
import { formatAccountNumber, formatCurrency } from "../utils/formatters";
import UserSidebar from "../components/UserSidebar";

const TransactionHistory: React.FC = () => {
  const navigate = useNavigate();
  const user = useMemo(() => getUserData(), []);
  const userId = user?.userId;

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<string>("전체");
  const [dateFilter, setDateFilter] = useState<string>("전체");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }
    getMyAccounts()
      .then((data) => {
        setAccounts(data);
        if (data.length > 0) setSelectedAccountId(data[0].accountId);
      })
      .catch((err) => console.error("계좌 조회 실패:", err));
  }, [navigate, userId]);

  useEffect(() => {
    if (!selectedAccountId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getTransactionHistory(selectedAccountId)
      .then((data) => setTransactions(data))
      .catch((err) => console.error("거래 내역 조회 실패:", err))
      .finally(() => setLoading(false));
  }, [selectedAccountId]);

  const filteredTransactions = transactions.filter((tx) => {
    const isSent = tx.senderAccount?.accountId === selectedAccountId;
    let isValid = true;
    if (filterType === "입금" && isSent) isValid = false;
    if (filterType === "출금" && !isSent) isValid = false;
    const txDate = tx.transactionDate ? new Date(tx.transactionDate) : null;
    if (txDate) {
      const now = new Date();
      if (dateFilter === "1개월") {
        const ago = new Date(); ago.setMonth(now.getMonth() - 1);
        if (txDate < ago) isValid = false;
      } else if (dateFilter === "3개월") {
        const ago = new Date(); ago.setMonth(now.getMonth() - 3);
        if (txDate < ago) isValid = false;
      } else if (dateFilter === "6개월") {
        const ago = new Date(); ago.setMonth(now.getMonth() - 6);
        if (txDate < ago) isValid = false;
      }
    }
    return isValid;
  });

  const groupedByDate = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((tx) => {
      const date = tx.transactionDate
        ? new Date(tx.transactionDate).toLocaleDateString("ko-KR", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "short",
          })
        : "날짜 없음";
      if (!groups[date]) groups[date] = [];
      groups[date].push(tx);
    });
    return groups;
  }, [filteredTransactions]);

  const selectedAccount = accounts.find((acc) => acc.accountId === selectedAccountId);

  const totalIn = filteredTransactions.reduce((s, tx) => {
    return tx.senderAccount?.accountId !== selectedAccountId ? s + Number(tx.amount || 0) : s;
  }, 0);
  const totalOut = filteredTransactions.reduce((s, tx) => {
    return tx.senderAccount?.accountId === selectedAccountId ? s + Number(tx.amount || 0) : s;
  }, 0);

  return (
    <div className="min-h-screen bg-[#eef3fb] p-3 text-slate-900 lg:p-4">
      <div className="mx-auto grid max-w-[1440px] gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        <UserSidebar />

        <main className="flex flex-col gap-5">
          {/* Header */}
          <header className="rounded-[28px] border border-white/70 bg-white/90 px-5 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/dashboard")}
                  className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h1 className="text-[2rem] font-black tracking-tight text-slate-950">거래 내역</h1>
                  <p className="text-sm font-semibold text-slate-400">계좌별 입출금 내역 조회</p>
                </div>
              </div>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300"
                onClick={() => navigate("/notifications")}
              >
                <Bell size={18} />
              </button>
            </div>
          </header>

          {/* Account selector + filters */}
          <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              {/* Account dropdown */}
              <div className="relative flex-1">
                <select
                  className="w-full appearance-none rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  value={selectedAccountId ?? ""}
                  onChange={(e) => setSelectedAccountId(Number(e.target.value))}
                >
                  {accounts.map((acc) => (
                    <option key={acc.accountId} value={acc.accountId}>
                      {acc.accountName} · {formatAccountNumber(acc.accountNumber)} · {formatCurrency(acc.balance)}
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>

              {/* Type filter */}
              <div className="flex rounded-[16px] bg-slate-100 p-1">
                {["전체", "입금", "출금"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFilterType(type)}
                    className={`rounded-[12px] px-4 py-2 text-sm font-bold transition ${
                      filterType === type
                        ? "bg-white text-slate-900 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Date filter */}
              <div className="relative">
                <select
                  className="appearance-none rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 pr-8 text-sm font-bold text-slate-700 transition focus:border-slate-400 focus:outline-none"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="전체">전체 기간</option>
                  <option value="1개월">최근 1개월</option>
                  <option value="3개월">최근 3개월</option>
                  <option value="6개월">최근 6개월</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold text-slate-400">총 거래 건수</p>
              <p className="mt-1 text-[1.8rem] font-black text-slate-950">{filteredTransactions.length}건</p>
            </div>
            <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold text-slate-400">총 입금</p>
              <p className="mt-1 text-[1.8rem] font-black text-cyan-600">+{formatCurrency(totalIn)}</p>
            </div>
            <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold text-slate-400">총 출금</p>
              <p className="mt-1 text-[1.8rem] font-black text-rose-500">-{formatCurrency(totalOut)}</p>
            </div>
          </div>

          {/* Transaction list */}
          <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
              </div>
            ) : Object.keys(groupedByDate).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupedByDate).map(([date, txs]) => (
                  <div key={date}>
                    <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">{date}</p>
                    <div className="space-y-2">
                      {txs.map((tx) => {
                        const isSent = tx.senderAccount?.accountId === selectedAccountId;
                        const counterparty = isSent ? tx.receiverAccount : tx.senderAccount;
                        return (
                          <div
                            key={tx.transactionId}
                            className="flex items-center justify-between rounded-[20px] bg-slate-50 px-4 py-3.5 transition hover:bg-slate-100"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isSent ? "bg-rose-100" : "bg-cyan-100"}`}>
                                {isSent ? (
                                  <ArrowUpCircle size={18} className="text-rose-500" />
                                ) : (
                                  <ArrowDownCircle size={18} className="text-cyan-600" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-black text-slate-950">
                                  {counterparty?.bankName || (isSent ? "출금" : "입금")}
                                </p>
                                <p className="mt-0.5 text-xs font-semibold text-slate-400">
                                  {tx.memo || tx.description || tx.category || "-"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`text-base font-black ${isSent ? "text-rose-500" : "text-cyan-700"}`}>
                                {isSent ? "-" : "+"}
                                {formatCurrency(tx.amount)}
                              </p>
                              <p className="mt-0.5 text-xs font-semibold text-slate-400">
                                {tx.category || "미분류"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <SearchX size={28} className="text-slate-400" />
                </div>
                <p className="text-base font-bold text-slate-500">거래 내역이 없습니다</p>
                <p className="mt-1 text-sm font-medium text-slate-400">필터 조건을 변경해 보세요.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TransactionHistory;
