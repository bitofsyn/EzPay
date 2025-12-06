import api from "./api";

// ========== Dashboard API ==========
// Admin 대시보드 통계 조회
export const getAdminDashboardStats = async () => {
    const res = await api.get("/admin/dashboard");
    console.log(`==== api res : ` , res);
    return res.data;
};

// ========== User Management API ==========
// 전체 회원 조회
export const getAllUsers = async () => {
    const res = await api.get("/admin/users");
    return res.data;
};

// 특정 회원 상세 조회
export const getUserById = async (userId) => {
    const res = await api.get(`/admin/users/${userId}`);
    return res.data;
};

// 특정 회원의 계좌 조회
export const getUserAccounts = async (userId) => {
    const res = await api.get(`/admin/users/${userId}/accounts`);
    return res.data;
};

// 특정 회원의 거래 내역 조회
export const getUserTransactions = async (userId) => {
    const res = await api.get(`/admin/users/${userId}/transactions`);
    return res.data;
};

// 회원 상태 변경
export const updateUserStatus = async (userId, status) => {
    const res = await api.patch(`/admin/users/${userId}/status`, null, {
        params: { status }
    });
    return res.data;
};

// 회원 삭제
export const deleteUserByAdmin = async (userId) => {
    const res = await api.delete(`/admin/users/${userId}`);
    return res.data;
};

// ========== Transaction Management API ==========
// 모든 거래 내역 조회
export const getAllTransactions = async () => {
    const res = await api.get("/admin/transaction/all");
    return res.data;
};

// 거래 삭제
export const deleteTransaction = async (transactionId) => {
    const res = await api.delete(`/admin/transaction/${transactionId}`);
    return res.data;
};

// ========== Error Log Management API ==========
// 모든 에러 로그 조회
export const getAllErrorLogs = async () => {
    const res = await api.get("/admin/error-logs");
    return res.data;
};

// 특정 상태의 에러 로그 조회
export const getErrorLogsByStatus = async (status) => {
    const res = await api.get(`/admin/error-logs/status/${status}`);
    return res.data;
};

// 에러 로그 해결 처리
export const resolveErrorLog = async (logId) => {
    const res = await api.patch(`/admin/error-logs/${logId}/resolve`);
    return res.data;
};

// 에러 로그 삭제
export const deleteErrorLog = async (logId) => {
    const res = await api.delete(`/admin/error-logs/${logId}`);
    return res.data;
};
