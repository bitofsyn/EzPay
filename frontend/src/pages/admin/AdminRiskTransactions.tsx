import React, { useState } from "react";
import { FiAlertTriangle, FiCheckCircle, FiXCircle } from "react-icons/fi";
import AdminShell from "../../components/admin/AdminShell";

type RiskLevel = "위험" | "주의";

interface RiskTx {
  id: string;
  level: RiskLevel;
  sender: string;
  receiver: string;
  amount: number;
  datetime: string;
  category: string;
  reason: string;
}

const MOCK_RISK: RiskTx[] = [
  {
    id: "TX003",
    level: "주의",
    sender: "소윤",
    receiver: "박서준",
    amount: 120000,
    datetime: "2026-06-19 10:20",
    category: "선물",
    reason: "평소 송금액 대비 큰 금액이거나 처음 송금하는 수취인입니다.",
  },
  {
    id: "TX006",
    level: "위험",
    sender: "박서준",
    receiver: "이지현",
    amount: 980000,
    datetime: "2026-06-16 23:55",
    category: "기타",
    reason: "고액 + 야간 시간대 + 신규 수취인으로 위험 거래가 감지되었습니다.",
  },
  {
    id: "TX007",
    level: "주의",
    sender: "정수현",
    receiver: "김민수",
    amount: 450000,
    datetime: "2026-06-15 11:30",
    category: "기타",
    reason: "평소 송금액 대비 큰 금액이거나 처음 송금하는 수취인입니다.",
  },
];

const DANGER_COUNT = MOCK_RISK.filter((r) => r.level === "위험").length;
const CAUTION_COUNT = MOCK_RISK.filter((r) => r.level === "주의").length;
const UNHANDLED_COUNT = MOCK_RISK.length;

const LevelBadge: React.FC<{ level: RiskLevel }> = ({ level }) => {
  const cls =
    level === "위험"
      ? "bg-red-50 text-red-500 border border-red-200"
      : "bg-amber-50 text-amber-600 border border-amber-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold ${cls}`}>
      {level}
    </span>
  );
};

const AdminRiskTransactions: React.FC = () => {
  const [handled, setHandled] = useState<Record<string, "승인" | "차단" | null>>({});

  const handleAction = (id: string, action: "승인" | "차단") => {
    setHandled((prev) => ({ ...prev, [id]: action }));
  };

  const visible = MOCK_RISK.filter((r) => !handled[r.id]);

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
              {DANGER_COUNT}
              <span className="text-xl font-bold ml-1">건</span>
            </p>
          </div>
          <div className="rounded-2xl bg-amber-50 border border-amber-100 p-5">
            <p className="text-xs font-semibold text-amber-500 uppercase tracking-wide mb-2">
              주의 (CAUTION)
            </p>
            <p className="text-4xl font-black text-amber-500">
              {CAUTION_COUNT}
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
          EzPay 내부 기준 분석 · {UNHANDLED_COUNT}건 감지
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
                    <LevelBadge level={tx.level} />
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
