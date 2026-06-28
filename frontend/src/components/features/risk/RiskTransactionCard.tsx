import React, { memo, useCallback } from "react";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";

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

interface RiskTransactionCardProps {
  transaction: RiskTx;
  onApprove?: (id: string) => void;
  onBlock?: (id: string) => void;
}

const getRiskLevelBadgeClass = (level: "위험" | "주의"): string => {
  return level === "위험"
    ? "bg-red-50 text-red-500 border border-red-200"
    : "bg-amber-50 text-amber-600 border border-amber-200";
};

/**
 * 최적화된 위험 거래 카드 컴포넌트
 * - React.memo로 같은 데이터면 리렌더링 스킵
 * - useCallback으로 핸들러 메모이제이션
 */
const RiskTransactionCard: React.FC<RiskTransactionCardProps> = memo(
  ({ transaction, onApprove, onBlock }) => {
    const isDanger = transaction.level === "위험";
    const borderColor = isDanger ? "border-l-red-400" : "border-l-amber-400";
    const reasonBg = isDanger ? "bg-red-50" : "bg-amber-50";
    const reasonIcon = isDanger ? "🔴" : "⚠️";

    const handleApprove = useCallback(() => {
      onApprove?.(transaction.id);
    }, [transaction.id, onApprove]);

    const handleBlock = useCallback(() => {
      onBlock?.(transaction.id);
    }, [transaction.id, onBlock]);

    return (
      <div
        className={`bg-white rounded-2xl border border-slate-100 shadow-sm border-l-4 ${borderColor} overflow-hidden`}
      >
        {/* Card Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono font-bold text-slate-700">{transaction.id}</span>
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${getRiskLevelBadgeClass(
                transaction.level
              )}`}
            >
              {transaction.level}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleApprove}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600 hover:bg-emerald-100 transition-colors"
            >
              <FiCheckCircle size={13} />
              승인
            </button>
            <button
              onClick={handleBlock}
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
            <p className="text-sm font-bold text-slate-800">{transaction.sender}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 mb-1">받는 분</p>
            <p className="text-sm font-bold text-slate-800">{transaction.receiver}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 mb-1">금액</p>
            <p className="text-sm font-bold text-slate-800">₩{transaction.amount.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 mb-1">일시</p>
            <p className="text-sm text-slate-700">{transaction.datetime}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 mb-1">카테고리</p>
            <p className="text-sm text-slate-700">{transaction.category}</p>
          </div>
        </div>

        {/* AI Warning */}
        <div className={`mx-5 mb-4 rounded-xl px-4 py-3 ${reasonBg}`}>
          <p className="text-xs text-slate-600">
            {reasonIcon} {transaction.reason}
          </p>
        </div>
      </div>
    );
  }
);

RiskTransactionCard.displayName = "RiskTransactionCard";

export default RiskTransactionCard;
