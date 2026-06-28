import api from '../api/api';
import type { LogEntry, ApiResponse } from '../types';

export interface GetSystemLogsResponse extends ApiResponse {
  data?: LogEntry[];
}

/**
 * 시스템 로그 초기 데이터 조회
 * @param limit - 조회할 로그 개수
 * @returns 시스템 로그 목록
 */
export const getSystemLogs = async (limit: number = 30): Promise<LogEntry[]> => {
  const res = await api.get<GetSystemLogsResponse>(
    '/admin/system-logs',
    { params: { limit } }
  );
  return res.data?.data || [];
};

/**
 * 시스템 로그 실시간 스트림 구독 (SSE)
 * @param callback - 새로운 로그 수신 시 호출할 콜백
 * @returns 구독 해제 함수
 */
export const subscribeSystemLogs = (
  callback: (log: LogEntry) => void
): (() => void) => {
  const eventSource = new EventSource(
    `${process.env.REACT_APP_API_URL || 'http://localhost:8080'}/api/v1/admin/stream/system-logs`
  );

  eventSource.onmessage = (event) => {
    try {
      const log = JSON.parse(event.data);
      callback(log);
    } catch (error) {
      console.error('Failed to parse system log event:', error);
    }
  };

  eventSource.onerror = (error) => {
    console.error('System logs EventSource error:', error);
    eventSource.close();
  };

  // 구독 해제 함수 반환
  return () => {
    eventSource.close();
  };
};
