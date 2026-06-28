import React, { useState } from "react";
import { FiSearch } from "react-icons/fi";
import AdminShell from "../../components/admin/AdminShell";
import { FilterTabs, RoleBadge, StatusBadge } from "../../components/admin/AdminUI";

type UserRole = "ADMIN" | "USER";
type UserStatus = "활성" | "정지";
type FilterType = "전체" | "활성" | "정지";

interface MockUser {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  txCount: number;
  role: UserRole;
  status: UserStatus;
  balance: number;
}

const MOCK_USERS: MockUser[] = [
  { id: "U001", name: "소윤", email: "soyoon@ezpay.com", joinDate: "2025-01-10", txCount: 42, role: "ADMIN", status: "활성", balance: 6704000 },
  { id: "U002", name: "김민수", email: "minsoo@ezpay.com", joinDate: "2025-03-22", txCount: 18, role: "USER", status: "활성", balance: 1280000 },
  { id: "U003", name: "이지현", email: "jihyun@ezpay.com", joinDate: "2025-06-01", txCount: 7, role: "USER", status: "활성", balance: 3350000 },
  { id: "U004", name: "박서준", email: "seojun@ezpay.com", joinDate: "2025-07-15", txCount: 33, role: "USER", status: "정지", balance: 880000 },
  { id: "U005", name: "최유진", email: "yujin@ezpay.com", joinDate: "2025-09-30", txCount: 11, role: "USER", status: "활성", balance: 2100000 },
  { id: "U006", name: "정수현", email: "suhyun@ezpay.com", joinDate: "2026-01-05", txCount: 5, role: "USER", status: "활성", balance: 760000 },
];

const AdminUserManagement: React.FC = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("전체");

  const filtered = MOCK_USERS.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !search || u.name.includes(q) || u.email.includes(q) || u.id.toLowerCase().includes(q);
    const matchFilter = filter === "전체" || u.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <AdminShell title="사용자 관리">
      <div className="space-y-4">
        {/* Header row */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-800">사용자 관리</h2>
            <p className="text-sm text-slate-400 mt-0.5">총 {filtered.length}명</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="이름·이메일·ID 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-cyan-300 w-52"
              />
            </div>
            <FilterTabs<FilterType>
              options={["전체", "활성", "정지"]}
              active={filter}
              onChange={setFilter}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["ID", "이름/이메일", "가입일", "거래수", "역할", "상태", "잔액"].map((h) => (
                  <th
                    key={h}
                    className={`px-5 py-3.5 text-xs font-semibold text-slate-400 text-left ${h === "잔액" ? "text-right" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer"
                >
                  <td className="px-5 py-4 text-sm text-slate-400 font-mono">{u.id}</td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold text-slate-800">{u.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{u.email}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-600">{u.joinDate}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-slate-800">{u.txCount}건</td>
                  <td className="px-5 py-4">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-5 py-4 text-sm font-bold text-slate-800 text-right">
                    ₩{u.balance.toLocaleString()}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">
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

export default AdminUserManagement;
