import React, { useEffect, useState } from "react";
import {
    getUserInfo,
    getNotificationSettings,
    updateNotificationSetting,
} from "../../api/UserAPI";
import { NotificationSettings } from "../../types";
import toast from "react-hot-toast";

const Notification: React.FC = () => {
    const [userId, setUserId] = useState<number | null>(null);
    const [emailEnabled, setEmailEnabled] = useState<boolean>(false);
    const [pushEnabled, setPushEnabled] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchInfo = async (): Promise<void> => {
            try {
                const userRes = await getUserInfo();
                console.log("공지 :", userRes)
                const id = userRes.userId;
                setUserId(id);

                const res = await getNotificationSettings(id);
                const notifications: NotificationSettings[] = res || [];

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

    const handleToggle = async (type: string, currentValue: boolean): Promise<void> => {
        try {
            await updateNotificationSetting(userId!, type, !currentValue);
            if (type === "EMAIL") setEmailEnabled(!currentValue);
            if (type === "PUSH") setPushEnabled(!currentValue);
            toast.success("알림 설정이 변경되었습니다.");
        } catch {
            toast.error("알림 설정 변경에 실패했습니다.");
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
