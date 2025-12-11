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
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import CountUp from "react-countup";
import { Account, Transaction } from "../types";

interface AccountWithBank extends Account {
  bankName?: string;
}

interface ChartDataPoint {
  date: string;
  balance: number;
}

const AccountDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<AccountWithBank | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;

        const accounts = await getMyAccounts();
        const found = (accounts as AccountWithBank[]).find(
          (acc) => acc.accountId === parseInt(id)
        );
        setAccount(found || null);

        if (!found) return;

        const tx = await getTransactionHistory(parseInt(id));
        const sortedTx = [...tx].sort(
          (a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
        

        setTransactions([...sortedTx].reverse()); // 최신순으로 보여줌

        // 잔액 그래프 계산
        let runningBalance = found.balance;
        const reversed = [...sortedTx].reverse();

        const reversedChart: ChartDataPoint[] = reversed.map((tx) => {
          const isSent = tx.transactionType === 'WITHDRAW' || tx.transactionType === 'TRANSFER_OUT';
          if (isSent) {
            runningBalance += tx.amount; // 내가 보낸 경우: 이전 잔액은 더 커야 함
          } else {
            runningBalance -= tx.amount; // 내가 받은 경우: 이전 잔액은 더 작음
          }
          return {
            date: new Date(tx.createdAt).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            }),
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
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
        <p>계좌 정보를 불러오는 중...</p>
      </div>
    );
  }

  const formatAccountNumber = (number: string): string => {
    if (!number || number.length < 10) return number;
    return `${number.slice(0, 2)}-${number.slice(2, 6)}-${number.slice(6)}`;
  };

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

      {/* 거래 내역 */}
      <div className="bg-white mt-8 p-6 shadow-md rounded-2xl w-full max-w-lg">
        <h3 className="text-lg font-bold text-slate-800 mb-4">최근 거래 내역</h3>
        {transactions.length > 0 ? (
          <div className="space-y-4">
            {transactions.map((tx) => {
              const isSent = tx.transactionType === 'WITHDRAW' || tx.transactionType === 'TRANSFER_OUT';
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
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`text-base font-bold ${isSent ? "text-rose-500" : "text-sky-600"
                      }`}
                  >
                    {(isSent ? "-" : "+") +
                      Number(tx.amount).toLocaleString()}{" "}
                    원
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
