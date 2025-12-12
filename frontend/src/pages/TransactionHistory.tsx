import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getTransactionHistory, getMyAccounts } from "../api/UserAPI";
import { ArrowDownCircle, ArrowUpCircle, Copy, ChevronDown } from "lucide-react";
import { Account, Transaction } from "../types";
import toast from "react-hot-toast";

const TransactionHistory: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [myAccountNumber, setMyAccountNumber] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("전체");
  const [dateFilter, setDateFilter] = useState<string>("전체");
  const [loading, setLoading] = useState<boolean>(true);

  // 계좌 목록 조회
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await getMyAccounts();
        setAccounts(data);
        if (data.length > 0) {
          const mainAccount = data.find(acc => (acc as any).main === true || acc.isMain === true) || data[0];
          setSelectedAccountId(mainAccount.accountId);
          setMyAccountNumber(mainAccount.accountNumber);
        }
      } catch (err) {
        console.error("계좌 조회 실패:", err);
      }
    };
    fetchAccounts();
  }, []);

  // 선택된 계좌의 거래 내역 조회
  useEffect(() => {
    if (!selectedAccountId) return;

    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const txData = await getTransactionHistory(selectedAccountId);
        const sorted = [...txData].sort(
          (a, b) => new Date((b as any).transactionDate).getTime() - new Date((a as any).transactionDate).getTime()
        );
        setTransactions(sorted);
      } catch (err) {
        console.error("거래 내역 조회 실패:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [selectedAccountId]);

  const handleAccountChange = (accountId: number) => {
    setSelectedAccountId(accountId);
    const account = accounts.find(acc => acc.accountId === accountId);
    if (account) setMyAccountNumber(account.accountNumber);
  };

  const filteredTransactions = transactions.filter((tx) => {
    let isValid = true;

    const txAny = tx as any;
    const isSent = txAny.senderAccount?.accountNumber === myAccountNumber;

    if (filterType !== "전체") {
      if (filterType === "입금" && isSent) isValid = false;
      if (filterType === "출금" && !isSent) isValid = false;
    }

    const transactionDate = new Date(txAny.transactionDate);
    const currentDate = new Date();

    if (dateFilter === "1개월") {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(currentDate.getMonth() - 1);
      if (transactionDate < oneMonthAgo) isValid = false;
    } else if (dateFilter === "3개월") {
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(currentDate.getMonth() - 3);
      if (transactionDate < threeMonthsAgo) isValid = false;
    } else if (dateFilter === "6개월") {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(currentDate.getMonth() - 6);
      if (transactionDate < sixMonthsAgo) isValid = false;
    }

    return isValid;
  });

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  const formatAccountNumber = (accountNumber: string): string => {
    if (!accountNumber || accountNumber.length < 8) return accountNumber;
    return `${accountNumber.slice(0, 2)}-${accountNumber.slice(2, 5)}-${accountNumber.slice(5)}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("계좌번호가 복사되었습니다.");
  };

  const formatAccountNumberShort = (num: string) => {
    if (!num || num.length < 4) return num;
    return `****${num.slice(-4)}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">거래 내역</h2>

      {/* 필터 영역 */}
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-md p-4 space-y-3">
        {/* 계좌 선택 */}
        {accounts.length > 1 && (
          <div className="relative">
            <select
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-700 appearance-none cursor-pointer focus:ring-2 focus:ring-blue-200 focus:outline-none"
              value={selectedAccountId || ""}
              onChange={(e) => handleAccountChange(Number(e.target.value))}
            >
              {accounts.map((acc) => (
                <option key={acc.accountId} value={acc.accountId}>
                  {(acc as any).bankName || "계좌"} {formatAccountNumberShort(acc.accountNumber)}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        )}

        {/* 필터 버튼 */}
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

      {/* 거래 건수 */}
      <div className="w-full max-w-lg mt-4 px-1">
        <p className="text-sm text-gray-500">
          총 <span className="font-semibold text-gray-700">{filteredTransactions.length}</span>건
        </p>
      </div>

      {/* 거래 리스트 */}
      <div className="w-full max-w-lg mt-3 space-y-2">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : filteredTransactions.length > 0 ? (
          filteredTransactions.map((tx) => {
            const txAny = tx as any;
            const isSent = txAny.senderAccount?.accountNumber === myAccountNumber;
            const targetAccount = isSent
              ? txAny.receiverAccount?.accountNumber
              : txAny.senderAccount?.accountNumber;
            return (
              <div
                key={tx.transactionId}
                className="flex justify-between items-center bg-white rounded-xl px-4 py-3 hover:bg-gray-50 transition cursor-pointer"
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
                    {targetAccount && (
                      <div className="flex items-center gap-1 mt-0.5">
                        <p className="text-xs text-gray-400">{formatAccountNumber(targetAccount)}</p>
                        <Copy
                          className="w-3 h-3 text-gray-300 cursor-pointer hover:text-gray-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(targetAccount);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${isSent ? "text-rose-500" : "text-sky-600"}`}>
                    {(isSent ? "-" : "+")}{Number(tx.amount).toLocaleString()}원
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate((tx as any).transactionDate)}</p>
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

      {/* 대시보드 이동 */}
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
