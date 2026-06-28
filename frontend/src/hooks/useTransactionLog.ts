import { useState, useCallback } from "react";
import type { RealtimeTransaction } from "../types";

interface UseTransactionLogReturn {
  transactions: RealtimeTransaction[];
  addTransaction: (tx?: Partial<RealtimeTransaction>) => void;
  clearTransactions: () => void;
  isAutoAdding: boolean;
  setIsAutoAdding: (enabled: boolean) => void;
  totalCount: number;
}

export const useTransactionLog = (
  initialCount: number = 10,
  autoAddInterval: number = 2000
): UseTransactionLogReturn => {
  const [transactions, setTransactions] = useState<RealtimeTransaction[]>([]);
  const [isAutoAdding, setIsAutoAdding] = useState(false);

  const handleAddTransaction = useCallback((tx?: Partial<RealtimeTransaction>) => {
    if (tx) {
      setTransactions((prev) => [tx as RealtimeTransaction, ...prev].slice(0, 50));
    }
  }, []);

  const handleClearTransactions = useCallback(() => {
    setTransactions([]);
  }, []);

  const handleSetIsAutoAdding = useCallback((enabled: boolean) => {
    setIsAutoAdding(enabled);
    // TODO: WebSocket/SSE 구독 활성화/비활성화
  }, []);

  return {
    transactions,
    addTransaction: handleAddTransaction,
    clearTransactions: handleClearTransactions,
    isAutoAdding,
    setIsAutoAdding: handleSetIsAutoAdding,
    totalCount: transactions.length,
  };
};
