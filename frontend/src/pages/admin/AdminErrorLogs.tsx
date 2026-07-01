import React, { useCallback, useEffect, useState } from "react";
import { FiAlertCircle, FiCheckCircle, FiFilter, FiRefreshCw, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import { deleteErrorLog, getAllErrorLogs, getErrorLogsByStatus, resolveErrorLog } from "../../api/AdminAPI";
import AdminShell from "../../components/admin/AdminShell";
import type { ErrorLog } from "../../types";

type StatusFilter = "ALL" | "RESOLVED" | "UNRESOLVED";

const AdminErrorLogs: React.FC = () => {
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const fetchErrorLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = statusFilter === "ALL" ? await getAllErrorLogs() : await getErrorLogsByStatus(statusFilter);
      setErrorLogs(data);
    } catch (error) {
      console.error("에러 로그 조회 실패:", error);
      toast.error("에러 로그를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchErrorLogs();
  }, [fetchErrorLogs]);

  const handleResolve = async (logId: number) => {
    if (!window.confirm("이 에러 로그를 해결 완료로 표시하시겠습니까?")) return;

    try {
      await resolveErrorLog(logId);
      toast.success("에러 로그가 해결 완료 처리되었습니다.");
      fetchErrorLogs();
    } catch (error) {
      console.error("에러 로그 해결 처리 실패:", error);
      toast.error("에러 로그 해결 처리에 실패했습니다.");
    }
  };

  const handleDelete = async (logId: number) => {
    if (!window.confirm("정말 이 에러 로그를 삭제하시겠습니까?")) return;

    try {
      await deleteErrorLog(logId);
      toast.success("에러 로그가 삭제되었습니다.");
      fetchErrorLogs();
    } catch (error) {
      console.error("에러 로그 삭제 실패:", error);
      toast.error("에러 로그 삭제에 실패했습니다.");
    }
  };

  const unresolvedCount = errorLogs.filter((log) => log.status === "UNRESOLVED").length;
  const resolvedCount = errorLogs.filter((log) => log.status === "RESOLVED").length;

  return (
    <AdminShell
      title="에러 로그 관리"
      description="시스템 에러 모니터링 및 관리"
      actions={
        <button
          type="button"
          onClick={fetchErrorLogs}
          className="hidden items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-white sm:flex"
        >
          <FiRefreshCw size={16} />
          새로고침
        </button>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold text-slate-500">전체 로그</p>
            <p className="mt-3 text-[28px] font-black text-slate-950">{errorLogs.length}</p>
          </article>
          <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold text-slate-500">미해결</p>
            <p className="mt-3 text-[28px] font-black text-rose-700">{unresolvedCount}</p>
          </article>
          <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold text-slate-500">해결됨</p>
            <p className="mt-3 text-[28px] font-black text-emerald-700">{resolvedCount}</p>
          </article>
        </section>

        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4">
            <FiFilter className="text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="h-12 bg-transparent text-sm font-semibold text-slate-700 outline-none"
            >
              <option value="ALL">전체 상태</option>
              <option value="UNRESOLVED">미해결</option>
              <option value="RESOLVED">해결됨</option>
            </select>
          </div>
        </section>

        <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  <th className="px-6 py-4">로그 ID</th>
                  <th className="px-6 py-4">서비스명</th>
                  <th className="px-6 py-4">에러 메시지</th>
                  <th className="px-6 py-4">발생 시간</th>
                  <th className="px-6 py-4">상태</th>
                  <th className="px-6 py-4 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-sm font-semibold text-slate-400">
                      에러 로그를 불러오는 중입니다.
                    </td>
                  </tr>
                ) : errorLogs.length > 0 ? (
                  errorLogs.map((log) => (
                    <tr key={log.logId} className="transition hover:bg-slate-50/80">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">{log.logId}</td>
                      <td className="px-6 py-4">
                        <span className="rounded-full bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700">{log.serviceName}</span>
                      </td>
                      <td className="max-w-xl px-6 py-4 text-sm text-slate-700">{log.errorMessage}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{new Date(log.occurredAt).toLocaleString("ko-KR")}</td>
                      <td className="px-6 py-4">
                        {log.status === "RESOLVED" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                            <FiCheckCircle size={14} />
                            해결됨
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700">
                            <FiAlertCircle size={14} />
                            미해결
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {log.status === "UNRESOLVED" && (
                            <button
                              type="button"
                              onClick={() => handleResolve(log.logId)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl text-emerald-600 transition hover:bg-emerald-50"
                              title="해결 완료"
                            >
                              <FiCheckCircle size={18} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDelete(log.logId)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-rose-600 transition hover:bg-rose-50"
                            title="삭제"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center text-sm font-semibold text-slate-400">
                      조회된 에러 로그가 없습니다.
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

export default AdminErrorLogs;
