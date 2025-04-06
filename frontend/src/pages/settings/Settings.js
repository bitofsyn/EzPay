import { useEffect, useState } from "react";
import { getUserInfo } from "../../api/userAPI";

const Settings = () => {
    const [user, setUser] = useState({ name: "", email: "" });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const user = await getUserInfo(); // user 객체만 반환된다고 가정
                console.log("res : ", user);
                setUser(user); // ✅ 바로 저장
            } catch (err) {
                console.error("사용자 정보 조회 실패", err);
            } finally {
                setLoading(false);
            }
        };
        fetchInfo();
    }, []);

    if (loading) {
        return <div className="flex justify-center items-center h-full">로딩 중...</div>;
    }

    return (
        <section className="bg-white p-6 rounded-xl shadow space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">사용자 정보</h2>
            <p className="text-sm text-gray-600">이름: {user.data.name}</p>
            <p className="text-sm text-gray-600">이메일: {user.data.email}</p> 
        </section>
    );
};

export default Settings;
