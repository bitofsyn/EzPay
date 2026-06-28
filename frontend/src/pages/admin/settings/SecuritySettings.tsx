import React, { useState } from "react";
import { AdminSlider, ToggleSwitch } from "../../../components/admin/AdminUI";
import ActivityLog from "./ActivityLog";

const SecuritySettings: React.FC = () => {
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [loginAttempts, setLoginAttempts] = useState("5");
  const [accountLock, setAccountLock] = useState(true);
  const [accessLog, setAccessLog] = useState(true);

  return (
    <div className="space-y-5">
      {/* 세션 및 접근 제어 */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">세션 및 접근 제어</h3>
        <div className="space-y-6">
          {/* 세션 만료 슬라이더 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-slate-700">세션 만료 시간</label>
              <span className="text-sm font-bold text-slate-800">{sessionTimeout}분</span>
            </div>
            <AdminSlider
              min={5}
              max={120}
              step={5}
              value={sessionTimeout}
              onChange={setSessionTimeout}
              color="#06b6d4"
            />
            <div className="flex justify-between mt-1.5">
              <span className="text-xs text-slate-400">5분</span>
              <span className="text-xs text-slate-400">120분</span>
            </div>
          </div>

          {/* 로그인 시도 제한 */}
          <div>
            <label className="text-sm font-semibold text-slate-700 block mb-2">
              로그인 시도 제한 횟수
            </label>
            <input
              type="text"
              value={loginAttempts}
              onChange={(e) => setLoginAttempts(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-300"
            />
          </div>
        </div>
      </div>

      {/* 보안 기능 */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">보안 기능</h3>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">계정 잠금 기능</p>
              <p className="text-xs text-slate-400 mt-0.5">제한 초과 시 계정 자동 잠금</p>
            </div>
            <ToggleSwitch checked={accountLock} onChange={setAccountLock} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-700">접근 로그 기록</p>
              <p className="text-xs text-slate-400 mt-0.5">모든 관리자 접근 기록 저장</p>
            </div>
            <ToggleSwitch checked={accessLog} onChange={setAccessLog} />
          </div>
        </div>
      </div>

      <ActivityLog />
    </div>
  );
};

export default SecuritySettings;
