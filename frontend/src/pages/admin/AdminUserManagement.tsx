import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch } from "react-icons/fi";
import toast from "react-hot-toast";
import AdminShell from "../../components/admin/AdminShell";
import { FilterTabs, RoleBadge, StatusBadge } from "../../components/admin/AdminUI";
import { useSseChannel } from "../../hooks";
import { getAllUsers } from "../../api/AdminAPI";
import type { AdminUserInfo, RealtimeUserEvent } from "../../types";

type FilterType = "전체" | "활성" | "비활성" | "잠금";

// 백엔드 Status enum → 화면 라벨 매핑
const STATUS_LABEL: Record<AdminUserInfo["status"], string> = {
  ACTIVE: "활성",
  INACTIVE: "비활성",
  LOCKED: "잠금",
};

const AdminUserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUserInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("전체");

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("회원 목록 조회 실패:", error);
      setIsError(true);
      toast.error("회원 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true);
      setIsError(false);
      try {
        const data = await getAllUsers();
        if (active) setUsers(data);
      } catch (error) {
        if (!active) return;
        console.error("회원 목록 조회 실패:", error);
        setIsError(true);
        toast.error("회원 목록을 불러오는데 실패했습니다.");
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // 사용자 상태 변경 실시간 구독: 이벤트가 오면 해당 사용자 행의 상태를
  // 새로고침 없이 즉시 갱신한다. 목록에 없던 사용자면 안전하게 전체를 재조회한다.
  useSseChannel<RealtimeUserEvent>("user-events", {
    enabled: !isLoading && !isError,
    onEvent: (evt) => {
      setUsers((prev) => {
        const exists = prev.some((u) => u.userId === evt.userId);
        if (!exists) {
          fetchUsers();
          return prev;
        }
        return prev.map((u) =>
          u.userId === evt.userId ? { ...u, status: evt.status } : u,
        );
      });
    },
  });

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      String(u.userId).includes(q);
    const matchFilter = filter === "전체" || STATUS_LABEL[u.status] === filter;
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
              options={["전체", "활성", "비활성", "잠금"]}
              active={filter}
              onChange={setFilter}
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                {["ID", "이름/이메일", "전화번호", "가입일", "역할", "상태"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3.5 text-xs font-semibold text-slate-400 text-left"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm text-slate-400">
                    회원 목록을 불러오는 중입니다...
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-sm text-rose-500">
                    <p className="mb-3">회원 목록을 불러오지 못했습니다.</p>
                    <button
                      type="button"
                      onClick={fetchUsers}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      다시 시도
                    </button>
                  </td>
                </tr>
              ) : filtered.length > 0 ? (
                filtered.map((u) => (
                  <tr
                    key={u.userId}
                    onClick={() => navigate(`/admin/users/${u.userId}`)}
                    className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4 text-sm text-slate-400 font-mono">{u.userId}</td>
                    <td className="px-5 py-4">
                      <p className="text-sm font-bold text-slate-800">{u.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{u.email}</p>
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">{u.phone || "-"}</td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString("ko-KR") : "-"}
                    </td>
                    <td className="px-5 py-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={STATUS_LABEL[u.status]} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-400">
                    {users.length === 0 ? "등록된 회원이 없습니다." : "검색 결과가 없습니다."}
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
