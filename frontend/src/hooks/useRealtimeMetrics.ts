import { useState, useEffect, useCallback } from 'react';
import {
  getDashboardMetrics,
  getTPSMetrics,
  subscribeTPSMetrics,
  subscribeActivities,
} from '../services/metricsApi';
import type { AdminDashboardStats } from '../types';

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

export interface UseRealtimeMetricsReturn {
  metrics: DashboardMetrics | null;
  tpsMetrics: TPSMetrics | null;
  isLoading: boolean;
  isConnected: boolean;
  refetchDashboard: () => Promise<void>;
}

export const useRealtimeMetrics = (
  autoSubscribe: boolean = true
): UseRealtimeMetricsReturn => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [tpsMetrics, setTPSMetrics] = useState<TPSMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  const fetchDashboardMetrics = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getDashboardMetrics();
      setMetrics(data);

      const tpsData = await getTPSMetrics();
      setTPSMetrics(tpsData);
    } catch (error) {
      console.error('메트릭 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!autoSubscribe) return;

    fetchDashboardMetrics();

    // SSE 구독: TPS 메트릭
    const unsubscribeTPS = subscribeTPSMetrics((newMetrics) => {
      setIsConnected(true);
      setTPSMetrics(newMetrics);
    });

    // SSE 구독: 활동 (대시보드 메트릭 갱신)
    const unsubscribeActivities = subscribeActivities(() => {
      // 새로운 활동 발생 시 대시보드 메트릭 재조회
      fetchDashboardMetrics();
    });

    return () => {
      unsubscribeTPS();
      unsubscribeActivities();
      setIsConnected(false);
    };
  }, [autoSubscribe, fetchDashboardMetrics]);

  return {
    metrics,
    tpsMetrics,
    isLoading,
    isConnected,
    refetchDashboard: fetchDashboardMetrics,
  };
};
