import api from "./api";
import {
  Account,
  Transaction,
  ApiResponse,
  AdminDashboardStats,
  Activity,
  HourlyTransaction,
  WeeklyTrendData,
  ErrorLog,
  AdminTransferLimitInfo,
  AdminDashboardMetrics,
  AdminTPSMetrics,
  AdminSystemLog,
  AdminRiskTransaction,
  AdminRiskActionResult,
  AdminTransactionInfo,
  AdminUserInfo,
  AdminPolicyConfig,
  AdminPolicyChange,
} from "../types";

// ========== Dashboard API ==========
// Admin 대시보드 통계 조회
export const getAdminDashboardStats = async (): Promise<ApiResponse<AdminDashboardStats>> => {
    const res = await api.get("/admin/dashboard");
    return res.data;
};

// 최근 활동 로그 조회
export const getRecentActivities = async (limit: number = 50): Promise<ApiResponse<Activity[]>> => {
    const res = await api.get("/admin/dashboard/recent-activities", {
        params: { limit }
    });
    return res.data;
};

// 시간대별 거래량 조회 (오늘)
export const getTodayHourlyTransactions = async (): Promise<ApiResponse<HourlyTransaction[]>> => {
    const res = await api.get("/admin/dashboard/hourly-transactions");
    return res.data;
};

// 주간 거래 추이 조회 (최근 7일)
export const getWeeklyTransactionTrend = async (): Promise<ApiResponse<WeeklyTrendData[]>> => {
    const res = await api.get("/admin/dashboard/weekly-trend");
    return res.data;
};

// 대시보드 실시간 메트릭 조회 (사용자/거래/계좌 집계)
export const getDashboardMetrics = async (): Promise<AdminDashboardMetrics> => {
    const res = await api.get("/admin/dashboard/metrics");
    return res.data.data ?? res.data;
};

// TPS 메트릭 조회 (실시간 TPS/성공률/실패율)
export const getTPSMetrics = async (): Promise<AdminTPSMetrics> => {
    const res = await api.get("/admin/dashboard/tps-metrics");
    return res.data.data ?? res.data;
};

// ========== User Management API ==========
// 전체 회원 조회
export const getAllUsers = async (): Promise<AdminUserInfo[]> => {
    const res = await api.get("/admin/users");
    return res.data.data ?? res.data;
};

// 특정 회원 상세 조회
export const getUserById = async (userId: number): Promise<AdminUserInfo> => {
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
export const getAllTransactions = async (): Promise<AdminTransactionInfo[]> => {
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

// ========== System Log API ==========
// 최근 시스템 로그 조회
export const getSystemLogs = async (limit: number = 30): Promise<AdminSystemLog[]> => {
    const res = await api.get("/admin/system-logs", { params: { limit } });
    return res.data.data ?? res.data;
};

// ========== Risk Transaction API ==========
// 위험 거래 목록 조회 (filter: 선택)
export const getRiskTransactions = async (filter?: string): Promise<AdminRiskTransaction[]> => {
    const res = await api.get("/admin/risk-transactions", {
        params: filter ? { filter } : undefined,
    });
    return res.data.data ?? res.data;
};

// 위험 거래 승인
export const approveRiskTransaction = async (transactionId: string): Promise<AdminRiskActionResult> => {
    const res = await api.post(`/admin/risk-transactions/${transactionId}/approve`);
    return res.data.data ?? res.data;
};

// 위험 거래 차단
export const blockRiskTransaction = async (transactionId: string): Promise<AdminRiskActionResult> => {
    const res = await api.post(`/admin/risk-transactions/${transactionId}/block`);
    return res.data.data ?? res.data;
};

// ========== Policy Management API ==========
// 현재 정책 설정 조회
export const getPolicyConfig = async (): Promise<AdminPolicyConfig> => {
    const res = await api.get("/admin/policies");
    return res.data.data ?? res.data;
};

// 정책 설정 저장
export const updatePolicyConfig = async (config: AdminPolicyConfig): Promise<ApiResponse> => {
    const res = await api.put("/admin/policies", config);
    return res.data;
};

// 정책 변경 이력 조회
export const getPolicyHistory = async (): Promise<AdminPolicyChange[]> => {
    const res = await api.get("/admin/policies/history");
    return res.data.data ?? res.data;
};
