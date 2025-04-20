import { Routes, Route, useNavigate, useLocation } from "react-router-dom"; // BrowserRouter ❌ (삭제)
import { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

import pages from "./utils/loadPage";
import NotFound from "./pages/NotFound";
import AccountDetail from "./pages/AccountDetail";
import PrivateRoute from "./components/PrivateRoute";
import LayoutSettings from "./pages/settings/LayoutSettings";

import Settings from "./pages/settings/Settings";
import PasswordChange from "./pages/settings/PasswordChange";
import Notification from "./pages/settings/Notification";
import TransferLimit from "./pages/settings/TransferLimit";
import Withdraw from "./pages/settings/Withdraw";

const AppRoutes = () => {
  const navigate = useNavigate();
  const location = useLocation(); // ✅ 현재 경로 확인
  const [user, setUser] = useState(undefined); // 중요: 초기값을 null → undefined로!

  useEffect(() => {
    const token = localStorage.getItem("userToken") || sessionStorage.getItem("userToken");

    if (token && token.split('.').length === 3) { // ✅ 토큰 형태 검증 추가
      try {
        const decoded = jwtDecode(token);
        setUser(decoded);
      } catch (err) {
        console.error("토큰 디코딩 오류:", err);
        localStorage.removeItem("userToken");
        sessionStorage.removeItem("userToken");
        setUser(null);
        if (location.pathname !== "/login" && location.pathname !== "/signup") {
          navigate("/login");
        }
      }
    } else {
      setUser(null);
      if (location.pathname !== "/login" && location.pathname !== "/signup") {
        navigate("/login");
      }
    }
  }, [navigate, location.pathname]);

  if (user === undefined) {
    return <div className="text-center mt-10">로딩 중...</div>; // 처음만 로딩 중
  }

  return (
    <Routes>
      <Route path="/" element={<pages.Home />} />
      <Route path="/login" element={<pages.Login />} />
      <Route path="/signup" element={<pages.Signup />} />

      {/* 로그인 후 접근 가능한 페이지 */}
      <Route path="/dashboard" element={<PrivateRoute><pages.Dashboard /></PrivateRoute>} />
      <Route path="/send" element={<PrivateRoute><pages.SendMoney /></PrivateRoute>} />
      <Route path="/create-account" element={<PrivateRoute><pages.CreateAccount /></PrivateRoute>} />
      <Route path="/transactions" element={<PrivateRoute><pages.TransactionHistory /></PrivateRoute>} />
      <Route path="/accounts" element={<PrivateRoute><pages.ViewAccounts /></PrivateRoute>} />
      <Route path="/account/:id" element={<PrivateRoute><AccountDetail /></PrivateRoute>} />

      {/* 환경설정 */}
      <Route path="/settings/*" element={<PrivateRoute><LayoutSettings /></PrivateRoute>}>
        <Route index element={<Settings />} />
        <Route path="password" element={<PasswordChange />} />
        <Route path="notification" element={<Notification />} />
        <Route path="transfer-limit" element={<TransferLimit />} />
        <Route path="withdraw" element={<Withdraw />} />
      </Route>

      {/* 404 Not Found */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
