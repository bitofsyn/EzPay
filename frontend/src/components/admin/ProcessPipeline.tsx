import React from "react";
import { FiCheck, FiClock, FiX } from "react-icons/fi";

interface ProcessPipelineProps {
  successCount: number;
  pendingCount: number;
  failedCount: number;
  totalCount: number;
}

const ProcessPipeline: React.FC<ProcessPipelineProps> = ({
  successCount,
  pendingCount,
  failedCount,
  totalCount,
}) => {
  const successPercent = totalCount > 0 ? (successCount / totalCount) * 100 : 0;
  const pendingPercent = totalCount > 0 ? (pendingCount / totalCount) * 100 : 0;
  const failedPercent = totalCount > 0 ? (failedCount / totalCount) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-white">
              <FiCheck size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-emerald-600">완료</p>
              <p className="mt-1 text-2xl font-black text-emerald-900">
                {successCount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white">
              <FiClock size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-amber-600">진행중</p>
              <p className="mt-1 text-2xl font-black text-amber-900">
                {pendingCount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500 text-white">
              <FiX size={20} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.1em] text-rose-600">실패</p>
              <p className="mt-1 text-2xl font-black text-rose-900">
                {failedCount.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-emerald-700">성공률</span>
            <span className="text-sm font-bold text-slate-900">{successPercent.toFixed(1)}%</span>
          </div>
          <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${successPercent}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-amber-700">진행률</span>
            <span className="text-sm font-bold text-slate-900">{pendingPercent.toFixed(1)}%</span>
          </div>
          <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${pendingPercent}%` }}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-rose-700">실패율</span>
            <span className="text-sm font-bold text-slate-900">{failedPercent.toFixed(1)}%</span>
          </div>
          <div className="h-3 rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full bg-rose-500 transition-all duration-500"
              style={{ width: `${failedPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessPipeline;
