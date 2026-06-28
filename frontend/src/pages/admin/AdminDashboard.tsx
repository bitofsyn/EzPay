import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import {
  Inbox,
  Search,
  BookOpen,
  Radio,
  Circle,
} from "lucide-react";
import AdminShell from "../../components/admin/AdminShell";

// ─── Types ───────────────────────────────────────────────────────────────────

interface SparkPoint {
  v: number;
}

type TxStatus = "SUCCESS" | "FAILED" | "PENDING";

interface TxRow {
  uid: string;
  time: string;
  id: string;
  sender: string;
  receiver: string;
  amount: number;
  status: TxStatus;
  responseMs: number;
}

// ─── Mock data helpers ────────────────────────────────────────────────────────

const NAMES = ["한예지", "오세훈", "윤서희", "최유진", "이지현", "정수현", "김민수", "박서준"];

let uidCounter = 0;
const nextUid = () => String(++uidCounter);

const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[rnd(0, arr.length - 1)];

const randStatus = (): TxStatus => {
  const r = Math.random();
  if (r < 0.5) return "SUCCESS";
  if (r < 0.75) return "PENDING";
  return "FAILED";
};

const randTxId = () =>
  "TX" +
  Math.random()
    .toString(36)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 7);

const fmtTime = (d: Date) =>
  [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");

const makeTx = (): TxRow => ({
  uid: nextUid(),
  time: fmtTime(new Date()),
  id: randTxId(),
  sender: pick(NAMES),
  receiver: pick(NAMES),
  amount: rnd(1, 50) * 10000,
  status: randStatus(),
  responseMs: rnd(200, 900),
});

const initTxList = (): TxRow[] =>
  Array.from({ length: 10 }, (_, i) => {
    const d = new Date(Date.now() - (10 - i) * 2000);
    return { ...makeTx(), time: fmtTime(d) };
  });

// ─── Sub-components ───────────────────────────────────────────────────────────

// Sparkline
const Sparkline: React.FC<{ data: SparkPoint[]; color: string }> = ({ data, color }) => (
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={data}>
      <Line
        type="monotone"
        dataKey="v"
        stroke={color}
        strokeWidth={2.5}
        dot={false}
        isAnimationActive={false}
      />
    </LineChart>
  </ResponsiveContainer>
);

// ─── Metric Cards ─────────────────────────────────────────────────────────────

interface MetricCardsProps {
  tps: number;
  tpsSpark: SparkPoint[];
}

const MetricCards: React.FC<MetricCardsProps> = ({ tps, tpsSpark }) => {
  const cards = [
    {
      label: "실시간 TPS",
      value: tps,
      sub: "초당 트랜잭션 수",
      color: "#06b6d4",
      spark: tpsSpark,
    },
    {
      label: "성공률",
      value: "50%",
      sub: "15건 성공",
      color: "#10b981",
      spark: [30, 45, 38, 52, 48, 55, 50].map((v) => ({ v })),
    },
    {
      label: "실패율",
      value: "23%",
      sub: "7건 실패",
      color: "#ef4444",
      spark: [15, 20, 18, 25, 22, 19, 23].map((v) => ({ v })),
    },
    {
      label: "활성 사용자",
      value: 181,
      sub: "지난 1시간 기준",
      color: "#8b5cf6",
      spark: [150, 162, 170, 165, 175, 178, 181].map((v) => ({ v })),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5"
        >
          <p className="text-xs font-semibold text-gray-500 mb-3">{c.label}</p>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-3xl font-black leading-none" style={{ color: c.color }}>
                {c.value}
              </p>
              <p className="text-xs text-gray-400 mt-1.5">{c.sub}</p>
            </div>
            <div className="w-28 h-12 shrink-0">
              <Sparkline data={c.spark} color={c.color} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Process Pipeline ─────────────────────────────────────────────────────────

const PIPELINE_STEPS = [
  { label: "요청 수신", sub: "API 엔드포인트 수신", Icon: Inbox },
  { label: "잔액 검증", sub: "계좌 잔액 확인", Icon: Search },
  { label: "원장 반영", sub: "이동 완료 업데이트", Icon: BookOpen },
  { label: "이벤트 발행", sub: "Kafka 이벤트 게시", Icon: Radio },
  { label: "완료", sub: "알림 전송", Icon: Circle },
];

const ProcessPipeline: React.FC<{ activeTx?: TxRow }> = ({ activeTx }) => (
  <div className="rounded-2xl bg-white border border-gray-100 shadow-sm px-6 py-5">
    <h2 className="text-sm font-bold text-gray-700 mb-6">프로세스 파이프라인</h2>

    <div className="flex items-start">
      {PIPELINE_STEPS.map((step, i) => {
        const active = i < 4;
        const Icon = step.Icon;
        const isLast = i === PIPELINE_STEPS.length - 1;
        return (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center gap-2 min-w-[80px]">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
                  active
                    ? "bg-gray-900 text-white shadow-md"
                    : "border-2 border-gray-300 bg-white text-gray-300"
                }`}
              >
                <Icon size={22} />
              </div>
              <p className="text-xs font-bold text-gray-700 text-center leading-tight">
                {step.label}
              </p>
              <p className="text-[10px] text-gray-400 text-center leading-tight">{step.sub}</p>
            </div>
            {!isLast && (
              <div className="flex-1 flex items-start pt-7">
                <div
                  className={`h-px w-full transition-colors ${
                    i < 3 ? "bg-gray-800" : "bg-gray-200"
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>

    {activeTx && (
      <div className="mt-5 pt-4 border-t border-gray-100">
        <span className="text-xs font-mono text-gray-500">
          <span className="text-gray-800 font-bold">{activeTx.id}</span>
          {" · "}
          {activeTx.sender}→{activeTx.receiver}
          {" · "}
          <span className="font-bold">₩{activeTx.amount.toLocaleString()}</span>
        </span>
      </div>
    )}
  </div>
);

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_DOT: Record<TxStatus, string> = {
  SUCCESS: "#10b981",
  PENDING: "#f59e0b",
  FAILED: "#ef4444",
};

const STATUS_LABEL: Record<TxStatus, { text: string; cls: string }> = {
  SUCCESS: { text: "완료", cls: "text-emerald-600 font-bold" },
  PENDING: { text: "처리중", cls: "text-orange-500 font-bold" },
  FAILED: { text: "실패", cls: "text-red-500 font-bold" },
};

// ─── Realtime Transaction Log ─────────────────────────────────────────────────

const TransactionLog: React.FC<{ txs: TxRow[] }> = ({ txs }) => {
  const colGrid =
    "grid grid-cols-[90px_110px_1fr_100px_160px_80px] items-center gap-2";

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-gray-800">실시간 트랜잭션 로그</h2>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </div>
        <span className="text-xs font-semibold text-gray-400">{txs.length}건</span>
      </div>

      {/* Column headers */}
      <div className={`${colGrid} px-5 py-2.5 border-b border-gray-50`}>
        {["시각", "거래 ID", "송금 경로", "금액", "상태", "응답"].map((h) => (
          <p key={h} className="text-[11px] font-semibold text-gray-400">
            {h}
          </p>
        ))}
      </div>

      {/* Rows */}
      <div className="overflow-hidden flex-1">
        <AnimatePresence initial={false}>
          {txs.slice(0, 10).map((tx) => {
            const dot = STATUS_DOT[tx.status];
            const lbl = STATUS_LABEL[tx.status];
            const isHighlight = tx.status === "PENDING";

            return (
              <motion.div
                key={tx.uid}
                layout
                initial={{ opacity: 0, y: -36, backgroundColor: "#eff6ff" }}
                animate={{
                  opacity: 1,
                  y: 0,
                  backgroundColor: isHighlight ? "#fffbeb" : "#ffffff",
                }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className={`${colGrid} px-5 py-3 border-b border-gray-50 hover:bg-gray-50/60 transition-colors`}
              >
                {/* 시각 */}
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: dot }}
                  />
                  <span className="text-xs font-mono text-blue-500">{tx.time}</span>
                </div>

                {/* 거래 ID */}
                <span className="text-xs font-mono font-bold text-blue-600">{tx.id}</span>

                {/* 송금 경로 */}
                <span className="text-xs text-gray-700 truncate">
                  {tx.sender} – {tx.receiver}
                </span>

                {/* 금액 */}
                <span className="text-xs font-bold text-gray-800 text-right">
                  ₩{tx.amount.toLocaleString()}
                </span>

                {/* 상태 */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`text-xs ${lbl.cls}`}>{lbl.text}</span>
                  {tx.status === "FAILED" && (
                    <>
                      <button className="text-[10px] border border-gray-300 rounded px-1.5 py-0.5 text-gray-500 hover:bg-gray-100 transition-colors">
                        롤백
                      </button>
                      <button className="text-[10px] border border-gray-300 rounded px-1.5 py-0.5 text-gray-500 hover:bg-gray-100 transition-colors">
                        재처리
                      </button>
                    </>
                  )}
                  {tx.status === "PENDING" && (
                    <button className="text-[10px] border border-amber-300 rounded px-1.5 py-0.5 text-amber-600 hover:bg-amber-50 transition-colors">
                      대기중
                    </button>
                  )}
                </div>

                {/* 응답 */}
                <span
                  className={`text-xs font-mono text-right ${
                    tx.responseMs > 700 ? "text-red-400" : "text-gray-500"
                  }`}
                >
                  {tx.responseMs}ms
                </span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};

// ─── Policy Settings ──────────────────────────────────────────────────────────

const PolicyPanel: React.FC = () => {
  const [limit, setLimit] = useState(3000000);
  const [fee, setFee] = useState(0.5);
  const [maxRetry, setMaxRetry] = useState(3);

  const sliderStyle =
    "w-full h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:shadow-sm";

  const pct = (val: number, min: number, max: number) =>
    ((val - min) / (max - min)) * 100;

  return (
    <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-6 flex flex-col">
      <h2 className="text-sm font-bold text-gray-800 mb-6">정책 설정</h2>

      <div className="space-y-6 flex-1">
        {/* 일일 송금 한도 */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">일일 송금 한도</span>
            <span className="text-xs font-bold text-gray-800">
              ₩{limit.toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min={100000}
            max={10000000}
            step={100000}
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className={sliderStyle}
            style={{
              background: `linear-gradient(to right, #3b82f6 ${pct(limit, 100000, 10000000)}%, #e5e7eb ${pct(limit, 100000, 10000000)}%)`,
            }}
          />
        </div>

        {/* 수수료율 */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">수수료율</span>
            <span className="text-xs font-bold text-gray-800">{fee.toFixed(1)}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={5}
            step={0.1}
            value={fee}
            onChange={(e) => setFee(Number(e.target.value))}
            className={sliderStyle}
            style={{
              background: `linear-gradient(to right, #3b82f6 ${pct(fee, 0, 5)}%, #e5e7eb ${pct(fee, 0, 5)}%)`,
            }}
          />
        </div>

        {/* 최대 재처리 횟수 */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">최대 재처리 횟수</span>
            <span className="text-xs font-bold text-gray-800">{maxRetry}회</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={maxRetry}
            onChange={(e) => setMaxRetry(Number(e.target.value))}
            className={sliderStyle}
            style={{
              background: `linear-gradient(to right, #3b82f6 ${pct(maxRetry, 1, 10)}%, #e5e7eb ${pct(maxRetry, 1, 10)}%)`,
            }}
          />
        </div>
      </div>

      <button className="mt-8 w-full bg-gray-900 text-white py-3 rounded-xl text-sm font-bold hover:bg-gray-800 active:scale-[0.98] transition-all">
        정책 적용
      </button>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────

const AdminDashboard: React.FC = () => {
  const [tps, setTps] = useState(26);
  const [tpsSpark, setTpsSpark] = useState<SparkPoint[]>(
    [12, 18, 22, 15, 26, 20, 26].map((v) => ({ v }))
  );
  const [txs, setTxs] = useState<TxRow[]>(initTxList);

  // TPS 2초마다 갱신
  useEffect(() => {
    const id = setInterval(() => {
      const next = rnd(10, 45);
      setTps(next);
      setTpsSpark((prev) => [...prev.slice(-6), { v: next }]);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // 트랜잭션 2초마다 앞에 추가
  const addTx = useCallback(() => {
    setTxs((prev) => [makeTx(), ...prev.slice(0, 29)]);
  }, []);

  useEffect(() => {
    const id = setInterval(addTx, 2000);
    return () => clearInterval(id);
  }, [addTx]);

  return (
    <AdminShell title="관리자 대시보드">
      <div className="space-y-4">
        {/* 1. 핵심 지표 카드 */}
        <MetricCards tps={tps} tpsSpark={tpsSpark} />

        {/* 2. 프로세스 파이프라인 */}
        <ProcessPipeline activeTx={txs[0]} />

        {/* 3. 트랜잭션 로그 + 정책 설정 */}
        <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
          <TransactionLog txs={txs} />
          <PolicyPanel />
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminDashboard;
