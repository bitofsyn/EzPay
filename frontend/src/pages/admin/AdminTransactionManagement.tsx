import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiSearch } from "react-icons/fi";
import toast from "react-hot-toast";
import AdminShell from "../../components/admin/AdminShell";
import { FilterTabs, StatusBadge } from "../../components/admin/AdminUI";
import { getAllTransactions } from "../../api/AdminAPI";
import type { AdminTransactionInfo, AdminTransactionStatusType } from "../../types";

type FilterType = "전체" | "완료" | "처리중" | "실패" | "취소";

// 페이지당 표시 건수 및 번호 페이지네이션 윈도우 크기(1,2,3,4,5)
const PAGE_SIZE = 10;
const PAGE_WINDOW = 5;

// 백엔드 TransactionStatus enum → 화면 라벨 매핑
const STATUS_LABEL: Record<AdminTransactionStatusType, string> = {
  SUCCESS: "완료",
  PROCESSING: "처리중",
  FAILED: "실패",
  CANCELLED: "취소",
};

const AdminTransactionManagement: React.FC = () => {
  const [transactions, setTransactions] = useState<AdminTransactionInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("전체");
  const [page, setPage] = useState(1);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const data = await getAllTransactions();
      setTransactions(data);
    } catch (error) {
      console.error("거래 내역 조회 실패:", error);
      setIsError(true);
      toast.error("거래 내역을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const data = await getAllTransactions();
        if (active) setTransactions(data);
      } catch (error) {
        if (!active) return;
        console.error("거래 내역 조회 실패:", error);
        setIsError(true);
        toast.error("거래 내역을 불러오는데 실패했습니다.");
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // 검색·필터 적용 후 최신순(일시 내림차순, 동시각이면 거래ID 큰 순)으로 정렬한다.
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return transactions
      .filter((tx) => {
        const matchSearch =
          !search ||
          String(tx.transactionId).includes(q) ||
          String(tx.senderAccountId).includes(q) ||
          String(tx.receiverAccountId).includes(q);
        const matchFilter = filter === "전체" || STATUS_LABEL[tx.status] === filter;
        return matchSearch && matchFilter;
      })
      .sort((a, b) => {
        const t =
          new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
        return t !== 0 ? t : Number(b.transactionId) - Number(a.transactionId);
      });
  }, [transactions, search, filter]);

  // 10개씩 페이지네이션
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // 검색·필터가 바뀌면 항상 첫 페이지로 되돌린다.
  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  // 표시할 페이지 번호 윈도우(예: 1 2 3 4 5 → 6 7 8 9 10)
  const windowStart = Math.floor((currentPage - 1) / PAGE_WINDOW) * PAGE_WINDOW + 1;
  const windowEnd = Math.min(windowStart + PAGE_WINDOW - 1, pageCount);
  const pageNumbers = Array.from(
    { length: windowEnd - windowStart + 1 },
    (_, i) => windowStart + i,
  );

  return (
    <AdminShell title="거래 관리">
      <div className="space-y-4">
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">거래 관리</h2>
            <p className="text-sm text-slate-400 mt-0.5">전체 {filtered.length}건</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="거래ID·계좌 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-cyan-300 w-52"
              />
            </div>
            <FilterTabs<FilterType>
              options={["전체", "완료", "처리중", "실패", "취소"]}
              active={filter}
              onChange={setFilter}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["거래ID", "출금 계좌", "입금 계좌", "금액", "카테고리", "일시", "상태"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-xs font-semibold text-slate-400 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-slate-400">
                    거래 내역을 불러오는 중입니다...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-sm text-rose-500">
                    <p className="mb-3">거래 내역을 불러오지 못했습니다.</p>
                    <button
                      type="button"
                      onClick={fetchTransactions}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      다시 시도
                    </button>
                  </td>
                </tr>
              ) : paged.length > 0 ? (
                paged.map((tx) => (
                  <tr
                    key={tx.transactionId}
                    className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-4 py-4 text-sm font-mono font-bold text-blue-600">
                      TX{tx.transactionId}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                      #{tx.senderAccountId}
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                      #{tx.receiverAccountId}
                    </td>
                    <td className="px-4 py-4 text-sm font-bold text-slate-800">
                      ₩{Number(tx.amount).toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600">{tx.category || "-"}</td>
                    <td className="px-4 py-4 text-sm text-slate-600">
                      {tx.createdAt ? new Date(tx.createdAt).toLocaleString("ko-KR") : "-"}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge status={STATUS_LABEL[tx.status]} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">
                    {transactions.length === 0 ? "거래 내역이 없습니다." : "검색 결과가 없습니다."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination — 최신순 10개씩, 번호 페이지네이션 */}
        {!isLoading && !isError && filtered.length > 0 && (
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
              aria-label="이전 페이지"
            >
              <FiChevronLeft size={15} />
            </button>

            {pageNumbers.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setPage(n)}
                className={`h-8 min-w-8 rounded-lg px-2.5 text-sm font-semibold transition-colors ${
                  n === currentPage
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {n}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={currentPage === pageCount}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
              aria-label="다음 페이지"
            >
              <FiChevronRight size={15} />
            </button>
          </div>
        )}
      </div>
    </AdminShell>
  );
};

export default AdminTransactionManagement;
