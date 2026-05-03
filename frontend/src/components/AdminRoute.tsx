import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../api/api';
import { getUserData } from '../utils/storage';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const userData = getUserData();

    if (!userData) {
      setIsValid(false);
      setLoading(false);
      return;
    }

    // API로 JWT 유효성 및 역할 확인
    api
      .get('/users/me')
      .then((res) => {
        const user = res.data.data ?? res.data;
        setIsValid(true);
        // 서버에서 받은 role 확인 (ADMIN인 경우만 허용)
        setIsAdmin(user.role === 'ADMIN');
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem('user');
          sessionStorage.removeItem('user');
          setIsValid(false);
        } else {
          // 네트워크 에러 등은 스토리지 정보로 판단
          setIsValid(true);
          setIsAdmin(userData.role === 'ADMIN');
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

  // 로그인되지 않은 경우 로그인 페이지로
  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  // 관리자가 아닌 경우 일반 대시보드로
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
