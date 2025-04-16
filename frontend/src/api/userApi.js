import api from "./api";

// 회원가입(Signup)
export const signup = async (formData) => {
    const res = await api.post("/users/signup", formData);
    return res.data;
};

// 로그인(Login)
export const login = async (userData) => {
    const res = await api.post("/users/login", userData);
    localStorage.setItem("userToken", res.data.token);  
    return res.data;
};


// 비밀번호 변경 (Settings)
export const updatePassword = async (newPassword) => {
    const token = localStorage.getItem("userToken");
    const res = await api.put(
        "/password-reset/reset-password",
        {}, // 요청 body는 없음
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                newPassword, // 쿼리 파라미터로 전달
            },
        }
    );
    return res.data;
};


// 알림 설정 조회(Settings)
export const getNotificationSettings = async (userId) => {
    const token = localStorage.getItem("userToken");
    const res = await api.get(`/notifications/${userId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return res.data;
};

// 알림 설정 변경(Settings)
export const updateNotificationSetting = async (userId, type, isEnabled) => {
    const token = localStorage.getItem("userToken");
    const res = await api.put(
        `/notifications/${userId}`,
        {
            notificationType: type,
            isEnabled,
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
};

// 송금 한도 조회(Settings)
export const getTransferLimit = async (userId) => {
    const token = localStorage.getItem("userToken");
    const res = await api.get(`/transfer-limits/${userId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return res.data;
};

// 송금 한도 변경(Settings)
export const updateTransferLimit = async (userId, perLimit, dailyLimit) => {
    const token = localStorage.getItem("userToken");
    const res = await api.put(
        `/transfer-limits/${userId}`,
        {
            perTransactionLimit: perLimit,
            dailyLimit: dailyLimit,
        },
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return res.data;
};

// 회원 탈퇴(Settings)
export const deleteUser = async (userId) => {
    const token = localStorage.getItem("userToken");
    const res = await api.delete(`/users/${userId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return res.data;
};


// 사용자 정보 조회(Settings)
export const getUserInfo = async () => {
    const token = localStorage.getItem("userToken");
    const res = await api.get("/users/me", {
        headers: {
            Authorization: `Bearer ${token}`,
        }
    });
    return res.data;
}

// 최근 로그인 기록 조회(Settings)
export const getLoginHistory = async (userId) => {
    const token = localStorage.getItem("userToken");
    const res = await api.get(`/users/${userId}/login-history`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return res.data;
};


// 대시보드(Dashboard)
export const getDashboardInfo = async () => {
    const token = localStorage.getItem("userToken");
    const res = await api.get("/dashboard", {
        headers : {
            Authorization: `Bearer ${token}`,
        }
    });
    return res.data;
};

// 대시보드-최근 거래 내역(Dashboard)
export const getRecentTransactions = async (accountId, sort = "desc", limit = 10) => {
    const token = localStorage.getItem("userToken");
    const res = await api.get(`/dashboard/accounts/${accountId}/transactions`, {
        params: { sort, limit },
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return res.data;
}

// 계좌 개설(createAccount)
export const createAccount = async (accountData) => {
    const token = localStorage.getItem("userToken");

    const response = await api.post("/account", accountData, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    console.log("response : " , response);

    return response.data;
};

// 전체 계좌 조회(ViewAccount)
export const getMyAccounts = async () => {
    const res = await api.get("/account/me");
    return res.data;
};

// 송금(SendMoney)
export const transferMoney = async (transferData) => {
    const res = await api.post("/transaction/transfer", transferData, {
        headers: {
            "Content-Type": "application/json",
        },
    });

    return res.data;
};


// 계좌번호로 사용자 조회(SendMoney)
export const getAccountOwner = async(accountNumber) => {
    const res = await api.get(`/account/${accountNumber}`);
    return res.data;
}

// 거래 내역 조회 (TransactionHistory)
export const getTransactionHistory = async (accountId) => {
    const res = await api.get(`/transaction/account/${accountId}`);
    return res.data;
}