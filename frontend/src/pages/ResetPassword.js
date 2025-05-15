import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { resetPassword, validatePasswordResetToken } from "../api/UserAPI";

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isTokenValid, setIsTokenValid] = useState(true);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();
    const token = sessionStorage.getItem("resetToken");

    // 토큰 유효성 검사
    useEffect(() => {
        const validateToken = async () => {
            try {
                await validatePasswordResetToken(token);
                setIsTokenValid(true);
            } catch (err) {
                setIsTokenValid(false);
                setError("유효하지 않거나 만료된 토큰입니다.");
                Sentry.captureException(err);
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            validateToken();
        } else {
            setError("토큰이 제공되지 않았습니다.");
            setIsTokenValid(false);
            setLoading(false);
        }
    }, [token]);


    const handleSubmit = async (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setError("비밀번호가 일치하지 않습니다.");
            return;
        }

        const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordPattern.test(newPassword)) {
            setError("비밀번호는 최소 8자 이상, 숫자, 대문자, 특수문자를 포함해야 합니다.");
            return;
        }

        try {
            await resetPassword(token, newPassword);
            setSuccessMessage("비밀번호가 성공적으로 변경되었습니다.");
            setError("");

            // 완료 후 토큰 삭제
            sessionStorage.removeItem("resetToken");

            setTimeout(() => {
                navigate("/login");
            }, 2500);
        } catch (err) {
            setError(err.response?.data?.message || "비밀번호 변경에 실패했습니다.");
            Sentry.captureException(err);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold text-center mb-6">비밀번호 재설정</h2>

                {loading ? (
                    <p className="text-center text-gray-500">로딩 중...</p>
                ) : !isTokenValid ? (
                    <p className="text-red-500 text-center">{error}</p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block font-semibold text-gray-700">새 비밀번호</label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="새 비밀번호 입력"
                                className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-gray-700">비밀번호 확인</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="비밀번호 다시 입력"
                                className="w-full px-4 py-2 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        {successMessage && <p className="text-green-600 text-sm">{successMessage}</p>}

                        <button
                            type="submit"
                            disabled={!isTokenValid}
                            className="w-full bg-gray-800 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 disabled:opacity-50"
                        >
                            비밀번호 재설정
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ResetPassword;
