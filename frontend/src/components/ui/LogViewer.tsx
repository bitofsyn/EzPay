import React from "react";
import type { LogEntry } from "../../types";
import { getLogLevelDotColor } from "../../utils/admin/styleMapper";
import { BadgeDark } from "./Badge";

interface LogViewerProps {
  logs: LogEntry[];
  isLoading?: boolean;
}

const LogViewer: React.FC<LogViewerProps> = ({ logs, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-[#1a202c] overflow-hidden border border-slate-700 shadow-xl">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0f172a]">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-amber-500/70" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
          <span className="ml-3 text-xs text-white/50">System Logs</span>
        </div>
        <div className="p-6 text-center text-slate-400">로딩 중...</div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-2xl bg-[#1a202c] overflow-hidden border border-slate-700 shadow-xl">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0f172a]">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-amber-500/70" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
          <span className="ml-3 text-xs text-white/50">System Logs</span>
        </div>
        <div className="p-6 text-center text-slate-400">로그가 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#1a202c] overflow-hidden border border-slate-700 shadow-xl">
      {/* Terminal Title Bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0f172a]">
        <div className="w-3 h-3 rounded-full bg-red-500/70" />
        <div className="w-3 h-3 rounded-full bg-amber-500/70" />
        <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
        <span className="ml-3 text-xs text-white/50">System Logs ({logs.length})</span>
      </div>

      {/* Logs Container */}
      <div className="font-mono text-xs overflow-y-auto max-h-96">
        {logs.map((log) => (
          <div
            key={log.id}
            className="px-4 py-2 border-b border-white/5 hover:bg-white/5 transition flex items-center gap-3"
          >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getLogLevelDotColor(log.level)}`} />
            <span className="text-slate-400 w-12 flex-shrink-0">{log.time}</span>
            <BadgeDark variant="level" value={log.level} />
            <span className="text-cyan-300 w-20 flex-shrink-0 truncate">{log.service}</span>
            <span className="text-slate-300 flex-1 truncate">{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LogViewer;
