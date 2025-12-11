import api from "./api";
import {
    SignupFormData,
    LoginFormData,
    User,
    Account,
    Transaction,
    DashboardInfo,
    NotificationSettings,
    TransferLimit,
    LoginHistoryItem,
    CreateAccountData,
    TransferData,
    AccountOwner,
    ApiResponse,
} from "../types";

// 회원가입(Signup)
export const signup = async (formData: SignupFormData): Promise<ApiResponse<User>> => {
    const res = await api.post("/users/signup", formData);
    return res.data;
};

// 로그인(Login) - 응답: { status, data: { userId, email, name, token } }
export const login = async (userData: LoginFormData): Promise<ApiResponse<{ userId: number; email: string; name: string; token: string | null }>> => {
    const res = await api.post("/users/login", userData);
    return res.data;
};

// 비밀번호 변경 (Settings)
export const updatePassword = async (newPassword: string): Promise<ApiResponse> => {
    const res = await api.put(
        "/password-reset/reset-password",
        {}, // 요청 body는 없음
        {
            params: {
                newPassword, // 쿼리 파라미터로 전달
            },
        }
    );
    return res.data;
};

// 알림 설정 조회(Settings)
export const getNotificationSettings = async (userId: number): Promise<NotificationSettings[]> => {
    const res = await api.get(`/notifications/${userId}`);
    return res.data.data ?? res.data;
};

// 알림 설정 변경(Settings)
export const updateNotificationSetting = async (
    userId: number,
    type: string,
    isEnabled: boolean
): Promise<ApiResponse> => {
    const res = await api.put(`/notifications/${userId}`, {
        notificationType: type,
        isEnabled,
    });
    return res.data;
};

// 송금 한도 조회(Settings)
export const getTransferLimit = async (userId: number): Promise<TransferLimit> => {
    const res = await api.get(`/transfer-limits/${userId}`);
    return res.data.data ?? res.data;
};

// 송금 한도 변경(Settings)
export const updateTransferLimit = async (
    userId: number,
    perLimit: number,
    dailyLimit: number
): Promise<ApiResponse> => {
    const res = await api.put(`/transfer-limits/${userId}`, {
        perTransactionLimit: perLimit,
        dailyLimit: dailyLimit,
    });
    return res.data;
};

// 회원 탈퇴(Settings)
export const deleteUser = async (userId: number): Promise<ApiResponse> => {
    const res = await api.delete(`/users/${userId}`);
    return res.data;
};

// 사용자 정보 조회(Settings)
export const getUserInfo = async (): Promise<User> => {
    const res = await api.get("/users/me");
    return res.data.data ?? res.data;
};

// 최근 로그인 기록 조회(Settings)
export const getLoginHistory = async (userId: number): Promise<LoginHistoryItem[]> => {
    const res = await api.get(`/users/${userId}/login-history`);
    return res.data.data ?? res.data;
};

// 대시보드(Dashboard)
export const getDashboardInfo = async (): Promise<DashboardInfo> => {
    const res = await api.get("/dashboard");
    return res.data;
};

// 대시보드-최근 거래 내역(Dashboard)
export const getRecentTransactions = async (
    accountId: number,
    sort: "asc" | "desc" = "desc",
    limit: number = 10
): Promise<Transaction[]> => {
    const res = await api.get(`/dashboard/accounts/${accountId}/transactions`, {
        params: { sort, limit },
    });
    return res.data.data ?? res.data;
};

// 계좌 개설(createAccount)
export const createAccount = async (accountData: CreateAccountData): Promise<ApiResponse<Account>> => {
    const response = await api.post("/account", accountData);
    return response.data;
};

// 전체 계좌 조회(ViewAccount)
export const getMyAccounts = async (): Promise<Account[]> => {
    const res = await api.get("/account/me");
    return res.data.data ?? res.data;
};

// 송금(SendMoney)
export const transferMoney = async (transferData: TransferData): Promise<ApiResponse> => {
    const res = await api.post("/transaction/transfer", transferData);
    return res.data;
};

// 계좌번호로 사용자 조회(SendMoney)
export const getAccountOwner = async (accountNumber: string): Promise<AccountOwner> => {
    const res = await api.get(`/account/${accountNumber}`);
    return res.data.data ?? res.data;
};

// 거래 내역 조회 (TransactionHistory)
export const getTransactionHistory = async (accountId: number): Promise<Transaction[]> => {
    const res = await api.get(`/transaction/account/${accountId}`);
    return res.data.data ?? res.data;
};

// 대표 계좌 설정(Settings)
export const setMainAccount = async (accountId: number): Promise<ApiResponse> => {
    return await api.patch(`/account/${accountId}/main`);
};

// 이메일 찾기 (FindEmail)
export const findEmail = async (formData: { name: string; phoneNumber: string }): Promise<ApiResponse<{ email: string }>> => {
    const res = await api.post("/users/find-email", formData);
    return res.data;
};

// 비밀번호 재설정 요청(FindPassword)
export const requestPasswordReset = async (email: string): Promise<ApiResponse> => {
    const res = await api.post("/password-reset/request", { email });
    return res.data;
};

// 비밀번호 재설정 토큰 유효성 검사(ResetPassword)
export const validatePasswordResetToken = async (token: string): Promise<ApiResponse> => {
    return await api.get("/password-reset/validate", {
        params: { token },
    });
};

// 비밀번호 재설정(ResetPassword)
export const resetPassword = async (token: string, newPassword: string): Promise<ApiResponse> => {
    const res = await api.put(
        `/password-reset/reset-password`,
        {},
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                newPassword,
            },
        }
    );
    return res.data;
};
