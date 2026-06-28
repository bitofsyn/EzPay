import api from '../api/api';
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

export interface GetRiskTransactionsResponse extends ApiResponse {
  data?: RiskTransaction[];
}

export interface RiskActionResponse extends ApiResponse {
  data?: {
    transactionId: string;
    status: 'APPROVED' | 'BLOCKED';
    approvedAt: string;
  };
}

/**
 * 위험 거래 목록 조회
 * @param filter - 필터 조건 (선택사항)
 * @returns 위험 거래 목록
 */
export const getRiskTransactions = async (
  filter?: string
): Promise<RiskTransaction[]> => {
  const res = await api.get<GetRiskTransactionsResponse>(
    '/admin/risk-transactions',
    { params: { filter } }
  );
  return res.data?.data || [];
};

/**
 * 위험 거래 승인
 * @param transactionId - 거래 ID
 * @returns 승인 결과
 */
export const approveRiskTransaction = async (
  transactionId: string
): Promise<ApiResponse> => {
  const res = await api.post<RiskActionResponse>(
    `/admin/risk-transactions/${transactionId}/approve`
  );
  return res.data;
};

/**
 * 위험 거래 차단
 * @param transactionId - 거래 ID
 * @returns 차단 결과
 */
export const blockRiskTransaction = async (
  transactionId: string
): Promise<ApiResponse> => {
  const res = await api.post<RiskActionResponse>(
    `/admin/risk-transactions/${transactionId}/block`
  );
  return res.data;
};
