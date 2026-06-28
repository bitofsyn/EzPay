import { useNavigate, useLocation } from "react-router-dom";
import {
  Bell,
  ChevronRight,
  CreditCard,
  Landmark,
  LayoutDashboard,
  LogOut,
  Receipt,
  SendHorizontal,
  Settings,
  UserCircle2,
  Users,
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

  const handleLogout = () => {
    clearUserData();
    navigate("/login");
  };

  const isActive = (path: string) => {
    if (path === "/settings") {
      return location.pathname === "/settings";
    }
    if (path === "/notifications") {
      return location.pathname === "/notifications";
    }
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  return (
    <aside className="flex min-h-[calc(100vh-1.5rem)] flex-col rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
      <button
        type="button"
        onClick={() => navigate("/")}
        className="flex items-center gap-3 rounded-[22px] border border-slate-100 bg-slate-50 px-4 py-3 transition hover:bg-slate-100"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-cyan-400 shadow-lg shadow-slate-950/15">
          <Landmark size={20} />
        </div>
        <div>
          <p className="text-[1.7rem] leading-none font-black tracking-tight text-slate-950">EzPay</p>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Personal</p>
        </div>
      </button>

      <div className="mt-4 rounded-[22px] bg-slate-50 p-4">
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

      <nav className="mt-4 space-y-1.5">
        {navItems.map(({ label, icon: Icon, path }) => {
          const active = isActive(path);
          return (
            <button
              key={path}
              type="button"
              onClick={() => navigate(path)}
              className={`flex w-full items-center justify-between rounded-[18px] px-4 py-3 text-left transition ${
                active
                  ? "bg-slate-950 text-white shadow-[0_18px_30px_rgba(15,23,42,0.18)]"
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
                <ChevronRight size={15} />
              )}
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        className="mt-auto flex items-center justify-center gap-2 rounded-[18px] bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-500 transition hover:bg-rose-100"
      >
        <LogOut size={16} />
        로그아웃
      </button>
    </aside>
  );
};

export default UserSidebar;
