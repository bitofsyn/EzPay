import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

// 회원가입(Signup)
export const signup = async (userData) => {
  const response = await axios.post(`${API_BASE_URL}/auth/signup`, userData, {
    headers: {
      "Content-Type": "application/json"
    }
  });
  return response.data;
};

// 로그인(Login)
export const login = async (userData) => {
  const response = await axios.post(`${API_BASE_URL}/users/login`, userData);
  return response.data;
};

// 사용자 정보 조회(Home)
export const getUserInfo = async (token) => {
  const response = await axios.get(`${API_BASE_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// 대시보드(Dashboard)
export const getDashboardInfo = async (token) => {
  const response = await axios.get(`${API_BASE_URL}/dashboard`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};

// 계좌 개설(createAccount)
export const createAccount = async (token, accountData) => {
  const response = await axios.post(`${API_BASE_URL}/account`, accountData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    }
  });
  return response.data;
};

// 전체 계좌 조회(ViewAccount)
export const getMyAccounts = async (token) => {
  const response = await axios.get(`${API_BASE_URL}/account/me`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return response.data;
};










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
