import React, { useEffect, useState } from "react";
import { FiTrendingUp, FiActivity, FiZap, FiPercent } from "react-icons/fi";

interface RealtimeTPSProps {
  currentTPS: number;
  lastMinuteTPS: number;
  peakTPS: number;
  successRate: number;
}

const RealtimeTPS: React.FC<RealtimeTPSProps> = ({
  currentTPS,
  lastMinuteTPS,
  peakTPS,
  successRate,
}) => {
  const [animatedTPS, setAnimatedTPS] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedTPS(Math.floor(Math.random() * (currentTPS + 3)) + Math.max(currentTPS - 2, 0));
    }, 800);

    return () => clearInterval(interval);
  }, [currentTPS]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 px-6 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-cyan-600">현재 TPS</p>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-5xl font-black text-cyan-900">{animatedTPS}</span>
              <span className="text-lg font-semibold text-cyan-600">tx/s</span>
            </div>
            <p className="mt-2 text-xs font-medium text-cyan-600">
              실시간 거래 처리량
            </p>
          </div>
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg">
            <FiActivity className="animate-pulse text-cyan-500" size={40} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <FiZap size={16} className="text-emerald-600" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">최고 TPS</p>
          </div>
          <p className="text-2xl font-black text-slate-900">{peakTPS}</p>
          <p className="mt-1 text-xs text-slate-400">최대 거래 처리량</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              <FiTrendingUp size={16} className="text-blue-600" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">1분 거래량</p>
          </div>
          <p className="text-2xl font-black text-slate-900">{lastMinuteTPS}</p>
          <p className="mt-1 text-xs text-slate-400">최근 1분 거래</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <FiPercent size={16} className="text-emerald-600" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-500">성공률</p>
          </div>
          <p className="text-2xl font-black text-slate-900">{successRate.toFixed(1)}%</p>
          <p className="mt-1 text-xs text-slate-400">거래 성공률</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-semibold text-slate-700">시스템 상태</span>
          </div>
          <span className="text-sm font-bold text-emerald-600">정상 운영</span>
        </div>
      </div>
    </div>
  );
};

export default RealtimeTPS;
