import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getUserInfo, deleteUser, getLoginHistory } from "../../api/UserAPI";
import { LoginHistoryItem } from "../../types";

interface UserData {
    userId: number;
    name: string;
    email: string;
}

const UserInfo: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserData>({ userId: 0, name: "", email: "" });
    const [logs, setLogs] = useState<LoginHistoryItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

    useEffect(() => {
        const fetchUser = async (): Promise<void> => {
            try {
                const userRes = await getUserInfo();
                const userData: UserData = {
                    userId: userRes.userId,
                    name: userRes.name,
                    email: userRes.email,
                };
                const logsRes = await getLoginHistory(userData.userId);
                console.log("logsRes :", logsRes);
                setUser(userData);
                setLogs(logsRes);
            } catch (err) {
                toast.error("사용자 정보 또는 로그인 기록을 불러오지 못했습니다.");
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [navigate]);

    const handleLogout = (): void => {
        localStorage.removeItem("userToken");
        navigate("/login");
    };

    const handleDeleteAccount = async (): Promise<void> => {
        try {
            await deleteUser(user.userId);
            toast.success("계정이 삭제되었습니다.");
            localStorage.removeItem("userToken");
            navigate("/login");
        } catch {
            toast.error("계정 삭제에 실패했습니다.");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <p>로딩 중...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 사용자 정보 */}
            <section className="bg-white shadow rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-3">사용자 정보</h2>
                <p className="text-sm mb-1"><strong>이름:</strong> {user.name}</p>
                <p className="text-sm"><strong>이메일:</strong> {user.email}</p>
            </section>

            {/* 최근 로그인 기록 */}
            <section className="bg-white shadow rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-3">최근 로그인 기록</h2>
                {logs.length === 0 ? (
                    <p className="text-sm text-gray-500">기록이 없습니다.</p>
                ) : (
                    <>
                        <ul className="space-y-2">
                            {logs.slice(0, 5).map((log) => (
                                <li
                                    key={log.historyId}
                                    className="flex justify-between items-center text-sm text-gray-700 border rounded px-3 py-2"
                                >
                                    <div>
                                        <p className="font-medium">{log.deviceInfo || "알 수 없는 기기"}</p>
                                        <p className="text-xs text-gray-500">{log.ipAddress || "IP 미상"}</p>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {new Date(log.loginTime).toLocaleString("ko-KR")}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        {/* 전체 로그인 기록 보기 버튼 */}
                        {logs.length > 5 && (
                            <div className="mt-4 text-center">
                                <button
                                    onClick={() => navigate("/settings/login-history")}
                                    className="text-blue-600 hover:underline text-sm font-medium"
                                >
                                    전체 로그인 기록 보기 →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </section>

            {/* 로그아웃 + 탈퇴 */}
            <div className="flex flex-col items-center gap-4 mt-8">
                <button
                    onClick={handleLogout}
                    className="w-60 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 rounded-xl shadow-md transition-all"
                >
                    로그아웃
                </button>

                <button
                    onClick={() => setShowDeleteModal(true)}
                    className="text-sm text-gray-400 hover:text-gray-600 hover:underline transition-all"
                >
                    회원 탈퇴하기
                </button>
            </div>



            {/* 탈퇴 모달 */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow w-80">
                        <h3 className="text-lg font-semibold mb-4">정말 탈퇴하시겠어요?</h3>
                        <div className="flex justify-end space-x-4">
                            <button
                                className="px-4 py-2 bg-gray-300 rounded"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                취소
                            </button>
                            <button
                                className="px-4 py-2 bg-red-500 text-white rounded"
                                onClick={handleDeleteAccount}
                            >
                                탈퇴
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserInfo;