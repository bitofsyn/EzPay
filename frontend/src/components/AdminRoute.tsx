import { Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../api/api';
import { getToken, getUserData } from '../utils/storage';
import { enableAdminPreview, hasAdminPreview } from '../utils/adminView';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPreviewAllowed, setIsPreviewAllowed] = useState(false);

  useEffect(() => {
    const userData = getUserData();
    const token = getToken();
    setIsPreviewAllowed(hasAdminPreview());

    if (!userData || !token) {
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
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
        const allowedAdmin = user.role === 'ADMIN' || userData.role === 'ADMIN';
        setIsAdmin(allowedAdmin);

        if (!allowedAdmin) {
          enableAdminPreview();
          setIsPreviewAllowed(true);
        }
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem('user');
          sessionStorage.removeItem('user');
          setIsValid(false);
        } else {
          // 네트워크 에러 등은 스토리지 정보로 판단
          setIsValid(true);
          const allowedAdmin = userData.role === 'ADMIN';
          setIsAdmin(allowedAdmin);

          if (!allowedAdmin) {
            enableAdminPreview();
            setIsPreviewAllowed(true);
          }
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
  if (!isAdmin && !isPreviewAllowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
