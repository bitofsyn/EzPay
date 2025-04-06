import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserInfo, deleteUser } from "../../api/userAPI";

const Withdraw = () => {
    const navigate = useNavigate();
    const [userId, setUserId] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchUserId = async () => {
            try {
                const res = await getUserInfo();
                setUserId(res.data.id);
            } catch (err) {
                console.error("사용자 정보 조회 실패", err);
                navigate("/login");
            }
        };
        fetchUserId();
    }, [navigate]);

    const handleDelete = async () => {
        try {
            await deleteUser(userId);
            alert("회원 탈퇴가 완료되었습니다.");
            localStorage.removeItem("userToken");
            navigate("/login");
        } catch (err) {
            alert("회원 탈퇴 실패");
        }
    };

    return (
        <section className="bg-white p-6 rounded-xl shadow space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">회원 탈퇴</h2>
            <p className="text-sm text-gray-600">
                탈퇴 시 계정 정보가 삭제되며 복구할 수 없습니다.
                정말 탈퇴하시겠습니까?
            </p>
            <button
                onClick={() => setShowModal(true)}
                className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600"
            >
                회원 탈퇴하기
            </button>

            {/* 탈퇴 확인 모달 */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow w-80">
                        <h3 className="text-lg font-semibold mb-4">정말 탈퇴하시겠어요?</h3>
                        <div className="flex justify-end space-x-4">
                            <button
                                className="px-4 py-2 bg-gray-300 rounded"
                                onClick={() => setShowModal(false)}
                            >
                                취소
                            </button>
                            <button
                                className="px-4 py-2 bg-red-500 text-white rounded"
                                onClick={handleDelete}
                            >
                                탈퇴
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default Withdraw;
