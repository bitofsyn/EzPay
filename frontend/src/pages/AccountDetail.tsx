import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownCircle,
  ArrowLeft,
  ArrowUpCircle,
  Bell,
  CreditCard,
  SendHorizontal,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import CountUp from "react-countup";
import { getMyAccounts, getTransactionHistory } from "../api/UserAPI";
import { Account, Transaction } from "../types";
import {
  parseDate,
  formatDateShort,
  formatDateFull,
  formatAccountNumber,
  formatAmount,
  _formatCurrency,
} from "../utils/formatters";
import { AccountCardSkeleton, TransactionListSkeleton, Skeleton } from "../components/Skeleton";
import UserSidebar from "../components/UserSidebar";

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
  const [pageLoading, setPageLoading] = useState(true);

  const isOutgoing = (tx: Transaction, accountId: number): boolean =>
    tx.senderAccount?.accountId === accountId;

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
        setTransactions([...sortedTx].reverse());

        const summaryData = sortedTx.reduce(
          (acc, t) => {
            const isOut = isOutgoing(t, currentAccountId);
            if (isOut) { acc.totalOut += t.amount; acc.countOut += 1; }
            else { acc.totalIn += t.amount; acc.countIn += 1; }
            return acc;
          },
          { totalIn: 0, totalOut: 0, countIn: 0, countOut: 0 }
        );
        setSummary(summaryData);

        let runningBalance = found.balance;
        const reversedChart: ChartDataPoint[] = [...sortedTx].reverse().map((t) => {
          const isOut = isOutgoing(t, currentAccountId);
          runningBalance += isOut ? t.amount : -t.amount;
          return { date: formatDateFull(t.transactionDate), balance: runningBalance };
        });
        setChartData(reversedChart.reverse());
      } catch (err) {
        console.error("계좌 상세 조회 실패", err);
      } finally {
        setPageLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (pageLoading || !account) {
    return (
      <div className="min-h-screen bg-[#eef3fb] p-3 lg:p-4">
        <div className="mx-auto grid max-w-[1440px] gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
          <UserSidebar />
          <div className="space-y-5">
            <AccountCardSkeleton />
            <div className="grid grid-cols-2 gap-5">
              <Skeleton className="h-28 rounded-[28px]" />
              <Skeleton className="h-28 rounded-[28px]" />
            </div>
            <div className="rounded-[28px] bg-white p-5 shadow-sm">
              <Skeleton className="mb-4 h-6 w-36" />
              <TransactionListSkeleton count={4} />
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                  onClick={() => navigate("/accounts")}
                  className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h1 className="text-[2rem] font-black tracking-tight text-slate-950">계좌 상세</h1>
                  <p className="text-sm font-semibold text-slate-400">{account.bankName || "EzPay Bank"}</p>
                </div>
              </div>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300"
                onClick={() => navigate("/settings/notification")}
              >
                <Bell size={18} />
              </button>
            </div>
          </header>

          {/* Hero card */}
          <div className="rounded-[28px] bg-gradient-to-r from-[#264997] via-[#175f8b] to-[#17667b] p-6 text-white shadow-[0_30px_70px_rgba(23,53,120,0.32)]">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-white/70">{account.bankName || "EzPay Bank"}</p>
                  {account.isMain && (
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white">대표</span>
                  )}
                </div>
                <p className="mt-1 text-sm tracking-[0.14em] text-white/50">
                  {formatAccountNumber(account.accountNumber)}
                </p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/20">
                <CreditCard size={20} />
              </div>
            </div>

            <div className="mt-5">
              <p className="text-sm font-semibold text-white/60">현재 잔액</p>
              <p className="mt-1 text-[2.8rem] font-black tracking-tight">
                <CountUp end={account.balance} duration={1.5} separator="," />
                <span className="ml-2 text-xl font-bold text-white/60">원</span>
              </p>
            </div>

            {/* Balance chart */}
            {chartData.length > 0 && (
              <div className="mt-5 h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ left: 0, right: 0, top: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="detailFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ffffff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ffffff" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
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
                      contentStyle={{ background: "rgba(15,23,42,0.9)", border: "none", borderRadius: 12, color: "#fff", fontSize: 12 }}
                    />
                    <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.1)" />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke="rgba(255,255,255,0.8)"
                      strokeWidth={2.5}
                      fill="url(#detailFill)"
                      dot={false}
                      activeDot={{ r: 6, fill: "#fff", stroke: "rgba(255,255,255,0.5)", strokeWidth: 3 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Action buttons */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => navigate("/send")}
                className="flex items-center justify-center gap-2 rounded-[16px] bg-white/14 py-3 text-sm font-bold transition hover:bg-white/20"
              >
                <SendHorizontal size={16} />
                송금하기
              </button>
              <button
                type="button"
                onClick={() => navigate("/transactions")}
                className="flex items-center justify-center gap-2 rounded-[16px] bg-white/14 py-3 text-sm font-bold transition hover:bg-white/20"
              >
                거래 내역 보기
              </button>
            </div>
          </div>

          {/* Summary cards */}
          {transactions.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-100">
                    <TrendingDown size={18} className="text-cyan-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400">총 입금</p>
                    <p className="text-[1.5rem] font-black text-cyan-700">
                      +{formatAmount(summary.totalIn)}원
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-400">{summary.countIn}건</p>
                <div className="mt-3 h-1.5 rounded-full bg-slate-100">
                  <div
                    className="h-1.5 rounded-full bg-cyan-400 transition-all duration-700"
                    style={{
                      width: `${summary.totalIn + summary.totalOut > 0
                        ? (summary.totalIn / (summary.totalIn + summary.totalOut)) * 100
                        : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-100">
                    <TrendingUp size={18} className="text-rose-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400">총 출금</p>
                    <p className="text-[1.5rem] font-black text-rose-500">
                      -{formatAmount(summary.totalOut)}원
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs font-semibold text-slate-400">{summary.countOut}건</p>
                <div className="mt-3 h-1.5 rounded-full bg-slate-100">
                  <div
                    className="h-1.5 rounded-full bg-rose-400 transition-all duration-700"
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

          {/* Transaction list */}
          <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[1.4rem] font-black tracking-tight text-slate-950">최근 거래 내역</h2>
              <button
                type="button"
                onClick={() => navigate("/transactions")}
                className="text-sm font-semibold text-cyan-600 transition hover:text-cyan-800"
              >
                전체보기
              </button>
            </div>

            {transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.map((tx) => {
                  const currentAccountId = parseInt(id || "0");
                  const isSent = isOutgoing(tx, currentAccountId);
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
                            {isSent ? "출금" : "입금"}
                            {counterparty?.bankName && (
                              <span className="ml-1 font-semibold text-slate-400">
                                ({counterparty.bankName})
                              </span>
                            )}
                          </p>
                          <p className="mt-0.5 text-xs font-semibold text-slate-400">
                            {formatDateShort(tx.transactionDate)}
                          </p>
                        </div>
                      </div>
                      <p className={`text-base font-black ${isSent ? "text-rose-500" : "text-cyan-700"}`}>
                        {(isSent ? "-" : "+") + formatAmount(tx.amount)}원
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm font-semibold text-slate-400">거래 내역이 없습니다.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AccountDetail;
