import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiEye, FiFilter, FiSearch, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import { deleteUserByAdmin, getAllUsers, updateUserStatus } from "../../api/AdminAPI";
import AdminShell from "../../components/admin/AdminShell";
import type { AdminUser, ApiResponse } from "../../types";
import { previewAdminUsers } from "../../utils/adminPreviewData";
import { isAdminPreviewForbiddenError } from "../../utils/adminView";

const AdminUsers: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.phoneNumber && user.phoneNumber.includes(searchTerm)),
      );
    }

    if (statusFilter !== "ALL") {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, statusFilter, users]);

  const fetchAllUsers = async () => {
    try {
      const usersData = await getAllUsers();
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error: unknown) {
      if (isAdminPreviewForbiddenError(error)) {
        setUsers(previewAdminUsers);
        setFilteredUsers(previewAdminUsers);
        return;
      }

      console.error("사용자 목록 조회 실패:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "사용자 목록을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (userId: number, newStatus: string) => {
    if (!window.confirm(`사용자 상태를 ${newStatus}로 변경하시겠습니까?`)) return;

    try {
      const response: ApiResponse = await updateUserStatus(userId, newStatus);
      if (response.status === "success") {
        toast.success(response.message || "사용자 상태가 변경되었습니다.");
        fetchAllUsers();
        return;
      }
      throw new Error(response.message || "상태 변경 실패");
    } catch (error: unknown) {
      if (isAdminPreviewForbiddenError(error)) {
        setUsers((prev) => prev.map((user) => (user.userId === userId ? { ...user, status: newStatus as AdminUser["status"] } : user)));
        return;
      }

      console.error("사용자 상태 변경 실패:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "사용자 상태 변경에 실패했습니다.");
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!window.confirm(`정말 ${userName} 사용자를 삭제하시겠습니까?`)) return;

    try {
      const response: ApiResponse = await deleteUserByAdmin(userId);
      if (response.status === "success") {
        toast.success(response.message || "사용자가 삭제되었습니다.");
        fetchAllUsers();
        return;
      }
      throw new Error(response.message || "삭제 실패");
    } catch (error: unknown) {
      if (isAdminPreviewForbiddenError(error)) {
        setUsers((prev) => prev.filter((user) => user.userId !== userId));
        return;
      }

      console.error("사용자 삭제 실패:", error);
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "사용자 삭제에 실패했습니다.");
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-emerald-50 text-emerald-700";
      case "INACTIVE":
        return "bg-amber-50 text-amber-700";
      case "LOCKED":
        return "bg-rose-50 text-rose-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <AdminShell title="사용자 관리" description="전체 사용자 목록 및 상태 관리">
      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold text-slate-500">전체 사용자</p>
            <p className="mt-3 text-[28px] font-black text-slate-950">{users.length.toLocaleString()}</p>
          </article>
          <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold text-slate-500">활성 사용자</p>
            <p className="mt-3 text-[28px] font-black text-emerald-700">
              {users.filter((user) => user.status === "ACTIVE").length.toLocaleString()}
            </p>
          </article>
          <article className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold text-slate-500">잠금 사용자</p>
            <p className="mt-3 text-[28px] font-black text-rose-700">
              {users.filter((user) => user.status === "LOCKED").length.toLocaleString()}
            </p>
          </article>
        </section>

        <section className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="이름, 이메일, 전화번호로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
              />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4">
              <FiFilter className="text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-12 bg-transparent text-sm font-semibold text-slate-700 outline-none"
              >
                <option value="ALL">전체 상태</option>
                <option value="ACTIVE">활성</option>
                <option value="INACTIVE">비활성</option>
                <option value="LOCKED">잠금</option>
              </select>
            </div>
          </div>
          <p className="mt-4 text-sm font-medium text-slate-400">총 {filteredUsers.length}명의 사용자가 표시됩니다.</p>
        </section>

        <section className="overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">이름</th>
                  <th className="px-6 py-4">이메일</th>
                  <th className="px-6 py-4">전화번호</th>
                  <th className="px-6 py-4">상태</th>
                  <th className="px-6 py-4">가입일</th>
                  <th className="px-6 py-4 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-sm font-semibold text-slate-400">
                      사용자 정보를 불러오는 중입니다.
                    </td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user.userId} className="transition hover:bg-slate-50/80">
                      <td className="px-6 py-4 text-sm font-semibold text-slate-700">{user.userId}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-950">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{user.phoneNumber || "-"}</td>
                      <td className="px-6 py-4">
                        <select
                          value={user.status}
                          onChange={(e) => handleStatusChange(user.userId, e.target.value)}
                          className={`rounded-full px-3 py-1.5 text-xs font-bold outline-none ${getStatusBadgeStyle(user.status)}`}
                        >
                          <option value="ACTIVE">활성</option>
                          <option value="INACTIVE">비활성</option>
                          <option value="LOCKED">잠금</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/users/${user.userId}`)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-sky-600 transition hover:bg-sky-50"
                            title="상세 보기"
                          >
                            <FiEye size={18} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user.userId, user.name)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl text-rose-600 transition hover:bg-rose-50"
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
                    <td colSpan={7} className="px-6 py-16 text-center text-sm font-semibold text-slate-400">
                      조회된 사용자가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
};

export default AdminUsers;
