import { Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";

// Lazy load pages
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SendMoney = lazy(() => import("./pages/SendMoney"));
const CreateAccount = lazy(() => import("./pages/CreateAccount"));
const TransactionHistory = lazy(() => import("./pages/TransactionHistory"));
const ViewAccounts = lazy(() => import("./pages/ViewAccounts"));
const AccountDetail = lazy(() => import("./pages/AccountDetail"));
const CalendarPage = lazy(() => import("./pages/calendar/CalendarPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const FindEmail = lazy(() => import("./pages/FindEmail"));
const FindPassword = lazy(() => import("./pages/FindPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AIAssistant = lazy(() => import("./pages/AIAssistant"));

// Settings pages
const LayoutSettings = lazy(() => import("./pages/settings/LayoutSettings"));
const Settings = lazy(() => import("./pages/settings/Settings"));
const PasswordChange = lazy(() => import("./pages/settings/PasswordChange"));
const Notification = lazy(() => import("./pages/settings/Notification"));
const TransferLimit = lazy(() => import("./pages/settings/TransferLimit"));
const Withdraw = lazy(() => import("./pages/settings/Withdraw"));
const LoginHistory = lazy(() => import("./pages/settings/LoginHistory"));
const MainAccountSettings = lazy(() => import("./pages/settings/MainAccountSettings"));

// Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminUserDetail = lazy(() => import("./pages/admin/AdminUserDetail"));
const AdminErrorLogs = lazy(() => import("./pages/admin/AdminErrorLogs"));
const AdminTransactions = lazy(() => import("./pages/admin/AdminTransactions"));
const AdminTransferLimits = lazy(() => import("./pages/admin/AdminTransferLimits"));

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
      <p className="text-gray-600">로딩 중...</p>
    </div>
  </div>
);

const AppRoutes = () => {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* 비로그인 접근 가능 */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/find-email" element={<FindEmail />} />
          <Route path="/find-password" element={<FindPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* 로그인 후 접근 가능 */}
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/send" element={<PrivateRoute><SendMoney /></PrivateRoute>} />
          <Route path="/create-account" element={<PrivateRoute><CreateAccount /></PrivateRoute>} />
          <Route path="/transactions" element={<PrivateRoute><TransactionHistory /></PrivateRoute>} />
          <Route path="/accounts" element={<PrivateRoute><ViewAccounts /></PrivateRoute>} />
          <Route path="/account/:id" element={<PrivateRoute><AccountDetail /></PrivateRoute>} />
          <Route path="/ai-assistant" element={<PrivateRoute><AIAssistant /></PrivateRoute>} />

          {/* 달력 관련 */}
          <Route path="/calendar" element={<PrivateRoute><CalendarPage /></PrivateRoute>} />

          {/* 환경설정 */}
          <Route path="/settings/*" element={<PrivateRoute><LayoutSettings /></PrivateRoute>}>
            <Route index element={<Settings />} />
            <Route path="password" element={<PasswordChange />} />
            <Route path="notification" element={<Notification />} />
            <Route path="transfer-limit" element={<TransferLimit />} />
            <Route path="withdraw" element={<Withdraw />} />
            <Route path="login-history" element={<LoginHistory />} />
            <Route path="main-account" element={<MainAccountSettings />} />
          </Route>

          {/* 관리자 페이지 - AdminRoute로 보호 (관리자만 접근 가능) */}
          <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
          <Route path="/admin/users/:userId" element={<AdminRoute><AdminUserDetail /></AdminRoute>} />
          <Route path="/admin/transactions" element={<AdminRoute><AdminTransactions /></AdminRoute>} />
          <Route path="/admin/transfer-limits" element={<AdminRoute><AdminTransferLimits /></AdminRoute>} />
          <Route path="/admin/error-logs" element={<AdminRoute><AdminErrorLogs /></AdminRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppRoutes;
