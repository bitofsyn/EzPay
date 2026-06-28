import React, { memo, useMemo } from "react";
import type { LogEntry } from "../../../types";
import { LogViewer } from "../../ui";

interface SystemLogListProps {
  logs: LogEntry[];
  isLoading?: boolean;
}

/**
 * 최적화된 시스템 로그 목록 컴포넌트
 * - React.memo로 props 변경 시에만 리렌더링
 * - useMemo로 로그 데이터 참조 안정화
 */
const SystemLogList: React.FC<SystemLogListProps> = memo(({ logs, isLoading = false }) => {
  // 로그 데이터를 안정화 - 같은 데이터면 같은 참조 유지
  const memoizedLogs = useMemo(() => logs, [logs]);

  return <LogViewer logs={memoizedLogs} isLoading={isLoading} />;
}, (prevProps, nextProps) => {
  // 커스텀 비교: logs 배열의 내용이 같으면 리렌더링 스킵
  return (
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.logs.length === nextProps.logs.length &&
    prevProps.logs === nextProps.logs
  );
});

SystemLogList.displayName = "SystemLogList";

export default SystemLogList;
