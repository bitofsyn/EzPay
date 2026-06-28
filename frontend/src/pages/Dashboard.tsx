import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlignJustify,
  ArrowDown,
  ArrowUp,
  Bell,
  ChevronRight,
  CreditCard,
  Landmark,
  LayoutDashboard,
  LogOut,
  Receipt,
  SendHorizontal,
  Settings,
  UserCircle2,
  Users,
  TrendingUp,
  Wallet,
  Activity,
} from "lucide-react";
import { getDashboardInfo } from "../api/UserAPI";
import {
  formatAccountNumber,
  formatCurrency,
  formatDateShort,
  parseDate,
} from "../utils/formatters";
import { clearUserData } from "../utils/storage";
import { Account, Transaction, User } from "../types";
import { Skeleton } from "../components/Skeleton";

interface DashboardAccount extends Account {
  main?: boolean;
  bankName?: string;
}

type DashboardTransaction = Transaction;

type BudgetItem = {
  label: string;
  spent: number;
  budget: number;
  tone: string;
};

const monthLabels = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

const normalizeAccounts = (accountList: DashboardAccount[]): DashboardAccount[] =>
  accountList.map((account) => ({
    ...account,
    main: account.main ?? account.isMain ?? false,
  }));

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<DashboardAccount[]>([]);
  const [transactions, setTransactions] = useState<DashboardTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const todayLabel = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  useEffect(() => {
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const fetchDashboard = async () => {
      try {
        const dashboardRes = await getDashboardInfo();
        setAccounts(normalizeAccounts(dashboardRes.data?.account || []));
        setTransactions((dashboardRes.data?.transactions || []) as DashboardTransaction[]);

        if (dashboardRes.data?.user) {
          setUser(dashboardRes.data.user);
        }
      } catch (error) {
        console.error("대시보드 조회 실패:", error);
        clearUserData();
        navigate("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [navigate]);

  const sortedAccounts = useMemo(() => {
    return [...accounts].sort((a, b) => {
      const aIsMain = a.main ?? a.isMain ?? false;
      const bIsMain = b.main ?? b.isMain ?? false;
      if (aIsMain === bIsMain) return a.accountId - b.accountId;
      return aIsMain ? -1 : 1;
    });
  }, [accounts]);

  const ownAccountIds = useMemo(
    () => new Set(sortedAccounts.map((account) => account.accountId)),
    [sortedAccounts]
  );

  const mainAccount = sortedAccounts[0] ?? null;
  const totalBalance = sortedAccounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const unreadNotifications = Math.min(transactions.length, 3);

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const currentMonthTx = transactions.filter((t) => {
      const d = parseDate(t.transactionDate);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });

    const totalSent = currentMonthTx
      .filter((t) => ownAccountIds.has(t.senderAccount?.accountId))
      .reduce((s, t) => s + Number(t.amount || 0), 0);

    const totalReceived = currentMonthTx
      .filter(
        (t) =>
          ownAccountIds.has(t.receiverAccount?.accountId) &&
          !ownAccountIds.has(t.senderAccount?.accountId)
      )
      .reduce((s, t) => s + Number(t.amount || 0), 0);

    const averageAmount = currentMonthTx.length
      ? Math.round(currentMonthTx.reduce((s, t) => s + Number(t.amount || 0), 0) / currentMonthTx.length)
      : 0;

    return { totalSent, totalReceived, count: currentMonthTx.length, averageAmount };
  }, [ownAccountIds, transactions]);

  const monthlyExpenseData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }).map((_, index) => {
      const target = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const label = monthLabels[target.getMonth()];
      const amount = transactions.reduce((sum, t) => {
        const d = parseDate(t.transactionDate);
        const isSameMonth = d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth();
        const isOutgoing = ownAccountIds.has(t.senderAccount?.accountId);
        return isSameMonth && isOutgoing ? sum + Number(t.amount || 0) : sum;
      }, 0);
      return { month: label, amount };
    });
  }, [ownAccountIds, transactions]);

  const assetTrendData = useMemo(() => {
    const monthlyNetFlows = monthlyExpenseData.map((expenseItem) => {
      const monthNumber = Number(expenseItem.month.replace("월", ""));
      const incoming = transactions.reduce((sum, t) => {
        const d = parseDate(t.transactionDate);
        const isIncoming =
          ownAccountIds.has(t.receiverAccount?.accountId) &&
          !ownAccountIds.has(t.senderAccount?.accountId);
        return d.getMonth() + 1 === monthNumber && isIncoming ? sum + Number(t.amount || 0) : sum;
      }, 0);
      return incoming - expenseItem.amount;
    });

    const seed = Math.max(totalBalance - monthlyNetFlows.reduce((s, v) => s + v, 0), 0);
    let running = seed;
    return monthlyExpenseData.map((item, index) => {
      running += monthlyNetFlows[index];
      return { month: item.month, balance: Math.max(running, 0) };
    });
  }, [monthlyExpenseData, ownAccountIds, totalBalance, transactions]);

  const budgetItems = useMemo<BudgetItem[]>(() => {
    const defaultBudgets: Record<string, { label: string; budget: number; tone: string; keywords: string[] }> = {
      food: { label: "식비", budget: 300000, tone: "bg-slate-600", keywords: ["food", "meal", "cafe", "coffee", "식비", "카페", "음식"] },
      transport: { label: "교통", budget: 100000, tone: "bg-slate-500", keywords: ["transport", "taxi", "bus", "subway", "교통", "택시", "버스"] },
      housing: { label: "주거", budget: 700000, tone: "bg-amber-500", keywords: ["rent", "home", "house", "housing", "주거", "월세", "관리비"] },
    };
    const totals = { food: 0, transport: 0, housing: 0 };
    const now = new Date();

    transactions.forEach((t) => {
      const d = parseDate(t.transactionDate);
      const isOutgoing = ownAccountIds.has(t.senderAccount?.accountId);
      if (!isOutgoing || d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth()) return;
      const src = `${t.category || ""} ${t.memo || ""} ${t.description || ""}`.toLowerCase();
      if (defaultBudgets.food.keywords.some((k) => src.includes(k))) { totals.food += Number(t.amount || 0); return; }
      if (defaultBudgets.transport.keywords.some((k) => src.includes(k))) { totals.transport += Number(t.amount || 0); return; }
      totals.housing += Number(t.amount || 0);
    });

    return [
      { label: defaultBudgets.food.label, spent: totals.food, budget: defaultBudgets.food.budget, tone: defaultBudgets.food.tone },
      { label: defaultBudgets.transport.label, spent: totals.transport, budget: defaultBudgets.transport.budget, tone: defaultBudgets.transport.tone },
      { label: defaultBudgets.housing.label, spent: totals.housing, budget: defaultBudgets.housing.budget, tone: defaultBudgets.housing.tone },
    ];
  }, [ownAccountIds, transactions]);

  const frequentFriends = useMemo(() => {
    const outgoing = transactions.filter((t) => ownAccountIds.has(t.senderAccount?.accountId));
    const frequency: Record<number, { name: string; count: number }> = {};
    outgoing.forEach((t) => {
      const id = t.receiverAccount?.accountId;
      const name = t.receiverAccount?.bankName || "상대방";
      if (id != null) {
        if (!frequency[id]) frequency[id] = { name, count: 0 };
        frequency[id].count++;
      }
    });
    return Object.entries(frequency)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 4)
      .map(([id, { name }]) => ({ id: Number(id), name }));
  }, [ownAccountIds, transactions]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => parseDate(b.transactionDate).getTime() - parseDate(a.transactionDate).getTime())
      .slice(0, 5);
  }, [transactions]);

  const handleLogout = () => {
    clearUserData();
    navigate("/login");
  };

  const menuItems = [
    { label: "대시보드", icon: LayoutDashboard, onClick: () => navigate("/dashboard"), active: true },
    { label: "내 계좌", icon: CreditCard, onClick: () => navigate("/accounts"), active: false },
    { label: "송금하기", icon: SendHorizontal, onClick: () => navigate("/send"), active: false },
    { label: "친구", icon: Users, onClick: () => navigate("/send"), active: false },
    { label: "거래 내역", icon: Receipt, onClick: () => navigate("/transactions"), active: false },
    { label: "알림", icon: Bell, onClick: () => navigate("/notifications"), active: false },
    { label: "설정", icon: Settings, onClick: () => navigate("/settings"), active: false },
  ];

  const heroActions = [
    { label: "이체", Icon: ArrowUp, path: "/send" },
    { label: "충전", Icon: ArrowDown, path: "/accounts" },
    { label: "내역", Icon: AlignJustify, path: "/transactions" },
    { label: "친구", Icon: Users, path: "/send" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1a2847] to-[#0f172a] p-4 lg:p-5 relative overflow-hidden">
        {/* Background circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        </div>
        <div className="mx-auto grid max-w-[1440px] gap-5 lg:grid-cols-[250px_minmax(0,1fr)] relative z-10">
          <div className="rounded-[28px] bg-white/5 backdrop-blur-md p-5 border border-white/10">
            <Skeleton className="h-12 w-40 rounded-2xl" />
            <Skeleton className="mt-6 h-16 w-full rounded-[24px]" />
            <Skeleton className="mt-6 h-80 w-full rounded-[28px]" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-24 w-full rounded-[28px]" />
            <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
              <Skeleton className="h-96 w-full rounded-[28px]" />
              <Skeleton className="h-96 w-full rounded-[28px]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1a2847] to-[#0f172a] p-3 text-white lg:p-4 relative overflow-hidden">
      {/* Background decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-[1440px] gap-5 lg:grid-cols-[250px_minmax(0,1fr)] relative z-10">
        {/* Sidebar */}
        <aside className="flex min-h-[calc(100vh-1.5rem)] flex-col rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3 rounded-[22px] border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 px-4 py-3 backdrop-blur transition hover:bg-cyan-500/20"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20">
              <Landmark size={20} />
            </div>
            <div>
              <p className="text-[1.7rem] leading-none font-black tracking-tight text-white">EzPay</p>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400/70">Personal</p>
            </div>
          </button>

          <div className="mt-4 rounded-[22px] border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                <UserCircle2 size={24} />
              </div>
              <div>
                <p className="text-[15px] font-bold text-white">{user?.name || "사용자"} 님</p>
                <p className="text-xs font-medium text-cyan-400/60">일반 사용자</p>
              </div>
            </div>
          </div>

          <nav className="mt-4 space-y-2">
            {menuItems.map(({ label, icon: Icon, onClick, active }) => (
              <button
                key={label}
                type="button"
                onClick={onClick}
                className={`flex w-full items-center justify-between rounded-[18px] px-4 py-3 text-left transition ${
                  active
                    ? "bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-white border border-cyan-500/50 shadow-[0_18px_30px_rgba(34,211,238,0.15)]"
                    : "text-cyan-300/60 hover:bg-white/5 hover:text-cyan-300 hover:border hover:border-white/10"
                }`}
              >
                <span className="flex items-center gap-3 text-[14px] font-semibold">
                  <Icon size={17} />
                  {label}
                </span>
                {active ? <span className="h-2 w-2 rounded-full bg-cyan-400" /> : <ChevronRight size={15} />}
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-auto flex items-center justify-center gap-2 rounded-[18px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/20 hover:border-rose-500/50"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </aside>

        <main className="flex flex-col gap-5">
          {/* Header */}
          <header className="rounded-[28px] border border-white/10 bg-white/5 px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h1 className="text-[2rem] font-black tracking-tight text-white">사용자 홈</h1>
                <p className="mt-1 text-sm font-semibold text-cyan-400/60">EzPay · {todayLabel}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1 text-sm font-semibold backdrop-blur">
                  <button type="button" className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-2 text-white shadow-lg shadow-cyan-500/20">
                    사용자 뷰
                  </button>
                  <button
                    type="button"
                    className="rounded-full px-5 py-2 text-cyan-300/60 transition hover:text-cyan-300"
                    onClick={() => navigate("/admin/dashboard")}
                  >
                    관리자 뷰
                  </button>
                </div>
                <button
                  type="button"
                  className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-400 transition hover:border-cyan-500/50 hover:bg-cyan-500/10"
                  onClick={() => navigate("/notifications")}
                >
                  <Bell size={18} />
                  {unreadNotifications > 0 && (
                    <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white shadow-lg shadow-rose-500/30">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* 2-column layout: left (hero + chart + transactions) | right (friends + stats + expense + budget) */}
          <div className="grid flex-1 gap-5 xl:grid-cols-[1.55fr_1fr]">
            {/* Left column */}
            <div className="flex flex-col gap-5">
              {/* Hero Card */}
              <div className="rounded-[28px] bg-gradient-to-br from-cyan-500/30 via-blue-600/30 to-blue-900/30 border border-cyan-500/40 p-6 text-white shadow-[0_30px_70px_rgba(34,211,238,0.15)] backdrop-blur-xl overflow-hidden relative">
                {/* Decorative circles */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-400/20 rounded-full blur-2xl" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/20 rounded-full blur-2xl" />

                <div className="relative z-10">
                  <p className="text-sm font-semibold text-white/70">총 보유 자산</p>
                  <p className="mt-2 text-[3rem] font-black tracking-tight lg:text-[3.35rem]">
                    ₩{totalBalance.toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-cyan-300/70">
                    계좌 {sortedAccounts.length}개 · <span className="text-emerald-400">전월 대비 +12.5%</span>
                  </p>

                  {mainAccount && (
                    <div className="mt-5 rounded-[18px] border border-white/15 bg-white/10 px-4 py-4 transition hover:bg-white/15 hover:border-white/25 backdrop-blur">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white/70">{mainAccount.bankName || "EzPay Bank"}</p>
                          <span className="rounded-full bg-cyan-500/30 border border-cyan-400/50 px-2 py-0.5 text-xs font-bold text-cyan-300">대표</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate("/accounts")}
                          className="text-xs font-semibold text-cyan-300/70 transition hover:text-cyan-300"
                        >
                          전체 계좌 →
                        </button>
                      </div>
                      <p className="mt-2 text-sm font-semibold tracking-[0.14em] text-white/60">
                        {formatAccountNumber(mainAccount.accountNumber)}
                      </p>
                      <p className="mt-2 text-[2rem] font-black text-white">
                        {formatCurrency(mainAccount.balance).replace(" 원", "")}
                      </p>
                    </div>
                  )}

                  <div className="mt-5 grid grid-cols-4 gap-3">
                    {heroActions.map(({ label, Icon, path }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => navigate(path)}
                        className="flex flex-col items-center gap-2 rounded-[16px] border border-white/15 bg-white/10 py-3 transition hover:bg-white/20 hover:border-white/25 backdrop-blur"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20">
                          <Icon size={16} />
                        </div>
                        <span className="text-xs font-bold">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Asset Trend */}
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-[1.7rem] font-black tracking-tight text-white flex items-center gap-2">
                    <TrendingUp size={28} className="text-cyan-400" />
                    자산 추이
                  </h2>
                  <div className="rounded-full bg-emerald-500/20 border border-emerald-500/50 px-4 py-2 text-base font-bold text-emerald-400">
                    ↑ 12.5%
                  </div>
                </div>
                <div className="mt-5 h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={assetTrendData} margin={{ left: 6, right: 12, top: 12, bottom: 0 }}>
                      <defs>
                        <linearGradient id="assetFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#7dd3fc", fontSize: 13, fontWeight: 700 }} />
                      <YAxis hide />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), "자산"]} labelFormatter={(label) => `${label}`} contentStyle={{ backgroundColor: "rgba(15,23,42,0.9)", border: "1px solid rgba(34,211,238,0.3)", borderRadius: "12px" }} />
                      <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="#06b6d4"
                        strokeWidth={3}
                        fill="url(#assetFill)"
                        dot={{ r: 5, strokeWidth: 3, fill: "#0f172a", stroke: "#06b6d4" }}
                        activeDot={{ r: 8, strokeWidth: 3, fill: "#0f172a", stroke: "#06b6d4" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl">
                <h2 className="text-[1.7rem] font-black tracking-tight text-white flex items-center gap-2">
                  <Activity size={28} className="text-cyan-400" />
                  최근 거래
                </h2>
                <div className="mt-5 space-y-3">
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((transaction) => {
                      const isOutgoing = ownAccountIds.has(transaction.senderAccount?.accountId);
                      const counterparty = isOutgoing ? transaction.receiverAccount : transaction.senderAccount;
                      return (
                        <button
                          key={transaction.transactionId}
                          type="button"
                          onClick={() => navigate("/transactions")}
                          className="flex w-full items-center justify-between rounded-[20px] border border-white/10 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10 hover:border-white/20 backdrop-blur"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex h-11 w-11 items-center justify-center rounded-full text-xs font-black ${isOutgoing ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"}`}>
                              {isOutgoing ? "출금" : "입금"}
                            </div>
                            <div>
                              <p className="text-base font-black text-white">
                                {counterparty?.bankName || "거래 상대"}
                              </p>
                              <p className="mt-1 text-sm font-semibold text-cyan-300/60">
                                {transaction.memo || transaction.description || formatDateShort(transaction.transactionDate)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-black ${isOutgoing ? "text-rose-400" : "text-emerald-400"}`}>
                              {isOutgoing ? "-" : "+"}
                              {formatCurrency(transaction.amount)}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-cyan-300/60">
                              {formatDateShort(transaction.transactionDate)}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-[24px] border border-dashed border-white/10 px-6 py-10 text-center text-cyan-300/50">
                      최근 거래 내역이 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-5">
              {/* Frequent Friends */}
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <h2 className="text-[1.4rem] font-black tracking-tight text-white">자주 보내는 친구</h2>
                  <button
                    type="button"
                    onClick={() => navigate("/transactions")}
                    className="text-sm font-semibold text-cyan-400/70 transition hover:text-cyan-300"
                  >
                    전체보기
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {frequentFriends.length > 0 ? (
                    frequentFriends.map((friend, index) => {
                      const avatarColors = [
                        "bg-gradient-to-r from-blue-500 to-cyan-500",
                        "bg-gradient-to-r from-cyan-500 to-teal-500",
                        "bg-gradient-to-r from-indigo-500 to-purple-500",
                        "bg-gradient-to-r from-violet-500 to-pink-500",
                      ];
                      return (
                        <button
                          key={friend.id}
                          type="button"
                          onClick={() => navigate("/send")}
                          className="flex flex-col items-center gap-2 group"
                        >
                          <div className={`flex h-12 w-12 items-center justify-center rounded-full text-base font-black text-white shadow-lg transition group-hover:shadow-xl ${avatarColors[index % avatarColors.length]}`}>
                            {friend.name.charAt(0)}
                          </div>
                          <span className="w-full truncate text-center text-xs font-semibold text-cyan-300/70 group-hover:text-cyan-300">
                            {friend.name}
                          </span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-4 py-5 text-center text-sm text-cyan-300/50">
                      거래 내역이 없습니다
                    </div>
                  )}
                </div>
              </div>

              {/* Monthly Stats */}
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl">
                <h2 className="text-[1.4rem] font-black tracking-tight text-white">이달의 통계</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[18px] border border-rose-500/30 bg-rose-500/10 px-4 py-4 backdrop-blur">
                    <p className="text-xs font-semibold text-rose-400/70">총 송금</p>
                    <p className="mt-1 text-[1.4rem] font-black text-rose-300">{formatCurrency(monthlyStats.totalSent)}</p>
                  </div>
                  <div className="rounded-[18px] border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 backdrop-blur">
                    <p className="text-xs font-semibold text-emerald-400/70">총 입금</p>
                    <p className="mt-1 text-[1.4rem] font-black text-emerald-300">{formatCurrency(monthlyStats.totalReceived)}</p>
                  </div>
                  <div className="rounded-[18px] border border-cyan-500/30 bg-cyan-500/10 px-4 py-4 backdrop-blur">
                    <p className="text-xs font-semibold text-cyan-400/70">거래 건수</p>
                    <p className="mt-1 text-[1.4rem] font-black text-cyan-300">{monthlyStats.count}건</p>
                  </div>
                  <div className="rounded-[18px] border border-purple-500/30 bg-purple-500/10 px-4 py-4 backdrop-blur">
                    <p className="text-xs font-semibold text-purple-400/70">평균 금액</p>
                    <p className="mt-1 text-[1.4rem] font-black text-purple-300">{formatCurrency(monthlyStats.averageAmount)}</p>
                  </div>
                </div>
              </div>

              {/* Monthly Expense */}
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl">
                <h2 className="text-[1.4rem] font-black tracking-tight text-white">월별 지출</h2>
                <div className="mt-4 h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyExpenseData} barGap={12}>
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#7dd3fc", fontSize: 12, fontWeight: 700 }} />
                      <Tooltip
                        cursor={{ fill: "rgba(34,211,238,0.1)" }}
                        formatter={(value: number) => [formatCurrency(value), "지출"]}
                        labelFormatter={(label) => `${label}`}
                        contentStyle={{ backgroundColor: "rgba(15,23,42,0.9)", border: "1px solid rgba(34,211,238,0.3)", borderRadius: "12px" }}
                      />
                      <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                        {monthlyExpenseData.map((entry, index) => (
                          <Cell
                            key={entry.month}
                            fill={index === monthlyExpenseData.length - 1 ? "#06b6d4" : "#06b6d4"}
                            fillOpacity={index === monthlyExpenseData.length - 1 ? 1 : 0.5}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Budget */}
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl">
                <h2 className="text-[1.4rem] font-black tracking-tight text-white">월간 예산</h2>
                <div className="mt-4 space-y-4">
                  {budgetItems.map((item) => {
                    const progress = item.budget > 0 ? Math.min((item.spent / item.budget) * 100, 100) : 0;
                    const remain = Math.max(item.budget - item.spent, 0);
                    const toneMap: Record<string, string> = {
                      "bg-slate-600": "from-slate-500 to-slate-600",
                      "bg-slate-500": "from-blue-500 to-cyan-500",
                      "bg-amber-500": "from-amber-500 to-orange-500",
                    };
                    const gradientTone = toneMap[item.tone] || "from-cyan-500 to-blue-500";
                    return (
                      <div key={item.label}>
                        <div className="flex items-end justify-between gap-4">
                          <p className="text-sm font-black text-white">{item.label}</p>
                          <p className="text-xs font-bold text-cyan-400/60">
                            {formatCurrency(item.spent)} / {formatCurrency(item.budget)}
                          </p>
                        </div>
                        <div className="mt-2 h-2 rounded-full bg-white/10 border border-white/10 overflow-hidden">
                          <div className={`h-2 rounded-full bg-gradient-to-r ${gradientTone}`} style={{ width: `${progress}%` }} />
                        </div>
                        <p className="mt-1 text-xs font-semibold text-cyan-400/60">
                          {Math.round(progress)}% 사용 · 남은 {formatCurrency(remain)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
