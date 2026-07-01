// ─────────────────────────────────────────────────────────────────
// Admin Dashboard Type Definitions
// ─────────────────────────────────────────────────────────────────

// System Logs
export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG";
export type LogFilterType = "전체" | LogLevel;

export interface LogEntry {
  id: number;
  time: string;
  level: LogLevel;
  service: string;
  message: string;
}

// Real-time Transactions
export type TransactionStatus = "SUCCESS" | "PENDING" | "FAILED";

export interface RealtimeTransaction {
  uid: string;
  time: string;
  id: string;
  sender: string;
  receiver: string;
  amount: number;
  status: TransactionStatus;
  responseMs: number;
}

// Dashboard Metrics
export interface MetricCard {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  color?: "cyan" | "emerald" | "purple" | "amber" | "rose";
}

export interface DashboardMetrics {
  tps: number;
  successRate: number;
  avgResponseTime: number;
  totalVolume: number;
  sparklineData: Array<{ v: number }>;
}

// User Status
export type UserStatusType = "ACTIVE" | "INACTIVE" | "LOCKED" | "SUSPENDED";

export interface UserStatusCount {
  status: UserStatusType;
  count: number;
  percentage: number;
}

// Risk Assessment
export type RiskLevel = "SAFE" | "CAUTION" | "DANGER";

export interface RiskTransaction {
  transactionId: number;
  amount: number;
  sender: string;
  receiver: string;
  riskLevel: RiskLevel;
  reason: string;
  timestamp: string;
  status: "PENDING_REVIEW" | "APPROVED" | "REJECTED";
}

// Policy Configuration
export interface TransferLimitPolicy {
  id: string;
  perTransactionMax: number;
  dailyMax: number;
  monthlyMax: number;
  enabled: boolean;
}

export interface RiskManagementPolicy {
  id: string;
  riskScoreThreshold: number;
  automaticBlockEnabled: boolean;
  notificationEnabled: boolean;
}

export interface PolicyConfig {
  transferLimit: TransferLimitPolicy;
  riskManagement: RiskManagementPolicy;
  maintenanceMode: boolean;
}

// Admin Settings
export interface AdminAccount {
  adminId: number;
  email: string;
  name: string;
  role: "SUPER_ADMIN" | "ADMIN" | "MODERATOR";
  createdAt: string;
  lastLogin: string;
}

export interface AdminActivityLog {
  id: number;
  timestamp: string;
  adminName: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
}

// Badge Styling
export type BadgeVariant = "status" | "risk" | "log-level";
export type BadgeColor = "green" | "yellow" | "red" | "blue" | "purple" | "gray";

export interface BadgeProps {
  variant: BadgeVariant;
  value: string;
  color?: BadgeColor;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Filter & Pagination
export interface FilterConfig {
  search?: string;
  status?: string;
  level?: LogLevel;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}

// Form Controls
export interface ToggleSwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  description?: string;
}

export interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  unit?: string;
}

// Table
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  width?: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  virtualized?: boolean;
}
