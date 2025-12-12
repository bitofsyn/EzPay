import React, { useState } from "react";
import { updatePassword } from "../../api/UserAPI";
import toast from "react-hot-toast";

const PasswordChange: React.FC = () => {
    const [newPassword, setNewPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");

    const handlePasswordChange = async (): Promise<void> => {
        if (!newPassword || !confirmPassword) {
            toast.error("비밀번호를 모두 입력해주세요.");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("비밀번호가 일치하지 않습니다.");
            return;
        }

        try {
            const res = await updatePassword(newPassword);
            toast.success(res.message || "비밀번호가 변경되었습니다.");
            setNewPassword("");
            setConfirmPassword("");
        } catch {
            toast.error("비밀번호 변경에 실패했습니다.");
        }
    };

    return (
        <section className="bg-white p-6 rounded-xl shadow space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">비밀번호 변경</h2>
            <input
                type="password"
                placeholder="새 비밀번호"
                className="w-full border p-2 rounded"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
                type="password"
                placeholder="새 비밀번호 확인"
                className="w-full border p-2 rounded"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
                onClick={handlePasswordChange}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
                비밀번호 변경
            </button>
        </section>
    );
};

export default PasswordChange;
