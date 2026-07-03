import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  ChevronRight,
  CreditCard,
  Landmark,
  LayoutDashboard,
  LogOut,
  Menu,
  Receipt,
  SendHorizontal,
  Settings,
  UserCircle2,
  Users,
  X,
} from "lucide-react";
import { clearUserData, getUserData } from "../utils/storage";

const navItems = [
  { label: "대시보드", icon: LayoutDashboard, path: "/dashboard" },
  { label: "내 계좌", icon: CreditCard, path: "/accounts" },
  { label: "송금하기", icon: SendHorizontal, path: "/send" },
  { label: "친구", icon: Users, path: "/friends" },
  { label: "거래 내역", icon: Receipt, path: "/transactions" },
  { label: "알림", icon: Bell, path: "/notifications" },
  { label: "설정", icon: Settings, path: "/settings" },
];

interface UserSidebarProps {
  unreadCount?: number;
}

const UserSidebar: React.FC<UserSidebarProps> = ({ unreadCount = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUserData();
  const [mobileOpen, setMobileOpen] = useState(false);

  // 라우트가 바뀌면 모바일 드로어를 닫는다.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // 드로어가 열려 있는 동안 배경 스크롤을 막는다.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  const handleLogout = () => {
    clearUserData();
    navigate("/login");
  };

  // 메뉴 이동 시 모바일 드로어를 닫는다. (같은 경로 재선택으로 라우트가 바뀌지 않아도 닫히도록)
  const handleNavigate = (path: string) => {
    setMobileOpen(false);
    navigate(path);
  };

  const isActive = (path: string) => {
    if (path === "/settings") {
      return location.pathname === "/settings" || location.pathname.startsWith("/settings/");
    }
    if (path === "/notifications") {
      return location.pathname === "/notifications";
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  // 데스크톱 사이드바와 모바일 드로어가 공유하는 내부 콘텐츠
  const panelContent = (
    <>
      <button
        type="button"
        onClick={() => handleNavigate("/")}
        className="flex items-center gap-3 rounded-2xl px-2 py-2 transition hover:bg-slate-50"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-cyan-400 shadow-lg shadow-slate-950/15">
          <Landmark size={20} />
        </div>
        <div className="text-left">
          <p className="text-2xl font-black leading-none tracking-tight text-slate-950">EzPay</p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">
            Personal
          </p>
        </div>
      </button>

      <div className="mt-4 rounded-2xl bg-slate-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-500/15 text-cyan-600">
            <UserCircle2 size={24} />
          </div>
          <div>
            <p className="text-[15px] font-bold text-slate-900">{user?.name || "사용자"} 님</p>
            <p className="text-xs font-medium text-slate-400">일반 사용자</p>
          </div>
        </div>
      </div>

      <nav className="mt-4 flex-1 space-y-1.5">
        {navItems.map(({ label, icon: Icon, path }) => {
          const active = isActive(path);
          return (
            <button
              key={path}
              type="button"
              onClick={() => handleNavigate(path)}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-3 text-left transition ${
                active
                  ? "bg-slate-950 text-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="flex items-center gap-3 text-[14px] font-semibold">
                <Icon size={17} />
                {label}
              </span>
              {label === "알림" && unreadCount > 0 && !active ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white">
                  {unreadCount}
                </span>
              ) : active ? (
                <span className="h-2 w-2 rounded-full bg-white" />
              ) : (
                <ChevronRight size={15} className="text-slate-300" />
              )}
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-500 transition hover:bg-rose-100"
      >
        <LogOut size={16} />
        로그아웃
      </button>
    </>
  );

  return (
    <>
      {/* 모바일/태블릿 상단 바 (lg 미만) — 사이드바를 숨기고 콘텐츠가 화면을 꽉 채우도록 한다. */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
        <button type="button" onClick={() => navigate("/")} className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-cyan-400">
            <Landmark size={18} />
          </div>
          <p className="text-xl font-black tracking-tight text-slate-950">EzPay</p>
        </button>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="메뉴 열기"
          className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-slate-300 hover:bg-white"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* 데스크톱 사이드바 (lg 이상) — 전체 높이 · 화면에 밀착된 흰색 사이드바 */}
      <aside className="hidden min-h-screen flex-col border-r border-slate-200 bg-white p-4 lg:flex">
        {panelContent}
      </aside>

      {/* 모바일 드로어 오버레이 */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="메뉴 닫기"
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col overflow-y-auto border-r border-slate-200 bg-white p-4 shadow-2xl">
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="메뉴 닫기"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>
            {panelContent}
          </aside>
        </div>
      )}
    </>
  );
};

export default UserSidebar;
