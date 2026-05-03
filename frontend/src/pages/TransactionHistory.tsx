import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowDownCircle, ArrowUpCircle, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { getFinancialConnections, getNormalizedTransactions } from "../api/UserAPI";
import { FinancialConnection, NormalizedTransactionRecord } from "../types";
import { getUserData } from "../utils/storage";

const TransactionHistory: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useMemo(() => getUserData(), []);
  const userId = user?.userId;

  const [connections, setConnections] = useState<FinancialConnection[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<NormalizedTransactionRecord[]>([]);
  const [filterType, setFilterType] = useState<string>("전체");
  const [dateFilter, setDateFilter] = useState<string>("전체");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const summary = (location.state as any)?.syncSummary;
    if (summary?.syncedCount !== undefined) {
      toast.success(`${summary.syncedCount}건의 거래를 동기화했습니다.`);
    }
  }, [location.state]);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }

    const fetchConnections = async () => {
      try {
        const data = await getFinancialConnections(userId);
        setConnections(data);
        if (data.length > 0) {
          setSelectedConnectionId(data[0].connectionId);
        }
      } catch (err) {
        console.error("연결 목록 조회 실패:", err);
      }
    };

    fetchConnections();
  }, [navigate, userId]);

  useEffect(() => {
    if (!userId) {
      return;
    }

    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const txData = await getNormalizedTransactions(userId, selectedConnectionId ?? undefined);
        setTransactions(txData);
      } catch (err) {
        console.error("정규화 거래 조회 실패:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [selectedConnectionId, userId]);

  const filteredTransactions = transactions.filter((tx) => {
    let isValid = true;
    const isOutflow = tx.direction === "OUTFLOW";
    const transactionDate = tx.postedAt ? new Date(tx.postedAt) : null;
    const currentDate = new Date();

    if (filterType !== "전체") {
      if (filterType === "입금" && isOutflow) isValid = false;
      if (filterType === "출금" && !isOutflow) isValid = false;
    }

    if (!transactionDate) {
      return isValid;
    }

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

  const formatDate = (dateString?: string): string => {
    if (!dateString) {
      return "날짜 없음";
    }
    const date = new Date(dateString);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">거래 내역</h2>
      <p className="text-sm text-gray-500 mb-6">동기화된 실제 금융 거래 데이터를 기준으로 분석합니다.</p>

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-md p-4 space-y-3">
        {connections.length > 0 && (
          <div className="relative">
            <select
              className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-700 appearance-none cursor-pointer focus:ring-2 focus:ring-blue-200 focus:outline-none"
              value={selectedConnectionId ?? ""}
              onChange={(e) => setSelectedConnectionId(Number(e.target.value))}
            >
              {connections.map((connection) => (
                <option key={connection.connectionId} value={connection.connectionId}>
                  {connection.provider} · {connection.connectionReference}
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
            const isOutflow = tx.direction === "OUTFLOW";
            return (
              <div
                key={tx.normalizedTransactionId ?? tx.providerTransactionId}
                className="flex justify-between items-center bg-white rounded-xl px-4 py-3 hover:bg-gray-50 transition"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${isOutflow ? "bg-rose-50" : "bg-sky-50"}`}>
                    {isOutflow ? (
                      <ArrowUpCircle className="w-5 h-5 text-rose-500" />
                    ) : (
                      <ArrowDownCircle className="w-5 h-5 text-sky-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{isOutflow ? "출금" : "입금"}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {tx.merchantName || tx.description || "거래 설명 없음"}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {tx.primaryCategory || "미분류"}{tx.pending ? " · pending" : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${isOutflow ? "text-rose-500" : "text-sky-600"}`}>
                    {isOutflow ? "-" : "+"}
                    {Number(tx.amount).toLocaleString()}원
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDate(tx.postedAt)}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">동기화된 거래 내역이 없습니다.</p>
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
