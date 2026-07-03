import { useRef, useState } from "react";
import { useSseChannel } from "./useSseChannel";
import type {
  PipelineStage,
  PipelineStageStatus,
  TransactionPipelineEvent,
} from "../types";

// 스텝 UI 한 건이 참조하는 거래의 현재 파이프라인 상태
export interface PipelineTransaction {
  txId: string;
  sender: string;
  receiver: string;
  amount: number;
  stage: PipelineStage;
  stageIndex: number;
  stageStatus: PipelineStageStatus;
  message: string;
  elapsedMs: number;
  occurredAt: string;
}

export interface UseTransactionPipelineReturn {
  // 현재 스포트라이트로 보여줄 거래(가장 최근 갱신된 거래). 아직 이벤트가 없으면 null.
  current: PipelineTransaction | null;
  // 최근 종료(완료/실패)된 거래 히스토리 (최신순, 최대 6건)
  history: PipelineTransaction[];
  // SSE 연결 상태
  connected: boolean;
}

const HISTORY_LIMIT = 6;

const toTransaction = (e: TransactionPipelineEvent): PipelineTransaction => ({
  txId: e.txId,
  sender: e.sender,
  receiver: e.receiver,
  amount: e.amount,
  stage: e.stage,
  stageIndex: e.stageIndex,
  stageStatus: e.stageStatus,
  message: e.message,
  elapsedMs: e.elapsedMs,
  occurredAt: e.occurredAt,
});

const isTerminal = (status: PipelineStageStatus) =>
  status === "COMPLETED" || status === "FAILED";

// connect 핑 등 파이프라인 이벤트가 아닌 메시지를 걸러낸다.
const isPipelineEvent = (data: unknown): data is TransactionPipelineEvent => {
  const e = data as TransactionPipelineEvent;
  return !!e && typeof e.stageIndex === "number" && !!e.stage;
};

// 실시간 트랜잭션 처리 파이프라인 SSE 구독 훅.
// 백엔드(/admin/stream/transaction-pipeline)가 발행하는 단계 전이 이벤트를 수신해
// 새로고침 없이 상태를 갱신한다. 연결이 끊기면 useSseChannel이 자동 재연결한다.
export const useTransactionPipeline = (): UseTransactionPipelineReturn => {
  const [current, setCurrent] = useState<PipelineTransaction | null>(null);
  const [history, setHistory] = useState<PipelineTransaction[]>([]);

  // 종료된 거래를 히스토리에 중복 없이 넣기 위한 최근 txId 참조
  const lastTerminalTxRef = useRef<string | null>(null);

  const { connected } = useSseChannel<TransactionPipelineEvent>("transaction-pipeline", {
    validate: isPipelineEvent,
    onEvent: (payload) => {
      const tx = toTransaction(payload);
      setCurrent(tx);

      if (isTerminal(tx.stageStatus) && lastTerminalTxRef.current !== tx.txId) {
        lastTerminalTxRef.current = tx.txId;
        setHistory((prev) => [tx, ...prev].slice(0, HISTORY_LIMIT));
      }
    },
  });

  return { current, history, connected };
};
