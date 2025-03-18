const API_BASE_URL = "http://localhost:8080";

// 회원가입
export const signup = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return response.json();
};

// 로그인
export const login = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return response.json();
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
  

// 사용자 정보 조회
export const getUserInfo = async (token) => {
  const response = await fetch(`${API_BASE_URL}/user`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.json();
};

// 계좌 개설
export const createAccount = async (token, accountData) => {
  const response = await fetch(`${API_BASE_URL}/accounts`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(accountData),
  });
  return response.json();
};

// 전체 계좌 조회
export const getAccounts = async (token) => {
  const response = await fetch(`${API_BASE_URL}/accounts`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
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
