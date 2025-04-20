import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

const PrivateRoute = ({ children }) => {
  const localToken = localStorage.getItem("userToken");
  const sessionToken = sessionStorage.getItem("userToken");
  const token = localToken || sessionToken;

  // 토큰이 없으면 로그인 페이지로
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  try {
    const decoded = jwtDecode(token);

    // 토큰 만료 여부 확인
    if (decoded.exp * 1000 < Date.now()) {
      console.log("토큰 만료됨");
      localStorage.removeItem("userToken");
      sessionStorage.removeItem("userToken");
      return <Navigate to="/login" replace />;
    }

    console.log("child : ", children);
    return children;
  } catch (err) {
    console.error("토큰 디코딩 실패", err);
    // 디코딩 실패 시도 로그인 페이지로
    localStorage.removeItem("userToken");
    sessionStorage.removeItem("userToken");
    return <Navigate to="/login" replace />;
  }
};

export default PrivateRoute;