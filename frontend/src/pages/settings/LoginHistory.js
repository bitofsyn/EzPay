import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getLoginHistory } from "../../api/UserAPI";

const LoginHistory = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLoginLogs = async () => {
            try {
                const userData = JSON.parse(localStorage.getItem("user"));
                console.log("로그인 기록 : ", userData);
                const res = await getLoginHistory(userData.data.id);
                setLogs(res.data);
            } catch (err) {
                toast.error("로그인 기록을 불러오지 못했습니다.");
            } finally {
                setLoading(false);
            }
        };
        fetchLoginLogs();
    }, []);

    if (loading) {
        return <div className="text-center">로딩 중...</div>;
    }

    return (
        <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold text-gray-800">최근 로그인 기록</h2>
            {logs.length === 0 ? (
                <p className="text-gray-600 mt-4">기록이 없습니다.</p>
            ) : (
                <ul className="mt-4 space-y-3">
                    {logs.map((log, idx) => (
                        <li
                            key={idx}
                            className="flex justify-between items-center p-3 border rounded-md"
                        >
                            <div>
                                <p className="text-sm text-gray-800 font-medium">
                                    {log.device || "알 수 없는 기기"}
                                </p>
                                <p className="text-xs text-gray-500">{log.ip || "IP 미상"}</p>
                            </div>
                            <span className="text-xs text-gray-400">{log.timestamp}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default LoginHistory;
