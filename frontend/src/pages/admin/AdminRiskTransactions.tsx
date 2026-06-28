import React, { useState, useMemo, useEffect } from "react";
import { FiAlertTriangle, FiCheckCircle, FiXCircle } from "react-icons/fi";
import AdminShell from "../../components/admin/AdminShell";
import type { RiskTransaction } from "../../types";
import toast from "react-hot-toast";

const getRiskLevelBadgeClass = (level: string): string => {
  return level === "위험"
    ? "bg-red-50 text-red-500 border border-red-200"
    : "bg-amber-50 text-amber-600 border border-amber-200";
};

interface RiskTx {
  id: string;
  level: "위험" | "주의";
  sender: string;
  receiver: string;
  amount: number;
  datetime: string;
  category: string;
  reason: string;
}

const AdminRiskTransactions: React.FC = () => {
  const [riskTransactions, setRiskTransactions] = useState<RiskTx[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [handled, setHandled] = useState<Record<string, "승인" | "차단" | null>>({});

  useEffect(() => {
    fetchRiskTransactions();
  }, []);

  const fetchRiskTransactions = async () => {
    try {
      setIsLoading(true);
      setIsError(false);
      // TODO: API 연동
      // const response = await getRiskTransactions();
      // setRiskTransactions(response);
      setRiskTransactions([]);
    } catch (error) {
      console.error("위험 거래 조회 실패:", error);
      setIsError(true);
      toast.error("위험 거래를 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (id: string, action: "승인" | "차단") => {
    setHandled((prev) => ({ ...prev, [id]: action }));
  };

  const visible = riskTransactions.filter((r) => !handled[r.id]);

  const dangerCount = useMemo(() => riskTransactions.filter((r) => r.level === "위험").length, [riskTransactions]);
  const cautionCount = useMemo(() => riskTransactions.filter((r) => r.level === "주의").length, [riskTransactions]);
  const totalCount = riskTransactions.length;

  return (
    <AdminShell title="AI 위험 거래">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-red-50 border border-red-100 p-5">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">
              위험 (DANGER)
            </p>
            <p className="text-4xl font-black text-red-500">
              {dangerCount}
              <span className="text-xl font-bold ml-1">건</span>
            </p>
          </div>
          <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5">
            <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-2">
              주의 (CAUTION)
            </p>
            <p className="text-4xl font-black text-amber-500">
              {cautionCount}
              <span className="text-xl font-bold ml-1">건</span>
            </p>
          </div>
          <div className="rounded-2xl bg-blue-50 border border-blue-100 p-5">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wide mb-2">
              미처리 건수
            </p>
            <p className="text-4xl font-black text-blue-500">
              {visible.length}
              <span className="text-xl font-bold ml-1">건</span>
            </p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-slate-400">
          EzPay 내부 기준 분석 · {totalCount}건 감지
        </p>

        {/* Risk Cards */}
        <div className="space-y-4">
          {visible.map((tx) => {
            const isDanger = tx.level === "위험";
            const borderColor = isDanger ? "border-l-red-400" : "border-l-amber-400";
            const reasonBg = isDanger ? "bg-red-50" : "bg-amber-50";
            const reasonIcon = isDanger ? "🔴" : "⚠️";

            return (
              <div
                key={tx.id}
                className={`bg-white rounded-2xl border border-slate-100 shadow-sm border-l-4 ${borderColor} overflow-hidden`}
              >
                {/* Card Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono font-bold text-slate-700">{tx.id}</span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${getRiskLevelBadgeClass(tx.level)}`}>
                      {tx.level}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAction(tx.id, "승인")}
                      className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-100 transition-colors"
                    >
                      <FiCheckCircle size={13} />
                      승인
                    </button>
                    <button
                      onClick={() => handleAction(tx.id, "차단")}
                      className="flex items-center gap-1.5 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-100 transition-colors"
                    >
                      <FiXCircle size={13} />
                      차단
                    </button>
                  </div>
                </div>

                {/* Card Body */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 px-5 py-4 sm:grid-cols-5">
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1">보내는 분</p>
                    <p className="text-sm font-bold text-slate-800">{tx.sender}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1">받는 분</p>
                    <p className="text-sm font-bold text-slate-800">{tx.receiver}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1">금액</p>
                    <p className="text-sm font-bold text-slate-800">₩{tx.amount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1">일시</p>
                    <p className="text-sm text-slate-700">{tx.datetime}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-400 mb-1">카테고리</p>
                    <p className="text-sm text-slate-700">{tx.category}</p>
                  </div>
                </div>

                {/* AI Warning */}
                <div className={`mx-5 mb-4 rounded-xl px-4 py-3 ${reasonBg}`}>
                  <p className="text-xs text-slate-600">
                    {reasonIcon} {tx.reason}
                  </p>
                </div>
              </div>
            );
          })}

          {visible.length === 0 && (
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm py-16 text-center">
              <FiAlertTriangle className="mx-auto mb-3 text-slate-300" size={36} />
              <p className="text-sm font-semibold text-slate-400">모든 위험 거래가 처리되었습니다.</p>
            </div>
          )}
        </div>

        {/* Handled log */}
        {Object.keys(handled).length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-slate-700 mb-3">처리 완료</h3>
            <div className="space-y-2">
              {Object.entries(handled).map(([id, action]) => (
                <div key={id} className="flex items-center gap-3 text-sm">
                  <span className="font-mono text-slate-500">{id}</span>
                  <span
                    className={`font-semibold ${
                      action === "승인" ? "text-emerald-600" : "text-red-500"
                    }`}
                  >
                    {action}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminShell>
  );
};

export default AdminRiskTransactions;
