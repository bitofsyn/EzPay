import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getUserInfo, deleteUser, getMyAccounts, setMainAccount } from "../../../api/UserAPI";
import { Account } from "../../../types";

interface UserData {
    userId: number;
    name: string;
    email: string;
}

const formatAccountNumber = (accountNumber: string): string => {
    const cleaned = accountNumber.replace(/\D/g, "");
    if (cleaned.length === 10) {
        return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}`;
    }
    return accountNumber;
};

const AccountTab: React.FC = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserData>({ userId: 0, name: "", email: "" });
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [currentMainId, setCurrentMainId] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);

    useEffect(() => {
        const fetchData = async (): Promise<void> => {
            try {
                const userRes = await getUserInfo();
                setUser({
                    userId: userRes.userId,
                    name: userRes.name,
                    email: userRes.email,
                });

                const accountRes = await getMyAccounts();
                setAccounts(accountRes);
                const main = accountRes.find((acc: Account) => acc.isMain);
                if (main) {
                    setCurrentMainId(main.accountId);
                }
            } catch (err) {
                toast.error("정보를 불러오지 못했습니다.");
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
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

    const handleSelectMain = async (accountId: number): Promise<void> => {
        if (accountId === currentMainId) return;

        try {
            await setMainAccount(accountId);
            const res = await getMyAccounts();
            setAccounts(res);
            const main = res.find((acc: Account) => acc.isMain);
            if (main) {
                setCurrentMainId(main.accountId);
            }
            toast.success("대표 계좌가 변경되었습니다!");
        } catch {
            toast.error("대표 계좌 변경에 실패했습니다.");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* 사용자 정보 */}
            <section className="bg-white shadow rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="text-blue-600">👤</span> 사용자 정보
                </h2>
                <div className="space-y-2">
                    <p className="text-sm">
                        <span className="text-gray-500">이름:</span>{" "}
                        <span className="font-medium">{user.name}</span>
                    </p>
                    <p className="text-sm">
                        <span className="text-gray-500">이메일:</span>{" "}
                        <span className="font-medium">{user.email}</span>
                    </p>
                </div>
            </section>

            {/* 대표 계좌 설정 */}
            <section className="bg-white shadow rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="text-green-600">💳</span> 대표 계좌 설정
                </h2>
                {accounts.length === 0 ? (
                    <p className="text-sm text-gray-500">등록된 계좌가 없습니다.</p>
                ) : (
                    <div className="space-y-3">
                        {accounts.map((account) => (
                            <div
                                key={account.accountId}
                                className={`p-4 border-2 rounded-lg cursor-pointer transition-all
                                    ${account.isMain
                                        ? "bg-blue-50 border-blue-500"
                                        : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"}`}
                                onClick={() => handleSelectMain(account.accountId)}
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        {account.isMain && (
                                            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full mb-2 inline-block">
                                                대표 계좌
                                            </span>
                                        )}
                                        <p className={`font-semibold ${account.isMain ? "text-blue-800" : "text-gray-800"}`}>
                                            {account.accountName}
                                        </p>
                                        <p className={`text-sm font-mono ${account.isMain ? "text-blue-600" : "text-gray-600"}`}>
                                            {formatAccountNumber(account.accountNumber)}
                                        </p>
                                        <p className="text-gray-500 text-sm mt-1">
                                            {account.balance.toLocaleString()} 원
                                        </p>
                                    </div>
                                    {!account.isMain && (
                                        <span className="text-gray-400 text-xs">클릭하여 대표 설정</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* 로그아웃 + 탈퇴 */}
            <div className="flex flex-col items-center gap-4 pt-4">
                <button
                    onClick={handleLogout}
                    className="w-60 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 rounded-xl shadow-md transition-all"
                >
                    로그아웃
                </button>

                <button
                    onClick={() => setShowDeleteModal(true)}
                    className="text-sm text-gray-400 hover:text-red-500 hover:underline transition-all"
                >
                    회원 탈퇴하기
                </button>
            </div>

            {/* 탈퇴 모달 */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-xl shadow-lg w-80">
                        <h3 className="text-lg font-semibold mb-2">회원 탈퇴</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            탈퇴 시 계정 정보가 삭제되며 복구할 수 없습니다.
                            정말 탈퇴하시겠습니까?
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                취소
                            </button>
                            <button
                                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
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

export default AccountTab;
