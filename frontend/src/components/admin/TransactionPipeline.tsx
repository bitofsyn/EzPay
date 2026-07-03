import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Inbox,
  ShieldCheck,
  Database,
  Banknote,
  Check,
  Loader2,
  X,
  Wifi,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import { useTransactionPipeline, type PipelineTransaction } from "../../hooks";
import type { PipelineStage, PipelineStageStatus } from "../../types";

// ─── Stage 정의 ────────────────────────────────────────────────────────────────

interface StageDef {
  stage: PipelineStage;
  label: string;
  sub: string;
  Icon: LucideIcon;
}

const STAGES: StageDef[] = [
  { stage: "RECEIVED", label: "송금 요청 접수", sub: "API 요청 수신", Icon: Inbox },
  { stage: "RISK_CHECK", label: "이상거래 검증", sub: "Risk Check", Icon: ShieldCheck },
  { stage: "LEDGER", label: "분산 원장 기록", sub: "Ledger Commit", Icon: Database },
  { stage: "SETTLEMENT", label: "정산 및 완료", sub: "Settlement", Icon: Banknote },
];

// 현재 거래 상태로부터 특정 스텝(index)의 상태를 도출
const stageStatusAt = (
  index: number,
  current: PipelineTransaction | null
): PipelineStageStatus => {
  if (!current) return "PENDING";
  if (index < current.stageIndex) return "COMPLETED";
  if (index === current.stageIndex) return current.stageStatus;
  return "PENDING";
};

// ─── 스텝 노드 ─────────────────────────────────────────────────────────────────

const nodeStyle: Record<PipelineStageStatus, string> = {
  COMPLETED: "bg-cyan-400 text-slate-950 border-cyan-400 shadow-[0_0_18px_-2px_rgba(34,211,238,0.7)]",
  PROCESSING: "bg-cyan-500/10 text-cyan-300 border-cyan-400",
  FAILED: "bg-rose-500/15 text-rose-400 border-rose-500",
  PENDING: "bg-white/5 text-slate-500 border-white/10",
};

const StepNode: React.FC<{ def: StageDef; status: PipelineStageStatus }> = ({
  def,
  status,
}) => {
  const { Icon } = def;
  const isProcessing = status === "PROCESSING";

  return (
    <div className="flex min-w-[76px] flex-1 flex-col items-center gap-2.5">
      <div className="relative flex h-14 w-14 items-center justify-center">
        {/* 처리 중 pulse ring */}
        {isProcessing && (
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-cyan-400/60"
            initial={{ opacity: 0.7, scale: 1 }}
            animate={{ opacity: 0, scale: 1.55 }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
          />
        )}
        <motion.div
          layout
          initial={false}
          animate={{ scale: isProcessing ? 1.06 : 1 }}
          transition={{ type: "spring", stiffness: 320, damping: 20 }}
          className={`relative flex h-13 w-13 items-center justify-center rounded-full border-2 transition-colors duration-500 ${nodeStyle[status]}`}
          style={{ height: "3.25rem", width: "3.25rem" }}
        >
          {status === "COMPLETED" ? (
            <Check size={22} strokeWidth={3} />
          ) : status === "FAILED" ? (
            <X size={22} strokeWidth={3} />
          ) : status === "PROCESSING" ? (
            <Loader2 size={22} className="animate-spin" />
          ) : (
            <Icon size={20} />
          )}
        </motion.div>
      </div>

      <div className="text-center">
        <p
          className={`text-xs font-bold leading-tight transition-colors duration-500 ${
            status === "PENDING" ? "text-slate-500" : "text-white"
          }`}
        >
          {def.label}
        </p>
        <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
          {def.sub}
        </p>
      </div>
    </div>
  );
};

// ─── 커넥터 ────────────────────────────────────────────────────────────────────

const Connector: React.FC<{ state: "done" | "active" | "pending" }> = ({ state }) => (
  <div className="relative mt-7 h-[3px] flex-1 self-start overflow-hidden rounded-full bg-white/10">
    <div
      className={`absolute inset-0 rounded-full transition-transform duration-700 ease-out ${
        state === "done" ? "bg-cyan-400" : "bg-cyan-400/0"
      }`}
      style={{ transform: state === "done" ? "scaleX(1)" : "scaleX(0)", transformOrigin: "left" }}
    />
    {state === "active" && (
      <span className="pipeline-shimmer absolute inset-y-0 left-0 w-1/2 rounded-full bg-gradient-to-r from-cyan-400/0 via-cyan-300 to-cyan-400/0" />
    )}
  </div>
);

// ─── 상태 요약 pill ────────────────────────────────────────────────────────────

const summarize = (current: PipelineTransaction | null) => {
  if (!current) return { text: "대기 중", cls: "bg-white/5 text-slate-400" };
  if (current.stageStatus === "FAILED")
    return { text: "차단됨", cls: "bg-rose-500/15 text-rose-300" };
  if (current.stageIndex === STAGES.length - 1 && current.stageStatus === "COMPLETED")
    return { text: "완료", cls: "bg-emerald-500/15 text-emerald-300" };
  return { text: "처리 중", cls: "bg-cyan-500/15 text-cyan-300" };
};

const won = (n: number) => `₩${n.toLocaleString()}`;

// ─── 메인 컴포넌트 ─────────────────────────────────────────────────────────────

const TransactionPipeline: React.FC = () => {
  const { current, history, connected } = useTransactionPipeline();
  const summary = summarize(current);
  const currentIndex = current?.stageIndex ?? -1;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f172a] to-[#111c33] px-6 py-5 text-white shadow-sm">
      {/* 커넥터 shimmer 키프레임 */}
      <style>{`
        @keyframes pipelineShimmer {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(240%); }
        }
        .pipeline-shimmer { animation: pipelineShimmer 1.15s ease-in-out infinite; }
      `}</style>

      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <h2 className="text-sm font-bold tracking-tight">실시간 트랜잭션 처리 파이프라인</h2>
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${summary.cls}`}>
            {summary.text}
          </span>
        </div>
        <span
          className={`flex items-center gap-1.5 text-[11px] font-semibold ${
            connected ? "text-emerald-400" : "text-slate-500"
          }`}
        >
          {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
          {connected ? "LIVE" : "연결 대기"}
          {connected && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />}
        </span>
      </div>

      {/* 스텝퍼 */}
      <div className="flex items-start">
        {STAGES.map((def, i) => {
          const status = stageStatusAt(i, current);
          const isLast = i === STAGES.length - 1;
          const connectorState: "done" | "active" | "pending" =
            i < currentIndex
              ? "done"
              : i === currentIndex && current?.stageStatus === "PROCESSING"
              ? "active"
              : "pending";
          return (
            <React.Fragment key={def.stage}>
              <StepNode def={def} status={status} />
              {!isLast && <Connector state={connectorState} />}
            </React.Fragment>
          );
        })}
      </div>

      {/* 현재 거래 정보 / 스켈레톤 */}
      <div className="mt-6 border-t border-white/10 pt-4">
        {current ? (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${current.txId}-${current.stage}-${current.stageStatus}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="flex flex-wrap items-center gap-x-3 gap-y-1"
            >
              <span className="font-mono text-xs font-bold text-cyan-300">{current.txId}</span>
              <span className="text-xs text-slate-400">
                {current.sender} → {current.receiver}
              </span>
              <span className="text-xs font-bold text-white">{won(current.amount)}</span>
              <span className="text-[11px] font-medium text-slate-500">
                +{current.elapsedMs}ms
              </span>
              <span className="w-full text-xs font-medium text-slate-300 sm:w-auto sm:flex-1">
                {current.message}
              </span>
            </motion.div>
          </AnimatePresence>
        ) : (
          // 첫 이벤트 수신 전 스켈레톤
          <div className="flex items-center gap-3">
            <div className="h-3 w-20 animate-pulse rounded-full bg-white/10" />
            <div className="h-3 w-28 animate-pulse rounded-full bg-white/10" />
            <div className="h-3 w-16 animate-pulse rounded-full bg-white/10" />
            <span className="text-xs font-medium text-slate-500">
              실시간 거래 이벤트를 기다리는 중…
            </span>
          </div>
        )}
      </div>

      {/* 최근 종료 거래 히스토리 */}
      {history.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            최근 처리
          </span>
          <AnimatePresence initial={false}>
            {history.map((tx) => {
              const failed = tx.stageStatus === "FAILED";
              return (
                <motion.span
                  key={tx.txId}
                  layout
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.25 }}
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    failed ? "bg-rose-500/10 text-rose-300" : "bg-emerald-500/10 text-emerald-300"
                  }`}
                >
                  {failed ? <X size={11} /> : <Check size={11} />}
                  <span className="font-mono">{tx.txId}</span>
                  <span className="text-slate-400">{won(tx.amount)}</span>
                </motion.span>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default TransactionPipeline;
