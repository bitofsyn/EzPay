import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiUsers, FiActivity, FiAlertCircle, FiCreditCard, FiMenu, FiSearch, FiBell, FiSettings, FiMail, FiTrendingUp } from "react-icons/fi";
import CircularProgress from "../../components/admin/CircularProgress";
import TransactionTrendChart from "../../components/admin/TransactionTrendChart";
import UserStatusChart from "../../components/admin/UserStatusChart";
import HourlyTransactionChart from "../../components/admin/HourlyTransactionChart";
import { formatAmount } from "../../utils/formatters";
import { useAdminStats, useRealtimeActivities, useHourlyTransactions, useWeeklyTrend } from "../../hooks/useAdminDashboard";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

// ChartJS 등록
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 커스텀 훅으로 데이터 관리
  const { stats, isLoading } = useAdminStats();
  const realtimeActivities = useRealtimeActivities();
  const hourlyTransactions = useHourlyTransactions();
  const weeklyTrend = useWeeklyTrend();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-cyan-400 mx-auto"
               style={{ filter: 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.5))' }}></div>
          <p className="mt-4 text-cyan-300 text-lg font-semibold">로딩 중...</p>
        </div>
      </div>
    );
  }

  const totalUsers = stats?.totalUsers || 0;
  const activeUsers = stats?.activeUsers || 0;
  const inactiveUsers = stats?.inactiveUsers || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-purple-800 flex">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-black/40 backdrop-blur-sm border-r border-purple-500/30 transition-all duration-300`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-white hover:text-cyan-400 transition-colors">
              <FiMenu size={24} />
            </button>
            {isSidebarOpen && (
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Dashboard
              </h1>
            )}
          </div>

          <nav className="space-y-2">
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400 transition-all hover:from-cyan-500/30 hover:to-blue-500/30"
              style={{ boxShadow: '0 0 20px rgba(34, 211, 238, 0.2)' }}
            >
              <FiActivity size={20} />
              {isSidebarOpen && <span className="font-medium">대시보드</span>}
            </button>
            <button
              onClick={() => navigate("/admin/users")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <FiUsers size={20} />
              {isSidebarOpen && <span className="font-medium">사용자 관리</span>}
            </button>
            <button
              onClick={() => navigate("/admin/error-logs")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <FiAlertCircle size={20} />
              {isSidebarOpen && <span className="font-medium">에러 로그</span>}
            </button>
            <button
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <FiSettings size={20} />
              {isSidebarOpen && <span className="font-medium">설정</span>}
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Top Header */}
        <div className="bg-black/20 backdrop-blur-sm border-b border-purple-500/30 px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="SEARCH"
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-purple-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20"
                />
              </div>
            </div>
            <div className="flex items-center gap-4 ml-8">
              <button className="relative p-2 text-white hover:text-cyan-400 transition-colors">
                <FiBell size={22} />
                <span className="absolute top-0 right-0 w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
              </button>
              <button className="p-2 text-white hover:text-cyan-400 transition-colors">
                <FiSettings size={22} />
              </button>
              <button className="p-2 text-white hover:text-cyan-400 transition-colors">
                <FiMail size={22} />
              </button>
              <div className="ml-2 w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center justify-center">
                <span className="text-white font-bold">A</span>
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <p className="text-gray-400 text-sm">
              <span className="text-cyan-400">DASHBOARD</span> / <span>HOME</span>
            </p>
          </div>

          {/* 원형 프로그레스 통계 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 hover:border-cyan-500/50 transition-all"
                 style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}>
              <CircularProgress
                value={totalUsers}
                max={10000}
                label="전체 사용자"
                gradient={['#06b6d4', '#3b82f6']}
              />
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Total Users</p>
                <p className="text-gray-300 text-sm">시스템에 등록된 모든 사용자</p>
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 hover:border-pink-500/50 transition-all"
                 style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}>
              <CircularProgress
                value={activeUsers}
                max={10000}
                label="활성 사용자"
                gradient={['#ec4899', '#f43f5e']}
              />
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Active Users</p>
                <p className="text-gray-300 text-sm">현재 활성 상태의 사용자</p>
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-8 hover:border-green-500/50 transition-all"
                 style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}>
              <CircularProgress
                value={stats?.totalTransactions || 0}
                max={100000}
                label="전체 거래"
                gradient={['#10b981', '#06b6d4']}
              />
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Transactions</p>
                <p className="text-gray-300 text-sm">총 거래 건수</p>
              </div>
            </div>
          </div>

          {/* 상세 통계 카드 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* 사용자 통계 */}
            <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6"
                 style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}>
              <h3 className="text-cyan-400 text-lg font-bold mb-6 flex items-center gap-2">
                <FiUsers className="text-cyan-400" />
                사용자 현황
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500/10 to-transparent rounded-lg border-l-4 border-green-500">
                  <span className="text-gray-300">활성 사용자</span>
                  <span className="text-2xl font-bold text-green-400">{activeUsers?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-500/10 to-transparent rounded-lg border-l-4 border-orange-500">
                  <span className="text-gray-300">비활성 사용자</span>
                  <span className="text-2xl font-bold text-orange-400">{inactiveUsers?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-500/10 to-transparent rounded-lg border-l-4 border-red-500">
                  <span className="text-gray-300">잠금 사용자</span>
                  <span className="text-2xl font-bold text-red-400">{stats?.lockedUsers?.toLocaleString() || 0}</span>
                </div>
              </div>
            </div>

            {/* 거래 통계 */}
            <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6"
                 style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}>
              <h3 className="text-pink-400 text-lg font-bold mb-6 flex items-center gap-2">
                <FiActivity className="text-pink-400" />
                거래 통계
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-500/10 to-transparent rounded-lg border-l-4 border-cyan-500">
                  <span className="text-gray-300">오늘 거래 수</span>
                  <span className="text-2xl font-bold text-cyan-400">{stats?.todayTransactions?.toLocaleString() || 0}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-transparent rounded-lg border-l-4 border-blue-500">
                  <span className="text-gray-300">오늘 거래 총액</span>
                  <span className="text-xl font-bold text-blue-400">{formatAmount(stats?.todayTransactionVolume)}원</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-transparent rounded-lg border-l-4 border-purple-500">
                  <span className="text-gray-300">전체 거래 총액</span>
                  <span className="text-xl font-bold text-purple-400">{formatAmount(stats?.totalTransactionVolume)}원</span>
                </div>
              </div>
            </div>
          </div>

          {/* 하단 정보 카드 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 계좌 정보 */}
            <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6 hover:border-cyan-500/50 transition-all"
                 style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg">
                  <FiCreditCard className="text-purple-400 text-2xl" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">전체 계좌</p>
                  <p className="text-3xl font-bold text-white">{stats?.totalAccounts?.toLocaleString() || 0}</p>
                </div>
              </div>
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                     style={{ width: '64%', boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)' }}></div>
              </div>
            </div>

            {/* 에러 로그 */}
            <div
              className="bg-black/30 backdrop-blur-sm border border-red-500/30 rounded-2xl p-6 cursor-pointer hover:border-red-500/50 transition-all"
              style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}
              onClick={() => navigate("/admin/error-logs")}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg">
                  <FiAlertCircle className="text-red-400 text-2xl" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">미해결 에러</p>
                  <p className="text-3xl font-bold text-white">{stats?.recentErrors?.toLocaleString() || 0}</p>
                </div>
              </div>
              <div className="flex items-center text-red-400 text-sm">
                <span>에러 확인하기 →</span>
              </div>
            </div>

            {/* 시스템 상태 */}
            <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6"
                 style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-gradient-to-br from-green-500/20 to-cyan-500/20 rounded-lg">
                  <FiActivity className="text-green-400 text-2xl" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">시스템 상태</p>
                  <p className="text-xl font-bold text-green-400">정상 운영</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-gray-400 text-sm">All systems operational</span>
              </div>
            </div>
          </div>

          {/* 그래프 섹션 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            {/* 거래 추이 그래프 */}
            <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6"
                 style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-cyan-400 text-lg font-bold flex items-center gap-2">
                  <FiTrendingUp className="text-cyan-400" />
                  주간 거래 추이
                </h3>
                <span className="text-xs text-gray-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
                  최근 7일
                </span>
              </div>
              <div className="h-64">
                <TransactionTrendChart weeklyTrend={weeklyTrend} />
              </div>
            </div>

            {/* 사용자 상태 분포 */}
            <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6"
                 style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-pink-400 text-lg font-bold flex items-center gap-2">
                  <FiUsers className="text-pink-400" />
                  사용자 상태 분포
                </h3>
                <span className="text-xs text-gray-400 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/30">
                  실시간
                </span>
              </div>
              <div className="h-64">
                <UserStatusChart
                  activeUsers={activeUsers}
                  inactiveUsers={inactiveUsers}
                  lockedUsers={stats?.lockedUsers || 0}
                />
              </div>
            </div>
          </div>

          {/* 시간대별 거래량 & 실시간 활동 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* 시간대별 거래량 */}
            <div className="lg:col-span-2 bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6"
                 style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-purple-400 text-lg font-bold flex items-center gap-2">
                  <FiActivity className="text-purple-400" />
                  시간대별 거래량
                </h3>
                <span className="text-xs text-gray-400 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/30">
                  오늘
                </span>
              </div>
              <div className="h-64">
                <HourlyTransactionChart hourlyTransactions={hourlyTransactions} />
              </div>
            </div>

            {/* 실시간 활동 로그 */}
            <div className="bg-black/30 backdrop-blur-sm border border-purple-500/30 rounded-2xl p-6"
                 style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-green-400 text-lg font-bold">실시간 활동</h3>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-400">LIVE</span>
                </div>
              </div>
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2" style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(99, 102, 241, 0.5) transparent'
              }}>
                {realtimeActivities.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-purple-500/20 hover:border-cyan-500/30 transition-all animate-fadeIn"
                  >
                    <div className={`mt-1 w-2 h-2 rounded-full ${
                      activity.color === 'cyan' ? 'bg-cyan-400' :
                      activity.color === 'green' ? 'bg-green-400' :
                      activity.color === 'red' ? 'bg-red-400' :
                      activity.color === 'blue' ? 'bg-blue-400' :
                      'bg-yellow-400'
                    } animate-pulse`}></div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-200">{activity.text}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
