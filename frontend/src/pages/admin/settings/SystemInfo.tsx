import React from "react";
import ActivityLog from "./ActivityLog";

interface InfoRowProps {
  label: string;
  value: string;
  badge?: "정상" | "주의" | "오류" | null;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, badge }) => (
  <div className="flex items-center justify-between">
    <span className="text-xs text-slate-400">{label}</span>
    <div className="flex items-center gap-2">
      <span className="text-xs font-bold text-slate-800">{value}</span>
      {badge && (
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            badge === "정상"
              ? "bg-emerald-50 text-emerald-700"
              : badge === "주의"
              ? "bg-amber-50 text-amber-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              badge === "정상"
                ? "bg-emerald-500"
                : badge === "주의"
                ? "bg-amber-500"
                : "bg-red-500"
            }`}
          />
          {badge}
        </span>
      )}
    </div>
  </div>
);

const SystemInfo: React.FC = () => (
  <div className="space-y-5">
    {/* 시스템 버전 */}
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">시스템 버전</h3>
      <div className="space-y-4">
        <InfoRow label="서비스 버전" value="v2.5.1" badge="정상" />
        <InfoRow label="프론트엔드" value="React 18.3.1" badge="정상" />
        <InfoRow label="백엔드" value="Spring Boot 3.2.0" badge="정상" />
        <InfoRow label="마지막 배포" value="2026-06-22 02:00" badge={null} />
      </div>
    </div>

    {/* 인프라 상태 */}
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">인프라 상태</h3>
      <div className="space-y-4">
        <InfoRow label="웹 서버" value="Nginx 1.24" badge="정상" />
        <InfoRow label="데이터베이스" value="PostgreSQL 15" badge="정상" />
        <InfoRow label="캐시 서버" value="Redis 7.2" badge="정상" />
        <InfoRow label="메시지 큐" value="Kafka 3.6" badge="주의" />
      </div>
    </div>

    <ActivityLog />
  </div>
);

export default SystemInfo;
