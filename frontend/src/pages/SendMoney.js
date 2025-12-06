import { useState, useEffect } from "react";
import Input from "../components/Input";
import { getAccountOwner, transferMoney, getMyAccounts } from "../api/UserAPI";
import { useNavigate } from "react-router-dom";
import * as Sentry from "@sentry/react";

const SendMoney = () => {
    const navigate = useNavigate();
    const [fromAccountId, setFromAccountId] = useState(null);
    const [accounts, setAccounts] = useState([]);
    const [toAccountNumber, setToAccountNumber] = useState("");
    const [amount, setAmount] = useState("");
    const [memo, setMemo] = useState("");
    const [category, setCategory] = useState("기타");
    const [confidence, setConfidence] = useState(0); // 예측 신뢰도
    const [receiverName, setReceiverName] = useState("");
    const [receiverAccountId, setReceiverAccountId] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const res = await getMyAccounts();
                let accountList = res.data;

                // 대표 계좌가 맨 앞에 오도록 정렬
                accountList.sort((a, b) => (b.main === true ? 1 : -1));

                setAccounts(accountList);

                // 대표 계좌로 초기 설정
                const mainAccount = accountList.find(acc => acc.main) || accountList[0];
                setFromAccountId(mainAccount.accountId);
            } catch (err) {
                console.error("계좌 목록 불러오기 실패", err);
            }
        };
        fetchAccounts();
    }, []);


    // 메모 변경 시 자동 카테고리 예측
    useEffect(() => {
        const predictCategory = async () => {
            if (memo.trim().length > 1) {
                try {
                    const res = await fetch(`${import.meta.env.VITE_AI_SERVICE_URL}/predict-prob`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ text: memo }),
                    });
                    const result = await res.json();
                    console.log("[예측 결과]", result);

                    if (result.confidence < 0.4) {
                        setCategory("기타");
                    } else {
                        setCategory(result.category);
                    }

                    setConfidence(result.confidence);
                } catch (error) {
                    console.error("카테고리 예측 실패", error);
                    Sentry.captureException(error);
                }
            }
        };
        predictCategory();
    }, [memo]);

    const handleCheckAccount = async () => {
        try {
            const res = await getAccountOwner(toAccountNumber);
            setReceiverName(res.data.ownerName);
            setReceiverAccountId(res.data.accountId);
            setError("");
        } catch (err) {
            setError("존재하지 않는 계좌번호입니다.");
            setReceiverName("");
            setReceiverAccountId(null);
        }
    };

    const handleSendMoney = async () => {
        if (!toAccountNumber || !amount) {
            setError("계좌번호와 금액을 입력해주세요.");
            return;
        }

        const parsedAmount = Number(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            setError("송금 금액은 1원 이상이어야 합니다.");
            return;
        }

        if (!receiverAccountId || !receiverName) {
            await handleCheckAccount();
            if (!receiverAccountId) {
                setError("계좌 확인에 실패했습니다.");
                return;
            }
        }

        try {
            const transferData = {
                fromAccountId,
                toAccountId: receiverAccountId,
                amount: parsedAmount,
                memo,
                category,
            };
            await transferMoney(transferData);
            alert("송금 완료!");
            navigate(`/account/${fromAccountId}`);

            // 초기화
            setToAccountNumber("");
            setAmount("");
            setMemo("");
            setCategory("기타");
            setReceiverName("");
            setReceiverAccountId(null);
            setError("");
            setConfidence(0);
        } catch (err) {
            const knownMessages = {
                "송금 한도 정보를 찾을 수 없습니다.": "송금 한도 설정이 되어 있지 않습니다. 관리자에게 문의해주세요.",
                "잔액이 부족합니다.": "출금 계좌에 잔액이 부족합니다.",
                "계좌가 존재하지 않습니다.": "존재하지 않는 계좌입니다.",
            };
            const errorMessage = knownMessages[err.response?.data?.message] || err.response?.data?.message || "송금에 실패했습니다. 다시 시도해주세요.";
            setError(errorMessage);
            console.error("송금 실패:", errorMessage);
            Sentry.captureException(err);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8f9fa] px-4 py-12 flex flex-col items-center">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 space-y-6 border border-gray-100">
                <h2 className="text-2xl font-semibold text-center text-gray-800">송금하기</h2>

                <div className="space-y-2">
                    <label className="text-sm text-gray-600 font-medium">출금 계좌 선택</label>
                    <select
                        value={fromAccountId || ""}
                        onChange={(e) => setFromAccountId(Number(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    >
                        {accounts.map((acc) => (
                            <option key={acc.accountId} value={acc.accountId}>
                                {acc.bankName} ({acc.accountNumber})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex w-full gap-2">
                    <input
                        type="text"
                        placeholder="계좌번호 입력"
                        className="w-3/4 h-12 px-4 rounded-xl border border-gray-300 focus:outline-none focus:ring focus:ring-blue-200"
                        value={toAccountNumber}
                        onChange={(e) => setToAccountNumber(e.target.value)}
                    />
                    <button
                        onClick={handleCheckAccount}
                        className="w-1/4 h-12 bg-[#1E293B] text-white font-semibold rounded-xl shadow hover:bg-[#0f172a]"
                    >
                        계좌 확인
                    </button>
                </div>

                {receiverName && (
                    <p className="text-sm text-green-600 font-medium">수신인: {receiverName}</p>
                )}

                <Input
                    label="송금할 금액"
                    type="number"
                    placeholder="금액 입력"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />

                <Input
                    label="메모"
                    type="text"
                    placeholder="송금 메모 입력"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                />

                <div className="space-y-1">
                    <label className="text-sm text-gray-600 font-medium">카테고리 선택</label>
                    <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
                    >
                        <option value="식비">식비</option>
                        <option value="교통">교통</option>
                        <option value="주거">주거</option>
                        <option value="가족">가족</option>
                        <option value="기타">기타</option>
                    </select>
                    {confidence > 0 && (
                        <p className="text-xs text-gray-500">
                            AI 추천 신뢰도: {(confidence * 100).toFixed(1)}%
                        </p>
                    )}
                </div>

                {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

                <div className="flex justify-center mt-4">
                    <button
                        onClick={handleSendMoney}
                        className="bg-[#1E293B] text-white font-semibold px-6 py-2 rounded-xl shadow hover:bg-[#0f172a] transition"
                    >
                        송금하기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SendMoney;
