import { BrowserRouter, Routes, Route } from "react-router-dom";
import pages from "./utils/loadPage";
import NotFound from "./pages/NotFound";
import AccountDetail from "./pages/AccountDetail";
import PrivateRoute from "./components/PrivateRoute";
import LayoutSettings from "./pages/settings/LayoutSettings";

// ✨ Settings 하위 페이지들
import Settings from "./pages/settings/Settings";
import PasswordChange from "./pages/settings/PasswordChange";
import Notification from "./pages/settings/Notification";
import TransferLimit from "./pages/settings/TransferLimit";
import Withdraw from "./pages/settings/Withdraw";
const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ✅ 비로그인 접근 가능 */}
        <Route path="/" element={<pages.Home />} />
        <Route path="/login" element={<pages.Login />} />
        <Route path="/signup" element={<pages.Signup />} />

        {/* 🔐 로그인 후 접근 가능한 페이지 */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <pages.Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/send"
          element={
            <PrivateRoute>
              <pages.SendMoney />
            </PrivateRoute>
          }
        />
        <Route
          path="/create-account"
          element={
            <PrivateRoute>
              <pages.CreateAccount />
            </PrivateRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <PrivateRoute>
              <pages.TransactionHistory />
            </PrivateRoute>
          }
        />
        <Route
          path="/accounts"
          element={
            <PrivateRoute>
              <pages.ViewAccounts />
            </PrivateRoute>
          }
        />
        <Route
          path="/account/:id"
          element={
            <PrivateRoute>
              <AccountDetail />
            </PrivateRoute>
          }
        />

        {/* ⚙️ 환경설정 (Layout + 하위 라우트 구성) */}
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <LayoutSettings />
            </PrivateRoute>
          }
        >
          <Route index element={<Settings />} />
          <Route path="password" element={<PasswordChange />} />
          <Route path="notification" element={<Notification />} />
          <Route path="transfer-limit" element={<TransferLimit />} />
          <Route path="withdraw" element={<Withdraw />} />
        </Route>

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
