import { useState, useEffect } from "react";
import {
  getAdminDashboardStats,
  getRecentActivities,
  getTodayHourlyTransactions,
  getWeeklyTransactionTrend,
  getAdminAlerts,
  getAdminMessages,
  markAlertAsRead,
  markAllAlertsAsRead,
  markMessageAsRead,
  markAllMessagesAsRead
} from "../api/AdminAPI";
import toast from "react-hot-toast";
import { getRelativeTime, getActivityColor, formatActivityDescription } from "../utils/formatters";
import {
  AdminDashboardStats,
  Activity,
  FormattedActivity,
  HourlyTransaction,
  WeeklyTrendData
} from "../types";

interface UseAdminStatsReturn {
  stats: AdminDashboardStats | null;
  isLoading: boolean;
}

// 대시보드 통계 데이터 훅
export const useAdminStats = (): UseAdminStatsReturn => {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await getAdminDashboardStats();

        if (response.status === "success" && response.data) {
          setStats(response.data);
        } else {
          throw new Error(response.message || "데이터 조회 실패");
        }
      } catch (error) {
        console.error("대시보드 통계 조회 실패:", error);
        toast.error("대시보드 데이터를 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();

    // 30초마다 자동 갱신
    const interval = setInterval(() => {
      fetchDashboardStats();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return { stats, isLoading };
};

// 실시간 활동 로그 훅
export const useRealtimeActivities = (): FormattedActivity[] => {
  const [realtimeActivities, setRealtimeActivities] = useState<FormattedActivity[]>([]);

  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        const response = await getRecentActivities(10);

        if (response.status === "success" && response.data) {
          const formattedActivities = response.data.map((activity: Activity) => ({
            type: activity.type,
            text: formatActivityDescription(activity.description),
            time: getRelativeTime(activity.timestamp),
            color: getActivityColor(activity.type, activity.status),
            userName: activity.userName
          }));

          setRealtimeActivities(formattedActivities);
        }
      } catch (error) {
        console.error("활동 로그 조회 실패:", error);
      }
    };

    fetchRecentActivities();

    // 10초마다 자동 갱신
    const interval = setInterval(() => {
      fetchRecentActivities();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return realtimeActivities;
};

// 시간대별 거래량 훅
export const useHourlyTransactions = (): HourlyTransaction[] => {
  const [hourlyTransactions, setHourlyTransactions] = useState<HourlyTransaction[]>([]);

  useEffect(() => {
    const fetchHourlyTransactions = async () => {
      try {
        const response = await getTodayHourlyTransactions();

        if (response.status === "success" && response.data) {
          setHourlyTransactions(response.data);
        }
      } catch (error) {
        console.error("시간대별 거래량 조회 실패:", error);
      }
    };

    fetchHourlyTransactions();

    // 30초마다 자동 갱신
    const interval = setInterval(() => {
      fetchHourlyTransactions();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return hourlyTransactions;
};

// 주간 거래 추이 훅
export const useWeeklyTrend = (): WeeklyTrendData[] => {
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrendData[]>([]);

  useEffect(() => {
    const fetchWeeklyTrend = async () => {
      try {
        const response = await getWeeklyTransactionTrend();

        if (response.status === "success" && response.data) {
          setWeeklyTrend(response.data);
        }
      } catch (error) {
        console.error("주간 거래 추이 조회 실패:", error);
      }
    };

    fetchWeeklyTrend();

    // 30초마다 자동 갱신
    const interval = setInterval(() => {
      fetchWeeklyTrend();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return weeklyTrend;
};

// 관리자 알림 타입
export interface AdminAlert {
  alertId: number;
  alertType: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  timeAgo: string;
}

// 관리자 메시지 타입
export interface AdminMessage {
  messageId: number;
  senderName: string;
  senderAvatar: string;
  senderId: number;
  subject: string;
  content: string;
  category: string;
  isRead: boolean;
  createdAt: string;
  timeAgo: string;
}

// 관리자 알림 훅 반환 타입
interface UseAdminAlertsReturn {
  alerts: AdminAlert[];
  unreadCount: number;
  isLoading: boolean;
  handleMarkAsRead: (alertId: number) => Promise<void>;
  handleMarkAllAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
}

// 관리자 알림 훅
export const useAdminAlerts = (): UseAdminAlertsReturn => {
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAlerts = async () => {
    try {
      const response = await getAdminAlerts();
      if (response.status === "success" && response.data) {
        setAlerts(response.data);
      }
    } catch (error) {
      console.error("알림 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    // 30초마다 자동 갱신
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = alerts.filter(a => !a.isRead).length;

  const handleMarkAsRead = async (alertId: number) => {
    try {
      await markAlertAsRead(alertId);
      setAlerts(prev => prev.map(a =>
        a.alertId === alertId ? { ...a, isRead: true } : a
      ));
    } catch (error) {
      console.error("알림 읽음 처리 실패:", error);
      toast.error("알림 읽음 처리에 실패했습니다.");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAlertsAsRead();
      setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
    } catch (error) {
      console.error("모든 알림 읽음 처리 실패:", error);
      toast.error("알림 읽음 처리에 실패했습니다.");
    }
  };

  return {
    alerts,
    unreadCount,
    isLoading,
    handleMarkAsRead,
    handleMarkAllAsRead,
    refetch: fetchAlerts
  };
};

// 관리자 메시지 훅 반환 타입
interface UseAdminMessagesReturn {
  messages: AdminMessage[];
  unreadCount: number;
  isLoading: boolean;
  handleMarkAsRead: (messageId: number) => Promise<void>;
  handleMarkAllAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
}

// 관리자 메시지 훅
export const useAdminMessages = (): UseAdminMessagesReturn => {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchMessages = async () => {
    try {
      const response = await getAdminMessages();
      if (response.status === "success" && response.data) {
        setMessages(response.data);
      }
    } catch (error) {
      console.error("메시지 조회 실패:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // 30초마다 자동 갱신
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = messages.filter(m => !m.isRead).length;

  const handleMarkAsRead = async (messageId: number) => {
    try {
      await markMessageAsRead(messageId);
      setMessages(prev => prev.map(m =>
        m.messageId === messageId ? { ...m, isRead: true } : m
      ));
    } catch (error) {
      console.error("메시지 읽음 처리 실패:", error);
      toast.error("메시지 읽음 처리에 실패했습니다.");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllMessagesAsRead();
      setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
    } catch (error) {
      console.error("모든 메시지 읽음 처리 실패:", error);
      toast.error("메시지 읽음 처리에 실패했습니다.");
    }
  };

  return {
    messages,
    unreadCount,
    isLoading,
    handleMarkAsRead,
    handleMarkAllAsRead,
    refetch: fetchMessages
  };
};
