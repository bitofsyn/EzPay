import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowDownCircle, ArrowUpCircle, ChevronDown } from "lucide-react";
import { getMyAccounts, getTransactionHistory } from "../api/UserAPI";
import { Account, Transaction } from "../types";
import { getUserData } from "../utils/storage";
import { formatAccountNumber, formatCurrency } from "../utils/formatters";

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
        if (data.length > 0) {
          setSelectedAccountId(data[0].accountId);
        }
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

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "날짜 없음";
    return new Date(dateString).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">거래 내역</h2>
      <p className="text-sm text-gray-500 mb-6">계좌별 거래 내역을 조회합니다.</p>

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-md p-4 space-y-3">
        {accounts.length > 0 && (
          <div className="relative">
            <select
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-700 appearance-none cursor-pointer focus:ring-2 focus:ring-blue-200 focus:outline-none"
              value={selectedAccountId ?? ""}
              onChange={(e) => setSelectedAccountId(Number(e.target.value))}
            >
              {accounts.map((acc) => (
                <option key={acc.accountId} value={acc.accountId}>
                  {acc.accountName} · {formatAccountNumber(acc.accountNumber)} · {formatCurrency(acc.balance)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1 flex bg-gray-100 rounded-xl p-1">
            {["전체", "입금", "출금"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                  filterType === type
                    ? "bg-white text-gray-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
          <select
            className="px-3 py-2 bg-gray-100 rounded-xl text-sm text-gray-600 border-none focus:ring-2 focus:ring-blue-200 focus:outline-none"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="전체">전체</option>
            <option value="1개월">1개월</option>
            <option value="3개월">3개월</option>
            <option value="6개월">6개월</option>
          </select>
        </div>
      </div>

      <div className="w-full max-w-lg mt-4 px-1">
        <p className="text-sm text-gray-500">
          총 <span className="font-semibold text-gray-700">{filteredTransactions.length}</span>건
        </p>
      </div>

      <div className="w-full max-w-lg mt-3 space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filteredTransactions.length > 0 ? (
          filteredTransactions.map((tx) => {
            const isSent = tx.senderAccount?.accountId === selectedAccountId;
            return (
              <div
                key={tx.transactionId}
                className="flex justify-between items-center bg-white rounded-xl px-4 py-3 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${isSent ? "bg-rose-50" : "bg-sky-50"}`}>
                    {isSent ? (
                      <ArrowUpCircle className="w-5 h-5 text-rose-500" />
                    ) : (
                      <ArrowDownCircle className="w-5 h-5 text-sky-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{isSent ? "출금" : "입금"}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {tx.memo || tx.description || (isSent ? tx.receiverAccount?.accountNumber : tx.senderAccount?.accountNumber) || "-"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{tx.category || "미분류"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${isSent ? "text-rose-500" : "text-sky-600"}`}>
                    {isSent ? "-" : "+"}
                    {formatCurrency(tx.amount)}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(tx.transactionDate)}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">거래 내역이 없습니다.</p>
          </div>
        )}
      </div>

      <button
        onClick={() => navigate("/dashboard")}
        className="mt-8 px-6 py-3 bg-gray-800 text-white font-medium rounded-xl hover:bg-gray-700 transition"
      >
        대시보드로 이동
      </button>
    </div>
  );
};

export default TransactionHistory;
