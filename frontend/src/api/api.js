import axios from "axios";

const api = axios.create ({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:8080",
});

// Interceptro 추가 : 매 요청시 Authorization 헤더 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("userToken");
    if(token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
)



// 회원가입(Signup)
export const signup = async (formData) => {
  const res = await api.post("/users/signup", formData);
  return res.data;
};

// 로그인(Login)
export const login = async (userData) => {
  const res = api.post("/users/login", userData);
  return res.data;
}

// 사용자 정보 조회(Home)
export const getUserInfo = () => api.get("/users/me");

// 대시보드(Dashboard)
export const getDashboardInfo = () => api.get("/dashboard");

// 계좌 개설(createAccount)
export const createAccount = async (accountData) => {
  const response = await api.post("/account", accountData);
  return response.data;
};

// 전체 계좌 조회(ViewAccount)
export const getMyAccounts = () => api.get("/account/me");










// 비밀번호 변경
export const updatePassword = async (token, passwordData) => {
    const response = await fetch(`${API_BASE_URL}/reset-password`, {
      method: "PUT",
      headers: { 
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(passwordData),
    });
    return response.json();
  };
  







// 계좌 상세 조회
export const getAccountDetails = async (token, accountId) => {
  const response = await fetch(`${API_BASE_URL}/accounts/${accountId}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};

// 송금
export const transferMoney = async (token, transferData) => {
  const response = await fetch(`${API_BASE_URL}/transactions/transfer`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(transferData),
  });
  return response.json();
};

// 거래 내역 조회
export const getTransactions = async (token) => {
  const response = await fetch(`${API_BASE_URL}/transactions`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};
