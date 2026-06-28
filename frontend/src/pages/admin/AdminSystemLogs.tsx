import React, { useState } from "react";
import AdminShell from "../../components/admin/AdminShell";

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";
type FilterType = "전체" | LogLevel;

interface LogEntry {
  id: number;
  time: string;
  level: LogLevel;
  service: string;
  message: string;
}

const MOCK_LOGS: LogEntry[] = [
  { id: 1,  time: "10:21:34", level: "INFO",  service: "notification-service", message: "POST /api/transfers/analyze - 200 OK" },
  { id: 2,  time: "10:20:29", level: "WARN",  service: "transfer-service",     message: "Kafka event published: TRANSFER_COMPLETED" },
  { id: 3,  time: "10:19:24", level: "DEBUG", service: "account-service",      message: "DELETE /api/accounts/acc4 - 404 Not Found" },
  { id: 4,  time: "10:18:19", level: "DEBUG", service: "risk-analyzer",        message: "GET /api/accounts - 200 OK" },
  { id: 5,  time: "10:17:14", level: "ERROR", service: "notification-service", message: "DB connection pool: 42/100" },
  { id: 6,  time: "10:16:09", level: "DEBUG", service: "risk-analyzer",        message: "POST /api/transfers/analyze - 200 OK" },
  { id: 7,  time: "10:15:04", level: "ERROR", service: "account-service",      message: "DELETE /api/accounts/acc4 - 404 Not Found" },
  { id: 8,  time: "10:13:59", level: "INFO",  service: "transfer-service",     message: "Kafka event published: TRANSFER_COMPLETED" },
  { id: 9,  time: "10:12:54", level: "DEBUG", service: "auth-service",         message: "DB connection pool: 42/100" },
  { id: 10, time: "10:11:49", level: "INFO",  service: "notification-service", message: "POST /api/transfers - 200 OK" },
  { id: 11, time: "10:10:44", level: "ERROR", service: "account-service",      message: "POST /api/auth/login - 401 Unauthorized" },
  { id: 12, time: "10:09:39", level: "DEBUG", service: "risk-analyzer",        message: "PATCH /api/accounts/{id}/primary - 200 OK" },
  { id: 13, time: "10:08:34", level: "INFO",  service: "notification-service", message: "Risk analysis completed: CAUTION" },
  { id: 14, time: "10:07:29", level: "INFO",  service: "transfer-service",     message: "DB connection pool: 42/100" },
  { id: 15, time: "10:06:24", level: "ERROR", service: "account-service",      message: "Cache hit rate: 87.3%" },
  { id: 16, time: "10:05:19", level: "ERROR", service: "auth-service",         message: "Kafka event published: TRANSFER_COMPLETED" },
  { id: 17, time: "10:04:50", level: "ERROR", service: "notification-service", message: "DB connection pool: 42/100" },
  { id: 18, time: "10:03:45", level: "ERROR", service: "account-service",      message: "DB connection pool: 42/100" },
  { id: 19, time: "10:02:40", level: "DEBUG", service: "account-service",      message: "POST /api/auth/login - 401 Unauthorized" },
  { id: 20, time: "10:01:35", level: "ERROR", service: "account-service",      message: "Risk analysis completed: CAUTION" },
  { id: 21, time: "10:00:54", level: "DEBUG", service: "transfer-service",     message: "Kafka event published: TRANSFER_COMPLETED" },
  { id: 22, time: "09:59:34", level: "DEBUG", service: "risk-analyzer",        message: "Cache hit rate: 87.3%" },
  { id: 23, time: "09:58:20", level: "ERROR", service: "transfer-service",     message: "POST /api/transfers - 200 OK" },
  { id: 24, time: "09:57:34", level: "WARN",  service: "notification-service", message: "GET /api/accounts - 200 OK" },
  { id: 25, time: "09:56:29", level: "WARN",  service: "notification-service", message: "GET /api/accounts - 200 OK" },
  { id: 26, time: "09:55:24", level: "WARN",  service: "account-service",      message: "PATCH /api/accounts/{id}/primary - 200 OK" },
  { id: 27, time: "09:54:19", level: "ERROR", service: "account-service",      message: "POST /api/auth/login - 401 Unauthorized" },
  { id: 28, time: "09:53:14", level: "INFO",  service: "auth-service",         message: "DB connection pool: 42/100" },
  { id: 29, time: "09:52:09", level: "DEBUG", service: "notification-service", message: "POST /api/transfers/analyze - 200 OK" },
  { id: 30, time: "09:51:04", level: "DEBUG", service: "transfer-service",     message: "POST /api/auth/login - 401 Unauthorized" },
];

const LEVEL_BADGE: Record<LogLevel, string> = {
  INFO:  "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30",
  WARN:  "bg-amber-500/20 text-amber-300 border border-amber-500/30",
  ERROR: "bg-red-500/20 text-red-400 border border-red-500/30",
  DEBUG: "bg-purple-500/20 text-purple-300 border border-purple-500/30",
};

const FILTER_TABS: FilterType[] = ["전체", "INFO", "WARN", "ERROR", "DEBUG"];

const AdminSystemLogs: React.FC = () => {
  const [filter, setFilter] = useState<FilterType>("전체");

  const filtered = filter === "전체" ? MOCK_LOGS : MOCK_LOGS.filter((l) => l.level === filter);

  return (
    <AdminShell title="시스템 로그">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">시스템 로그</h2>
            <p className="text-sm text-slate-400 mt-0.5">30건 표시</p>
          </div>
          {/* Filter tabs (light style, above dark container) */}
          <div className="flex rounded-xl border border-slate-200 bg-white overflow-hidden">
            {FILTER_TABS.map((tab) => {
              const active = filter === tab;
              const colorMap: Record<FilterType, string> = {
                "전체": active ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-50",
                INFO:  active ? "bg-cyan-500 text-white" : "text-slate-500 hover:bg-slate-50",
                WARN:  active ? "bg-amber-500 text-white" : "text-slate-500 hover:bg-slate-50",
                ERROR: active ? "bg-red-500 text-white" : "text-slate-500 hover:bg-slate-50",
                DEBUG: active ? "bg-purple-500 text-white" : "text-slate-500 hover:bg-slate-50",
              };
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-4 py-2 text-sm font-semibold transition ${colorMap[tab]}`}
                >
                  {tab}
                </button>
              );
            })}
          </div>
        </div>

        {/* Log Viewer */}
        <div className="rounded-2xl bg-[#1a202c] overflow-hidden border border-slate-700 shadow-xl">
          {/* Terminal title bar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-[#0f172a]">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-amber-500/70" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/70" />
            <span className="ml-3 text-xs font-mono font-semibold text-slate-400">
              System Log Monitor
            </span>
          </div>

          {/* Log rows */}
          <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto">
            {filtered.map((log) => (
              <div
                key={log.id}
                className={`flex items-baseline gap-3 px-4 py-2.5 font-mono text-xs transition-colors ${
                  log.level === "ERROR" ? "bg-red-500/10 hover:bg-red-500/15" : "hover:bg-white/5"
                }`}
              >
                {/* Time */}
                <span className="shrink-0 text-slate-500 w-[62px]">{log.time}</span>

                {/* Level badge */}
                <span
                  className={`shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${LEVEL_BADGE[log.level]}`}
                  style={{ minWidth: "46px", justifyContent: "center" }}
                >
                  {log.level}
                </span>

                {/* Service */}
                <span className="shrink-0 text-slate-400 w-[160px] truncate">{log.service}</span>

                {/* Message */}
                <span
                  className={`flex-1 truncate ${
                    log.level === "ERROR"
                      ? "text-red-300"
                      : log.level === "WARN"
                      ? "text-amber-200"
                      : log.level === "INFO"
                      ? "text-slate-200"
                      : "text-slate-400"
                  }`}
                >
                  {log.message}
                </span>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="py-12 text-center text-slate-500 text-sm font-mono">
                No logs found for level: {filter}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminSystemLogs;
