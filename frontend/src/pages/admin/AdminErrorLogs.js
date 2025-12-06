import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiAlertCircle, FiCheckCircle, FiTrash2, FiFilter, FiRefreshCw } from "react-icons/fi";
import { getAllErrorLogs, getErrorLogsByStatus, resolveErrorLog, deleteErrorLog } from "../../api/AdminAPI";
import toast from "react-hot-toast";

const AdminErrorLogs = () => {
  const navigate = useNavigate();
  const [errorLogs, setErrorLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchErrorLogs();
  }, [statusFilter]);

  const fetchErrorLogs = async () => {
    setIsLoading(true);
    try {
      let res;
      if (statusFilter === "ALL") {
        res = await getAllErrorLogs();
      } else {
        res = await getErrorLogsByStatus(statusFilter);
      }
      setErrorLogs(res.data);
    } catch (error) {
      console.error("에러 로그 조회 실패:", error);
      toast.error("에러 로그를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolve = async (logId) => {
    if (!window.confirm("이 에러 로그를 해결 완료로 표시하시겠습니까?")) {
      return;
    }

    try {
      await resolveErrorLog(logId);
      toast.success("에러 로그가 해결 완료 처리되었습니다.");
      fetchErrorLogs();
    } catch (error) {
      console.error("에러 로그 해결 처리 실패:", error);
      toast.error("에러 로그 해결 처리에 실패했습니다.");
    }
  };

  const handleDelete = async (logId) => {
    if (!window.confirm("정말 이 에러 로그를 삭제하시겠습니까?")) {
      return;
    }

    try {
      await deleteErrorLog(logId);
      toast.success("에러 로그가 삭제되었습니다.");
      fetchErrorLogs();
    } catch (error) {
      console.error("에러 로그 삭제 실패:", error);
      toast.error("에러 로그 삭제에 실패했습니다.");
    }
  };

  const getStatusBadge = (status) => {
    if (status === "RESOLVED") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          <FiCheckCircle size={14} />
          해결됨
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
        <FiAlertCircle size={14} />
        미해결
      </span>
    );
  };

  const unresolvedCount = errorLogs.filter((log) => log.status === "UNRESOLVED").length;
  const resolvedCount = errorLogs.filter((log) => log.status === "RESOLVED").length;

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
              <h1 className="text-2xl font-bold text-gray-900">에러 로그 관리</h1>
              <p className="text-sm text-gray-500 mt-1">시스템 에러 모니터링 및 관리</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchErrorLogs}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <FiRefreshCw size={16} />
                새로고침
              </button>
              <button
                onClick={() => navigate("/admin/dashboard")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                대시보드로
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 통계 및 필터 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* 전체 */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">전체 로그</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {errorLogs.length}
                </p>
              </div>
              <div className="p-3 bg-gray-100 rounded-lg">
                <FiAlertCircle className="text-gray-600 text-xl" />
              </div>
            </div>
          </div>

          {/* 미해결 */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">미해결</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {unresolvedCount}
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <FiAlertCircle className="text-red-600 text-xl" />
              </div>
            </div>
          </div>

          {/* 해결됨 */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">해결됨</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {resolvedCount}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <FiCheckCircle className="text-green-600 text-xl" />
              </div>
            </div>
          </div>
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="ALL">전체 상태</option>
              <option value="UNRESOLVED">미해결</option>
              <option value="RESOLVED">해결됨</option>
            </select>
          </div>
        </div>

        {/* 에러 로그 목록 */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    로그 ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    서비스명
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    에러 메시지
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    발생 시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    관리
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {errorLogs.length > 0 ? (
                  errorLogs.map((log) => (
                    <tr key={log.logId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.logId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          {log.serviceName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-md truncate" title={log.errorMessage}>
                          {log.errorMessage}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(log.occurredAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(log.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <div className="flex items-center justify-center gap-2">
                          {log.status === "UNRESOLVED" && (
                            <button
                              onClick={() => handleResolve(log.logId)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="해결 완료"
                            >
                              <FiCheckCircle size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(log.logId)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="삭제"
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      조회된 에러 로그가 없습니다.
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

export default AdminErrorLogs;
