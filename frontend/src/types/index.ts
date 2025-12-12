// User Types
export interface User {
  userId: number;
  email: string;
  name: string;
  phoneNumber?: string;
  createdAt?: string;
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
export interface ApiResponse<T = any> {
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
  hour: number;
  count: number;
  volume: number;
}

export interface WeeklyTrendData {
  date: string;
  count: number;
  volume: number;
}

export interface AdminUser {
  userId: number;
  email: string;
  name: string;
  phoneNumber?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  lastLoginAt?: string;
  accountCount?: number;
  totalBalance?: number;
}

export interface ErrorLog {
  id: number;
  eventId: string;
  topic: string;
  errorMessage: string;
  stackTrace?: string;
  failedAt: string;
}
