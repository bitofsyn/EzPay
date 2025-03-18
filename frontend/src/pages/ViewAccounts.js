import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

const dummyAccounts = [
    { id: 1, bank: "국민은행", accountNumber: "123-456-789", balance: 500000 },
    { id: 2, bank: "신한은행", accountNumber: "987-654-321", balance: 300000 },
    { id: 3, bank: "우리은행", accountNumber: "111-222-333", balance: 150000 },
]

const ViewAccounts = () => {
    const navigate = useNavigate();
    const [accounts] = useState(dummyAccounts);

    return (
        <div className="min-h-screen flex flex-col items-center bg-gray-100 p-6">
            <h2 className="text-2xl font-semibold">전체 계좌 조회</h2>

            {/* 계좌 리스트 */}
            <div className="w-full max-w-lg mt-6 bg-white shadow-md rounded-lg p-4">
                {accounts.length > 0 ? (
                    <ul className="space-y-3">
                        {accounts.map((account) => (
                            <li
                                key={account.id}
                                className="p-4 border rounded-lg bg-gray-100 flex justify-between items-center cursor-pointer hover:bg-gray-200"
                                onClick={() => navigate(`/account/${account.id}`)}
                            >
                                <div>
                                    <p className="font-semibold">{account.bank}</p>
                                    <p className="text-sm text-gray-600">{account.accountNumber}</p>
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

            {/* 대시보드 이동 버튼 */}
            <Button
                text="대시보드로 이동"
                className="mt-6 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                onClick={() => navigate("/dashboard")}
            />
        </div>
    );
};


export default ViewAccounts;