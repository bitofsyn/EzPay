import React, { useCallback, useEffect, useState } from "react";
import { FiSearch } from "react-icons/fi";
import toast from "react-hot-toast";
import AdminShell from "../../components/admin/AdminShell";
import { FilterTabs, StatusBadge } from "../../components/admin/AdminUI";
import { getAllTransactions } from "../../api/AdminAPI";
import type { AdminTransactionInfo, AdminTransactionStatusType } from "../../types";

type FilterType = "전체" | "완료" | "처리중" | "실패" | "취소";

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

  const filtered = transactions.filter((tx) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      String(tx.transactionId).includes(q) ||
      String(tx.senderAccountId).includes(q) ||
      String(tx.receiverAccountId).includes(q);
    const matchFilter = filter === "전체" || STATUS_LABEL[tx.status] === filter;
    return matchSearch && matchFilter;
  });

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
              ) : filtered.length > 0 ? (
                filtered.map((tx) => (
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
      </div>
    </AdminShell>
  );
};

export default AdminTransactionManagement;
