import React from "react";

export const ACTIVITY_LOG = [
  { id: 1, date: "06-22 14:38", admin: "admin", action: "정책 변경 — 일일 송금 한도", result: "정상" },
  { id: 2, date: "06-22 12:18", admin: "admin", action: "비밀번호 변경", result: "정상" },
  { id: 3, date: "06-21 09:05", admin: "admin", action: "사용자 계정 잠금 (ID:1042)", result: "정상" },
  { id: 4, date: "06-20 18:22", admin: "admin", action: "시스템 점검 모드 활성화", result: "정상" },
  { id: 5, date: "06-19 11:48", admin: "admin", action: "수수료율 변경", result: "실패" },
];

const ActivityLog: React.FC = () => (
  <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
      <h3 className="text-sm font-bold text-slate-800">관리자 활동 로그</h3>
      <span className="text-xs text-slate-400">최근 5건</span>
    </div>
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
  </div>
);

export default ActivityLog;
