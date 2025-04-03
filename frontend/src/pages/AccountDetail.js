import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { getMyAccounts, getTransactionHistory } from "../api/userAPI";

const AccountDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [account, setAccount] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [animatedBalance, setAnimatedBalance] = useState(0);

    useEffect(() => {
        const fetchAccountData = async () => {
            try {
                const accounts = await getMyAccounts();
                const found = accounts.data.find((acc) => acc.accountId === parseInt(id));
                setAccount(found);

                const tx = await getTransactionHistory(id);
                setTransactions(tx.data);
            } catch (err) {
                console.error("계좌 상세 정보 불러오기 실패 : ", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAccountData();
    }, [id]);

    // 카운트업 애니메이션
    useEffect(() => {
        if (!account) return;
        let current = 0;
        const step = Math.ceil(account.balance / 30); // 30 frame
        const interval = setInterval(() => {
            current += step;
            if (current >= account.balance) {
                setAnimatedBalance(account.balance);
                clearInterval(interval);
            } else {
                setAnimatedBalance(current);
            }
        }, 20);
        return () => clearInterval(interval);
    }, [account]);

    const formatDate = (isoDate) => {
        return isoDate.split("T")[0].replace(/-/g, ".");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f9fafb] flex flex-col items-center justify-center space-y-4 px-6">
                <div className="w-full max-w-md animate-pulse space-y-4">
                    <div className="h-20 bg-gray-200 rounded-xl"></div>
                    <div className="h-40 bg-gray-200 rounded-xl"></div>
                </div>
            </div>
        );
    }

    if (!account) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
                <h2 className="text-2xl font-semibold text-red-500">계좌를 찾을 수 없습니다.</h2>
                <Button
                    text="전체 계좌 조회"
                    className="mt-4 bg-[#64748b] text-white px-6 py-2 rounded-xl font-semibold hover:bg-[#475569] transition"
                    onClick={() => navigate("/accounts")}
                />
            </div>
        );
    }

    const formattedAccountNumber = account.accountNumber.replace(/(\d{2})(\d{4})(\d{4})/, "$1-$2-$3");

    return (
        <div className="min-h-screen flex flex-col items-center bg-[#f9fafb] px-4 py-10">
            {/* 계좌 정보 */}
            <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md text-center">
                <h2 className="text-2xl font-bold text-slate-800">{account.bankName}</h2>
                <p className="text-gray-400 text-sm tracking-widest mt-1">{formattedAccountNumber}</p>
                <p className="text-4xl font-bold text-gray-800 mt-4">
                    {animatedBalance.toLocaleString()} 원
                </p>
            </div>

            {/* 거래 내역 */}
            <div className="w-full max-w-md mt-8 bg-white shadow-lg rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">최근 거래 내역</h3>
                {transactions.length > 0 ? (
                    <ul className="space-y-3">
                        {transactions.map((tx) => (
                            <li
                                key={tx.id}
                                className="p-4 bg-white rounded-xl shadow border border-gray-100 flex justify-between items-center hover:shadow-md transition"
                            >
                                <div>
                                    <p className="font-semibold text-slate-800">
                                        {tx.type === "DEPOSIT" ? "입금" : "출금"}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">{formatDate(tx.transactionDate)}</p>
                                </div>
                                <p
                                    className={`text-base font-bold ${tx.type === "DEPOSIT" ? "text-green-500" : "text-rose-500"
                                        }`}
                                >
                                    {tx.amount.toLocaleString()} 원
                                </p>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">거래 내역이 없습니다.</p>
                )}
            </div>

            {/* 버튼 영역 */}
            <div className="mt-8 flex gap-4">
                <Button
                    text="송금하기"
                    className="bg-[#1e293b] text-white px-6 py-2 rounded-xl font-semibold shadow-md hover:bg-[#334155] transition"
                    onClick={() => navigate("/send")}
                />
                <Button
                    text="전체 계좌 조회"
                    className="bg-[#64748b] text-white px-6 py-2 rounded-xl font-semibold shadow-md hover:bg-[#475569] transition"
                    onClick={() => navigate("/accounts")}
                />
            </div>
        </div>
    );
};

export default AccountDetail;
