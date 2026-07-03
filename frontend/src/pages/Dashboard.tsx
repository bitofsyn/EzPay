import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserShell from "../components/UserShell";
import { getDashboardInfo } from "../api/UserAPI";
import { parseDate } from "../utils/formatters";
import { clearUserData } from "../utils/storage";
import { Account, Transaction } from "../types";
import { Skeleton } from "../components/Skeleton";
import {
  AssetTrendCard,
  FrequentFriendsCard,
  HeroCard,
  MonthlyBudgetCard,
  MonthlyExpenseCard,
  MonthlyStatsCard,
  RecentTransactionsCard,
  won,
  type BudgetItem,
  type ChartPoint,
  type FriendChip,
  type HeroAccount,
  type QuickAction,
  type RecentTx,
  type StatItem,
} from "../components/dashboard";

interface DashboardAccount extends Account {
  main?: boolean;
  bankName?: string;
}

const monthLabels = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

const maskAccountNumber = (raw?: string): string => {
  const digits = (raw || "").replace(/\D/g, "");
  if (digits.length < 8) return raw || "****";
  return `${digits.slice(0, 4)}-****-${digits.slice(-4)}`;
};

const normalizeAccounts = (accountList: DashboardAccount[]): DashboardAccount[] =>
  accountList.map((account) => ({ ...account, main: account.main ?? account.isMain ?? false }));

const Dashboard = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<DashboardAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const dashboardRes = await getDashboardInfo();
        setAccounts(normalizeAccounts(dashboardRes.data?.account || []));
        setTransactions((dashboardRes.data?.transactions || []) as Transaction[]);
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

  const sortedAccounts = useMemo(
    () =>
      [...accounts].sort((a, b) => {
        const aMain = a.main ?? a.isMain ?? false;
        const bMain = b.main ?? b.isMain ?? false;
        if (aMain === bMain) return a.accountId - b.accountId;
        return aMain ? -1 : 1;
      }),
    [accounts]
  );

  const ownAccountIds = useMemo(
    () => new Set(sortedAccounts.map((a) => a.accountId)),
    [sortedAccounts]
  );

  const totalBalance = sortedAccounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  const unreadNotifications = Math.min(transactions.length, 3);

  // ── 대표 계좌 뷰모델 ──
  const primaryAccount: HeroAccount | null = useMemo(() => {
    const main = sortedAccounts[0];
    if (!main) return null;
    return {
      bankName: main.bankName || "EzPay Bank",
      maskedNumber: maskAccountNumber(main.accountNumber),
      balance: Number(main.balance || 0),
    };
  }, [sortedAccounts]);

  // ── 이달의 통계 ──
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const inMonth = transactions.filter((t) => {
      const d = parseDate(t.transactionDate);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
    const totalSent = inMonth
      .filter((t) => ownAccountIds.has(t.senderAccount?.accountId))
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalReceived = inMonth
      .filter((t) => ownAccountIds.has(t.receiverAccount?.accountId) && !ownAccountIds.has(t.senderAccount?.accountId))
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const avg = inMonth.length
      ? Math.round(inMonth.reduce((s, t) => s + Number(t.amount || 0), 0) / inMonth.length)
      : 0;
    return { totalSent, totalReceived, count: inMonth.length, averageAmount: avg };
  }, [ownAccountIds, transactions]);

  // ── 월별 지출 ──
  const monthlyExpenseData = useMemo<ChartPoint[]>(() => {
    const now = new Date();
    const points = Array.from({ length: 6 }).map((_, index) => {
      const target = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const amount = transactions.reduce((sum, t) => {
        const d = parseDate(t.transactionDate);
        const sameMonth = d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth();
        const isOut = ownAccountIds.has(t.senderAccount?.accountId);
        return sameMonth && isOut ? sum + Number(t.amount || 0) : sum;
      }, 0);
      return { label: monthLabels[target.getMonth()], value: amount };
    });
    // 마지막(이번 달) 막대만 진하게 강조
    return points.map((p, i) => ({ ...p, color: i === points.length - 1 ? "#0f172a" : "#94a3b8" }));
  }, [ownAccountIds, transactions]);

  // ── 자산 추이 ──
  const assetTrendData = useMemo<ChartPoint[]>(() => {
    const netFlows = monthlyExpenseData.map((expense) => {
      const monthNumber = Number(expense.label.replace("월", ""));
      const incoming = transactions.reduce((sum, t) => {
        const d = parseDate(t.transactionDate);
        const isIn = ownAccountIds.has(t.receiverAccount?.accountId) && !ownAccountIds.has(t.senderAccount?.accountId);
        return d.getMonth() + 1 === monthNumber && isIn ? sum + Number(t.amount || 0) : sum;
      }, 0);
      return incoming - expense.value;
    });
    const seed = Math.max(totalBalance - netFlows.reduce((s, v) => s + v, 0), 0);
    let running = seed;
    return monthlyExpenseData.map((p, i) => {
      running += netFlows[i];
      return { label: p.label, value: Math.max(running, 0) };
    });
  }, [monthlyExpenseData, ownAccountIds, totalBalance, transactions]);

  // ── 월간 예산 ──
  const budgetItems = useMemo<BudgetItem[]>(() => {
    const config = {
      food: { label: "식비", limit: 300000, color: "#334155", keywords: ["food", "meal", "cafe", "coffee", "식비", "카페", "음식"] },
      transport: { label: "교통", limit: 100000, color: "#334155", keywords: ["transport", "taxi", "bus", "subway", "교통", "택시", "버스"] },
      housing: { label: "주거", limit: 700000, color: "#f59e0b", keywords: ["rent", "home", "house", "housing", "주거", "월세", "관리비"] },
    };
    const totals = { food: 0, transport: 0, housing: 0 };
    const now = new Date();
    transactions.forEach((t) => {
      const d = parseDate(t.transactionDate);
      const isOut = ownAccountIds.has(t.senderAccount?.accountId);
      if (!isOut || d.getFullYear() !== now.getFullYear() || d.getMonth() !== now.getMonth()) return;
      const src = `${t.category || ""} ${t.memo || ""} ${t.description || ""}`.toLowerCase();
      if (config.food.keywords.some((k) => src.includes(k))) totals.food += Number(t.amount || 0);
      else if (config.transport.keywords.some((k) => src.includes(k))) totals.transport += Number(t.amount || 0);
      else totals.housing += Number(t.amount || 0);
    });
    return [
      { category: config.food.label, used: totals.food, limit: config.food.limit, color: config.food.color },
      { category: config.transport.label, used: totals.transport, limit: config.transport.limit, color: config.transport.color },
      { category: config.housing.label, used: totals.housing, limit: config.housing.limit, color: config.housing.color },
    ];
  }, [ownAccountIds, transactions]);

  // ── 자주 보내는 친구 ──
  const frequentFriends = useMemo<FriendChip[]>(() => {
    const outgoing = transactions.filter((t) => ownAccountIds.has(t.senderAccount?.accountId));
    const freq: Record<number, { name: string; count: number }> = {};
    outgoing.forEach((t) => {
      const id = t.receiverAccount?.accountId;
      const name = t.receiverAccount?.ownerName || t.receiverAccount?.bankName || "상대방";
      if (id != null) {
        if (!freq[id]) freq[id] = { name, count: 0 };
        freq[id].count += 1;
      }
    });
    return Object.entries(freq)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([id, { name }], i) => ({ id: Number(id), name, favorite: i < 2 }));
  }, [ownAccountIds, transactions]);

  // ── 최근 거래 ──
  const recentTransactions = useMemo<RecentTx[]>(() => {
    return [...transactions]
      .sort((a, b) => parseDate(b.transactionDate).getTime() - parseDate(a.transactionDate).getTime())
      .slice(0, 5)
      .map((t) => {
        const isOut = ownAccountIds.has(t.senderAccount?.accountId);
        const counter = isOut ? t.receiverAccount : t.senderAccount;
        return {
          id: t.transactionId,
          counterparty: counter?.ownerName || counter?.bankName || "거래 상대",
          category: t.category,
          dateLabel: t.memo || t.description || "",
          amount: Number(t.amount || 0),
          direction: isOut ? "out" : "in",
        } satisfies RecentTx;
      });
  }, [ownAccountIds, transactions]);

  // 실제 API 데이터를 그대로 사용 (비어 있으면 각 카드가 빈 상태를 렌더)
  const assetTrend = assetTrendData;
  const expenseData = monthlyExpenseData;
  const recentTx = recentTransactions;
  const friends = frequentFriends;
  const budget = budgetItems;

  const stats: StatItem[] = [
    { label: "총 송금", value: won(monthlyStats.totalSent) },
    { label: "총 입금", value: won(monthlyStats.totalReceived) },
    { label: "거래 건수", value: `${monthlyStats.count}건` },
    { label: "평균 금액", value: won(monthlyStats.averageAmount) },
  ];

  const quickActions: QuickAction[] = [
    { key: "transfer", label: "이체", icon: "↑", onClick: () => navigate("/send") },
    { key: "charge", label: "충전", icon: "↓", onClick: () => navigate("/accounts") },
    { key: "history", label: "내역", icon: "≡", onClick: () => navigate("/transactions") },
    { key: "friends", label: "친구", icon: "♡", onClick: () => navigate("/friends") },
  ];

  if (isLoading) {
    return (
      <UserShell title="사용자 홈" showViewToggle>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-4">
            <Skeleton className="h-64 w-full rounded-[20px]" />
            <Skeleton className="h-44 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="flex flex-col gap-4">
            <Skeleton className="h-28 w-full rounded-2xl" />
            <Skeleton className="h-36 w-full rounded-2xl" />
            <Skeleton className="h-40 w-full rounded-2xl" />
          </div>
        </div>
      </UserShell>
    );
  }

  return (
    <UserShell title="사용자 홈" showViewToggle unreadCount={unreadNotifications}>
      <div className="grid flex-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        {/* 좌측 컬럼 */}
        <div className="flex flex-col gap-4">
          <HeroCard
            totalBalance={totalBalance}
            accountCount={sortedAccounts.length}
            primaryAccount={primaryAccount}
            quickActions={quickActions}
            onViewAccounts={() => navigate("/accounts")}
          />
          <AssetTrendCard data={assetTrend} />
          <RecentTransactionsCard
            transactions={recentTx}
            onSelectTx={() => navigate("/transactions")}
            onViewAll={() => navigate("/transactions")}
          />
        </div>

        {/* 우측 컬럼 */}
        <div className="flex flex-col gap-4">
          <FrequentFriendsCard
            friends={friends}
            onSelectFriend={() => navigate("/send")}
            onViewAll={() => navigate("/friends")}
          />
          <MonthlyStatsCard stats={stats} />
          <MonthlyExpenseCard data={expenseData} />
          <MonthlyBudgetCard items={budget} />
        </div>
      </div>
    </UserShell>
  );
};

export default Dashboard;
