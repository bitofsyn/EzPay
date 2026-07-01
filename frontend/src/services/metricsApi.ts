import api from '../api/api';
import type { AdminDashboardStats, ApiResponse } from '../types';
import { withAuthToken } from './streamAuth';

export interface TPSMetrics {
  currentTPS: number;
  peakTPS: number;
  avgTPS: number;
  successRate: number;
  failureRate: number;
  timestamp: string;
}

export interface DashboardMetrics extends AdminDashboardStats {
  lastUpdated: string;
}

export interface GetMetricsResponse extends ApiResponse {
  data?: DashboardMetrics;
}

export interface GetTPSMetricsResponse extends ApiResponse {
  data?: TPSMetrics;
}

/**
 * 대시보드 메트릭 조회
 * @returns 대시보드 통계 데이터
 */
export const getDashboardMetrics = async (): Promise<DashboardMetrics | null> => {
  const res = await api.get<GetMetricsResponse>(
    '/admin/dashboard/metrics'
  );
  return res.data?.data || null;
};

/**
 * 실시간 TPS 메트릭 조회
 * @returns 현재 TPS 데이터
 */
export const getTPSMetrics = async (): Promise<TPSMetrics | null> => {
  const res = await api.get<GetTPSMetricsResponse>(
    '/admin/dashboard/tps-metrics'
  );
  return res.data?.data || null;
};

/**
 * 실시간 TPS 메트릭 스트림 구독 (SSE)
 * @param callback - 새로운 메트릭 수신 시 호출할 콜백
 * @returns 구독 해제 함수
 */
export const subscribeTPSMetrics = (
  callback: (metrics: TPSMetrics) => void
): (() => void) => {
  const eventSource = new EventSource(
    withAuthToken(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081'}/admin/stream/tps-metrics`)
  );

  eventSource.onmessage = (event) => {
    try {
      const metrics = JSON.parse(event.data);
      callback(metrics);
    } catch (error) {
      console.error('Failed to parse TPS metrics event:', error);
    }
  };

  eventSource.onerror = (error) => {
    console.error('TPS metrics EventSource error:', error);
    eventSource.close();
  };

  // 구독 해제 함수 반환
  return () => {
    eventSource.close();
  };
};

/**
 * 실시간 활동 스트림 구독 (SSE)
 * @param callback - 새로운 활동 수신 시 호출할 콜백
 * @returns 구독 해제 함수
 */
export const subscribeActivities = (
  callback: (activity: any) => void
): (() => void) => {
  const eventSource = new EventSource(
    withAuthToken(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081'}/admin/stream/activities`)
  );

  eventSource.onmessage = (event) => {
    try {
      const activity = JSON.parse(event.data);
      callback(activity);
    } catch (error) {
      console.error('Failed to parse activity event:', error);
    }
  };

  eventSource.onerror = (error) => {
    console.error('Activities EventSource error:', error);
    eventSource.close();
  };

  return () => {
    eventSource.close();
  };
};
