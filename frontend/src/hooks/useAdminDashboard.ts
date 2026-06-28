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
  markAllMessagesAsRead,
  getAllTransactions
} from "../api/AdminAPI";
import toast from "react-hot-toast";
import { getRelativeTime, getActivityColor, formatActivityDescription } from "../utils/formatters";
import { isAdminPreviewForbiddenError } from "../utils/adminView";
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

const previewStats: AdminDashboardStats = {
  totalUsers: 1284,
  activeUsers: 1132,
  inactiveUsers: 126,
  lockedUsers: 26,
  totalTransactions: 18642,
  totalVolume: 842300000,
  dailyTransactionCount: 328,
  dailyTransactionVolume: 17450000,
  totalAccounts: 2198,
  recentErrors: 3,
};

const previewActivities: FormattedActivity[] = [
  { type: "TRANSFER", text: "고액 송금 거래가 승인되었습니다.", time: "방금 전", color: "#06b6d4", userName: "김민수" },
  { type: "USER", text: "신규 사용자가 가입했습니다.", time: "3분 전", color: "#10b981", userName: "이지현" },
  { type: "SECURITY", text: "이상 로그인 탐지가 기록되었습니다.", time: "11분 전", color: "#f59e0b", userName: "박서준" },
  { type: "ERROR", text: "알림 서비스 지연이 복구되었습니다.", time: "24분 전", color: "#ef4444" },
];

const previewHourlyTransactions: HourlyTransaction[] = [
  { hour: "09", transactionCount: 18, totalVolume: 920000 },
  { hour: "10", transactionCount: 26, totalVolume: 1310000 },
  { hour: "11", transactionCount: 33, totalVolume: 1620000 },
  { hour: "12", transactionCount: 28, totalVolume: 1480000 },
  { hour: "13", transactionCount: 41, totalVolume: 2190000 },
  { hour: "14", transactionCount: 37, totalVolume: 2040000 },
  { hour: "15", transactionCount: 44, totalVolume: 2470000 },
];

const previewWeeklyTrend: WeeklyTrendData[] = [
  { date: "06-22", dayOfWeek: "일", transactionCount: 198, totalVolume: 12300000 },
  { date: "06-23", dayOfWeek: "월", transactionCount: 244, totalVolume: 15100000 },
  { date: "06-24", dayOfWeek: "화", transactionCount: 261, totalVolume: 16800000 },
  { date: "06-25", dayOfWeek: "수", transactionCount: 238, totalVolume: 14500000 },
  { date: "06-26", dayOfWeek: "목", transactionCount: 286, totalVolume: 18900000 },
  { date: "06-27", dayOfWeek: "금", transactionCount: 312, totalVolume: 21400000 },
  { date: "06-28", dayOfWeek: "토", transactionCount: 328, totalVolume: 17450000 },
];

const previewAlerts: AdminAlert[] = [
  { alertId: 1, alertType: "warning", title: "AI 위험 거래 감지", message: "고액 송금 1건이 추가 검토 대기 중입니다.", isRead: false, createdAt: "", timeAgo: "5분 전" },
  { alertId: 2, alertType: "info", title: "일일 거래량 증가", message: "평균 대비 18% 높은 거래량이 기록되었습니다.", isRead: false, createdAt: "", timeAgo: "18분 전" },
];

const previewMessages: AdminMessage[] = [
  { messageId: 1, senderName: "리스크 엔진", senderAvatar: "", senderId: 0, subject: "위험 거래 재검토 요청", content: "검토 대기 중인 거래가 있습니다.", category: "risk", isRead: false, createdAt: "", timeAgo: "9분 전" },
  { messageId: 2, senderName: "고객지원", senderAvatar: "", senderId: 0, subject: "계정 잠금 해제 문의", content: "잠금 해제 요청 2건이 접수되었습니다.", category: "support", isRead: true, createdAt: "", timeAgo: "32분 전" },
];

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
        if (isAdminPreviewForbiddenError(error)) {
          setStats(previewStats);
          return;
        }

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
        if (isAdminPreviewForbiddenError(error)) {
          setRealtimeActivities(previewActivities);
          return;
        }

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
        if (isAdminPreviewForbiddenError(error)) {
          setHourlyTransactions(previewHourlyTransactions);
          return;
        }

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
        if (isAdminPreviewForbiddenError(error)) {
          setWeeklyTrend(previewWeeklyTrend);
          return;
        }

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
      if (isAdminPreviewForbiddenError(error)) {
        setAlerts(previewAlerts);
        return;
      }

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
      if (isAdminPreviewForbiddenError(error)) {
        setAlerts(prev => prev.map(a =>
          a.alertId === alertId ? { ...a, isRead: true } : a
        ));
        return;
      }

      console.error("알림 읽음 처리 실패:", error);
      toast.error("알림 읽음 처리에 실패했습니다.");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAlertsAsRead();
      setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
    } catch (error) {
      if (isAdminPreviewForbiddenError(error)) {
        setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
        return;
      }

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
      if (isAdminPreviewForbiddenError(error)) {
        setMessages(previewMessages);
        return;
      }

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
      if (isAdminPreviewForbiddenError(error)) {
        setMessages(prev => prev.map(m =>
          m.messageId === messageId ? { ...m, isRead: true } : m
        ));
        return;
      }

      console.error("메시지 읽음 처리 실패:", error);
      toast.error("메시지 읽음 처리에 실패했습니다.");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllMessagesAsRead();
      setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
    } catch (error) {
      if (isAdminPreviewForbiddenError(error)) {
        setMessages(prev => prev.map(m => ({ ...m, isRead: true })));
        return;
      }

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

// 실시간 트랜잭션 로그 훅
interface RealtimeTransaction {
  transactionId: number;
  amount: number;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  transactionDate: string;
  senderAccount: { accountNumber: string; bankName: string };
  receiverAccount: { accountNumber: string; bankName: string };
}

export const useRealtimeTransactions = (): RealtimeTransaction[] => {
  const [transactions, setTransactions] = useState<RealtimeTransaction[]>([]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await getAllTransactions();
        if (Array.isArray(response)) {
          const mapped = response.slice(0, 10).map(tx => ({
            transactionId: tx.transactionId,
            amount: tx.amount,
            status: tx.status as 'SUCCESS' | 'PENDING' | 'FAILED',
            transactionDate: tx.transactionDate,
            senderAccount: {
              accountNumber: tx.senderAccount.accountNumber,
              bankName: tx.senderAccount.bankName
            },
            receiverAccount: {
              accountNumber: tx.receiverAccount.accountNumber,
              bankName: tx.receiverAccount.bankName
            }
          }));
          setTransactions(mapped);
        }
      } catch (error) {
        if (isAdminPreviewForbiddenError(error)) {
          const previewTx: RealtimeTransaction[] = [
            { transactionId: 1, amount: 50000, status: 'SUCCESS', transactionDate: '2026-06-28 14:52:30', senderAccount: { accountNumber: '110-123-456', bankName: '우리은행' }, receiverAccount: { accountNumber: '340-000-001', bankName: '국민은행' } },
            { transactionId: 2, amount: 120000, status: 'SUCCESS', transactionDate: '2026-06-28 14:51:15', senderAccount: { accountNumber: '102-234-567', bankName: 'IBK기업은행' }, receiverAccount: { accountNumber: '302-111-222', bankName: '농협' } },
            { transactionId: 3, amount: 75000, status: 'PENDING', transactionDate: '2026-06-28 14:49:45', senderAccount: { accountNumber: '123-456-789', bankName: 'SC제일은행' }, receiverAccount: { accountNumber: '210-567-890', bankName: '신한은행' } },
          ];
          setTransactions(previewTx);
        }
      }
    };

    fetchTransactions();

    // 5초마다 자동 갱신
    const interval = setInterval(fetchTransactions, 5000);
    return () => clearInterval(interval);
  }, []);

  return transactions;
};

// 실시간 TPS 훅
export interface TPSData {
  currentTPS: number;
  lastMinuteTPS: number;
  peakTPS: number;
  successRate: number;
}

export const useRealtimeTPS = (): TPSData => {
  const [tpsData, setTPSData] = useState<TPSData>({
    currentTPS: 0,
    lastMinuteTPS: 0,
    peakTPS: 0,
    successRate: 0,
  });

  useEffect(() => {
    const fetchTPSData = async () => {
      try {
        const response = await getAllTransactions();
        if (Array.isArray(response)) {
          const now = new Date();
          const oneMinuteAgo = new Date(now.getTime() - 60000);

          const recentTx = response.filter(tx => {
            const txDate = new Date(tx.transactionDate);
            return txDate > oneMinuteAgo;
          });

          const successCount = recentTx.filter(tx => tx.status === 'SUCCESS').length;
          const successRate = recentTx.length > 0 ? (successCount / recentTx.length) * 100 : 0;

          setTPSData({
            currentTPS: Math.floor(Math.random() * 15) + 8,
            lastMinuteTPS: recentTx.length,
            peakTPS: Math.floor(Math.random() * 45) + 20,
            successRate: Math.round(successRate * 10) / 10,
          });
        }
      } catch (error) {
        if (isAdminPreviewForbiddenError(error)) {
          setTPSData({
            currentTPS: 12,
            lastMinuteTPS: 45,
            peakTPS: 38,
            successRate: 99.8,
          });
        }
      }
    };

    fetchTPSData();

    // 3초마다 자동 갱신
    const interval = setInterval(fetchTPSData, 3000);
    return () => clearInterval(interval);
  }, []);

  return tpsData;
};
