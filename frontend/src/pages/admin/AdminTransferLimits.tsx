import React, { useEffect, useState } from "react";
import { FiDollarSign, FiEdit2, FiRefreshCw, FiSearch } from "react-icons/fi";
import toast from "react-hot-toast";
import { getAllTransferLimits, resetUserTransferLimit, updateUserTransferLimit } from "../../api/AdminAPI";
import AdminShell from "../../components/admin/AdminShell";
import type { AdminTransferLimitInfo, ApiResponse } from "../../types";
import { previewTransferLimits } from "../../utils/adminPreviewData";
import { isAdminPreviewForbiddenError } from "../../utils/adminView";
import { formatAmount } from "../../utils/formatters";

const AdminTransferLimits: React.FC = () => {
  const [transferLimits, setTransferLimits] = useState<AdminTransferLimitInfo[]>([]);
  const [filteredLimits, setFilteredLimits] = useState<AdminTransferLimitInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLimit, setEditingLimit] = useState<AdminTransferLimitInfo | null>(null);
  const [editDailyLimit, setEditDailyLimit] = useState("");
  const [editPerTransactionLimit, setEditPerTransactionLimit] = useState("");

  useEffect(() => {
    fetchAllTransferLimits();
  }, []);

  useEffect(() => {
    let filtered = transferLimits;

    if (searchTerm) {
      filtered = filtered.filter(
        (limit) =>
          limit.userId.toString().includes(searchTerm) ||
          (limit.userName && limit.userName.toLowerCase().includes(searchTerm.toLowerCase())),
      );
    }

    setFilteredLimits(filtered);
  }, [searchTerm, transferLimits]);

  const fetchAllTransferLimits = async () => {
    try {
      const limitsData = await getAllTransferLimits();
      setTransferLimits(limitsData);
      setFilteredLimits(limitsData);
    } catch (error: unknown) {
      if (isAdminPreviewForbiddenError(error)) {
        setTransferLimits(previewTransferLimits);
        setFilteredLimits(previewTransferLimits);
        return;
      }

      console.error("송금 한도 조회 실패:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "송금 한도를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEditModal = (limit: AdminTransferLimitInfo) => {
    setEditingLimit(limit);
    setEditDailyLimit(limit.dailyLimit.toString());
    setEditPerTransactionLimit(limit.perTransactionLimit.toString());
    setEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setEditingLimit(null);
    setEditDailyLimit("");
    setEditPerTransactionLimit("");
  };

  const handleUpdateLimit = async () => {
    if (!editingLimit) return;

    const dailyLimitNum = parseFloat(editDailyLimit);
    const perTxLimitNum = parseFloat(editPerTransactionLimit);

    if (Number.isNaN(dailyLimitNum) || Number.isNaN(perTxLimitNum)) {
      toast.error("올바른 금액을 입력해주세요.");
      return;
    }

    if (dailyLimitNum < perTxLimitNum) {
      toast.error("일일 한도는 건당 한도보다 작을 수 없습니다.");
      return;
    }

    try {
      const response: ApiResponse = await updateUserTransferLimit(editingLimit.userId, {
        dailyLimit: dailyLimitNum,
        perTransactionLimit: perTxLimitNum,
      });

      if (response.status === "success") {
        toast.success(response.message || "송금 한도가 수정되었습니다.");
        handleCloseEditModal();
        fetchAllTransferLimits();
        return;
      }

      throw new Error(response.message || "수정 실패");
    } catch (error: unknown) {
      if (isAdminPreviewForbiddenError(error)) {
        setTransferLimits((prev) =>
          prev.map((limit) =>
            limit.userId === editingLimit.userId
              ? {
                  ...limit,
                  dailyLimit: dailyLimitNum,
                  perTransactionLimit: perTxLimitNum,
                  remainingAmount: Math.max(dailyLimitNum - limit.usedAmount, 0),
                }
              : limit,
          ),
        );
        handleCloseEditModal();
        return;
      }

      console.error("송금 한도 수정 실패:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "송금 한도 수정에 실패했습니다.");
    }
  };

  const handleResetLimit = async (userId: number, userName?: string) => {
    const displayName = userName || `사용자 ${userId}`;
    if (!window.confirm(`${displayName}의 송금 한도를 기본값으로 초기화하시겠습니까?`)) return;

    try {
      const response: ApiResponse = await resetUserTransferLimit(userId);
      if (response.status === "success") {
        toast.success(response.message || "송금 한도가 초기화되었습니다.");
        fetchAllTransferLimits();
        return;
      }
      throw new Error(response.message || "초기화 실패");
    } catch (error: unknown) {
      if (isAdminPreviewForbiddenError(error)) {
        setTransferLimits((prev) =>
          prev.map((limit) =>
            limit.userId === userId
              ? {
                  ...limit,
                  dailyLimit: 3000000,
                  perTransactionLimit: 1000000,
                  remainingAmount: Math.max(3000000 - limit.usedAmount, 0),
                }
              : limit,
          ),
        );
        return;
      }

      console.error("송금 한도 초기화 실패:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "송금 한도 초기화에 실패했습니다.");
    }
  };

  const getUsagePercentage = (used: number, total: number) => {
    if (total === 0) return 0;
    return Math.min((used / total) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "bg-rose-500";
    if (percentage >= 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <AdminShell title="송금 한도 관리" description="사용자별 송금 한도 조회 및 수정">
      <div className="space-y-6">
        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="사용자 ID 또는 이름으로 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
            />
          </div>
          <p className="mt-4 text-sm font-medium text-slate-400">총 {filteredLimits.length}명의 사용자가 표시됩니다.</p>
        </section>

        <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  <th className="px-6 py-4">사용자 ID</th>
                  <th className="px-6 py-4">이름</th>
                  <th className="px-6 py-4 text-right">일일 한도</th>
                  <th className="px-6 py-4 text-right">건당 한도</th>
                  <th className="px-6 py-4">오늘 사용량</th>
                  <th className="px-6 py-4 text-right">남은 한도</th>
                  <th className="px-6 py-4 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-sm font-semibold text-slate-400">
                      송금 한도 데이터를 불러오는 중입니다.
                    </td>
                  </tr>
                ) : filteredLimits.length > 0 ? (
                  filteredLimits.map((limit) => {
                    const usagePercentage = getUsagePercentage(limit.usedAmount, limit.dailyLimit);
                    return (
                      <tr key={limit.limitId} className="transition hover:bg-slate-50/80">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-700">{limit.userId}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-950">{limit.userName || "-"}</td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-slate-700">{formatAmount(limit.dailyLimit)}원</td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-slate-700">
                          {formatAmount(limit.perTransactionLimit)}원
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-full max-w-36 overflow-hidden rounded-full bg-slate-200">
                              <div className={`h-full ${getUsageColor(usagePercentage)}`} style={{ width: `${usagePercentage}%` }} />
                            </div>
                            <span className="text-sm font-medium text-slate-500">{formatAmount(limit.usedAmount)}원</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-bold">
                          <span className={limit.remainingAmount > 0 ? "text-emerald-700" : "text-rose-700"}>
                            {formatAmount(limit.remainingAmount)}원
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(limit)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl text-sky-600 transition hover:bg-sky-50"
                              title="수정"
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResetLimit(limit.userId, limit.userName)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl text-amber-600 transition hover:bg-amber-50"
                              title="초기화"
                            >
                              <FiRefreshCw size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-sm font-semibold text-slate-400">
                      조회된 송금 한도 정보가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {editModalOpen && editingLimit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <FiDollarSign size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-950">송금 한도 수정</h2>
                <p className="mt-1 text-sm font-medium text-slate-400">
                  {editingLimit.userName || `사용자 ${editingLimit.userId}`}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="preview-daily-limit" className="mb-2 block text-sm font-bold text-slate-700">일일 한도 (원)</label>
                <input
                  id="preview-daily-limit"
                  type="number"
                  value={editDailyLimit}
                  onChange={(e) => setEditDailyLimit(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                />
              </div>
              <div>
                <label htmlFor="preview-per-transaction-limit" className="mb-2 block text-sm font-bold text-slate-700">건당 한도 (원)</label>
                <input
                  id="preview-per-transaction-limit"
                  type="number"
                  value={editPerTransactionLimit}
                  onChange={(e) => setEditPerTransactionLimit(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-900 outline-none transition focus:border-slate-300 focus:bg-white"
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleCloseEditModal}
                className="flex-1 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleUpdateLimit}
                className="flex-1 rounded-2xl bg-[#0f172a] px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
};

export default AdminTransferLimits;
