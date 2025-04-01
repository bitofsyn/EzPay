import { BrowserRouter, Routes, Route } from "react-router-dom";
import pages from "./utils/loadPage";
import NotFound from "./pages/NotFound";
import AccountDetail from "./pages/AccountDetail";
import Settings from "./pages/Settings";
import PrivateRoute from "./components/PrivateRoute";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ✅ 비로그인 상태에서도 접근 가능 */}
        <Route path="/" element={<pages.Home />} />
        <Route path="/login" element={<pages.Login />} />
        <Route path="/signup" element={<pages.Signup />} />

        {/* 🔐 로그인한 사용자 전용 페이지 */}
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
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <Settings />
            </PrivateRoute>
          }
        />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
