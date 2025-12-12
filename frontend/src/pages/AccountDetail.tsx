import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMyAccounts, getTransactionHistory } from "../api/UserAPI";
import {
  LineChart,
  Line,
  Tooltip,
  ResponsiveContainer,
  YAxis,
  XAxis,
} from "recharts";
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown } from "lucide-react";
import CountUp from "react-countup";
import { Account, Transaction } from "../types";
import {
  parseDate,
  formatDateShort,
  formatDateFull,
  formatAccountNumber,
  formatAmount
} from "../utils/formatters";
import {
  AccountCardSkeleton,
  TransactionListSkeleton,
  Skeleton
} from "../components/Skeleton";

interface AccountWithBank extends Account {
  bankName?: string;
}

interface ChartDataPoint {
  date: string;
  balance: number;
}

interface TransactionSummary {
  totalIn: number;
  totalOut: number;
  countIn: number;
  countOut: number;
}

const AccountDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<AccountWithBank | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [summary, setSummary] = useState<TransactionSummary>({
    totalIn: 0,
    totalOut: 0,
    countIn: 0,
    countOut: 0,
  });

  // 출금 여부 판단 헬퍼 함수
  const isOutgoing = (tx: Transaction, accountId: number): boolean => {
    return tx.senderAccount?.accountId === accountId;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const currentAccountId = parseInt(id);

        const accounts = await getMyAccounts();
        const found = (accounts as AccountWithBank[]).find(
          (acc) => acc.accountId === currentAccountId
        );
        setAccount(found || null);

        if (!found) return;

        const tx = await getTransactionHistory(currentAccountId);
        const sortedTx = [...tx].sort(
          (a, b) => parseDate(a.transactionDate).getTime() - parseDate(b.transactionDate).getTime()
        );

        setTransactions([...sortedTx].reverse()); // 최신순으로 보여줌

        // 입출금 요약 계산
        const summaryData = sortedTx.reduce(
          (acc, t) => {
            const isOut = isOutgoing(t, currentAccountId);
            if (isOut) {
              acc.totalOut += t.amount;
              acc.countOut += 1;
            } else {
              acc.totalIn += t.amount;
              acc.countIn += 1;
            }
            return acc;
          },
          { totalIn: 0, totalOut: 0, countIn: 0, countOut: 0 }
        );
        setSummary(summaryData);

        // 잔액 그래프 계산
        let runningBalance = found.balance;
        const reversed = [...sortedTx].reverse();

        const reversedChart: ChartDataPoint[] = reversed.map((t) => {
          const isOut = isOutgoing(t, currentAccountId);
          if (isOut) {
            runningBalance += t.amount; // 내가 보낸 경우: 이전 잔액은 더 커야 함
          } else {
            runningBalance -= t.amount; // 내가 받은 경우: 이전 잔액은 더 작음
          }
          return {
            date: formatDateFull(t.transactionDate),
            balance: runningBalance,
          };
        });

        setChartData(reversedChart.reverse());
      } catch (err) {
        console.error("계좌 상세 조회 실패", err);
      }
    };
    fetchData();
  }, [id]);

  if (!account) {
    return (
      <div className="min-h-screen flex flex-col items-center bg-gray-100 p-6">
        <AccountCardSkeleton />
        <div className="grid grid-cols-2 gap-4 mt-6 w-full max-w-lg">
          <div className="bg-white shadow-md rounded-2xl p-4">
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="bg-white shadow-md rounded-2xl p-4">
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
        <div className="bg-white mt-8 p-6 shadow-md rounded-2xl w-full max-w-lg">
          <Skeleton className="h-6 w-32 mb-4" />
          <TransactionListSkeleton count={3} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 p-6">
      {/* 상단 카드 */}
      <div className="bg-white shadow-md rounded-2xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {account.bankName}
            </h2>
            <p className="text-sm text-gray-400">
              {formatAccountNumber(account.accountNumber)}
            </p>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            <CountUp end={account.balance} duration={1.5} separator="," /> 원
          </p>
        </div>

        {/* 잔액 그래프 */}
        <div className="w-full h-40 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              {/* 날짜 기준 x축 추가 */}
              <XAxis dataKey="date" hide />

              <YAxis
                domain={
                  chartData.length
                    ? [
                      Math.min(...chartData.map((d) => d.balance)) - 5000,
                      Math.max(...chartData.map((d) => d.balance)) + 5000,
                    ]
                    : [0, 100000]
                }
                hide
              />
              <Tooltip
                labelFormatter={(label) => `날짜: ${label}`}
                formatter={(value) => [`잔액: ${(value as number).toLocaleString()} 원`]}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>

        </div>
      </div>

      {/* 입출금 요약 */}
      {transactions.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mt-6 w-full max-w-lg">
          {/* 입금 요약 */}
          <div className="bg-white shadow-md rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-sky-100 rounded-full">
                <TrendingDown className="text-sky-500" size={18} />
              </div>
              <span className="text-sm text-gray-500">총 입금</span>
            </div>
            <p className="text-xl font-bold text-sky-600">
              +{formatAmount(summary.totalIn)} 원
            </p>
            <p className="text-xs text-gray-400 mt-1">{summary.countIn}건</p>
            {/* 비율 바 */}
            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-400 rounded-full transition-all duration-500"
                style={{
                  width: `${summary.totalIn + summary.totalOut > 0
                    ? (summary.totalIn / (summary.totalIn + summary.totalOut)) * 100
                    : 0}%`,
                }}
              />
            </div>
          </div>

          {/* 출금 요약 */}
          <div className="bg-white shadow-md rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-rose-100 rounded-full">
                <TrendingUp className="text-rose-500" size={18} />
              </div>
              <span className="text-sm text-gray-500">총 출금</span>
            </div>
            <p className="text-xl font-bold text-rose-500">
              -{formatAmount(summary.totalOut)} 원
            </p>
            <p className="text-xs text-gray-400 mt-1">{summary.countOut}건</p>
            {/* 비율 바 */}
            <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-400 rounded-full transition-all duration-500"
                style={{
                  width: `${summary.totalIn + summary.totalOut > 0
                    ? (summary.totalOut / (summary.totalIn + summary.totalOut)) * 100
                    : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* 거래 내역 */}
      <div className="bg-white mt-8 p-6 shadow-md rounded-2xl w-full max-w-lg">
        <h3 className="text-lg font-bold text-slate-800 mb-4">최근 거래 내역</h3>
        {transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((tx) => {
              const currentAccountId = parseInt(id || "0");
              const isSent = isOutgoing(tx, currentAccountId);
              const counterparty = isSent ? tx.receiverAccount : tx.senderAccount;

              return (
                <div
                  key={tx.transactionId}
                  className="flex justify-between items-center bg-gray-50 p-4 rounded-xl hover:bg-gray-100 transition"
                >
                  <div className="flex items-center gap-2">
                    {isSent ? (
                      <ArrowUpCircle className="text-rose-500" size={20} />
                    ) : (
                      <ArrowDownCircle className="text-sky-500" size={20} />
                    )}
                    <div>
                      <p className="text-sm font-semibold text-gray-700">
                        {isSent ? "출금" : "입금"}
                        {counterparty?.bankName && (
                          <span className="text-gray-400 font-normal ml-1">
                            ({counterparty.bankName})
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDateShort(tx.transactionDate)}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`text-base font-bold ${isSent ? "text-rose-500" : "text-sky-600"
                      }`}
                  >
                    {(isSent ? "-" : "+") + formatAmount(tx.amount)} 원
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">거래 내역이 없습니다.</p>
        )}
      </div>

      {/* 대시보드 이동 */}
      <button
        onClick={() => navigate("/dashboard")}
        className="mt-8 bg-gray-700 text-white font-semibold py-2 px-6 rounded-xl hover:bg-gray-800"
      >
        대시보드로 이동
      </button>
    </div>
  );
};

export default AccountDetail;
