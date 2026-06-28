import React, { useEffect, useState } from "react";
import { FiArrowRight, FiCalendar, FiFilter, FiSearch, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import { deleteTransaction, getAllTransactions } from "../../api/AdminAPI";
import AdminShell from "../../components/admin/AdminShell";
import type { ApiResponse, Transaction } from "../../types";
import { previewAdminTransactions } from "../../utils/adminPreviewData";
import { isAdminPreviewForbiddenError } from "../../utils/adminView";
import { formatAmount } from "../../utils/formatters";

const AdminTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    fetchAllTransactions();
  }, []);

  useEffect(() => {
    let filtered = transactions;

    if (searchTerm) {
      filtered = filtered.filter(
        (tx) =>
          tx.senderAccount?.accountNumber?.includes(searchTerm) ||
          tx.receiverAccount?.accountNumber?.includes(searchTerm) ||
          tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.memo?.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((tx) => tx.status === statusFilter);
    }

    if (dateFilter) {
      filtered = filtered.filter((tx) => new Date(tx.transactionDate).toISOString().split("T")[0] === dateFilter);
    }

    setFilteredTransactions(filtered);
  }, [dateFilter, searchTerm, statusFilter, transactions]);

  const fetchAllTransactions = async () => {
    try {
      const transactionsData = await getAllTransactions();
      setTransactions(transactionsData);
      setFilteredTransactions(transactionsData);
    } catch (error: unknown) {
      if (isAdminPreviewForbiddenError(error)) {
        setTransactions(previewAdminTransactions);
        setFilteredTransactions(previewAdminTransactions);
        return;
      }

      console.error("거래 내역 조회 실패:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "거래 내역을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTransaction = async (transactionId: number) => {
    if (!window.confirm(`거래 ID ${transactionId}를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;

    try {
      const response: ApiResponse = await deleteTransaction(transactionId);
      if (response.status === "success") {
        toast.success(response.message || "거래가 삭제되었습니다.");
        fetchAllTransactions();
        return;
      }
      throw new Error(response.message || "삭제 실패");
    } catch (error: unknown) {
      if (isAdminPreviewForbiddenError(error)) {
        setTransactions((prev) => prev.filter((tx) => tx.transactionId !== transactionId));
        return;
      }

      console.error("거래 삭제 실패:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "거래 삭제에 실패했습니다.");
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "bg-emerald-50 text-emerald-700";
      case "PENDING":
        return "bg-amber-50 text-amber-700";
      case "FAILED":
        return "bg-rose-50 text-rose-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "성공";
      case "PENDING":
        return "대기중";
      case "FAILED":
        return "실패";
      default:
        return status;
    }
  };

  const totalAmount = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const successCount = filteredTransactions.filter((tx) => tx.status === "SUCCESS").length;
  const pendingCount = filteredTransactions.filter((tx) => tx.status === "PENDING").length;
  const failedCount = filteredTransactions.filter((tx) => tx.status === "FAILED").length;

  return (
    <AdminShell title="거래 관리" description="전체 거래 내역 조회 및 관리">
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold text-slate-500">총 거래 수</p>
            <p className="mt-3 text-[28px] font-black text-slate-950">{filteredTransactions.length.toLocaleString()}건</p>
          </article>
          <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold text-slate-500">총 거래 금액</p>
            <p className="mt-3 text-[28px] font-black text-cyan-700">{formatAmount(totalAmount)}원</p>
          </article>
          <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold text-slate-500">성공 / 대기 / 실패</p>
            <p className="mt-3 text-lg font-black text-slate-900">
              <span className="text-emerald-700">{successCount}</span> / <span className="text-amber-700">{pendingCount}</span> /{" "}
              <span className="text-rose-700">{failedCount}</span>
            </p>
          </article>
          <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold text-slate-500">성공률</p>
            <p className="mt-3 text-[28px] font-black text-emerald-700">
              {filteredTransactions.length > 0 ? ((successCount / filteredTransactions.length) * 100).toFixed(1) : 0}%
            </p>
          </article>
        </section>

        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_240px_260px]">
            <div className="relative">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="계좌번호, 설명, 메모로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
              />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <FiFilter className="text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-12 w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
              >
                <option value="ALL">전체 상태</option>
                <option value="SUCCESS">성공</option>
                <option value="PENDING">대기중</option>
                <option value="FAILED">실패</option>
              </select>
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <FiCalendar className="text-slate-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="h-12 w-full bg-transparent text-sm font-semibold text-slate-700 outline-none"
              />
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  <th className="px-6 py-4">거래 ID</th>
                  <th className="px-6 py-4">보낸 계좌</th>
                  <th className="px-6 py-4 text-center"></th>
                  <th className="px-6 py-4">받는 계좌</th>
                  <th className="px-6 py-4 text-right">금액</th>
                  <th className="px-6 py-4">상태</th>
                  <th className="px-6 py-4">일시</th>
                  <th className="px-6 py-4">설명</th>
                  <th className="px-6 py-4 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center text-sm font-semibold text-slate-400">
                      거래 데이터를 불러오는 중입니다.
                    </td>
                  </tr>
                ) : filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.transactionId} className="transition hover:bg-slate-50/80">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">#{tx.transactionId}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-900">{tx.senderAccount?.accountNumber || "-"}</div>
                        <div className="text-xs font-medium text-slate-400">{tx.senderAccount?.bankName || ""}</div>
                      </td>
                      <td className="px-6 py-4 text-center text-slate-300">
                        <FiArrowRight className="inline" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-900">{tx.receiverAccount?.accountNumber || "-"}</div>
                        <div className="text-xs font-medium text-slate-400">{tx.receiverAccount?.bankName || ""}</div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-cyan-700">{formatAmount(tx.amount)}원</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1.5 text-xs font-bold ${getStatusBadgeStyle(tx.status)}`}>
                          {getStatusText(tx.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(tx.transactionDate).toLocaleString("ko-KR")}
                      </td>
                      <td className="max-w-xs px-6 py-4 text-sm text-slate-500">{tx.description || tx.memo || "-"}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteTransaction(tx.transactionId)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-rose-600 transition hover:bg-rose-50"
                          title="삭제"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center text-sm font-semibold text-slate-400">
                      조회된 거래 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
};

export default AdminTransactions;
