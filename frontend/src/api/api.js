import axios from "axios";

const api = axios.create ({
  baseURL: "http://localhost:8080",
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


// // 계좌 상세 조회
// export const getAccountDetails = async (token, accountId) => {
//   const response = await fetch(`${API_BASE_URL}/accounts/${accountId}`, {
//     method: "GET",
//     headers: { Authorization: `Bearer ${token}` },
//   });
//   return response.json();
// };



// // 거래 내역 조회
// export const getTransactions = async (token) => {
//   const response = await fetch(`${API_BASE_URL}/transactions`, {
//     method: "GET",
//     headers: { Authorization: `Bearer ${token}` },
//   });
//   return response.json();
// };
export default api;