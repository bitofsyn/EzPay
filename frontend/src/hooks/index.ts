// Custom Hooks
// Organized by domain and functionality

// Dashboard Hooks
export {
  useAdminStats,
  useRealtimeActivities,
  useHourlyTransactions,
  useWeeklyTrend,
  useAdminAlerts,
  useAdminMessages,
  useRealtimeTransactions,
  useRealtimeTPS,
} from "./useAdminDashboard";

// Realtime Data Hooks (NEW)
export { useRealtimeRiskTransactions } from "./useRealtimeRiskTransactions";
export { useSystemLogsStream, SYSTEM_LOG_FILTER_TABS } from "./useSystemLogsStream";
export { useRealtimeTransactionStream } from "./useRealtimeTransactionStream";
export { useRealtimeMetrics } from "./useRealtimeMetrics";

// Data Management Hooks (Legacy - to be replaced)
export { useSystemLogs, SYSTEM_LOG_FILTER_TABS as SYSTEM_LOG_FILTER_TABS_LEGACY } from "./useSystemLogs";
export { useTransactionLog } from "./useTransactionLog";
export { useFilteredData } from "./useFilteredData";

// Common Hooks
export { usePagination } from "./usePagination";
export { useDebounce } from "./useDebounce";
export { useLocalStorage } from "./useLocalStorage";
