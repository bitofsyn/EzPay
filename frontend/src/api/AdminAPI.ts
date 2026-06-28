import api from "./api";
import {
  User,
  Account,
  Transaction,
  ApiResponse,
  AdminDashboardStats,
  Activity,
  HourlyTransaction,
  WeeklyTrendData,
  ErrorLog,
  AdminTransferLimitInfo,
} from "../types";

// ========== Dashboard API ==========
// Admin 대시보드 통계 조회
export const getAdminDashboardStats = async (): Promise<AdminDashboardStats> => {
    const res = await api.get("/admin/dashboard");
    return res.data;
};

// 최근 활동 로그 조회
export const getRecentActivities = async (limit: number = 50): Promise<Activity[]> => {
    const res = await api.get("/admin/dashboard/recent-activities", {
        params: { limit }
    });
    return res.data;
};

// 시간대별 거래량 조회 (오늘)
export const getTodayHourlyTransactions = async (): Promise<HourlyTransaction[]> => {
    const res = await api.get("/admin/dashboard/hourly-transactions");
    return res.data;
};

// 주간 거래 추이 조회 (최근 7일)
export const getWeeklyTransactionTrend = async (): Promise<WeeklyTrendData[]> => {
    const res = await api.get("/admin/dashboard/weekly-trend");
    return res.data;
};

// ========== User Management API ==========
// 전체 회원 조회
export const getAllUsers = async (): Promise<User[]> => {
    const res = await api.get("/admin/users");
    return res.data.data ?? res.data;
};

// 특정 회원 상세 조회
export const getUserById = async (userId: number): Promise<User> => {
    const res = await api.get(`/admin/users/${userId}`);
    return res.data.data ?? res.data;
};

// 특정 회원의 계좌 조회
export const getUserAccounts = async (userId: number): Promise<Account[]> => {
    const res = await api.get(`/admin/users/${userId}/accounts`);
    return res.data.data ?? res.data;
};

// 특정 회원의 거래 내역 조회
export const getUserTransactions = async (userId: number): Promise<Transaction[]> => {
    const res = await api.get(`/admin/users/${userId}/transactions`);
    return res.data.data ?? res.data;
};

// 회원 상태 변경
export const updateUserStatus = async (userId: number, status: string): Promise<ApiResponse> => {
    const res = await api.patch(`/admin/users/${userId}/status`, null, {
        params: { status }
    });
    return res.data;
};

// 회원 삭제
export const deleteUserByAdmin = async (userId: number): Promise<ApiResponse> => {
    const res = await api.delete(`/admin/users/${userId}`);
    return res.data;
};

// ========== Transaction Management API ==========
// 모든 거래 내역 조회
export const getAllTransactions = async (): Promise<Transaction[]> => {
    const res = await api.get("/admin/transaction/all");
    return res.data.data ?? res.data;
};

// 거래 삭제
export const deleteTransaction = async (transactionId: number): Promise<ApiResponse> => {
    const res = await api.delete(`/admin/transaction/${transactionId}`);
    return res.data;
};

// ========== Error Log Management API ==========
// 모든 에러 로그 조회
export const getAllErrorLogs = async (): Promise<ErrorLog[]> => {
    const res = await api.get("/admin/error-logs");
    return res.data.data ?? res.data;
};

// 특정 상태의 에러 로그 조회
export const getErrorLogsByStatus = async (status: string): Promise<ErrorLog[]> => {
    const res = await api.get(`/admin/error-logs/status/${status}`);
    return res.data.data ?? res.data;
};

// 에러 로그 해결 처리
export const resolveErrorLog = async (logId: number): Promise<ApiResponse> => {
    const res = await api.patch(`/admin/error-logs/${logId}/resolve`);
    return res.data;
};

// 에러 로그 삭제
export const deleteErrorLog = async (logId: number): Promise<ApiResponse> => {
    const res = await api.delete(`/admin/error-logs/${logId}`);
    return res.data;
};

// ========== Transfer Limit Management API ==========
// 모든 사용자 송금 한도 조회
export const getAllTransferLimits = async (): Promise<AdminTransferLimitInfo[]> => {
    const res = await api.get("/admin/transfer-limits/all");
    return res.data.data ?? res.data;
};

// 특정 사용자 송금 한도 수정
export const updateUserTransferLimit = async (
    userId: number,
    data: { dailyLimit: number; perTransactionLimit: number }
): Promise<ApiResponse> => {
    const res = await api.put(`/admin/transfer-limits/${userId}`, data);
    return res.data;
};

// 특정 사용자 송금 한도 초기화
export const resetUserTransferLimit = async (userId: number): Promise<ApiResponse> => {
    const res = await api.put(`/admin/transfer-limits/reset/${userId}`);
    return res.data;
};

// ========== Admin Alerts API ==========
// 모든 알림 조회
export const getAdminAlerts = async (): Promise<ApiResponse> => {
    const res = await api.get("/admin/dashboard/alerts");
    return res.data;
};

// 읽지 않은 알림 개수 조회
export const getUnreadAlertCount = async (): Promise<ApiResponse> => {
    const res = await api.get("/admin/dashboard/alerts/unread-count");
    return res.data;
};

// 특정 알림 읽음 처리
export const markAlertAsRead = async (alertId: number): Promise<ApiResponse> => {
    const res = await api.put(`/admin/dashboard/alerts/${alertId}/read`);
    return res.data;
};

// 모든 알림 읽음 처리
export const markAllAlertsAsRead = async (): Promise<ApiResponse> => {
    const res = await api.put("/admin/dashboard/alerts/read-all");
    return res.data;
};

// ========== Admin Messages API ==========
// 모든 메시지 조회
export const getAdminMessages = async (): Promise<ApiResponse> => {
    const res = await api.get("/admin/dashboard/messages");
    return res.data;
};

// 읽지 않은 메시지 개수 조회
export const getUnreadMessageCount = async (): Promise<ApiResponse> => {
    const res = await api.get("/admin/dashboard/messages/unread-count");
    return res.data;
};

// 특정 메시지 읽음 처리
export const markMessageAsRead = async (messageId: number): Promise<ApiResponse> => {
    const res = await api.put(`/admin/dashboard/messages/${messageId}/read`);
    return res.data;
};

// 모든 메시지 읽음 처리
export const markAllMessagesAsRead = async (): Promise<ApiResponse> => {
    const res = await api.put("/admin/dashboard/messages/read-all");
    return res.data;
};
