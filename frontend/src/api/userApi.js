import api from "../api/api";

// 🔐 회원가입(Signup)
export const signup = async (formData) => {
    const res = await api.post("/users/signup", formData);
    return res.data;
};

// 🔐 로그인(Login)
export const login = async (userData) => {
    const res = await api.post("/users/login", userData);
    return res.data;
};


// 비밀번호 변경
export const updatePassword = async (passwordData) => {
    const res = await api.put("/reset-password", passwordData);
    return res.data;
};


// 사용자 정보 조회(Home)
export const getUserInfo = async () => {
    const res = await api.get("/users/me");
    return res.data;
}

// 📊 대시보드(Dashboard)
export const getDashboardInfo = async () => {
    const res = await api.get("/dashboard");
    return res.data;
};

// 🏦 계좌 개설(createAccount)
export const createAccount = async (accountData) => {
    const response = await api.post("/account", accountData);
    return response.data;
};

// 전체 계좌 조회(ViewAccount)
export const getMyAccounts = async () => {
    const res = await api.get("/account/me");
    return res.data;
};
