import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";

const PrivateRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [isValid, setIsValid] = useState(false);

  useEffect(() => {
    const localToken = localStorage.getItem("userToken");
    const sessionToken = sessionStorage.getItem("userToken");
    const token = localToken || sessionToken;

    if (!token) {
      setIsValid(false);
      setLoading(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);

      if (decoded.exp * 1000 < Date.now()) {
        console.log("토큰 만료됨");
        localStorage.removeItem("userToken");
        sessionStorage.removeItem("userToken");
        setIsValid(false);
      } else {
        console.log("토큰 유효함");
        setIsValid(true);
      }
    } catch (err) {
      console.error("토큰 디코딩 실패", err);
      localStorage.removeItem("userToken");
      sessionStorage.removeItem("userToken");
      setIsValid(false);
    } finally {
      setLoading(false);  // 항상 로딩 끝내기
    }
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
