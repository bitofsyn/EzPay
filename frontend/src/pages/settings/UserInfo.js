import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserInfo, deleteUser } from "../../api/UserAPI";

const UserInfo = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({ id: null, name: "", email: "" });
    const [loading, setLoading] = useState(true);
    const [darkMode, setDarkMode] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const user = await getUserInfo(); // ✅ user만 반환한다고 가정
                console.log("사용자 정보 조회: ", user);
                setUser(user);
            } catch (err) {
                console.error("사용자 정보 불러오기 실패", err);
                navigate("/login");
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("userToken");
        navigate("/login");
    };

    const handleDeleteAccount = async () => {
        try {
            await deleteUser(user.id);
            alert("계정이 삭제되었습니다.");
            localStorage.removeItem("userToken");
            navigate("/login");
        } catch (err) {
            alert("계정 삭제 실패");
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

            {/* 다크모드 */}
            <section className="bg-white shadow rounded-xl p-6 flex items-center justify-between">
                <span className="text-gray-800 font-medium">다크모드</span>
                <input
                    type="checkbox"
                    checked={darkMode}
                    onChange={(e) => setDarkMode(e.target.checked)}
                    className="toggle toggle-md"
                />
            </section>

            {/* 로그아웃 + 탈퇴 */}
            <div className="text-center space-y-2">
                <button
                    onClick={handleLogout}
                    className="text-red-500 font-semibold"
                >
                    로그아웃
                </button>
                <br />
                <button
                    onClick={() => setShowDeleteModal(true)}
                    className="text-gray-500 underline text-sm"
                >
                    회원 탈퇴
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
