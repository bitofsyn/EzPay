import { useState, useCallback, useMemo, useEffect } from "react";
import type { LogEntry, LogFilterType } from "../types";
import { getSystemLogs } from "../api/AdminAPI";

interface UseSystemLogsReturn {
  logs: LogEntry[];
  filteredLogs: LogEntry[];
  filter: LogFilterType;
  setFilter: (filter: LogFilterType) => void;
  isLoading: boolean;
  isError: boolean;
  totalCount: number;
  refetch: () => void;
}

const FILTER_TABS: LogFilterType[] = ["전체", "INFO", "WARN", "ERROR", "DEBUG"];

// ISO 시간 문자열 → HH:MM:SS 표시용 포맷
const formatTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString("ko-KR", { hour12: false });
};

export const useSystemLogs = (initialCount: number = 30): UseSystemLogsReturn => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogFilterType>("전체");
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  useEffect(() => {
    let active = true;

    const fetchLogs = async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const data = await getSystemLogs(initialCount);
        if (!active) return;
        setLogs(
          data.map((log) => ({
            id: log.id,
            time: formatTime(log.time),
            level: log.level,
            service: log.service,
            message: log.message,
          })),
        );
      } catch (error) {
        if (!active) return;
        console.error("시스템 로그 조회 실패:", error);
        setIsError(true);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchLogs();
    return () => {
      active = false;
    };
  }, [initialCount, reloadToken]);

  // Filter logs based on selected filter
  const filteredLogs = useMemo(() => {
    if (filter === "전체") {
      return logs;
    }
    return logs.filter((log) => log.level === filter);
  }, [logs, filter]);

  const handleSetFilter = useCallback((newFilter: LogFilterType) => {
    setFilter(newFilter);
  }, []);

  return {
    logs,
    filteredLogs,
    filter,
    setFilter: handleSetFilter,
    isLoading,
    isError,
    totalCount: logs.length,
    refetch,
  };
};

export const SYSTEM_LOG_FILTER_TABS = FILTER_TABS;
