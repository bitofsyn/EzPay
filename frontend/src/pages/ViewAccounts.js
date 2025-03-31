import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { getMyAccounts } from "../api/api";

const ViewAccounts = () => {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const token = localStorage.getItem("userToken");
                if (!token) {
                    setError("로그인이 필요합니다.");
                    setLoading(false);
                    return;
                }

                const data = await getMyAccounts(token);
                console.log("===== data :", data);
                setAccounts(data.data);
            } catch (err) {
                console.err("계좌 조회 실패 :", err);
                setError("계좌 정보를 불러오는데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        };
        fetchAccounts();
    }, []);

    const formatAccountNumber = (number) => {
        return `${number.slice(0, 2)}-${number.slice(2, 6)}-${number.slice(6)}`;
    };

    return (
        <div className="min-h-screen flex flex-col items-center bg-gray-100 p-6">
            <h2 className="text-2xl font-semibold">전체 계좌 조회</h2>

            <div className="w-full max-w-lg mt-6 bg-white shadow-md rounded-lg p-4">
                {loading ? (
                    <p className="text-center text-gray-600">불러오는 중...</p>
                ) : error ? (
                    <p className="text-center text-red-500">{error}</p>
                ) : accounts.length > 0 ? (
                    <ul className="space-y-3">
                        {accounts.map((account) => (
                            <li
                                key={account.accountId}
                                className="p-4 border rounded-lg bg-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-200"
                                onClick={() => navigate(`/account/${account.accountId}`)}
                            >
                                <div>
                                    <p className="font-semibold">{account.bankName}</p>
                                    <p className="text-sm text-gray-600">{formatAccountNumber(account.accountNumber)}</p>
                                </div>
                                <p className="font-semibold text-blue-500">
                                    {account.balance.toLocaleString()} 원
                                </p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center">
                        <p className="text-gray-600">보유한 계좌가 없습니다.</p>
                        <Button
                            text="새 계좌 개설"
                            className="mt-4 bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
                            onClick={() => navigate("/create-account")}
                        />
                    </div>
                )}
            </div>

            <Button
                text="대시보드로 이동"
                className="mt-6 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                onClick={() => navigate("/dashboard")}
            />
        </div>
    );
};

export default ViewAccounts;