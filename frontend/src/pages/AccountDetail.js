// import { useState, useEffect } from "react"; // 나중에 backend와 연동할때 사용
import { useParams, useNavigate } from "react-router-dom";
import Button from "../components/Button";

const dummyAccounts = [
    { id: 1, bank: "국민은행", accountNumber: "123-456-789", balance: 500000 },
    { id: 2, bank: "신한은행", accountNumber: "987-654-321", balance: 300000 },
    { id: 3, bank: "우리은행", accountNumber: "111-222-333", balance: 150000 },
];

const dummyTransactions = {
    1: [
        { id: 1, type: "입금", amount: 200000, date: "2024-03-10" },
        { id: 2, type: "송금", amount: -50000, date: "2024-03-15" },
    ],
    2: [{ id: 3, type: "출금", amount: -100000, date: "2024-03-12" }],
    3: [],
};

const AccountDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const account = dummyAccounts.find((acc) => acc.id === parseInt(id));
    const transactions = dummyTransactions[id] || [];

    if (!account) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
                <h2 className="text-2xl font-semibold text-red-500">계좌를 찾을 수 없습니다.</h2>
                <Button
                    text="전체 계좌 조회"
                    className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                    onClick={() => navigate("/accounts")}
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center bg-gray-100 p-6">
            <h2 className="text-2xl font-semibold">{account.bank}</h2>
            <p className="text-gray-700">{account.accountNumber}</p>
            <p className="text-3xl font-bold text-blue-500 mt-4">
                {account.balance.toLocaleString()} 원
            </p>

            {/* 최근 거래 내역 */}
            <div className="w-full max-w-lg mt-6 bg-white shadow-md rounded-lg p-4">
                <h3 className="text-lg font-semibold">최근 거래 내역</h3>
                {transactions.length > 0 ? (
                    <ul className="space-y-3 mt-2">
                        {transactions.map((tx) => (
                            <li key={tx.id} className="p-3 border rounded-lg bg-gray-100 flex justify-between">
                                <p className="font-semibold">{tx.type}</p>
                                <p className={`font-semibold ${tx.amount < 0 ? "text-red-500" : "text-green-500"}`}>
                                    {tx.amount.toLocaleString()} 원
                                </p>
                                <p className="text-sm text-gray-500">{tx.date}</p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-600 mt-2">거래 내역이 없습니다.</p>
                )}
            </div>

            {/* 버튼 영역 */}
            <div className="mt-6 flex space-x-4">
                <Button
                    text="송금하기"
                    className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
                    onClick={() => navigate("/send-money")}
                />
                <Button
                    text="전체 계좌 조회"
                    className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                    onClick={() => navigate("/accounts")}
                />
            </div>
        </div>
    );
};

export default AccountDetail;
