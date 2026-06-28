import { useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiActivity,
  FiAlertTriangle,
  FiBell,
  FiChevronRight,
  FiGrid,
  FiLogOut,
  FiMonitor,
  FiRepeat,
  FiSettings,
  FiSliders,
  FiUsers,
} from "react-icons/fi";
import { disableAdminPreview, hasAdminPreview } from "../../utils/adminView";
import { clearUserData, getUserData } from "../../utils/storage";

const todayLabel = new Date().toLocaleDateString("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const adminMenus = [
  { label: "관리자 대시보드", path: "/admin/dashboard", icon: FiGrid, match: /^\/admin\/dashboard$/ },
  { label: "사용자 관리", path: "/admin/users", icon: FiUsers, match: /^\/admin\/users(\/.*)?$/ },
  { label: "거래 관리", path: "/admin/transactions", icon: FiRepeat, match: /^\/admin\/transactions$/ },
  { label: "AI 위험 거래", path: "/admin/risk", icon: FiAlertTriangle, match: /^\/admin\/risk$/ },
  { label: "정책 관리", path: "/admin/policy", icon: FiSliders, match: /^\/admin\/policy$/ },
  { label: "시스템 로그", path: "/admin/system-logs", icon: FiMonitor, match: /^\/admin\/system-logs$/ },
  { label: "설정", path: "/admin/settings", icon: FiSettings, match: /^\/admin\/settings$/ },
];

type AdminShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
};

const AdminShell = ({ title, description, children, actions }: AdminShellProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const userData = getUserData();
  const isPreviewMode = hasAdminPreview();

  const unreadCount = useMemo(() => 3, []);

  const handleLogout = () => {
    disableAdminPreview();
    clearUserData();
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    navigate("/login");
  };

  const handleUserView = () => {
    disableAdminPreview();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#eef4fb] text-slate-900">
      <div className="flex min-h-screen">
        <aside
          className={`hidden border-r border-slate-200 bg-[#0f172a] text-white transition-all duration-200 lg:flex lg:flex-col ${
            sidebarOpen ? "lg:w-[220px]" : "lg:w-[92px]"
          }`}
        >
          <div className="border-b border-white/10 px-4 py-5">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSidebarOpen((prev) => !prev)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400 text-slate-950 transition hover:bg-cyan-300"
              >
                <FiActivity size={18} />
              </button>
              {sidebarOpen && (
                <div>
                  <p className="text-lg font-black tracking-tight">EzPay</p>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
                    Admin Console
                  </p>
                </div>
              )}
            </div>
            {sidebarOpen && (
              <div className="mt-4 rounded-2xl bg-white/5 px-3 py-3">
                <p className="text-sm font-bold text-white">{userData?.name ?? "관리자"}</p>
                <p className="mt-1 text-xs font-medium text-slate-400">관리자 뷰</p>
              </div>
            )}
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {adminMenus.map((menu) => {
              const isActive = menu.match.test(location.pathname);
              const Icon = menu.icon;

              return (
                <button
                  key={menu.path}
                  type="button"
                  onClick={() => navigate(menu.path)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                    isActive
                      ? "bg-cyan-400/15 text-cyan-300"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={18} />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1">{menu.label}</span>
                      {isActive && <FiChevronRight size={14} />}
                    </>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-white/10 p-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/5 px-3 py-3 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <FiLogOut size={16} />
              {sidebarOpen && "로그아웃"}
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto flex w-full max-w-[1240px] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div>
                <h1 className="text-[22px] font-black tracking-tight text-slate-950">{title}</h1>
                <p className="mt-1 text-sm font-medium text-slate-400">
                  EzPay · {todayLabel}
                  {description ? ` · ${description}` : ""}
                </p>
                {isPreviewMode && (
                  <p className="mt-2 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                    관리자 프리뷰 모드
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden rounded-full bg-slate-100 p-1 sm:flex">
                  <button
                    type="button"
                    onClick={handleUserView}
                    className="rounded-full px-4 py-2 text-xs font-bold text-slate-500 transition hover:text-slate-900"
                  >
                    사용자 뷰
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-[#0f172a] px-4 py-2 text-xs font-bold text-cyan-300"
                  >
                    관리자 뷰
                  </button>
                </div>

                <button
                  type="button"
                  className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:border-slate-300 hover:bg-white hover:text-slate-900"
                >
                  <FiBell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {actions}
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-[1240px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminShell;
