import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";

const dummyTransactions = [
    { id: 1, type: "입금", amount: 500000, date: "2024-12-01", account: "국민은행 123-456-789" },
    { id: 2, type: "송금", amount: -150000, date: "2024-03-05", account: "신한은행 987-654-321" },
    { id: 3, type: "출금", amount: -100000, date: "2024-03-10", account: "우리은행 111-222-333" },
    { id: 4, type: "입금", amount: 200000, date: "2024-03-15", account: "하나은행 555-666-777" },
    { id: 5, type: "송금", amount: -50000, date: "2024-03-20", account: "카카오뱅크 999-888-777" },
]

const TransactionHistory = () => {
    const navigate = useNavigate();
    const [transactions] = useState(dummyTransactions);
    const [filterType, setFilterType] = useState("전체");
    const [dateFilter, setDateFilter] = useState("전체");

    // 필터링된 거래 내역 반환
    const filteredTransactions = transactions.filter((tx) => {
        let isValid = true;

        // 거래 유형 필터링
        if (filterType !== "전체" && tx.type !== filterType) {
            isValid = false;
        }

        // 날짜 필터링 (단순하게 최근 3개월 이하만 확인)
        const transactionDate = new Date(tx.date);
        const currentDate = new Date();

        if (dateFilter === "1개월") {
            const oneMonthAgo = new Date();
            oneMonthAgo.setMonth(currentDate.getMonth() - 1);
            if (transactionDate < oneMonthAgo) isValid = false;
        } else if (dateFilter === "3개월") {
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(currentDate.getMonth() - 3);
            if (transactionDate < threeMonthsAgo) isValid = false;
        } else if (dateFilter === "6개월") {
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(currentDate.getMonth() - 6);
            if (transactionDate < sixMonthsAgo) isValid = false;
        }

        return isValid;
    });

    return (
        <div className="min-h-screen flex flex-col items-center bg-gray-100 p-6">
            <h2 className="text-2xl font-semibold">거래 내역 조회</h2>

            {/* 필터링 옵션 */}
            <div className="flex space-x-4 mt-6">
                <select
                    className="px-4 py-2 border rounded-lg"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="전체">전체</option>
                    <option value="입금">입금</option>
                    <option value="출금">출금</option>
                    <option value="송금">송금</option>
                </select>

                <select
                    className="px-4 py-2 border rounded-lg"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                >
                    <option value="전체">전체 기간</option>
                    <option value="1개월">최근 1개월</option>
                    <option value="3개월">최근 3개월</option>
                    <option value="6개월">최근 6개월</option>
                </select>
            </div>

            {/* 거래 내역 리스트 */}
            <div className="w-full max-w-lg mt-6 bg-white shadow-md rounded-lg p-4">
                {filteredTransactions.length > 0 ? (
                    <ul className="space-y-3">
                        {filteredTransactions.map((tx) => (
                            <li key={tx.id} className="p-3 border rounded-lg bg-gray-100 flex justify-between">
                                <div>
                                    <p className="font-semibold">{tx.type}</p>
                                    <p className="text-sm text-gray-600">{tx.account}</p>
                                    <p className="text-sm text-gray-400">{tx.date}</p>
                                </div>
                                <p className={`font-semibold ${tx.amount < 0 ? "text-red-500" : "text-green-500"}`}>
                                    {tx.amount.toLocaleString()} 원
                                </p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-600 text-center">거래 내역이 없습니다.</p>
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

export default TransactionHistory;