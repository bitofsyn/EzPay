import React, { useState } from "react";
import { FiSearch } from "react-icons/fi";
import AdminShell from "../../components/admin/AdminShell";
import { FilterTabs, RiskBadge, StatusBadge } from "../../components/admin/AdminUI";

type TxStatus = "완료" | "실패" | "처리중";
type RiskLevel = "안전" | "주의" | "위험";
type FilterType = "전체" | "완료" | "실패" | "처리중";

interface MockTx {
  id: string;
  sender: string;
  receiver: string;
  amount: number;
  date: string;
  status: TxStatus;
  risk: RiskLevel;
  responseMs: number;
}

const MOCK_TRANSACTIONS: MockTx[] = [
  { id: "TX001", sender: "소윤", receiver: "김민수", amount: 50000, date: "2026-06-21", status: "완료", risk: "안전", responseMs: 450 },
  { id: "TX002", sender: "이지현", receiver: "소윤", amount: 35000, date: "2026-06-20", status: "완료", risk: "안전", responseMs: 380 },
  { id: "TX003", sender: "소윤", receiver: "박서준", amount: 120000, date: "2026-06-19", status: "완료", risk: "주의", responseMs: 620 },
  { id: "TX004", sender: "최유진", receiver: "소윤", amount: 25000, date: "2026-06-18", status: "실패", risk: "안전", responseMs: 410 },
  { id: "TX005", sender: "소윤", receiver: "최유진", amount: 8000, date: "2026-06-17", status: "완료", risk: "안전", responseMs: 290 },
  { id: "TX006", sender: "박서준", receiver: "이지현", amount: 980000, date: "2026-06-16", status: "완료", risk: "위험", responseMs: 710 },
  { id: "TX007", sender: "정수현", receiver: "김민수", amount: 450000, date: "2026-06-15", status: "처리중", risk: "주의", responseMs: 520 },
];

const msColor = (ms: number) =>
  ms >= 700 ? "text-red-400" : ms >= 600 ? "text-amber-500" : "text-slate-400";

const AdminTransactionManagement: React.FC = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("전체");

  const filtered = MOCK_TRANSACTIONS.filter((tx) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      tx.id.toLowerCase().includes(q) ||
      tx.sender.includes(q) ||
      tx.receiver.includes(q);
    const matchFilter = filter === "전체" || tx.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <AdminShell title="거래 관리">
      <div className="space-y-4">
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">거래 관리</h2>
            <p className="text-sm text-slate-400 mt-0.5">전체 {filtered.length}건</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="거래ID·이름 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-cyan-300 w-52"
              />
            </div>
            <FilterTabs<FilterType>
              options={["전체", "완료", "실패", "처리중"]}
              active={filter}
              onChange={setFilter}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["거래ID", "보내는 분", "받는 분", "금액", "일시", "상태", "위험도", "처리시간"].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-xs font-semibold text-slate-400 text-left">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => (
                <tr
                  key={tx.id}
                  className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <td className="px-4 py-4 text-sm font-mono font-bold text-blue-600">{tx.id}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-slate-800">{tx.sender}</td>
                  <td className="px-4 py-4 text-sm font-semibold text-slate-800">{tx.receiver}</td>
                  <td className="px-4 py-4 text-sm font-bold text-slate-800">
                    ₩{tx.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-600">{tx.date}</td>
                  <td className="px-4 py-4">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="px-4 py-4">
                    <RiskBadge risk={tx.risk} />
                  </td>
                  <td className={`px-4 py-4 text-sm font-mono ${msColor(tx.responseMs)}`}>
                    {tx.responseMs}ms
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-sm text-slate-400">
                    검색 결과가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
};

export default AdminTransactionManagement;
