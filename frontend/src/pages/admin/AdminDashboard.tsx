import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { Wifi, WifiOff } from "lucide-react";
import toast from "react-hot-toast";
import AdminShell from "../../components/admin/AdminShell";
import TransactionPipeline from "../../components/admin/TransactionPipeline";
import { useSseChannel } from "../../hooks";
import { getAllTransactions, getDashboardMetrics, getTPSMetrics } from "../../api/AdminAPI";
import type {
  Activity,
  AdminDashboardMetrics,
  AdminTPSMetrics,
  AdminTransactionInfo,
  AdminTransactionStatusType,
} from "../../types";

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
  metrics: AdminDashboardMetrics | null;
  tps: AdminTPSMetrics | null;
  tpsSpark: SparkPoint[];
}

const MetricCards: React.FC<MetricCardsProps> = ({ metrics, tps, tpsSpark }) => {
  const cards = [
    {
      label: "실시간 TPS",
      value: tps ? tps.currentTPS.toFixed(1) : "-",
      sub: "초당 트랜잭션 수",
      color: "#06b6d4",
      spark: tpsSpark.length > 0 ? tpsSpark : [{ v: 0 }],
    },
    {
      label: "성공률",
      value: tps ? `${tps.successRate.toFixed(1)}%` : "-",
      sub: `평균 ${tps ? tps.avgTPS.toFixed(1) : "-"} TPS`,
      color: "#10b981",
      spark: [{ v: 0 }],
    },
    {
      label: "실패율",
      value: tps ? `${tps.failureRate.toFixed(1)}%` : "-",
      sub: `최대 ${tps ? tps.peakTPS.toFixed(1) : "-"} TPS`,
      color: "#ef4444",
      spark: [{ v: 0 }],
    },
    {
      label: "활성 사용자",
      value: metrics ? metrics.activeUsers.toLocaleString() : "-",
      sub: `전체 ${metrics ? metrics.totalUsers.toLocaleString() : "-"}명`,
      color: "#8b5cf6",
      spark: [{ v: 0 }],
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

// 컬럼 정의: 헤더/셀 정렬을 한 곳에서 관리해 Th·Td 정렬을 항상 일치시킨다.
const TX_COLUMNS: { label: string; align: "text-left" | "text-right" | "text-center" }[] = [
  { label: "시각", align: "text-center" },
  { label: "거래 ID", align: "text-center" },
  { label: "송금 경로", align: "text-center" },
  { label: "금액", align: "text-center" },
  { label: "상태", align: "text-center" },
  { label: "응답", align: "text-center" },
];

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

      {/* Column headers — 각 컬럼의 align을 데이터 셀과 동일하게 맞춘다 */}
      <div className={`${colGrid} px-5 py-2.5 border-b border-gray-50`}>
        {TX_COLUMNS.map((c) => (
          <p key={c.label} className={`text-[11px] font-semibold text-gray-400 ${c.align}`}>
            {c.label}
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
                <div className="flex items-center justify-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: dot }}
                  />
                  <span className="text-xs font-mono text-blue-500">{tx.time}</span>
                </div>

                {/* 거래 ID */}
                <span className="text-xs font-mono font-bold text-blue-600 text-center">{tx.id}</span>

                {/* 송금 경로 */}
                <span className="text-xs text-gray-700 truncate text-center">
                  {tx.sender} – {tx.receiver}
                </span>

                {/* 금액 */}
                <span className="text-xs font-bold text-gray-800 text-center">
                  ₩{tx.amount.toLocaleString()}
                </span>

                {/* 상태 */}
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
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
                  className={`text-xs font-mono text-center ${
                    tx.responseMs > 700 ? "text-red-400" : "text-gray-500"
                  }`}
                >
                  {tx.responseMs > 0 ? `${tx.responseMs}ms` : "—"}
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

// 백엔드 TransactionStatus → 대시보드 로그 상태 매핑
const TX_STATUS_MAP: Record<AdminTransactionStatusType, TxStatus> = {
  SUCCESS: "SUCCESS",
  PROCESSING: "PENDING",
  FAILED: "FAILED",
  CANCELLED: "FAILED",
};

// 백엔드 거래 목록을 로그 테이블 행으로 변환한다.
// 최신 거래가 항상 최상단(내림차순)이 되도록 정렬하며, 시각이 같으면 transactionId가 큰 쪽을 우선한다.
const mapToTxRows = (txData: AdminTransactionInfo[]): TxRow[] =>
  txData
    .slice()
    .sort((a, b) => {
      const t = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return t !== 0 ? t : Number(b.transactionId) - Number(a.transactionId);
    })
    .slice(0, 30)
    .map((tx) => ({
      uid: String(tx.transactionId),
      time: tx.createdAt
        ? new Date(tx.createdAt).toLocaleTimeString("ko-KR", { hour12: false })
        : "--:--",
      id: `TX${tx.transactionId}`,
      sender: `#${tx.senderAccountId}`,
      receiver: `#${tx.receiverAccountId}`,
      amount: Number(tx.amount),
      status: TX_STATUS_MAP[tx.status] ?? "PENDING",
      responseMs: 0,
    }));

// TPS 실시간 스파크라인에 유지할 최근 표본 개수
const TPS_SPARK_LIMIT = 12;
// 실시간 이벤트가 유실될 경우를 대비한 안전 폴링 주기(ms)
const SAFETY_POLL_INTERVAL = 20000;

const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [tps, setTps] = useState<AdminTPSMetrics | null>(null);
  const [tpsSpark, setTpsSpark] = useState<SparkPoint[]>([]);
  const [txs, setTxs] = useState<TxRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // 지표 + 거래 로그를 다시 받아 화면 상태를 갱신한다(이벤트 수신/안전 폴링 시 재사용).
  // 실패해도 기존 화면을 유지하도록 조용히 무시한다.
  const refresh = useCallback(async () => {
    try {
      const [metricsData, txData] = await Promise.all([
        getDashboardMetrics(),
        getAllTransactions(),
      ]);
      setMetrics(metricsData);
      setTxs(mapToTxRows(txData));
    } catch (error) {
      console.error("대시보드 실시간 갱신 실패:", error);
    }
  }, []);

  // 최초 로드: 지표 + 첫 거래 스냅샷을 받아 로딩/에러 UX를 결정한다.
  useEffect(() => {
    let active = true;

    const load = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const [metricsData, tpsData, txData] = await Promise.all([
          getDashboardMetrics(),
          getTPSMetrics(),
          getAllTransactions(),
        ]);
        if (!active) return;

        setMetrics(metricsData);
        setTps(tpsData);
        setTpsSpark([{ v: tpsData.avgTPS }, { v: tpsData.currentTPS }]);
        setTxs(mapToTxRows(txData));
      } catch (error) {
        if (!active) return;
        console.error("대시보드 로드 실패:", error);
        setIsError(true);
        toast.error("대시보드 데이터를 불러오는데 실패했습니다.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  const streamEnabled = !isLoading && !isError;

  // (1) TPS 메트릭 실시간 구독 → 지표 카드 + 스파크라인이 새로고침 없이 갱신된다.
  const { connected } = useSseChannel<AdminTPSMetrics>("tps-metrics", {
    enabled: streamEnabled,
    onEvent: (data) => {
      setTps(data);
      setTpsSpark((prev) => [...prev, { v: data.currentTPS }].slice(-TPS_SPARK_LIMIT));
    },
  });

  // (2) 활동 이벤트 실시간 구독 → 사용자 액션(송금/상태 변경 등)이 발생하면
  //     지표와 트랜잭션 로그를 즉시 재조회해 관리자 화면을 리렌더링한다.
  useSseChannel<Activity>("activities", {
    enabled: streamEnabled,
    onEvent: () => {
      refresh();
    },
  });

  // 실시간 이벤트가 유실되는 경우를 대비한 안전 폴링(느린 주기).
  useEffect(() => {
    if (!streamEnabled) return;
    const timer = window.setInterval(refresh, SAFETY_POLL_INTERVAL);
    return () => window.clearInterval(timer);
  }, [streamEnabled, refresh]);

  return (
    <AdminShell title="관리자 대시보드">
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            대시보드를 로드하는 중입니다...
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-gray-400">
            <p className="text-sm font-semibold text-rose-500">대시보드 데이터를 불러오지 못했습니다.</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              새로고침
            </button>
          </div>
        ) : (
          <>
            {/* 실시간 연결 상태 표시 */}
            <div className="flex items-center justify-end">
              <span
                className={`flex items-center gap-1.5 text-[11px] font-semibold ${
                  connected ? "text-emerald-500" : "text-gray-400"
                }`}
              >
                {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
                {connected ? "실시간 연결됨" : "재연결 중…"}
                {connected && (
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                )}
              </span>
            </div>

            {/* 1. 핵심 지표 카드 */}
            <MetricCards metrics={metrics} tps={tps} tpsSpark={tpsSpark} />

            {/* 2. 실시간 트랜잭션 처리 파이프라인 (SSE 실시간 연동) */}
            <TransactionPipeline />

            {/* 3. 트랜잭션 로그 + 정책 설정 */}
            <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
              <TransactionLog txs={txs} />
              <PolicyPanel />
            </div>
          </>
        )}
      </div>
    </AdminShell>
  );
};

export default AdminDashboard;
