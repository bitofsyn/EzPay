import React, { useEffect, useState } from "react";
import {
    getUserInfo,
    getNotificationSettings,
    updateNotificationSetting,
} from "../../../api/UserAPI";
import { NotificationSettings } from "../../../types";
import toast from "react-hot-toast";

const NotificationTab: React.FC = () => {
    const [userId, setUserId] = useState<number | null>(null);
    const [emailEnabled, setEmailEnabled] = useState<boolean>(false);
    const [pushEnabled, setPushEnabled] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchInfo = async (): Promise<void> => {
            try {
                const userRes = await getUserInfo();
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
        if (!userId) {
            toast.error("사용자 정보를 불러올 수 없습니다.");
            return;
        }
        try {
            await updateNotificationSetting(userId, type, !currentValue);
            if (type === "EMAIL") setEmailEnabled(!currentValue);
            if (type === "PUSH") setPushEnabled(!currentValue);
            toast.success("알림 설정이 변경되었습니다.");
        } catch {
            toast.error("알림 설정 변경에 실패했습니다.");
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
            {/* 이메일 알림 */}
            <section className="bg-white shadow rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="text-blue-600">📧</span> 이메일 알림
                </h2>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-800">이메일 알림 수신</p>
                        <p className="text-sm text-gray-500">거래 내역, 공지사항 등을 이메일로 받습니다.</p>
                    </div>
                    <label htmlFor="emailEnabled" aria-label="이메일 알림 수신" className="relative inline-flex items-center cursor-pointer">
                        <input
                            id="emailEnabled"
                            type="checkbox"
                            checked={emailEnabled}
                            onChange={() => handleToggle("EMAIL", emailEnabled)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </section>

            {/* 푸시 알림 */}
            <section className="bg-white shadow rounded-xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span className="text-green-600">🔔</span> 푸시 알림
                </h2>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-800">푸시 알림 수신</p>
                        <p className="text-sm text-gray-500">실시간 거래 알림을 받습니다.</p>
                    </div>
                    <label htmlFor="pushEnabled" aria-label="푸시 알림 수신" className="relative inline-flex items-center cursor-pointer">
                        <input
                            id="pushEnabled"
                            type="checkbox"
                            checked={pushEnabled}
                            onChange={() => handleToggle("PUSH", pushEnabled)}
                            className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </section>

            {/* 알림 안내 */}
            <section className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 text-center">
                    알림 설정은 즉시 적용됩니다.
                </p>
            </section>
        </div>
    );
};

export default NotificationTab;
