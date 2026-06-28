import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
  ShieldAlert,
  UserCircle2,
  Users,
} from "lucide-react";
import { clearUserData, getUserData } from "../utils/storage";

type NotificationType = "transfer" | "deposit" | "security";

interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 1,
    type: "transfer",
    title: "송금 완료",
    message: "김민수에게 50,000원",
    time: "3분 전",
    read: false,
  },
  {
    id: 2,
    type: "deposit",
    title: "입금 확인",
    message: "이지원으로부터 35,000원",
    time: "1시간 전",
    read: false,
  },
  {
    id: 3,
    type: "security",
    title: "보안 알림",
    message: "새 기기에서 로그인 감지",
    time: "2시간 전",
    read: false,
  },
];

const typeConfig: Record<NotificationType, { bg: string; dot: string; icon: React.ReactNode }> = {
  transfer: {
    bg: "bg-emerald-500/20",
    dot: "bg-emerald-500",
    icon: <SendHorizontal size={18} className="text-emerald-400" />,
  },
  deposit: {
    bg: "bg-cyan-500/20",
    dot: "bg-cyan-400",
    icon: <Receipt size={18} className="text-cyan-400" />,
  },
  security: {
    bg: "bg-rose-500/20",
    dot: "bg-rose-500",
    icon: <ShieldAlert size={18} className="text-rose-400" />,
  },
};

const navItems = [
  { label: "대시보드", icon: LayoutDashboard, path: "/dashboard" },
  { label: "내 계좌", icon: CreditCard, path: "/accounts" },
  { label: "송금하기", icon: SendHorizontal, path: "/send" },
  { label: "친구", icon: Users, path: "/friends" },
  { label: "거래 내역", icon: Receipt, path: "/transactions" },
  { label: "알림", icon: Bell, path: "/notifications" },
  { label: "설정", icon: Settings, path: "/settings" },
];

const todayLabel = new Date().toLocaleDateString("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const user = getUserData();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    clearUserData();
    navigate("/login");
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#1a2847] to-[#0f172a] p-3 text-white lg:p-4 relative overflow-hidden">
      {/* Background decorative circles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto grid max-w-[1440px] gap-5 lg:grid-cols-[250px_minmax(0,1fr)] relative z-10">
        {/* Sidebar */}
        <aside className="flex min-h-[calc(100vh-1.5rem)] flex-col rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl">
          {/* Logo */}
          <button
            type="button"
            onClick={() => navigate("/")}
            className="flex items-center gap-3 rounded-[22px] border border-cyan-500/30 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 px-4 py-3 backdrop-blur transition hover:bg-cyan-500/20"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/20">
              <Landmark size={20} />
            </div>
            <div>
              <p className="text-[1.7rem] leading-none font-black tracking-tight text-white">EzPay</p>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-400/70">Personal</p>
            </div>
          </button>

          {/* User card */}
          <div className="mt-4 rounded-[22px] border border-white/10 bg-white/5 p-4 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400">
                <UserCircle2 size={24} />
              </div>
              <div>
                <p className="text-[15px] font-bold text-white">{user?.name || "사용자"} 님</p>
                <p className="text-xs font-medium text-cyan-400/60">일반 사용자</p>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="mt-4 space-y-2">
            {navItems.map(({ label, icon: Icon, path }) => {
              const active = path === "/notifications";
              return (
                <button
                  key={path}
                  type="button"
                  onClick={() => navigate(path)}
                  className={`flex w-full items-center justify-between rounded-[18px] px-4 py-3 text-left transition ${
                    active
                      ? "bg-gradient-to-r from-cyan-500/30 to-blue-500/30 text-white border border-cyan-500/50 shadow-[0_18px_30px_rgba(34,211,238,0.15)]"
                      : "text-cyan-300/60 hover:bg-white/5 hover:text-cyan-300"
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
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
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
            className="mt-auto flex items-center justify-center gap-2 rounded-[18px] border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/20 hover:border-rose-500/50"
          >
            <LogOut size={16} />
            로그아웃
          </button>
        </aside>

        {/* Main content */}
        <main className="flex flex-col gap-5">
          {/* Header */}
          <header className="rounded-[28px] border border-white/10 bg-white/5 px-5 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h1 className="text-[2rem] font-black tracking-tight text-white">알림</h1>
                <p className="mt-1 text-sm font-semibold text-cyan-400/60">EzPay · {todayLabel}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-full border border-white/10 bg-white/5 p-1 text-sm font-semibold backdrop-blur">
                  <button
                    type="button"
                    className="rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-5 py-2 text-white shadow-lg shadow-cyan-500/20"
                  >
                    사용자 뷰
                  </button>
                  <button
                    type="button"
                    className="rounded-full px-5 py-2 text-cyan-300/60 transition hover:text-cyan-300"
                    onClick={() => navigate("/admin/dashboard")}
                  >
                    관리자 뷰
                  </button>
                </div>
                <button
                  type="button"
                  className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-400 transition hover:border-cyan-500/50 hover:bg-cyan-500/10"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white shadow-lg shadow-rose-500/30">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* Notification list */}
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[1.4rem] font-black tracking-tight text-white">알림</h2>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-sm font-semibold text-cyan-400/70 transition hover:text-cyan-300"
                >
                  모두 읽음 처리
                </button>
              )}
            </div>

            <div className="space-y-3">
              {notifications.map((notification) => {
                const config = typeConfig[notification.type];
                return (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => markRead(notification.id)}
                    className="flex w-full items-center gap-4 rounded-[20px] border border-white/10 bg-white/5 px-5 py-4 text-left transition hover:bg-white/10 hover:border-white/20 backdrop-blur"
                  >
                    {/* Icon */}
                    <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${config.bg}`}>
                      {config.icon}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-white">{notification.title}</p>
                      <p className="mt-0.5 text-sm font-semibold text-cyan-300/60">{notification.message}</p>
                      <p className="mt-1 text-xs font-medium text-cyan-300/40">{notification.time}</p>
                    </div>

                    {/* Unread indicator */}
                    {!notification.read && (
                      <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${config.dot}`} />
                    )}
                  </button>
                );
              })}

              {notifications.length === 0 && (
                <div className="rounded-[24px] border border-dashed border-white/10 px-6 py-12 text-center text-cyan-300/50">
                  새로운 알림이 없습니다.
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotificationsPage;
