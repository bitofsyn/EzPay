import { useState, useEffect, useCallback, useMemo } from 'react';
import { getSystemLogs, subscribeSystemLogs } from '../services/logsApi';
import type { LogEntry, LogLevel, LogFilterType } from '../types';

export interface UseSystemLogsStreamReturn {
  logs: LogEntry[];
  isConnected: boolean;
  isLoading: boolean;
  filter: LogFilterType;
  setFilter: (level: LogFilterType) => void;
  filteredLogs: LogEntry[];
  totalCount: number;
}

const FILTER_TABS: LogFilterType[] = ['전체', 'INFO', 'WARN', 'ERROR', 'DEBUG'];

export const useSystemLogsStream = (
  limit: number = 30,
  autoSubscribe: boolean = true
): UseSystemLogsStreamReturn => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<LogFilterType>('전체');

  const fetchInitialLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getSystemLogs(limit);
      setLogs(data);
    } catch (error) {
      console.error('시스템 로그 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    if (!autoSubscribe) return;

    fetchInitialLogs();

    // SSE 구독
    const unsubscribe = subscribeSystemLogs((newLog) => {
      setIsConnected(true);
      setLogs((prev) => [newLog, ...prev].slice(0, limit));
    });

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [fetchInitialLogs, autoSubscribe, limit]);

  const filteredLogs = useMemo(() => {
    if (filter === '전체') {
      return logs;
    }
    return logs.filter((log) => log.level === filter);
  }, [logs, filter]);

  return {
    logs,
    isConnected,
    isLoading,
    filter,
    setFilter,
    filteredLogs,
    totalCount: logs.length,
  };
};

export { FILTER_TABS as SYSTEM_LOG_FILTER_TABS };
