import axios from "axios";

const api = axios.create ({
  baseURL: "http://localhost:8080",
});

// Interceptro 추가 : 매 요청시 Authorization 헤더 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;