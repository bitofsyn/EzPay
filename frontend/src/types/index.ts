// User Types
export type UserRole = 'USER' | 'ADMIN';

export interface User {
  userId: number;
  email: string;
  name: string;
  phoneNumber?: string;
  createdAt?: string;
  role?: UserRole;
}

export interface SignupFormData {
  email: string;
  password: string;
  name: string;
  phoneNumber?: string;
}

export interface LoginFormData {
  email: string;
  password: string;
}

// Account Types
export interface Account {
  accountId: number;
  accountNumber: string;
  accountName: string;
  balance: number;
  isMain: boolean;
  userId: number;
  createdAt: string;
}

export interface CreateAccountData {
  userId: number;
  bankName: string;
  balance: number;
}

export interface AccountOwner {
  accountNumber: string;
  accountName: string;
  ownerName: string;
  accountId: number;
}

// Transaction Types
export interface TransactionAccount {
  accountId: number;
  accountNumber: string;
  bankName: string;
  ownerName?: string; // 계좌 소유자 이름 (거래 상대 표시용)
  balance: number;
  createdAt?: string;
  main?: boolean;
}

export interface Transaction {
  transactionId: number;
  amount: number;
  description?: string;
  memo?: string;
  category?: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  transactionDate: string;
  senderAccount: TransactionAccount;
  receiverAccount: TransactionAccount;
  // 레거시 필드 (호환성)
  accountId?: number;
  transactionType?: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  balance?: number;
  createdAt?: string;
}

export interface TransferData {
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  memo?: string;
  category?: string;
}

// Dashboard Types
export interface DashboardInfo {
  status: string;
  message: string;
  data: {
    account: Account[];
    transactions: Transaction[];
    user: User;
  };
}

// Settings Types
export interface NotificationSettings {
  notificationId: number;
  userId: number;
  notificationType: string;
  isEnabled: boolean;
}

// 알림 피드(이벤트) — 백엔드 UserNotificationInfo와 정합
export type UserNotificationCategory = 'TRANSFER' | 'DEPOSIT' | 'SECURITY';

export interface UserNotificationItem {
  notificationId: number;
  category: UserNotificationCategory;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// 백엔드 UserNotificationPage와 정합
export interface UserNotificationPage {
  content: UserNotificationItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

export interface TransferLimit {
  limitId: number;
  userId: number;
  perTransactionLimit: number;
  dailyLimit: number;
}

export interface LoginHistoryItem {
  historyId: number;
  userId: number;
  ipAddress: string;
  deviceInfo: string;
  loginTime: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  status: string;
  message?: string;
  data?: T;
  error?: string;
}

// Calendar Types
export interface CalendarTransaction {
  date: string;
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
}

// Admin Types
export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  lockedUsers?: number;
  totalTransactions: number;
  totalVolume: number;
  dailyTransactionCount?: number;
  dailyTransactionVolume?: number;
  totalAccounts?: number;
  recentErrors?: number;
}

export interface Activity {
  type: string;
  description: string;
  timestamp: string;
  status?: string;
  userName?: string;
}

export interface FormattedActivity {
  type: string;
  text: string;
  time: string;
  color: string;
  userName?: string;
}

export interface HourlyTransaction {
  hour: string;
  transactionCount: number;
  totalVolume: number;
}

export interface WeeklyTrendData {
  date: string;
  dayOfWeek?: string;
  transactionCount: number;
  totalVolume: number;
}

export interface AdminUser {
  userId: number;
  email: string;
  name: string;
  phoneNumber?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  createdAt: string;
  lastLoginAt?: string;
  accountCount?: number;
  totalBalance?: number;
}

// 백엔드 ErrorLogInfo DTO와 정합 (logId, serviceName, errorMessage, occurredAt, status)
export interface ErrorLog {
  logId: number;
  serviceName: string;
  errorMessage: string;
  occurredAt: string;
  status: "RESOLVED" | "UNRESOLVED";
}

// Admin Transfer Limit Types
export interface AdminTransferLimitInfo {
  limitId: number;
  userId: number;
  userName?: string;
  dailyLimit: number;
  perTransactionLimit: number;
  usedAmount: number;
  remainingAmount: number;
}

// ─────────────────────────────────────────────────────────────────
// Admin API DTOs (백엔드 컨트롤러/DTO와 1:1 정합)
// ─────────────────────────────────────────────────────────────────

// 백엔드 DashboardMetricsInfo (GET /admin/dashboard/metrics)
export interface AdminDashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  lockedUsers: number;
  totalTransactions: number;
  totalVolume: number;
  dailyTransactionCount: number;
  dailyTransactionVolume: number;
  totalAccounts: number;
  recentErrors: number;
  lastUpdated: string;
}

// 백엔드 TPSMetricsInfo (GET /admin/dashboard/tps-metrics)
export interface AdminTPSMetrics {
  currentTPS: number;
  peakTPS: number;
  avgTPS: number;
  successRate: number;
  failureRate: number;
  timestamp: string;
}

// 백엔드 SystemLogInfo (GET /admin/system-logs)
export interface AdminSystemLog {
  id: number;
  time: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  service: string;
  message: string;
}

// 백엔드 RiskTransactionInfo (GET /admin/risk-transactions)
export type AdminRiskLevel = 'DANGER' | 'CAUTION' | 'SAFE';
export type AdminRiskStatus = 'PENDING_REVIEW' | 'APPROVED' | 'BLOCKED';

export interface AdminRiskTransaction {
  transactionId: string;
  level: AdminRiskLevel;
  sender: string;
  receiver: string;
  amount: number;
  datetime: string;
  category: string;
  reason: string;
  status: AdminRiskStatus;
}

// 백엔드 RiskActionResult (POST /admin/risk-transactions/{id}/approve|block)
export interface AdminRiskActionResult {
  transactionId: string;
  status: AdminRiskStatus;
  approvedAt: string;
}

// 백엔드 TransactionInfo (GET /admin/transaction/all)
export type AdminTransactionStatusType = 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

export interface AdminTransactionInfo {
  transactionId: number;
  senderAccountId: number;
  receiverAccountId: number;
  amount: number;
  memo?: string;
  category?: string;
  status: AdminTransactionStatusType;
  createdAt: string;
}

// 백엔드 UserInfo (GET /admin/users, /admin/users/{id})
export interface AdminUserInfo {
  userId: number;
  email: string;
  name: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

// 백엔드 RealtimeUserEvent (SSE 채널 "user-events")
// 사용자 상태 변경 등 사용자 도메인 실시간 이벤트
export interface RealtimeUserEvent {
  userId: number;
  name: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  action: string;
  occurredAt: string;
}

// 정책 관리 (신규 엔드포인트 계약: GET/PUT /admin/policies, GET /admin/policies/history)
export interface AdminPolicyConfig {
  dailyLimit: number;
  singleLimit: number;
  maxTxCount: number;
  feeRate: number;
  minFee: number;
  maxFee: number;
  aiEnabled: boolean;
  autoBlock: boolean;
  adminApproval: boolean;
  riskThreshold: number;
  warnThreshold: number;
}

export interface AdminPolicyChange {
  id: number | string;
  changedAt: string;
  adminName: string;
  policyName: string;
  before: string;
  after: string;
  reason: string;
}

// ─── Realtime Transaction Pipeline ─────────────────────────────────────────────

// 백엔드 PipelineStage(enum)와 1:1 대응. 스텝 순서를 그대로 표현한다.
export type PipelineStage = "RECEIVED" | "RISK_CHECK" | "LEDGER" | "SETTLEMENT";

// 백엔드 PipelineStageStatus(enum)와 대응
export type PipelineStageStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

// SSE 채널 "transaction-pipeline"로 수신하는 단계 전이 이벤트
export interface TransactionPipelineEvent {
  txId: string;
  stage: PipelineStage;
  stageIndex: number;
  stageStatus: PipelineStageStatus;
  sender: string;
  receiver: string;
  amount: number;
  elapsedMs: number;
  message: string;
  occurredAt: string;
}

// Re-export admin types
export type {
  LogLevel,
  LogFilterType,
  LogEntry,
  TransactionStatus,
  RealtimeTransaction,
  MetricCard,
  DashboardMetrics,
  UserStatusType,
  UserStatusCount,
  RiskLevel,
  RiskTransaction,
  TransferLimitPolicy,
  RiskManagementPolicy,
  PolicyConfig,
  AdminAccount,
  AdminActivityLog,
  BadgeVariant,
  BadgeColor,
  BadgeProps,
  FilterConfig,
  PaginationState,
  ToggleSwitchProps,
  RangeSliderProps,
  TableColumn,
  TableProps,
} from "./admin";
