import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { getTransactionHistory, getMyAccounts } from "../api/UserAPI";
import { ArrowDownCircle, ArrowUpCircle, Copy } from "lucide-react";

const TransactionHistory = () => {
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [myAccountNumber, setMyAccountNumber] = useState("");
    const [filterType, setFilterType] = useState("전체");
    const [dateFilter, setDateFilter] = useState("전체");

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const accountRes = await getMyAccounts();
                if (accountRes.status === "success" && accountRes.data.length > 0) {
                    const account = accountRes.data[0];
                    setMyAccountNumber(account.accountNumber);

                    const txRes = await getTransactionHistory(account.accountId);
                    if (txRes.status === "success") {
                        setTransactions(txRes.data);
                    }
                }
            } catch (err) {
                console.error("거래 내역 조회 실패:", err);
            }
        };
        fetchTransactions();
    }, []);

    const filteredTransactions = transactions.filter((tx) => {
        let isValid = true;

        if (filterType !== "전체") {
            if (filterType === "입금" && tx.receiverAccount.accountNumber !== myAccountNumber) isValid = false;
            if (filterType === "송금" && tx.senderAccount.accountNumber !== myAccountNumber) isValid = false;
        }

        const transactionDate = new Date(tx.transactionDate);
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

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
    };

    // 계좌번호 포맷 (2-3-3)
    const formatAccountNumber = (accountNumber) => {
        if (!accountNumber || accountNumber.length < 8) return accountNumber;
        return `${accountNumber.slice(0, 2)}-${accountNumber.slice(2, 5)}-${accountNumber.slice(5)}`;
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert("계좌번호가 복사되었습니다.");
    };

    return (
        <div className="min-h-screen flex flex-col items-center bg-gray-100 p-6">
            <h2 className="text-2xl font-semibold">거래 내역 조회</h2>

            {/* 필터 옵션 */}
            <div className="flex space-x-4 mt-6 bg-white shadow-md rounded-lg p-4">
                <select
                    className="px-4 py-2 border rounded-lg"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="전체">전체</option>
                    <option value="입금">입금</option>
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
            <div className="w-full max-w-lg mt-6 space-y-3">
                {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => {
                        const isSent = tx.senderAccount.accountNumber === myAccountNumber;
                        const targetAccount = isSent
                            ? tx.receiverAccount.accountNumber
                            : tx.senderAccount.accountNumber;
                        return (
                            <div
                                key={tx.transactionId}
                                className="flex justify-between items-center bg-white shadow-sm rounded-xl p-4 hover:shadow-md transition"
                            >
                                <div className="flex items-center space-x-3">
                                    {isSent ? (
                                        <ArrowUpCircle className="text-red-500" />
                                    ) : (
                                        <ArrowDownCircle className="text-green-500" />
                                    )}
                                    <div>
                                        <p className="font-semibold">{isSent ? "송금" : "입금"}</p>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <p className="text-xs text-gray-500">
                                                {formatAccountNumber(targetAccount)}
                                            </p>
                                            <Copy
                                                className="w-4 h-4 text-gray-400 cursor-pointer"
                                                onClick={() => copyToClipboard(targetAccount)}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400">{formatDate(tx.transactionDate)}</p>
                                    </div>
                                </div>
                                <p className={`font-bold ${isSent ? "text-red-500" : "text-green-500"}`}>
                                    {Number(tx.amount).toLocaleString()} 원
                                </p>
                            </div>
                        );
                    })
                ) : (
                    <p className="text-gray-600 text-center">거래 내역이 없습니다.</p>
                )}
            </div>

            {/* 대시보드 이동 */}
            <Button
                text="대시보드로 이동"
                className="mt-8 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
                onClick={() => navigate("/dashboard")}
            />
        </div>
    );
};

export default TransactionHistory;
