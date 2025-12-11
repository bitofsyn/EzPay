import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import api from "../api/api";

interface PrivateRouteProps {
    children: React.ReactNode;
}

const PrivateRoute = ({ children }: PrivateRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    // 사용자 정보가 있는지 확인 (localStorage 또는 sessionStorage)
    const localUser = localStorage.getItem("user");
    const sessionUser = sessionStorage.getItem("user");
    const user = localUser || sessionUser;

    if (!user) {
      setIsValid(false);
      setLoading(false);
      return;
    }

    // 쿠키의 JWT 유효성은 API 요청으로 확인
    // 첫 번째 인증된 API 요청이 실패하면 로그인 페이지로 리다이렉트
    api.get("/users/me")
      .then(() => {
        setIsValid(true);
      })
      .catch((err) => {
        // 401 에러면 인증 실패
        if (err.response?.status === 401) {
          localStorage.removeItem("user");
          sessionStorage.removeItem("user");
          setIsValid(false);
        } else {
          // 다른 에러는 일단 허용 (네트워크 에러 등)
          setIsValid(true);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600 text-lg">로딩 중...</p>
      </div>
    );
  }

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
