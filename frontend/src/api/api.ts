import axios from "axios";
import { getToken } from "../utils/storage";

const api = axios.create ({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // 쿠키를 포함하여 요청 전송
});

// 요청 인터셉터: Authorization 헤더 자동 추가
api.interceptors.request.use(
  (config) => {
    const token = getToken();
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