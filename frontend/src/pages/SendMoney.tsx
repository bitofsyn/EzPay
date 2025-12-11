import { useState, useEffect } from "react";
import { getAccountOwner, transferMoney, getMyAccounts } from "../api/UserAPI";
import { useNavigate } from "react-router-dom";
import * as Sentry from "@sentry/react";
import { handleTransferError } from "../utils/errorHandler";
import { TRANSACTION_CATEGORIES } from "../utils/constants";
import { Account } from "../types";

interface AccountWithMain extends Account {
  main?: boolean;
  bankName?: string;
}

interface AccountOwnerResponse {
  ownerName: string;
  accountId: number;
}

interface PredictionResult {
  category: string;
  confidence: number;
}

const SendMoney: React.FC = () => {
    const navigate = useNavigate();
    const [fromAccountId, setFromAccountId] = useState<number | null>(null);
    const [accounts, setAccounts] = useState<AccountWithMain[]>([]);
    const [toAccountNumber, setToAccountNumber] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [memo, setMemo] = useState<string>("");
    const [category, setCategory] = useState<string>("기타");
    const [confidence, setConfidence] = useState<number>(0);
    const [receiverName, setReceiverName] = useState<string>("");
    const [receiverAccountId, setReceiverAccountId] = useState<number | null>(null);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const res = await getMyAccounts();
                let accountList = res as AccountWithMain[];

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
                    const result: PredictionResult = await res.json();
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
            const data = res as AccountOwnerResponse;
            setReceiverName(data.ownerName);
            setReceiverAccountId(data.accountId);
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

        if (!fromAccountId) {
            setError("출금 계좌를 선택해주세요.");
            return;
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
            const errorMessage = handleTransferError(err);
            setError(errorMessage);
            console.error("송금 실패:", errorMessage);
            Sentry.captureException(err);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
            <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-center text-gray-800">송금하기</h2>

                <div className="mt-6 space-y-5">
                    {/* 출금 계좌 선택 */}
                    <div>
                        <label className="block text-gray-700 mb-2">출금 계좌 선택</label>
                        <select
                            value={fromAccountId || ""}
                            onChange={(e) => setFromAccountId(Number(e.target.value))}
                            className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-200 focus:outline-none"
                        >
                            {accounts.map((acc) => (
                                <option key={acc.accountId} value={acc.accountId}>
                                    {acc.bankName} ({acc.accountNumber})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* 입금 계좌 입력 */}
                    <div>
                        <label className="block text-gray-700 mb-2">입금 계좌번호</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="계좌번호 입력"
                                className="flex-1 px-4 py-2 border rounded-lg focus:ring focus:ring-blue-200 focus:outline-none"
                                value={toAccountNumber}
                                onChange={(e) => setToAccountNumber(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={handleCheckAccount}
                                className="px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-800 transition"
                            >
                                확인
                            </button>
                        </div>
                        {receiverName && (
                            <p className="text-sm text-green-600 mt-2">수신인: {receiverName}</p>
                        )}
                    </div>

                    {/* 송금 금액 */}
                    <div>
                        <label className="block text-gray-700 mb-2">송금 금액</label>
                        <input
                            type="number"
                            placeholder="금액 입력"
                            className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-200 focus:outline-none"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    {/* 메모 */}
                    <div>
                        <label className="block text-gray-700 mb-2">메모 (선택)</label>
                        <input
                            type="text"
                            placeholder="송금 메모 입력"
                            className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-200 focus:outline-none"
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                        />
                    </div>

                    {/* 카테고리 선택 */}
                    <div>
                        <label className="block text-gray-700 mb-2">카테고리 선택</label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-200 focus:outline-none"
                        >
                            {TRANSACTION_CATEGORIES.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                        {confidence > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                                AI 추천 신뢰도: {(confidence * 100).toFixed(1)}%
                            </p>
                        )}
                    </div>

                    {/* 에러 메시지 */}
                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    {/* 송금 버튼 */}
                    <button
                        type="button"
                        onClick={handleSendMoney}
                        className="w-full mt-2 bg-gray-700 text-white py-2 rounded-lg font-semibold hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                        송금하기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SendMoney;
