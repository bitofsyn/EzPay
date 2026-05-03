import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiTrash2, FiFilter, FiCalendar, FiArrowRight } from "react-icons/fi";
import { getAllTransactions, deleteTransaction } from "../../api/AdminAPI";
import { Transaction, ApiResponse } from "../../types";
import { formatAmount } from "../../utils/formatters";
import toast from "react-hot-toast";

const AdminTransactions: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dateFilter, setDateFilter] = useState<string>("");

  useEffect(() => {
    fetchAllTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, dateFilter, transactions]);

  const fetchAllTransactions = async (): Promise<void> => {
    try {
      const transactionsData = await getAllTransactions();
      setTransactions(transactionsData);
      setFilteredTransactions(transactionsData);
    } catch (error: unknown) {
      console.error("거래 내역 조회 실패:", error);
      const err = error as any;
      toast.error(err.response?.data?.message || "거래 내역을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const filterTransactions = (): void => {
    let filtered = transactions;

    // 검색어 필터링 (계좌번호, 설명)
    if (searchTerm) {
      filtered = filtered.filter(
        (tx) =>
          tx.senderAccount?.accountNumber?.includes(searchTerm) ||
          tx.receiverAccount?.accountNumber?.includes(searchTerm) ||
          tx.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.memo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터링
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((tx) => tx.status === statusFilter);
    }

    // 날짜 필터링
    if (dateFilter) {
      filtered = filtered.filter((tx) => {
        const txDate = new Date(tx.transactionDate).toISOString().split("T")[0];
        return txDate === dateFilter;
      });
    }

    setFilteredTransactions(filtered);
  };

  const handleDeleteTransaction = async (transactionId: number): Promise<void> => {
    if (!window.confirm(`거래 ID ${transactionId}를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const response: ApiResponse<any> = await deleteTransaction(transactionId);
      if (response.status === "success") {
        toast.success(response.message || "거래가 삭제되었습니다.");
        fetchAllTransactions();
      } else {
        throw new Error(response.message || "삭제 실패");
      }
    } catch (error: unknown) {
      console.error("거래 삭제 실패:", error);
      const err = error as any;
      toast.error(err.response?.data?.message || "거래 삭제에 실패했습니다.");
    }
  };

  const getStatusBadgeStyle = (status: string): string => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case "SUCCESS":
        return "성공";
      case "PENDING":
        return "대기중";
      case "FAILED":
        return "실패";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // 통계 계산
  const totalAmount = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
  const successCount = filteredTransactions.filter((tx) => tx.status === "SUCCESS").length;
  const pendingCount = filteredTransactions.filter((tx) => tx.status === "PENDING").length;
  const failedCount = filteredTransactions.filter((tx) => tx.status === "FAILED").length;

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
              <h1 className="text-2xl font-bold text-gray-900">거래 관리</h1>
              <p className="text-sm text-gray-500 mt-1">전체 거래 내역 조회 및 관리</p>
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
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">총 거래 수</p>
            <p className="text-2xl font-bold text-gray-900">{filteredTransactions.length.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">총 거래 금액</p>
            <p className="text-2xl font-bold text-blue-600">{formatAmount(totalAmount)}원</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">성공 / 대기 / 실패</p>
            <p className="text-lg font-bold">
              <span className="text-green-600">{successCount}</span>
              {" / "}
              <span className="text-yellow-600">{pendingCount}</span>
              {" / "}
              <span className="text-red-600">{failedCount}</span>
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <p className="text-sm text-gray-500">성공률</p>
            <p className="text-2xl font-bold text-green-600">
              {filteredTransactions.length > 0
                ? ((successCount / filteredTransactions.length) * 100).toFixed(1)
                : 0}
              %
            </p>
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="계좌번호, 설명, 메모로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 상태 필터 */}
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">전체 상태</option>
                <option value="SUCCESS">성공</option>
                <option value="PENDING">대기중</option>
                <option value="FAILED">실패</option>
              </select>
            </div>

            {/* 날짜 필터 */}
            <div className="flex items-center gap-2">
              <FiCalendar className="text-gray-400" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {dateFilter && (
                <button
                  onClick={() => setDateFilter("")}
                  className="px-2 py-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  초기화
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 거래 목록 테이블 */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    거래 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    보낸 계좌
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">

                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    받는 계좌
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    일시
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    설명
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <tr key={tx.transactionId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        #{tx.transactionId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{tx.senderAccount?.accountNumber || "-"}</div>
                        <div className="text-xs text-gray-500">{tx.senderAccount?.bankName || ""}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <FiArrowRight className="inline text-gray-400" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{tx.receiverAccount?.accountNumber || "-"}</div>
                        <div className="text-xs text-gray-500">{tx.receiverAccount?.bankName || ""}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className="text-sm font-semibold text-blue-600">
                          {formatAmount(tx.amount)}원
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeStyle(
                            tx.status
                          )}`}
                        >
                          {getStatusText(tx.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(tx.transactionDate)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                        {tx.description || tx.memo || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleDeleteTransaction(tx.transactionId)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="삭제"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
                      조회된 거래 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTransactions;
