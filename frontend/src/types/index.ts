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
  accountName: string;
  initialBalance?: number;
}

export interface AccountOwner {
  accountNumber: string;
  accountName: string;
  ownerName: string;
}

// Transaction Types
export interface Transaction {
  transactionId: number;
  accountId: number;
  transactionType: 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  amount: number;
  balance: number;
  description?: string;
  memo?: string;
  category?: string;
  createdAt: string;
  recipientAccountNumber?: string;
  senderAccountNumber?: string;
}

export interface TransferData {
  fromAccountId: number;
  toAccountNumber: string;
  amount: number;
  memo?: string;
}

// Dashboard Types
export interface DashboardInfo {
  totalBalance: number;
  accounts: Account[];
  recentTransactions?: Transaction[];
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
  loginHistoryId: number;
  userId: number;
  loginTime: string;
  ipAddress: string;
  userAgent?: string;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
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
  totalTransactions: number;
  totalVolume: number;
}
