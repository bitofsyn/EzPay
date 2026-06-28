import React, { useState } from "react";
import AdminShell from "../../components/admin/AdminShell";
import { AdminSlider, ToggleSwitch } from "../../components/admin/AdminUI";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PolicyChange {
  id: string;
  date: string;
  admin: string;
  item: string;
  before: string;
  after: string;
  reason: string;
}

interface PreviewItem {
  label: string;
  before: string;
  after: string;
}

// ─── Mock history data ────────────────────────────────────────────────────────

const HISTORY: PolicyChange[] = [
  { id: "1", date: "2026-06-22 14:38", admin: "admin", item: "일일 송금 한도", before: "₩3,000,000", after: "₩5,000,000", reason: "정기 한도 조정" },
  { id: "2", date: "2026-06-28 09:15", admin: "admin", item: "수수료율", before: "0.3%", after: "0.5%", reason: "수익성 개선" },
  { id: "3", date: "2026-06-15 16:45", admin: "admin", item: "AI 자동 차단", before: "OFF", after: "ON", reason: "보안 강화" },
  { id: "4", date: "2026-06-18 11:28", admin: "admin", item: "위험도 임계치", before: "60", after: "80", reason: "오탐 감소" },
];

const RECENT_CHANGES = [
  { label: "일일 송금 한도", date: "06-22 14:38", value: "₩5,000,000" },
  { label: "수수료율", date: "06-28 09:15", value: "0.5%" },
  { label: "AI 자동 차단", date: "06-15 16:45", value: "ON" },
  { label: "위험도 임계치", date: "06-10 11:20", value: "80" },
];

// ─── Initial policy state ─────────────────────────────────────────────────────

const INITIAL = {
  dailyLimit: 5000000,
  singleLimit: 1000000,
  maxTxCount: 1000,
  feeRate: 0.5,
  minFee: 0,
  maxFee: 5000,
  aiEnabled: true,
  autoBlock: false,
  adminApproval: true,
  riskThreshold: 80,
  warnThreshold: 50,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pct = (v: number, min: number, max: number) => ((v - min) / (max - min)) * 100;

const fmtWon = (v: number) => `₩${v.toLocaleString()}`;

// ─── Component ────────────────────────────────────────────────────────────────

const AdminPolicy: React.FC = () => {
  const [policy, setPolicy] = useState(INITIAL);
  const [preview, setPreview] = useState<PreviewItem[]>([]);

  const set = <K extends keyof typeof INITIAL>(key: K, value: (typeof INITIAL)[K]) => {
    const old = policy[key];
    if (old === value) return;
    setPolicy((p) => ({ ...p, [key]: value }));

    const labelMap: Record<string, string> = {
      dailyLimit: "일일 송금 한도",
      singleLimit: "1회 송금 한도",
      maxTxCount: "최대 처리 건수",
      feeRate: "수수료율",
      minFee: "최소 수수료",
      maxFee: "최대 수수료",
      aiEnabled: "AI 분석 사용",
      autoBlock: "위험 거래 자동 차단",
      adminApproval: "관리자 승인 필요",
      riskThreshold: "위험 임계치",
      warnThreshold: "경고 임계치",
    };

    const fmt = (k: string, v: unknown) => {
      if (k === "dailyLimit" || k === "singleLimit") return fmtWon(v as number);
      if (k === "maxTxCount") return `${v}건`;
      if (k === "feeRate") return `${v}%`;
      if (k === "minFee" || k === "maxFee") return `₩${(v as number).toLocaleString()}`;
      if (typeof v === "boolean") return v ? "ON" : "OFF";
      return String(v);
    };

    setPreview((prev) => {
      const existing = prev.findIndex((p) => p.label === labelMap[key]);
      const entry: PreviewItem = {
        label: labelMap[key] ?? key,
        before: fmt(key, old),
        after: fmt(key, value),
      };
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = entry;
        return updated;
      }
      return [...prev, entry];
    });
  };

  return (
    <AdminShell title="정책 관리">
      <div className="space-y-6">
        {/* ── Summary Cards ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-slate-400 mb-1">일일 송금 한도</p>
            <p className="text-xl font-black text-cyan-500">{fmtWon(policy.dailyLimit)}</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-slate-400 mb-1">1회 송금 한도</p>
            <p className="text-xl font-black text-blue-500">{fmtWon(policy.singleLimit)}</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-slate-400 mb-1">수수료율</p>
            <p className="text-xl font-black text-purple-500">{policy.feeRate.toFixed(1)}%</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-slate-400 mb-1">최대 처리 건수</p>
            <p className="text-xl font-black text-orange-500">{policy.maxTxCount.toLocaleString()}건</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
            <p className="text-xs font-semibold text-slate-400 mb-1">현재 상태</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <p className="text-sm font-bold text-emerald-600">정상 운영</p>
            </div>
          </div>
        </div>

        {/* ── Main Layout ─────────────────────────────────────────────────── */}
        <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
          {/* Left Column */}
          <div className="space-y-5">
            {/* 송금 정책 */}
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5">송금 정책</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500">일일 송금 한도</span>
                    <span className="text-xs font-bold text-slate-800">{fmtWon(policy.dailyLimit)}</span>
                  </div>
                  <AdminSlider min={1000000} max={20000000} step={500000} value={policy.dailyLimit} onChange={(v) => set("dailyLimit", v)} />
                  <div className="flex justify-between mt-1 text-[10px] text-slate-300">
                    <span>₩1,000,000</span><span>₩20,000,000</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500">1회 송금 한도</span>
                    <span className="text-xs font-bold text-slate-800">{fmtWon(policy.singleLimit)}</span>
                  </div>
                  <AdminSlider min={100000} max={5000000} step={100000} value={policy.singleLimit} onChange={(v) => set("singleLimit", v)} />
                  <div className="flex justify-between mt-1 text-[10px] text-slate-300">
                    <span>₩100,000</span><span>₩5,000,000</span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500">최대 처리 건수</span>
                    <span className="text-xs font-bold text-slate-800">{policy.maxTxCount.toLocaleString()}건</span>
                  </div>
                  <AdminSlider min={100} max={10000} step={100} value={policy.maxTxCount} onChange={(v) => set("maxTxCount", v)} />
                  <div className="flex justify-between mt-1 text-[10px] text-slate-300">
                    <span>100</span><span>10,000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 수수료 정책 */}
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5">수수료 정책</h3>
              <div className="space-y-5">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-500">수수료율</span>
                    <span className="text-xs font-bold text-slate-800">{policy.feeRate.toFixed(1)}%</span>
                  </div>
                  <AdminSlider min={0} max={5} step={0.1} value={policy.feeRate} onChange={(v) => set("feeRate", Math.round(v * 10) / 10)} />
                  <div className="flex justify-between mt-1 text-[10px] text-slate-300">
                    <span>0%</span><span>5%</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">최소 수수료</label>
                    <input
                      type="number"
                      value={policy.minFee}
                      onChange={(e) => set("minFee", Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">최대 수수료</label>
                    <input
                      type="number"
                      value={policy.maxFee}
                      onChange={(e) => set("maxFee", Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-300"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* AI 위험 거래 정책 */}
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm border-l-4 border-l-red-400 p-6">
              <h3 className="text-sm font-bold text-slate-800 mb-5">AI 위험 거래 정책</h3>
              <div className="space-y-5">
                {/* Toggles */}
                <div className="space-y-4">
                  {[
                    { label: "AI 분석 사용", sub: "거래 전 AI 위험도 자동 분석", key: "aiEnabled" as const },
                    { label: "위험 거래 자동 차단", sub: "DANGER 등급 송금 자동 차단 시간", key: "autoBlock" as const },
                    { label: "관리자 승인 필요", sub: "CAUTION 이상 거래에 승인 요구", key: "adminApproval" as const },
                  ].map(({ label, sub, key }) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
                      </div>
                      <ToggleSwitch
                        checked={policy[key] as boolean}
                        onChange={(v) => set(key, v)}
                      />
                    </div>
                  ))}
                </div>

                {/* Threshold Sliders */}
                <div className="pt-2 space-y-5">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-500">위험 임계치</span>
                      <span className="text-xs font-bold text-red-500">{policy.riskThreshold}</span>
                    </div>
                    <AdminSlider
                      min={0}
                      max={100}
                      step={1}
                      value={policy.riskThreshold}
                      onChange={(v) => set("riskThreshold", v)}
                      gradientColors={["#ef4444", "#f97316"]}
                    />
                    <div className="flex justify-between mt-1 text-[10px] text-slate-300">
                      <span>0</span><span>100</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-500">경고 임계치</span>
                      <span className="text-xs font-bold text-amber-500">{policy.warnThreshold}</span>
                    </div>
                    <AdminSlider
                      min={0}
                      max={100}
                      step={1}
                      value={policy.warnThreshold}
                      onChange={(v) => set("warnThreshold", v)}
                      color="#f59e0b"
                    />
                    <div className="flex justify-between mt-1 text-[10px] text-slate-300">
                      <span>0</span><span>100</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 정책 변경 이력 Table */}
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-800">정책 변경 이력</h3>
                <span className="text-xs text-slate-400">{HISTORY.length}건</span>
              </div>
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    {["변경일시", "관리자", "정책명", "변경 전", "변경 후", "사유"].map((h) => (
                      <th key={h} className="px-4 py-3 text-xs font-semibold text-slate-400 text-left">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {HISTORY.map((h) => (
                    <tr key={h.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3 text-xs font-mono text-slate-500">{h.date}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-cyan-600">{h.admin}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-slate-700">{h.item}</td>
                      <td className="px-4 py-3 text-xs text-slate-400">{h.before}</td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-800">{h.after}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{h.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-5">
            {/* 변경 미리보기 */}
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 sticky top-6">
              <h3 className="text-sm font-bold text-slate-800 mb-4">변경 미리보기</h3>
              {preview.length === 0 ? (
                <div className="py-8 text-center">
                  <div className="w-8 h-8 rounded-full border-2 border-slate-200 mx-auto mb-2 flex items-center justify-center">
                    <span className="text-slate-300 text-xs">○</span>
                  </div>
                  <p className="text-xs text-slate-400">변경된 항목이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {preview.map((p) => (
                    <div key={p.label} className="rounded-xl bg-slate-50 px-3 py-2.5">
                      <p className="text-xs font-semibold text-slate-500 mb-1">{p.label}</p>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-400 line-through">{p.before}</span>
                        <span className="text-slate-300">→</span>
                        <span className="font-bold text-cyan-600">{p.after}</span>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setPreview([])}
                    className="w-full mt-2 rounded-xl bg-slate-900 text-white py-2.5 text-sm font-bold hover:bg-slate-800 transition-colors"
                  >
                    정책 적용
                  </button>
                </div>
              )}
            </div>

            {/* 최근 변경 이력 */}
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-4">최근 변경 이력</h3>
              <div className="space-y-3">
                {RECENT_CHANGES.map((r) => (
                  <div key={r.label} className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-700">{r.label}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{r.date}</p>
                    </div>
                    <span className="text-sm font-bold text-cyan-500">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminPolicy;
