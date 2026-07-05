import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  Receipt,
  SendHorizontal,
  ShieldAlert,
} from "lucide-react";
import UserShell from "../components/UserShell";
import { Pagination } from "../components/ui";
import {
  getUnreadNotificationCount,
  getUserNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../api/UserAPI";
import { getToken, getUserData } from "../utils/storage";
import { getRelativeTime } from "../utils/formatters";
import type {
  UserNotificationCategory,
  UserNotificationItem,
  UserNotificationPage,
} from "../types";

const PAGE_SIZE = 10;

type TypeKey = "transfer" | "deposit" | "security";

const categoryToType: Record<UserNotificationCategory, TypeKey> = {
  TRANSFER: "transfer",
  DEPOSIT: "deposit",
  SECURITY: "security",
};

const typeConfig: Record<TypeKey, { bg: string; dot: string; icon: ReactNode }> = {
  transfer: {
    bg: "bg-emerald-500/15",
    dot: "bg-emerald-500",
    icon: <SendHorizontal size={15} className="text-emerald-500" />,
  },
  deposit: {
    bg: "bg-cyan-500/15",
    dot: "bg-cyan-400",
    icon: <Receipt size={15} className="text-cyan-500" />,
  },
  security: {
    bg: "bg-rose-500/15",
    dot: "bg-rose-500",
    icon: <ShieldAlert size={15} className="text-rose-500" />,
  },
};

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081";

const NotificationsPage = () => {
  const navigate = useNavigate();
  const user = useMemo(() => getUserData(), []);
  const userId = user?.userId;

  const [feed, setFeed] = useState<UserNotificationPage | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // SSE 콜백에서 최신 페이지 번호를 참조하기 위한 ref (stale closure 방지)
  const pageRef = useRef(0);

  const items = feed?.content ?? [];
  const page = feed?.page ?? 0;
  const totalPages = feed?.totalPages ?? 0;

  const fetchUnread = useCallback(() => {
    getUnreadNotificationCount()
      .then(setUnreadCount)
      .catch(() => {});
  }, []);

  const fetchPage = useCallback((p: number, showLoading = true) => {
    if (showLoading) setLoading(true);
    return getUserNotifications(p, PAGE_SIZE)
      .then((data) => {
        setFeed(data);
        pageRef.current = data.page;
        setError(false);
      })
      .catch((err) => {
        console.error("알림 조회 실패:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }, []);

  // 초기 로드
  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }
    fetchPage(0);
    fetchUnread();
  }, [navigate, userId, fetchPage, fetchUnread]);

  // 실시간 구독 (SSE) — 새 알림이 오면 미확인 수 갱신, 첫 페이지면 새로고침
  useEffect(() => {
    if (!userId) return;
    const token = getToken();
    if (!token) return;

    const source = new EventSource(
      `${apiBaseUrl}/user-notifications/stream?token=${encodeURIComponent(token)}`
    );

    source.onmessage = (event) => {
      try {
        const item: UserNotificationItem = JSON.parse(event.data);
        if (!item || typeof item.notificationId !== "number") return;
        fetchUnread();
        if (pageRef.current === 0) fetchPage(0, false);
      } catch {
        /* connect 핑 등 JSON이 아닌 메시지는 무시 */
      }
    };

    return () => source.close();
  }, [userId, fetchPage, fetchUnread]);

  const goToPage = (p: number) => {
    if (p < 0 || (totalPages > 0 && p >= totalPages) || p === page) return;
    fetchPage(p);
  };

  const markRead = useCallback((id: number) => {
    setFeed((prev) =>
      prev
        ? {
            ...prev,
            content: prev.content.map((n) =>
              n.notificationId === id ? { ...n, isRead: true } : n
            ),
          }
        : prev
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    markNotificationRead(id).catch((err) => {
      console.error("알림 읽음 처리 실패:", err);
      fetchUnread();
    });
  }, [fetchUnread]);

  const markAllRead = useCallback(() => {
    setFeed((prev) =>
      prev ? { ...prev, content: prev.content.map((n) => ({ ...n, isRead: true })) } : prev
    );
    setUnreadCount(0);
    markAllNotificationsRead()
      .then(() => fetchPage(pageRef.current, false))
      .catch((err) => {
        console.error("전체 읽음 처리 실패:", err);
        fetchUnread();
      });
  }, [fetchPage, fetchUnread]);

  return (
    <UserShell title="알림" showViewToggle unreadCount={unreadCount}>
      <div className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-black tracking-tight text-slate-900">알림</h2>
            {unreadCount > 0 && (
              <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-500">
                미확인 {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-semibold text-slate-400 transition hover:text-slate-700"
            >
              모두 읽음 처리
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-600" />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-dashed border-rose-200 bg-rose-50 px-6 py-12 text-center text-sm text-rose-400">
            알림을 불러오지 못했습니다.
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center text-sm text-slate-400">
            새로운 알림이 없습니다.
          </div>
        ) : (
          <>
            <ul className="divide-y divide-slate-100">
              {items.map((n) => {
                const config = typeConfig[categoryToType[n.category] ?? "security"];
                return (
                  <li key={n.notificationId}>
                    <button
                      type="button"
                      onClick={() => markRead(n.notificationId)}
                      className={`flex w-full items-center gap-3 px-1.5 py-2 text-left transition hover:bg-slate-50 ${
                        n.isRead ? "opacity-60" : ""
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${config.bg}`}
                      >
                        {config.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[13px] font-bold text-slate-900">
                            {n.title}
                          </span>
                          {!n.isRead && (
                            <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${config.dot}`} />
                          )}
                        </span>
                        <span className="mt-0.5 block truncate text-xs font-medium text-slate-500">
                          {n.message}
                        </span>
                      </span>
                      <span className="flex-shrink-0 text-[11px] font-medium text-slate-400">
                        {getRelativeTime(n.createdAt)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* 페이지네이션 — 10개씩, 번호 페이지네이션(1 2 3 4 5) */}
            <Pagination
              page={page + 1}
              pageCount={totalPages}
              onChange={(n) => goToPage(n - 1)}
              className="mt-3 border-t border-slate-100 pt-3"
            />
          </>
        )}
      </div>
    </UserShell>
  );
};

export default NotificationsPage;
