import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, SearchX } from "lucide-react";
import { FiSearch } from "react-icons/fi";
import { getMyAccounts, getTransactionHistory } from "../api/UserAPI";
import { Account, Transaction } from "../types";
import { getUserData } from "../utils/storage";
import { formatAccountNumber, formatCurrency, formatDateShort } from "../utils/formatters";
import UserShell from "../components/UserShell";
import { FilterTabs, StatusBadge } from "../components/admin/AdminUI";

type TypeFilter = "전체" | "입금" | "출금";

const STATUS_KO: Record<string, string> = {
  SUCCESS: "완료",
  PENDING: "처리중",
  FAILED: "실패",
};

const TransactionHistory: React.FC = () => {
  const navigate = useNavigate();
  const user = useMemo(() => getUserData(), []);
  const userId = user?.userId;

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<TypeFilter>("전체");
  const [dateFilter, setDateFilter] = useState<string>("전체");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }
    getMyAccounts()
      .then((data) => {
        setAccounts(data);
        if (data.length > 0) setSelectedAccountId(data[0].accountId);
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions
      .filter((tx) => {
        const isSent = tx.senderAccount?.accountId === selectedAccountId;
        if (filterType === "입금" && isSent) return false;
        if (filterType === "출금" && !isSent) return false;

        const txDate = tx.transactionDate ? new Date(tx.transactionDate) : null;
        if (txDate && dateFilter !== "전체") {
          const months = dateFilter === "1개월" ? 1 : dateFilter === "3개월" ? 3 : 6;
          const ago = new Date();
          ago.setMonth(ago.getMonth() - months);
          if (txDate < ago) return false;
        }

        if (q) {
          const counter = isSent ? tx.receiverAccount : tx.senderAccount;
          const haystack = `${tx.transactionId} ${counter?.ownerName ?? ""} ${counter?.bankName ?? ""} ${tx.memo ?? ""} ${tx.category ?? ""}`.toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());
  }, [transactions, selectedAccountId, filterType, dateFilter, search]);

  const totalIn = filtered.reduce(
    (s, tx) => (tx.senderAccount?.accountId !== selectedAccountId ? s + Number(tx.amount || 0) : s),
    0
  );
  const totalOut = filtered.reduce(
    (s, tx) => (tx.senderAccount?.accountId === selectedAccountId ? s + Number(tx.amount || 0) : s),
    0
  );

  return (
    <UserShell title="거래 내역" subtitle="계좌별 입출금 내역 조회" backTo="/dashboard">
      <div className="space-y-4">
        {/* Header row (admin 패턴: 제목 + 건수 · 검색 · 필터) */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">거래 내역</h2>
            <p className="mt-0.5 text-sm text-slate-400">전체 {filtered.length}건</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="상대·메모·카테고리 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-56 rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
              />
            </div>
            <FilterTabs<TypeFilter>
              options={["전체", "입금", "출금"]}
              active={filterType}
              onChange={setFilterType}
            />
          </div>
        </div>

        {/* Account selector + date filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <select
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              value={selectedAccountId ?? ""}
              onChange={(e) => setSelectedAccountId(Number(e.target.value))}
            >
              {accounts.map((acc) => (
                <option key={acc.accountId} value={acc.accountId}>
                  {acc.accountName} · {formatAccountNumber(acc.accountNumber)} · {formatCurrency(acc.balance)}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <div className="relative">
            <select
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2.5 pr-9 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-300 sm:w-40"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="전체">전체 기간</option>
              <option value="1개월">최근 1개월</option>
              <option value="3개월">최근 3개월</option>
              <option value="6개월">최근 6개월</option>
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Summary cards (admin scale) */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-400">총 거래 건수</p>
            <p className="mt-1 text-xl font-black text-slate-800">{filtered.length}건</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-400">총 입금</p>
            <p className="mt-1 text-xl font-black text-cyan-600">+{formatCurrency(totalIn)}</p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-400">총 출금</p>
            <p className="mt-1 text-xl font-black text-rose-500">-{formatCurrency(totalOut)}</p>
          </div>
        </div>

        {/* Table (admin 패턴) */}
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
            </div>
          ) : filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {["구분", "상대", "메모", "금액", "일시", "카테고리", "상태"].map((h) => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold text-slate-400">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((tx) => {
                    const isSent = tx.senderAccount?.accountId === selectedAccountId;
                    const counterparty = isSent ? tx.receiverAccount : tx.senderAccount;
                    return (
                      <tr
                        key={tx.transactionId}
                        className="cursor-pointer border-b border-slate-50 transition-colors hover:bg-slate-50/60"
                      >
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                              isSent ? "bg-rose-50 text-rose-500" : "bg-cyan-50 text-cyan-600"
                            }`}
                          >
                            {isSent ? "출금" : "입금"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                          {counterparty?.ownerName || counterparty?.bankName || "-"}
                        </td>
                        <td className="max-w-[180px] truncate px-4 py-4 text-sm text-slate-500">
                          {tx.memo || tx.description || "-"}
                        </td>
                        <td className={`px-4 py-4 text-sm font-bold tabular-nums ${isSent ? "text-rose-500" : "text-cyan-700"}`}>
                          {isSent ? "-" : "+"}
                          {formatCurrency(tx.amount)}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-500">{formatDateShort(tx.transactionDate)}</td>
                        <td className="px-4 py-4 text-sm text-slate-500">{tx.category || "미분류"}</td>
                        <td className="px-4 py-4">
                          <StatusBadge status={STATUS_KO[tx.status] || "완료"} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <SearchX size={28} className="text-slate-400" />
              </div>
              <p className="text-base font-bold text-slate-500">거래 내역이 없습니다</p>
              <p className="mt-1 text-sm font-medium text-slate-400">필터 조건을 변경해 보세요.</p>
            </div>
          )}
        </div>
      </div>
    </UserShell>
  );
};

export default TransactionHistory;
