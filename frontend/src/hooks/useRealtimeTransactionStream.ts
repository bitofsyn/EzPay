import { useState, useEffect, useCallback } from 'react';
import { subscribeTransactionStream } from '../services/realtimeApi';
import type { RealtimeTransaction } from '../types';

export interface UseRealtimeTransactionStreamReturn {
  transactions: RealtimeTransaction[];
  isConnected: boolean;
  isLoading: boolean;
  latestTransaction?: RealtimeTransaction;
  clear: () => void;
}

export const useRealtimeTransactionStream = (
  maxItems: number = 30,
  autoSubscribe: boolean = true
): UseRealtimeTransactionStreamReturn => {
  const [transactions, setTransactions] = useState<RealtimeTransaction[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(!autoSubscribe);

  const handleClear = useCallback(() => {
    setTransactions([]);
  }, []);

  useEffect(() => {
    if (!autoSubscribe) return;

    setIsLoading(false);

    // WebSocket 구독
    const { unsubscribe, isConnected: initialConnected } = subscribeTransactionStream(
      (newTx) => {
        setIsConnected(true);
        setTransactions((prev) => [newTx, ...prev].slice(0, maxItems));
      }
    );

    setIsConnected(initialConnected);

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [autoSubscribe, maxItems]);

  const latestTransaction = transactions.length > 0 ? transactions[0] : undefined;

  return {
    transactions,
    isConnected,
    isLoading,
    latestTransaction,
    clear: handleClear,
  };
};
