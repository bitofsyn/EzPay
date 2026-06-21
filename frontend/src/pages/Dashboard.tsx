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
  Bell,
  ChevronRight,
  Copy,
  CreditCard,
  Landmark,
  LayoutDashboard,
  LogOut,
  Receipt,
  SendHorizontal,
  Settings,
  UserCircle2,
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

const cardGradients = [
  "from-sky-500 to-cyan-500",
  "from-orange-500 to-red-500",
  "from-blue-600 to-indigo-600",
];

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

      if (aIsMain === bIsMain) {
        return a.accountId - b.accountId;
      }

      return aIsMain ? -1 : 1;
    });
  }, [accounts]);

  const ownAccountIds = useMemo(() => new Set(sortedAccounts.map((account) => account.accountId)), [sortedAccounts]);

  const previewAccounts = sortedAccounts.slice(0, 2);
  const totalBalance = sortedAccounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const unreadNotifications = Math.min(transactions.length, 3);

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const currentMonthTransactions = transactions.filter((transaction) => {
      const txDate = parseDate(transaction.transactionDate);
      return txDate.getFullYear() === now.getFullYear() && txDate.getMonth() === now.getMonth();
    });

    const sentTransactions = currentMonthTransactions.filter((transaction) =>
      ownAccountIds.has(transaction.senderAccount?.accountId)
    );
    const receivedTransactions = currentMonthTransactions.filter(
      (transaction) =>
        ownAccountIds.has(transaction.receiverAccount?.accountId) &&
        !ownAccountIds.has(transaction.senderAccount?.accountId)
    );

    const totalSent = sentTransactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const totalReceived = receivedTransactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);
    const averageAmount = currentMonthTransactions.length
      ? Math.round(
          currentMonthTransactions.reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0) /
            currentMonthTransactions.length
        )
      : 0;

    return {
      totalSent,
      totalReceived,
      count: currentMonthTransactions.length,
      averageAmount,
    };
  }, [ownAccountIds, transactions]);

  const monthlyExpenseData = useMemo(() => {
    const now = new Date();

    return Array.from({ length: 6 }).map((_, index) => {
      const target = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const label = monthLabels[target.getMonth()];

      const amount = transactions.reduce((sum, transaction) => {
        const txDate = parseDate(transaction.transactionDate);
        const isSameMonth =
          txDate.getFullYear() === target.getFullYear() && txDate.getMonth() === target.getMonth();
        const isOutgoing = ownAccountIds.has(transaction.senderAccount?.accountId);

        return isSameMonth && isOutgoing ? sum + Number(transaction.amount || 0) : sum;
      }, 0);

      return {
        month: label,
        amount,
      };
    });
  }, [ownAccountIds, transactions]);

  const assetTrendData = useMemo(() => {
    const monthlyNetFlows = monthlyExpenseData.map((expenseItem) => {
      const monthNumber = Number(expenseItem.month.replace("월", ""));
      const incoming = transactions.reduce((sum, transaction) => {
        const txDate = parseDate(transaction.transactionDate);
        const isIncoming =
          ownAccountIds.has(transaction.receiverAccount?.accountId) &&
          !ownAccountIds.has(transaction.senderAccount?.accountId);

        return txDate.getMonth() + 1 === monthNumber && isIncoming ? sum + Number(transaction.amount || 0) : sum;
      }, 0);

      return incoming - expenseItem.amount;
    });

    const seed = Math.max(totalBalance - monthlyNetFlows.reduce((sum, value) => sum + value, 0), 0);
    let running = seed;

    return monthlyExpenseData.map((item, index) => {
      running += monthlyNetFlows[index];
      return {
        month: item.month,
        balance: Math.max(running, 0),
      };
    });
  }, [monthlyExpenseData, ownAccountIds, totalBalance, transactions]);

  const budgetItems = useMemo<BudgetItem[]>(() => {
    const defaultBudgets: Record<string, { label: string; budget: number; tone: string; keywords: string[] }> = {
      food: { label: "식비", budget: 300000, tone: "bg-slate-600", keywords: ["food", "meal", "cafe", "coffee", "식비", "카페", "음식"] },
      transport: { label: "교통", budget: 100000, tone: "bg-slate-500", keywords: ["transport", "taxi", "bus", "subway", "교통", "택시", "버스"] },
      housing: { label: "주거", budget: 700000, tone: "bg-rose-500", keywords: ["rent", "home", "house", "housing", "주거", "월세", "관리비"] },
    };

    const totals = {
      food: 0,
      transport: 0,
      housing: 0,
    };

    const now = new Date();

    transactions.forEach((transaction) => {
      const txDate = parseDate(transaction.transactionDate);
      const isOutgoing = ownAccountIds.has(transaction.senderAccount?.accountId);
      if (!isOutgoing || txDate.getFullYear() !== now.getFullYear() || txDate.getMonth() !== now.getMonth()) {
        return;
      }

      const sourceText = `${transaction.category || ""} ${transaction.memo || ""} ${transaction.description || ""}`.toLowerCase();

      if (defaultBudgets.food.keywords.some((keyword) => sourceText.includes(keyword))) {
        totals.food += Number(transaction.amount || 0);
        return;
      }
      if (defaultBudgets.transport.keywords.some((keyword) => sourceText.includes(keyword))) {
        totals.transport += Number(transaction.amount || 0);
        return;
      }
      totals.housing += Number(transaction.amount || 0);
    });

    return [
      {
        label: defaultBudgets.food.label,
        spent: totals.food,
        budget: defaultBudgets.food.budget,
        tone: defaultBudgets.food.tone,
      },
      {
        label: defaultBudgets.transport.label,
        spent: totals.transport,
        budget: defaultBudgets.transport.budget,
        tone: defaultBudgets.transport.tone,
      },
      {
        label: defaultBudgets.housing.label,
        spent: totals.housing,
        budget: defaultBudgets.housing.budget,
        tone: defaultBudgets.housing.tone,
      },
    ];
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

  const handleCopyAccount = async (accountNumber: string) => {
    try {
      await navigator.clipboard.writeText(accountNumber);
    } catch (error) {
      console.error("계좌번호 복사 실패:", error);
    }
  };

  const menuItems = [
    { label: "대시보드", icon: LayoutDashboard, onClick: () => navigate("/dashboard"), active: true },
    { label: "내 계좌", icon: CreditCard, onClick: () => navigate("/accounts"), active: false },
    { label: "송금하기", icon: SendHorizontal, onClick: () => navigate("/send"), active: false },
    { label: "거래 내역", icon: Receipt, onClick: () => navigate("/transactions"), active: false },
    { label: "설정", icon: Settings, onClick: () => navigate("/settings"), active: false },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 p-4 lg:p-5">
        <div className="mx-auto grid max-w-[1440px] gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
          <div className="rounded-[28px] bg-white p-5 shadow-sm">
            <Skeleton className="h-12 w-40 rounded-2xl" />
            <Skeleton className="mt-6 h-16 w-full rounded-[24px]" />
            <Skeleton className="mt-6 h-80 w-full rounded-[28px]" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-24 w-full rounded-[28px]" />
            <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
              <Skeleton className="h-64 w-full rounded-[28px]" />
              <Skeleton className="h-64 w-full rounded-[28px]" />
            </div>
            <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
              <Skeleton className="h-80 w-full rounded-[28px]" />
              <Skeleton className="h-80 w-full rounded-[28px]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef3fb] p-3 text-slate-900 lg:p-4">
      <div className="mx-auto grid max-w-[1440px] gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="flex min-h-[calc(100vh-1.5rem)] flex-col rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="flex items-center gap-3 rounded-[22px] border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-cyan-400 shadow-lg shadow-slate-950/15">
              <Landmark size={20} />
            </div>
            <div>
              <p className="text-[1.7rem] leading-none font-black tracking-tight text-slate-950">EzPay</p>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Personal</p>
            </div>
          </div>

          <div className="mt-4 rounded-[22px] bg-slate-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-600">
                <UserCircle2 size={24} />
              </div>
              <div>
                <p className="text-[15px] font-bold text-slate-900">{user?.name || "사용자"} 님</p>
                <p className="text-xs font-medium text-slate-400">일반 사용자</p>
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
                    ? "bg-slate-950 text-white shadow-[0_18px_30px_rgba(15,23,42,0.18)]"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="flex items-center gap-3 text-[14px] font-semibold">
                  <Icon size={17} />
                  {label}
                </span>
                {active ? <span className="h-2 w-2 rounded-full bg-white" /> : <ChevronRight size={15} />}
              </button>
            ))}
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-auto flex items-center justify-center gap-2 rounded-[18px] bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-500 transition hover:bg-rose-100"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </aside>

        <main className="space-y-5">
          <header className="rounded-[28px] border border-white/70 bg-white/90 px-5 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h1 className="text-[2rem] font-black tracking-tight text-slate-950">사용자 홈</h1>
                <p className="mt-1 text-sm font-semibold text-slate-400">EzPay · {todayLabel}</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-full bg-slate-100 p-1 text-sm font-semibold">
                  <button type="button" className="rounded-full bg-slate-950 px-5 py-2 text-white">
                    사용자 뷰
                  </button>
                  <button
                    type="button"
                    className="rounded-full px-5 py-2 text-slate-400 transition hover:text-slate-700"
                    onClick={() => navigate("/admin/dashboard")}
                  >
                    관리자 뷰
                  </button>
                </div>

                <button
                  type="button"
                  className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:text-slate-950"
                  onClick={() => navigate("/settings/notification")}
                >
                  <Bell size={18} />
                  {unreadNotifications > 0 && (
                    <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </header>

          <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
            <div className="rounded-[28px] bg-gradient-to-r from-[#264997] via-[#175f8b] to-[#17667b] p-6 text-white shadow-[0_30px_70px_rgba(23,53,120,0.32)]">
              <p className="text-sm font-semibold text-white/70">총 자산</p>
              <p className="mt-3 text-[3rem] font-black tracking-tight lg:text-[3.35rem]">
                ₩{totalBalance.toLocaleString()}
              </p>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {previewAccounts.map((account) => (
                  <button
                    key={account.accountId}
                    type="button"
                    onClick={() => navigate(`/account/${account.accountId}`)}
                    className="rounded-[18px] bg-white/14 px-4 py-4 text-left transition hover:bg-white/20"
                  >
                    <p className="text-xs font-semibold text-white/65">{account.bankName || "연결 계좌"}</p>
                    <p className="mt-2 text-[1.75rem] font-black">{formatCurrency(account.balance).replace(" 원", "")}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <h2 className="text-[1.7rem] font-black tracking-tight text-slate-950">이달의 통계</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[18px] bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-400">총 송금</p>
                  <p className="mt-2 text-[1.75rem] font-black text-slate-950">{formatCurrency(monthlyStats.totalSent)}</p>
                </div>
                <div className="rounded-[18px] bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-400">총 입금</p>
                  <p className="mt-2 text-[1.75rem] font-black text-slate-950">{formatCurrency(monthlyStats.totalReceived)}</p>
                </div>
                <div className="rounded-[18px] bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-400">거래 건수</p>
                  <p className="mt-2 text-[1.75rem] font-black text-slate-950">{monthlyStats.count}건</p>
                </div>
                <div className="rounded-[18px] bg-slate-50 px-4 py-4">
                  <p className="text-sm font-semibold text-slate-400">평균 금액</p>
                  <p className="mt-2 text-[1.75rem] font-black text-slate-950">{formatCurrency(monthlyStats.averageAmount)}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
            <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-[1.7rem] font-black tracking-tight text-slate-950">내 계좌</h2>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/accounts")}
                  className="text-lg font-bold text-slate-400 transition hover:text-slate-700"
                >
                  + 계좌 추가
                </button>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {previewAccounts.map((account, index) => (
                  <article
                    key={account.accountId}
                    className={`rounded-[22px] bg-gradient-to-r ${cardGradients[index % cardGradients.length]} p-5 text-white shadow-[0_20px_40px_rgba(15,23,42,0.16)]`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white/70">{account.bankName || "EzPay Bank"}</p>
                        <p className="mt-2 text-[1.7rem] font-black">{account.accountName}</p>
                        <p className="mt-3 text-base font-semibold tracking-[0.14em] text-white/80">
                          {formatAccountNumber(account.accountNumber)}
                        </p>
                      </div>
                      <div className="h-7 w-7 rounded-md border-2 border-white/55" />
                    </div>

                    <div className="mt-5 flex items-center justify-between gap-3">
                      <p className="text-[2rem] font-black tracking-tight">{formatCurrency(account.balance).replace(" 원", "")}</p>
                      <button
                        type="button"
                        onClick={() => handleCopyAccount(account.accountNumber)}
                        className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/30"
                      >
                        <Copy size={14} />
                        복사
                      </button>
                    </div>
                  </article>
                ))}

                {previewAccounts.length === 0 && (
                  <div className="col-span-full rounded-[24px] border border-dashed border-slate-200 px-6 py-10 text-center text-slate-500">
                    연결된 계좌가 없습니다.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <h2 className="text-[1.7rem] font-black tracking-tight text-slate-950">월별 지출</h2>
              <div className="mt-5 h-[190px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyExpenseData} barGap={12}>
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 13, fontWeight: 700 }} />
                    <Tooltip
                      cursor={{ fill: "rgba(148,163,184,0.08)" }}
                      formatter={(value: number) => [formatCurrency(value), "지출"]}
                      labelFormatter={(label) => `${label}`}
                    />
                    <Bar dataKey="amount" radius={[8, 8, 0, 0]}>
                      {monthlyExpenseData.map((entry, index) => (
                        <Cell
                          key={entry.month}
                          fill={index === monthlyExpenseData.length - 1 ? "#0f172a" : "#9aa8bd"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
            <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-[1.7rem] font-black tracking-tight text-slate-950">자산 추이</h2>
                <div className="rounded-full bg-slate-100 px-4 py-2 text-base font-bold text-slate-500">
                  ↑ 12.5%
                </div>
              </div>

              <div className="mt-5 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={assetTrendData} margin={{ left: 6, right: 12, top: 12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="assetFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1f9ac0" stopOpacity={0.24} />
                        <stop offset="95%" stopColor="#1f9ac0" stopOpacity={0.04} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#dbe5f1" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 13, fontWeight: 700 }} />
                    <YAxis hide />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), "자산"]} labelFormatter={(label) => `${label}`} />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      stroke="#1597be"
                      strokeWidth={4}
                      fill="url(#assetFill)"
                      dot={{ r: 5, strokeWidth: 4, fill: "#ffffff", stroke: "#1597be" }}
                      activeDot={{ r: 8, strokeWidth: 4, fill: "#ffffff", stroke: "#1597be" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
              <h2 className="text-[1.7rem] font-black tracking-tight text-slate-950">월간 예산</h2>
              <div className="mt-5 space-y-5">
                {budgetItems.map((item) => {
                  const progress = item.budget > 0 ? Math.min((item.spent / item.budget) * 100, 100) : 0;
                  const remain = Math.max(item.budget - item.spent, 0);

                  return (
                    <div key={item.label}>
                      <div className="flex items-end justify-between gap-4">
                        <p className="text-lg font-black text-slate-950">{item.label}</p>
                        <p className="text-base font-bold text-slate-300">
                          {formatCurrency(item.spent)} / {formatCurrency(item.budget)}
                        </p>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-slate-100">
                        <div className={`h-2 rounded-full ${item.tone}`} style={{ width: `${progress}%` }} />
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-400">
                        {Math.round(progress)}% 사용 · 남은 {formatCurrency(remain)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <h2 className="text-[1.7rem] font-black tracking-tight text-slate-950">최근 거래</h2>
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
                      className="flex w-full items-center justify-between rounded-[20px] bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-full text-xs font-black ${isOutgoing ? "bg-slate-200 text-slate-700" : "bg-cyan-100 text-cyan-700"}`}>
                          {isOutgoing ? "출금" : "입금"}
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-950">
                            {counterparty?.bankName || "거래 상대"}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-400">
                            {transaction.memo || transaction.description || formatDateShort(transaction.transactionDate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xl font-black ${isOutgoing ? "text-slate-700" : "text-cyan-700"}`}>
                          {isOutgoing ? "-" : "+"}
                          {formatCurrency(transaction.amount)}
                        </p>
                        <p className="mt-1 text-sm font-semibold text-slate-400">
                          {formatDateShort(transaction.transactionDate)}
                        </p>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="rounded-[24px] border border-dashed border-slate-200 px-6 py-10 text-center text-slate-500">
                  최근 거래 내역이 없습니다.
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
