import { useEffect, useState } from "react";
import {
    getUserInfo,
    getNotificationSettings,
    updateNotificationSetting,
} from "../../api/UserAPI";

const Notification = () => {
    const [userId, setUserId] = useState(null);
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [pushEnabled, setPushEnabled] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const userRes = await getUserInfo();
                console.log("공지 :", userRes)
                const id = userRes.data.id;
                setUserId(id);

                const res = await getNotificationSettings(id);
                const notifications = res.data || [];

                notifications.forEach((n) => {
                    if (n.notificationType === "EMAIL") setEmailEnabled(n.isEnabled);
                    if (n.notificationType === "PUSH") setPushEnabled(n.isEnabled);
                });
            } catch (err) {
                console.error("알림 설정 조회 실패:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInfo();
    }, []);

    const handleToggle = async (type, currentValue) => {
        try {
            await updateNotificationSetting(userId, type, !currentValue);
            if (type === "EMAIL") setEmailEnabled(!currentValue);
            if (type === "PUSH") setPushEnabled(!currentValue);
        } catch (err) {
            alert("알림 설정 변경 실패");
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
        <section className="bg-white p-6 rounded-xl shadow space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">알림 설정</h2>

            <label className="flex items-center space-x-3">
                <input
                    type="checkbox"
                    checked={emailEnabled}
                    onChange={() => handleToggle("EMAIL", emailEnabled)}
                />
                <span className="text-gray-700">이메일 알림 수신</span>
            </label>

            <label className="flex items-center space-x-3">
                <input
                    type="checkbox"
                    checked={pushEnabled}
                    onChange={() => handleToggle("PUSH", pushEnabled)}
                />
                <span className="text-gray-700">푸시 알림 수신</span>
            </label>
        </section>
    );
};

export default Notification;
