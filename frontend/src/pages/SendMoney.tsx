import { useState, useEffect, useCallback, useMemo } from "react";
import { getAccountOwner, transferMoney, getMyAccounts } from "../api/UserAPI";
import { useNavigate } from "react-router-dom";
import * as Sentry from "@sentry/react";
import toast from "react-hot-toast";
import { handleTransferError } from "../utils/errorHandler";
import { TRANSACTION_CATEGORIES } from "../utils/constants";
import { Account } from "../types";
import { formatAccountNumber, formatAmount as formatDisplayAmount } from "../utils/formatters";

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

// 입력용 금액 포맷팅 (콤마 추가)
const formatInputAmount = (value: string): string => {
  const numericValue = value.replace(/[^\d]/g, "");
  if (!numericValue) return "";
  return Number(numericValue).toLocaleString("ko-KR");
};

// 입력값에서 숫자만 추출
const parseAmount = (value: string): number => {
  return Number(value.replace(/[^\d]/g, "")) || 0;
};

// 빠른 금액 버튼 옵션
const QUICK_AMOUNTS = [10000, 50000, 100000, 500000];

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
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isCheckingAccount, setIsCheckingAccount] = useState<boolean>(false);
    const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

    // 선택한 출금 계좌 정보
    const selectedAccount = useMemo(() => {
        return accounts.find(acc => acc.accountId === fromAccountId);
    }, [accounts, fromAccountId]);

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


    // 메모 변경 시 자동 카테고리 예측 (디바운싱 적용)
    useEffect(() => {
        if (memo.trim().length <= 1) {
            return;
        }

        const timeoutId = setTimeout(async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_AI_SERVICE_URL}/predict-prob`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text: memo }),
                });
                const result: PredictionResult = await res.json();

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
        }, 500); // 500ms 디바운싱

        return () => clearTimeout(timeoutId);
    }, [memo]);

    // 계좌 확인 (Promise 반환하도록 수정)
    const handleCheckAccount = useCallback(async (): Promise<AccountOwnerResponse | null> => {
        setIsCheckingAccount(true);
        try {
            const res = await getAccountOwner(toAccountNumber);
            const data = res as AccountOwnerResponse;
            setReceiverName(data.ownerName);
            setReceiverAccountId(data.accountId);
            setError("");
            return data;
        } catch (err) {
            setError("존재하지 않는 계좌번호입니다.");
            setReceiverName("");
            setReceiverAccountId(null);
            return null;
        } finally {
            setIsCheckingAccount(false);
        }
    }, [toAccountNumber]);

    // 빠른 금액 추가
    const handleQuickAmount = (quickAmount: number) => {
        const currentAmount = parseAmount(amount);
        const newAmount = currentAmount + quickAmount;
        setAmount(formatInputAmount(String(newAmount)));
    };

    // 금액 입력 핸들러
    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatInputAmount(e.target.value);
        setAmount(formatted);
    };

    // 송금 전 유효성 검사
    const validateTransfer = async (): Promise<boolean> => {
        if (!toAccountNumber || !amount) {
            setError("계좌번호와 금액을 입력해주세요.");
            return false;
        }

        const parsedAmount = parseAmount(amount);
        if (parsedAmount <= 0) {
            setError("송금 금액은 1원 이상이어야 합니다.");
            return false;
        }

        if (!fromAccountId) {
            setError("출금 계좌를 선택해주세요.");
            return false;
        }

        // 잔액 확인
        if (selectedAccount && parsedAmount > selectedAccount.balance) {
            setError("잔액이 부족합니다.");
            return false;
        }

        // 본인 계좌로 송금 방지
        if (selectedAccount && selectedAccount.accountNumber === toAccountNumber) {
            setError("본인 계좌로는 송금할 수 없습니다.");
            return false;
        }

        // 수신자 확인이 안된 경우 확인 시도
        if (!receiverAccountId || !receiverName) {
            const result = await handleCheckAccount();
            if (!result) {
                setError("계좌 확인에 실패했습니다.");
                return false;
            }
        }

        return true;
    };

    // 송금 확인 모달 열기
    const handleOpenConfirmModal = async () => {
        const isValid = await validateTransfer();
        if (isValid) {
            setShowConfirmModal(true);
        }
    };

    // 실제 송금 실행
    const handleConfirmTransfer = async () => {
        setShowConfirmModal(false);
        setIsLoading(true);

        try {
            const transferData = {
                fromAccountId: fromAccountId!,
                toAccountId: receiverAccountId!,
                amount: parseAmount(amount),
                memo,
                category,
            };
            await transferMoney(transferData);
            toast.success("송금이 완료되었습니다!");
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
        } finally {
            setIsLoading(false);
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
                                    {acc.bankName} ({formatAccountNumber(acc.accountNumber)})
                                </option>
                            ))}
                        </select>
                        {/* 선택한 계좌 잔액 표시 */}
                        {selectedAccount && (
                            <p className="text-sm text-gray-600 mt-2">
                                잔액: <span className="font-semibold text-blue-600">{formatDisplayAmount(selectedAccount.balance)}원</span>
                            </p>
                        )}
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
                                onChange={(e) => {
                                    setToAccountNumber(e.target.value);
                                    // 계좌번호 변경 시 수신인 정보 초기화
                                    setReceiverName("");
                                    setReceiverAccountId(null);
                                }}
                            />
                            <button
                                type="button"
                                onClick={handleCheckAccount}
                                disabled={isCheckingAccount}
                                className="px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {isCheckingAccount ? "확인 중..." : "확인"}
                            </button>
                        </div>
                        {receiverName && (
                            <p className="text-sm text-gray-600 mt-2">
                                수신인: <span className="font-semibold text-blue-600">{receiverName}</span>
                            </p>
                        )}
                    </div>

                    {/* 송금 금액 */}
                    <div>
                        <label className="block text-gray-700 mb-2">송금 금액</label>
                        <input
                            type="text"
                            placeholder="금액 입력"
                            className="w-full px-4 py-2 border rounded-lg focus:ring focus:ring-blue-200 focus:outline-none"
                            value={amount}
                            onChange={handleAmountChange}
                        />
                        {/* 빠른 금액 버튼 */}
                        <div className="flex gap-2 mt-2">
                            {QUICK_AMOUNTS.map((quickAmount) => (
                                <button
                                    key={quickAmount}
                                    type="button"
                                    onClick={() => handleQuickAmount(quickAmount)}
                                    className="flex-1 px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                                >
                                    +{(quickAmount / 10000).toFixed(0)}만
                                </button>
                            ))}
                        </div>
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
                        onClick={handleOpenConfirmModal}
                        disabled={isLoading}
                        className="w-full mt-2 bg-gray-700 text-white py-2 rounded-lg font-semibold hover:bg-gray-800 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                송금 중...
                            </>
                        ) : (
                            "송금하기"
                        )}
                    </button>
                </div>
            </div>

            {/* 송금 확인 모달 */}
            {showConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-80">
                        <h3 className="text-lg font-semibold mb-4 text-gray-800">송금 확인</h3>
                        <div className="space-y-3 text-sm text-gray-600">
                            <div className="flex justify-between">
                                <span>받는 분</span>
                                <span className="font-medium text-gray-800">{receiverName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>송금 금액</span>
                                <span className="font-medium text-blue-600">{amount}원</span>
                            </div>
                            {memo && (
                                <div className="flex justify-between">
                                    <span>메모</span>
                                    <span className="font-medium text-gray-800">{memo}</span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span>카테고리</span>
                                <span className="font-medium text-gray-800">{category}</span>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                                onClick={() => setShowConfirmModal(false)}
                            >
                                취소
                            </button>
                            <button
                                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition"
                                onClick={handleConfirmTransfer}
                            >
                                확인
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SendMoney;
