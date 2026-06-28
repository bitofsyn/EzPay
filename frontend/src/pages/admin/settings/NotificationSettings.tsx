import React, { useState } from "react";
import { ToggleSwitch } from "../../../components/admin/AdminUI";
import ActivityLog from "./ActivityLog";

const NOTIFICATION_ITEMS = [
  {
    key: "danger",
    label: "위험 거래 발생 알림",
    sub: "DANGER 등급 거래 즉시 알림",
    defaultOn: true,
  },
  {
    key: "failure",
    label: "거래 실패 알림",
    sub: "거래 실패 발생 시 알림",
    defaultOn: true,
  },
  {
    key: "system",
    label: "시스템 장애 알림",
    sub: "서버 DB 서비스 감지 시 알림",
    defaultOn: true,
  },
  {
    key: "signup",
    label: "신규 회원가입 알림",
    sub: "회원 가입 시 알림",
    defaultOn: false,
  },
  {
    key: "policy",
    label: "정책 변경 알림",
    sub: "정책 수정 적용 시 알림",
    defaultOn: true,
  },
];

const NotificationSettings: React.FC = () => {
  const [toggles, setToggles] = useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_ITEMS.map((i) => [i.key, i.defaultOn]))
  );
  const [email, setEmail] = useState("admin@ezpay.com");

  const toggle = (key: string) =>
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-5">
      {/* 운영 알림 */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">운영 알림</h3>
        <div className="space-y-5">
          {NOTIFICATION_ITEMS.map(({ key, label, sub }) => (
            <div key={key} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">{label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
              </div>
              <ToggleSwitch checked={toggles[key]} onChange={() => toggle(key)} />
            </div>
          ))}
        </div>
      </div>

      {/* 알림 수신 이메일 */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">알림 수신 이메일</h3>
        <div>
          <label className="text-xs font-semibold text-slate-500 block mb-1.5">수신 이메일</label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            />
            <button className="rounded-xl bg-slate-900 text-white px-5 py-2.5 text-sm font-bold hover:bg-slate-800 transition-colors shrink-0">
              저장
            </button>
          </div>
        </div>
      </div>

      <ActivityLog />
    </div>
  );
};

export default NotificationSettings;
