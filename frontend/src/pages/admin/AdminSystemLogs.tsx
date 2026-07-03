import React from "react";
import AdminShell from "../../components/admin/AdminShell";
import { FilterTab, LogViewer } from "../../components/ui";
import { useSystemLogs, SYSTEM_LOG_FILTER_TABS } from "../../hooks";

const AdminSystemLogs: React.FC = () => {
  const { filteredLogs, filter, setFilter, totalCount, isLoading, isError, refetch } = useSystemLogs(30);

  return (
    <AdminShell title="시스템 로그">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">시스템 로그</h2>
            <p className="text-sm text-slate-400 mt-0.5">{totalCount}건 표시</p>
          </div>
          <FilterTab tabs={SYSTEM_LOG_FILTER_TABS as string[]} activeTab={filter} onChange={(tab) => setFilter(tab as typeof filter)} />
        </div>

        {/* Error state */}
        {isError ? (
          <div className="rounded-2xl border border-slate-700 bg-[#1a202c] p-8 text-center">
            <p className="mb-3 text-sm font-semibold text-rose-300">시스템 로그를 불러오지 못했습니다.</p>
            <button
              type="button"
              onClick={refetch}
              className="rounded-lg border border-slate-600 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-white/5"
            >
              다시 시도
            </button>
          </div>
        ) : (
          /* Log Viewer Component (로딩/빈 상태는 LogViewer 내부 처리) */
          <LogViewer logs={filteredLogs} isLoading={isLoading} />
        )}
      </div>
    </AdminShell>
  );
};

export default AdminSystemLogs;
