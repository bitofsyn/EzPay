import React from "react";
import AdminShell from "../../components/admin/AdminShell";
import { FilterTab, LogViewer } from "../../components/ui";
import { useSystemLogs, SYSTEM_LOG_FILTER_TABS } from "../../hooks";

const AdminSystemLogs: React.FC = () => {
  const { filteredLogs, filter, setFilter, totalCount } = useSystemLogs(30);

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

        {/* Log Viewer Component */}
        <LogViewer logs={filteredLogs} />
      </div>
    </AdminShell>
  );
};

export default AdminSystemLogs;
