import { useState, useEffect } from "react";
import {
  getAdminDashboardStats,
  getRecentActivities,
  getTodayHourlyTransactions,
  getWeeklyTransactionTrend
} from "../api/AdminAPI";
import toast from "react-hot-toast";
import { getRelativeTime, getActivityColor, formatActivityDescription } from "../utils/formatters";

// 대시보드 통계 데이터 훅
export const useAdminStats = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
export const useRealtimeActivities = () => {
  const [realtimeActivities, setRealtimeActivities] = useState([]);

  useEffect(() => {
    const fetchRecentActivities = async () => {
      try {
        const response = await getRecentActivities(10);

        if (response.status === "success" && response.data) {
          const formattedActivities = response.data.map(activity => ({
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
export const useHourlyTransactions = () => {
  const [hourlyTransactions, setHourlyTransactions] = useState([]);

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
export const useWeeklyTrend = () => {
  const [weeklyTrend, setWeeklyTrend] = useState([]);

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
