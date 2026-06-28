import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getRiskTransactions, approveRiskTransaction, blockRiskTransaction } from '../services/riskApi';
import { subscribeRiskTransactionStream } from '../services/realtimeApi';
import type { ApiResponse } from '../types';

export interface RiskTransaction {
  transactionId: string;
  level: 'DANGER' | 'CAUTION' | 'SAFE';
  sender: string;
  receiver: string;
  amount: number;
  datetime: string;
  category: string;
  reason: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'BLOCKED';
}

export interface UseRealtimeRiskTransactionsReturn {
  transactions: RiskTransaction[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  handleApprove: (txId: string) => Promise<void>;
  handleBlock: (txId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useRealtimeRiskTransactions = (): UseRealtimeRiskTransactionsReturn => {
  const [transactions, setTransactions] = useState<RiskTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();

  const fetchRiskTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      const data = await getRiskTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('위험 거래 조회 실패:', error);
      setIsError(true);
      setErrorMessage('위험 거래를 불러오는데 실패했습니다.');
      toast.error('위험 거래를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRiskTransactions();

    // WebSocket 구독
    const { unsubscribe } = subscribeRiskTransactionStream((newTx) => {
      setTransactions((prev) => [newTx, ...prev].slice(0, 100));
    });

    return () => {
      unsubscribe();
    };
  }, [fetchRiskTransactions]);

  const handleApprove = useCallback(
    async (txId: string) => {
      try {
        const response: ApiResponse = await approveRiskTransaction(txId);
        if (response.status === 'success') {
          toast.success('거래가 승인되었습니다.');
          setTransactions((prev) =>
            prev.map((tx) =>
              tx.transactionId === txId
                ? { ...tx, status: 'APPROVED' }
                : tx
            )
          );
        }
      } catch (error) {
        console.error('거래 승인 실패:', error);
        toast.error('거래 승인에 실패했습니다.');
      }
    },
    []
  );

  const handleBlock = useCallback(
    async (txId: string) => {
      try {
        const response: ApiResponse = await blockRiskTransaction(txId);
        if (response.status === 'success') {
          toast.success('거래가 차단되었습니다.');
          setTransactions((prev) =>
            prev.map((tx) =>
              tx.transactionId === txId
                ? { ...tx, status: 'BLOCKED' }
                : tx
            )
          );
        }
      } catch (error) {
        console.error('거래 차단 실패:', error);
        toast.error('거래 차단에 실패했습니다.');
      }
    },
    []
  );

  return {
    transactions,
    isLoading,
    isError,
    errorMessage,
    handleApprove,
    handleBlock,
    refetch: fetchRiskTransactions,
  };
};
