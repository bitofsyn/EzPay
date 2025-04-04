import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { getMyAccounts, getTransactionHistory, transferMoney, getAccountOwner } from "../api/userAPI";

const AccountDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [account, setAccount] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [animatedBalance, setAnimatedBalance] = useState(0);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [toAccount, setToAccount] = useState("");
    const [amount, setAmount] = useState("");

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

    useEffect(() => {
        if (!account) return;
        let current = 0;
        const step = Math.ceil(account.balance / 30);
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

    const handleTransfer = async () => {
        if (!toAccount || !amount) {
            alert("받는 계좌번호와 금액을 입력해주세요.");
            return;
        }

        if (parseInt(amount) <= 0) {
            alert("송금 금액은 1원 이상이어야 합니다.");
            return;
        }

        if (toAccount === account.accountNumber) {
            alert("본인 계좌로는 송금할 수 없습니다.");
            return;
        }

        try {
            const receiverRes = await getAccountOwner(toAccount);
            const toAccountId = receiverRes.data.accountId;

            await transferMoney({
                fromAccountId: account.accountId,
                toAccountId: toAccountId,
                amount: parseInt(amount),
            });

            alert("송금 완료!");
            setIsModalOpen(false);
            setToAccount("");
            setAmount("");

            // ✅ 잔액 업데이트
            const accountsAfter = await getMyAccounts();
            const updatedAccount = accountsAfter.data.find((acc) => acc.accountId === account.accountId);
            setAccount(updatedAccount);

            // ✅ 거래 내역 최신순 정렬
            const updatedTx = await getTransactionHistory(account.accountId);
            const sortedTx = [...updatedTx.data].sort(
                (a, b) => new Date(b.transactionDate) - new Date(a.transactionDate)
            );
            setTransactions(sortedTx);

        } catch (err) {
            if (err.response?.status === 404) {
                alert("존재하지 않는 계좌번호입니다.");
            } else if (err.response?.status === 400) {
                alert("송금 조건이 맞지 않습니다. (잔액 부족 등)");
            } else {
                alert("송금에 실패했습니다.");
            }
            console.error("송금 실패:", err.response?.data || err.message);
        }
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
            <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md text-center">
                <h2 className="text-2xl font-bold text-slate-800">{account.bankName}</h2>
                <p className="text-gray-400 text-sm tracking-widest mt-1">{formattedAccountNumber}</p>
                <p className="text-4xl font-bold text-gray-800 mt-4">
                    {animatedBalance.toLocaleString()} 원
                </p>
            </div>

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

            <div className="mt-8 flex gap-4">
                <Button
                    text="송금하기"
                    className="bg-[#1e293b] text-white px-6 py-2 rounded-xl font-semibold shadow-md hover:bg-[#334155] transition"
                    onClick={() => setIsModalOpen(true)}
                />
                <Button
                    text="전체 계좌 조회"
                    className="bg-[#64748b] text-white px-6 py-2 rounded-xl font-semibold shadow-md hover:bg-[#475569] transition"
                    onClick={() => navigate("/accounts")}
                />
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-sm">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">송금하기</h2>

                        <label className="text-sm text-gray-600">받는 계좌번호</label>
                        <input
                            type="text"
                            value={toAccount}
                            onChange={(e) => setToAccount(e.target.value)}
                            className="w-full mt-1 mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
                            placeholder="000012345678"
                        />

                        <label className="text-sm text-gray-600">금액</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full mt-1 mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring focus:ring-blue-200"
                            placeholder="5000"
                        />

                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 text-sm rounded-lg bg-gray-200 hover:bg-gray-300"
                            >
                                취소
                            </button>
                            <button
                                onClick={handleTransfer}
                                className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                            >
                                송금
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountDetail;