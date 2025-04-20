import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getMyAccounts, getTransactionHistory } from "../api/UserAPI";
import { LineChart, Line, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import CountUp from "react-countup";

const AccountDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [account, setAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accounts = await getMyAccounts();
        const found = accounts.data.find((acc) => acc.accountId === parseInt(id));
        setAccount(found);

        const tx = await getTransactionHistory(parseInt(id));
        const sortedTx = [...tx.data].sort(
          (a, b) => new Date(a.transactionDate) - new Date(b.transactionDate)
        );
        setTransactions(sortedTx);

        const chart = sortedTx.map((tx, idx) => ({
          name: idx + 1,
          amount: tx.balanceAfterTransaction || 0,
        }));
        setChartData(chart);
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

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-100 p-6">
      {/* 상단 정보 카드 */}
      <div className="bg-white shadow-md rounded-2xl p-6 w-full max-w-lg">
        {/* 수정된 flex 구조 */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{account.bankName}</h2>
            <p className="text-sm text-gray-400">{account.accountNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-slate-900">
              <CountUp end={account.balance} duration={1.5} separator="," /> 원
            </p>
          </div>
        </div>

        {/* 그래프 */}
        <div className="w-full h-40 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <Tooltip formatter={(value) => `${value.toLocaleString()} 원`} />
              <Line type="monotone" dataKey="amount" stroke="#38bdf8" strokeWidth={2} dot={false} />
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
              const isSent = tx.type === "WITHDRAW";
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
                      <p className="text-sm font-semibold text-gray-700">{isSent ? "출금" : "입금"}</p>
                      <p className="text-xs text-gray-400">{new Date(tx.transactionDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className={`text-base font-bold ${isSent ? "text-rose-500" : "text-sky-600"}`}>
                    {(isSent ? "-" : "+") + Number(tx.amount).toLocaleString()} 원
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">거래 내역이 없습니다.</p>
        )}
      </div>

      {/* 대시보드 이동 버튼 */}
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
