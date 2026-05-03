import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiEdit2, FiRefreshCw, FiDollarSign } from "react-icons/fi";
import { getAllTransferLimits, updateUserTransferLimit, resetUserTransferLimit } from "../../api/AdminAPI";
import { AdminTransferLimitInfo, ApiResponse } from "../../types";
import { formatAmount } from "../../utils/formatters";
import toast from "react-hot-toast";

const AdminTransferLimits: React.FC = () => {
  const navigate = useNavigate();
  const [transferLimits, setTransferLimits] = useState<AdminTransferLimitInfo[]>([]);
  const [filteredLimits, setFilteredLimits] = useState<AdminTransferLimitInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // 수정 모달 상태
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editingLimit, setEditingLimit] = useState<AdminTransferLimitInfo | null>(null);
  const [editDailyLimit, setEditDailyLimit] = useState<string>("");
  const [editPerTransactionLimit, setEditPerTransactionLimit] = useState<string>("");

  useEffect(() => {
    fetchAllTransferLimits();
  }, []);

  useEffect(() => {
    filterLimits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, transferLimits]);

  const fetchAllTransferLimits = async (): Promise<void> => {
    try {
      const limitsData = await getAllTransferLimits();
      setTransferLimits(limitsData);
      setFilteredLimits(limitsData);
    } catch (error: unknown) {
      console.error("송금 한도 조회 실패:", error);
      const err = error as any;
      toast.error(err.response?.data?.message || "송금 한도를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const filterLimits = (): void => {
    let filtered = transferLimits;

    if (searchTerm) {
      filtered = filtered.filter(
        (limit) =>
          limit.userId.toString().includes(searchTerm) ||
          (limit.userName && limit.userName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredLimits(filtered);
  };

  const handleOpenEditModal = (limit: AdminTransferLimitInfo): void => {
    setEditingLimit(limit);
    setEditDailyLimit(limit.dailyLimit.toString());
    setEditPerTransactionLimit(limit.perTransactionLimit.toString());
    setEditModalOpen(true);
  };

  const handleCloseEditModal = (): void => {
    setEditModalOpen(false);
    setEditingLimit(null);
    setEditDailyLimit("");
    setEditPerTransactionLimit("");
  };

  const handleUpdateLimit = async (): Promise<void> => {
    if (!editingLimit) return;

    const dailyLimitNum = parseFloat(editDailyLimit);
    const perTxLimitNum = parseFloat(editPerTransactionLimit);

    if (isNaN(dailyLimitNum) || isNaN(perTxLimitNum)) {
      toast.error("올바른 금액을 입력해주세요.");
      return;
    }

    if (dailyLimitNum < perTxLimitNum) {
      toast.error("일일 한도는 건당 한도보다 작을 수 없습니다.");
      return;
    }

    try {
      const response: ApiResponse<any> = await updateUserTransferLimit(editingLimit.userId, {
        dailyLimit: dailyLimitNum,
        perTransactionLimit: perTxLimitNum,
      });

      if (response.status === "success") {
        toast.success(response.message || "송금 한도가 수정되었습니다.");
        handleCloseEditModal();
        fetchAllTransferLimits();
      } else {
        throw new Error(response.message || "수정 실패");
      }
    } catch (error: unknown) {
      console.error("송금 한도 수정 실패:", error);
      const err = error as any;
      toast.error(err.response?.data?.message || "송금 한도 수정에 실패했습니다.");
    }
  };

  const handleResetLimit = async (userId: number, userName?: string): Promise<void> => {
    const displayName = userName || `사용자 ${userId}`;
    if (!window.confirm(`${displayName}의 송금 한도를 기본값으로 초기화하시겠습니까?`)) {
      return;
    }

    try {
      const response: ApiResponse<any> = await resetUserTransferLimit(userId);
      if (response.status === "success") {
        toast.success(response.message || "송금 한도가 초기화되었습니다.");
        fetchAllTransferLimits();
      } else {
        throw new Error(response.message || "초기화 실패");
      }
    } catch (error: unknown) {
      console.error("송금 한도 초기화 실패:", error);
      const err = error as any;
      toast.error(err.response?.data?.message || "송금 한도 초기화에 실패했습니다.");
    }
  };

  const getUsagePercentage = (used: number, total: number): number => {
    if (total === 0) return 0;
    return Math.min((used / total) * 100, 100);
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">송금 한도 관리</h1>
              <p className="text-sm text-gray-500 mt-1">사용자별 송금 한도 조회 및 수정</p>
            </div>
            <button
              onClick={() => navigate("/admin/dashboard")}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              대시보드로
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 검색 */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="사용자 ID 또는 이름으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-600">
            총 {filteredLimits.length}명의 사용자
          </div>
        </div>

        {/* 송금 한도 목록 */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이름
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    일일 한도
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    건당 한도
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    오늘 사용량
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    남은 한도
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLimits.length > 0 ? (
                  filteredLimits.map((limit) => {
                    const usagePercentage = getUsagePercentage(limit.usedAmount, limit.dailyLimit);
                    return (
                      <tr key={limit.limitId} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {limit.userId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {limit.userName || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {formatAmount(limit.dailyLimit)}원
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                          {formatAmount(limit.perTransactionLimit)}원
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 max-w-32">
                              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${getUsageColor(usagePercentage)} transition-all`}
                                  style={{ width: `${usagePercentage}%` }}
                                />
                              </div>
                            </div>
                            <span className="text-sm text-gray-600">
                              {formatAmount(limit.usedAmount)}원
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                          <span className={`font-semibold ${limit.remainingAmount > 0 ? "text-green-600" : "text-red-600"}`}>
                            {formatAmount(limit.remainingAmount)}원
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleOpenEditModal(limit)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="수정"
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleResetLimit(limit.userId, limit.userName)}
                              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title="초기화"
                            >
                              <FiRefreshCw size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      조회된 송금 한도 정보가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 수정 모달 */}
      {editModalOpen && editingLimit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FiDollarSign className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">송금 한도 수정</h3>
                <p className="text-sm text-gray-500">
                  {editingLimit.userName || `사용자 ${editingLimit.userId}`}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  일일 한도 (원)
                </label>
                <input
                  type="number"
                  value={editDailyLimit}
                  onChange={(e) => setEditDailyLimit(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="일일 송금 한도"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  건당 한도 (원)
                </label>
                <input
                  type="number"
                  value={editPerTransactionLimit}
                  onChange={(e) => setEditPerTransactionLimit(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="건당 송금 한도"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleCloseEditModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleUpdateLimit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransferLimits;
