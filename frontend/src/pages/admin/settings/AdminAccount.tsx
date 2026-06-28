import React, { useState } from "react";
import ActivityLog from "./ActivityLog";

const AdminAccount: React.FC = () => {
  const [name, setName] = useState("관리자");
  const [email, setEmail] = useState("admin@ezpay.com");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-300";

  return (
    <div className="space-y-5">
      {/* 관리자 정보 */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">관리자 정보</h3>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-white font-bold text-lg shrink-0">
            A
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">관리자</p>
            <span className="mt-0.5 inline-block rounded-full bg-amber-100 text-amber-700 text-xs font-bold px-2.5 py-0.5">
              SUPER_ADMIN
            </span>
          </div>
        </div>
        <div className="space-y-3 border-t border-slate-100 pt-5">
          {[
            { label: "이메일", value: "admin@ezpay.com" },
            { label: "최근 로그인", value: "2026-06-22 14:30" },
            { label: "계정 생성일", value: "2025-01-01" },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{label}</span>
              <span className="text-xs font-semibold text-slate-700">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 정보 수정 */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">정보 수정</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
          </div>
          <button className="w-full rounded-xl bg-slate-900 text-white py-2.5 text-sm font-bold hover:bg-slate-800 transition-colors mt-1">
            저장
          </button>
        </div>
      </div>

      {/* 비밀번호 변경 */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5">비밀번호 변경</h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">현재 비밀번호</label>
            <input
              type="password"
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">새 비밀번호</label>
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">비밀번호 확인</label>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              className={inputCls}
            />
          </div>
          <button className="w-full rounded-xl bg-slate-900 text-white py-2.5 text-sm font-bold hover:bg-slate-800 transition-colors mt-1">
            비밀번호 변경
          </button>
        </div>
      </div>

      <ActivityLog />
    </div>
  );
};

export default AdminAccount;
