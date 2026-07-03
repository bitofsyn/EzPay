import React from "react";

interface ActivityLogRow {
  id: number;
  date: string;
  admin: string;
  action: string;
  result: string;
}

const ACTIVITY_LOG: ActivityLogRow[] = [];

const ActivityLog: React.FC = () => (
  <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
      <h3 className="text-sm font-bold text-slate-800">관리자 활동 로그</h3>
      <span className="text-xs text-slate-400">{ACTIVITY_LOG.length}건</span>
    </div>
    {ACTIVITY_LOG.length === 0 ? (
      <div className="px-5 py-12 text-center text-sm text-slate-400">
        기록된 관리자 활동이 없습니다.
      </div>
    ) : (
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50">
            {["시간", "관리자", "작업 내용", "결과"].map((h) => (
              <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-400 text-left">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ACTIVITY_LOG.map((row) => (
            <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
              <td className="px-4 py-3 text-xs font-mono text-slate-500">{row.date}</td>
              <td className="px-4 py-3 text-xs font-semibold text-cyan-600">{row.admin}</td>
              <td className="px-4 py-3 text-xs text-slate-700">{row.action}</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    row.result === "정상"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {row.result}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    )}
  </div>
);

export default ActivityLog;
