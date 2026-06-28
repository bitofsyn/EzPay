import { useState, useCallback, useMemo, useEffect } from "react";
import type { LogEntry, LogLevel, LogFilterType } from "../types";

interface UseSystemLogsReturn {
  logs: LogEntry[];
  filteredLogs: LogEntry[];
  filter: LogFilterType;
  setFilter: (filter: LogFilterType) => void;
  isLoading: boolean;
  totalCount: number;
}

const FILTER_TABS: LogFilterType[] = ["전체", "INFO", "WARN", "ERROR", "DEBUG"];

export const useSystemLogs = (initialCount: number = 30): UseSystemLogsReturn => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<LogFilterType>("전체");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: API 연동 - getSystemLogs(initialCount)
    // const fetchLogs = async () => {
    //   try {
    //     const data = await getSystemLogs(initialCount);
    //     setLogs(data);
    //   } catch (error) {
    //     console.error("시스템 로그 조회 실패:", error);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // };
    // fetchLogs();
    setLogs([]);
    setIsLoading(false);
  }, [initialCount]);

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
    totalCount: logs.length,
  };
};

export const SYSTEM_LOG_FILTER_TABS = FILTER_TABS;
