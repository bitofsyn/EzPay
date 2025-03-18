import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Card from "../components/Card";
import Input from "../components/Input";
import { getUserInfo, updatePassword } from "../api/api";


const Settings = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState({ name: "", email: "" });
    const [loading, setLoading] = useState(true);
    const [oldPassword, setOldpassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        const fetchUserInfo = async () => {
            const token = localStorage.getItem("userToken");
            if (!token) {
                navigate("/login");
                return;
            }
            const data = await getUserInfo(token);
            setUser({ name: data.name, email: data.email });
            setLoading(false);
        };
        fetchUserInfo();
    }, [navigate]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
    }

    const handlePasswordChange = async () => {
        if (newPassword !== confirmPassword) {
            alert("비밀번호가 일치하지 않습니다.");
            return;
        }

        const token = localStorage.getItem("userToken");
        const response = await updatePassword(token, {
            oldPassword,
            newPassword
        });

        if (response.success) {
            alert("비밀번호가 성공적으로 변경되었습니다.");
            setOldpassword("");
            setNewPassword("");
            setConfirmPassword("");
        } else {
            alert(response.message || "비밀번호 변경에 실패했습니다.");
        }
    };





    return (
        <div className="min-h-screen flex flex-col items-center bg-background p-6">
            <h2 className="text-2xl font-semibold text-text">환경설정</h2>

            <Card className="w-full max-w-lg mt-6">
                <h3 className="text-lg font-semibold">사용자 정보</h3>
                <p className="mt-2"><strong>이름:</strong> {user.name}</p>
                <p className="mt-2"><strong>이메일:</strong> {user.email}</p>
            </Card>

            <Card className="w-full max-w-lg mt-6">
                <h3 className="text-lg font-semibold">비밀번호 변경</h3>
                <Input
                    type="password"
                    placeholder="현재 비밀번호"
                    value={oldPassword}
                    onChange={(e) => setOldpassword(e.target.value)}
                />
                <Input
                    type="password"
                    placeholder="새 비밀번호"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input
                    type="password"
                    placeholder="새 비밀번호 확인"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button text="비밀번호 변경" className="mt-4" onClick={handlePasswordChange} />
            </Card>

            <Button
                text="로그아웃"
                className="mt-6 bg-danger hover:bg-red-700"
                onClick={() => {
                    localStorage.removeItem("userToken");
                    navigate("/login");
                }}
            />
        </div>
    );
};

export default Settings;
