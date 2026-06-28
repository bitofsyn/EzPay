import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Receipt,
  SendHorizontal,
  ShieldAlert,
} from "lucide-react";
import UserSidebar from "../components/UserSidebar";
import { navigateToAdminDashboard } from "../utils/adminView";

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

const typeConfig: Record<NotificationType, { bg: string; dot: string; icon: ReactNode }> = {
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


const todayLabel = new Date().toLocaleDateString("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

const NotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <div className="min-h-screen bg-[#eef3fb] p-3 text-slate-900 lg:p-4">
      <div className="mx-auto grid max-w-[1440px] gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        <UserSidebar unreadCount={unreadCount} />

        {/* Main content */}
        <main className="flex flex-col gap-5">
          {/* Header */}
          <header className="rounded-[28px] border border-white/70 bg-white/90 px-5 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h1 className="text-[2rem] font-black tracking-tight text-slate-950">알림</h1>
                <p className="mt-1 text-sm font-semibold text-slate-400">EzPay · {todayLabel}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 text-sm font-semibold">
                  <button
                    type="button"
                    className="rounded-full bg-slate-950 px-5 py-2 text-white shadow-sm"
                  >
                    사용자 뷰
                  </button>
                  <button
                    type="button"
                    className="rounded-full px-5 py-2 text-slate-600 transition hover:text-slate-900"
                    onClick={() => navigateToAdminDashboard(navigate)}
                  >
                    관리자 뷰
                  </button>
                </div>
                <button
                  type="button"
                  className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300"
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
          <div className="rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[1.4rem] font-black tracking-tight text-slate-950">알림</h2>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-sm font-semibold text-slate-500 transition hover:text-slate-700"
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
                    className={`flex w-full items-center gap-4 rounded-[20px] border px-5 py-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10 ${
                      notification.read
                        ? "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-slate-100"
                        : "border-cyan-100 bg-cyan-50/70 hover:border-cyan-200 hover:bg-cyan-50"
                    }`}
                  >
                    {/* Icon */}
                    <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full ${config.bg}`}>
                      {config.icon}
                    </div>

                    {/* Text */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-slate-950">{notification.title}</p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-600">{notification.message}</p>
                      <p className="mt-1 text-xs font-medium text-slate-400">{notification.time}</p>
                    </div>

                    {/* Unread indicator */}
                    {!notification.read && (
                      <span className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${config.dot}`} />
                    )}
                  </button>
                );
              })}

              {notifications.length === 0 && (
                <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-400">
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
