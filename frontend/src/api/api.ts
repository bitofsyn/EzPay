import axios from "axios";

const api = axios.create ({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // 쿠키를 포함하여 요청 전송
});

export default api;