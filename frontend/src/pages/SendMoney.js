import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import { transferMoney, getAccountOwner, getMyAccounts } from "../api/userAPI";

const banks = ["KB국민은행", "신한은행", "우리은행", "하나은행", "기업은행", "NH농협은행", "카카오뱅크", "토스뱅크"];

const SendMoney = () => {
    const navigate = useNavigate();

    const [selectedBank, setSelectedBank] = useState(banks[0]);
    const [receiverAccount, setReceiverAccount] = useState("");
    const [receiverAccountId, setReceiverAccountId] = useState(null);
    const [amount, setAmount] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [receiverName, setReceiverName] = useState("");
    const [error, setError] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [fromAccountId, setFromAccountId] = useState(null); // ⭐️ 동적 계좌 ID

    // 내 계좌 조회해서 대표 계좌 세팅
    useEffect(() => {
        const fetchMyAccount = async () => {
            try {
                const res = await getMyAccounts();
                if (res.status === "success" && res.data.length > 0) {
                    setFromAccountId(res.data[0].accountId); // ⭐️ 첫 번째 계좌 (대표계좌)
                } else {
                    setError("계좌 정보를 불러올 수 없습니다.");
                }
            } catch (err) {
                console.error("내 계좌 조회 실패:", err);
                setError("계좌 조회 중 오류가 발생했습니다.");
            }
        };
        fetchMyAccount();
    }, []);

    const handleOpenModal = () => {
        if (!receiverAccount || !amount) {
            setError("은행명, 계좌번호, 금액을 입력해주세요.");
            return;
        }
        setError("");
        setIsModalOpen(true);
    };

    const handleCheckAccount = async () => {
        try {
            const res = await getAccountOwner(receiverAccount);
            if (res.status === "success" && res.data.ownerName) {
                if (res.data.bankName !== selectedBank) {
                    setError("은행명이 일치하지 않습니다. 다시 선택해 주세요.");
                    setReceiverName("");
                    return;
                }
                setReceiverName(res.data.ownerName);
                setReceiverAccountId(res.data.accountId);
                setError("");
            } else {
                setReceiverName("");
                setError("계좌번호가 존재하지 않습니다.");
            }
        } catch (err) {
            console.error("계좌 확인 실패:", err);
            setReceiverName("");
            setError("계좌 확인 중 오류가 발생했습니다.");
        }
    };

    const handleSendMoney = async () => {
        if (!receiverName) {
            setError("계좌 확인을 먼저 해주세요.");
            return;
        }

        try {
            setIsSending(true);
            const transferData = {
                fromAccountId: fromAccountId,
                toAccountId: receiverAccountId,
                amount: amount,
            };
            console.log("======== transferData : ", transferData);

            const res = await transferMoney(transferData);
            console.log("========== res : ", res);

            if (res.status === "success") {
                alert(`송금 완료! ${receiverName} 님에게 ${Number(amount).toLocaleString()} 원 송금되었습니다.`);
                setIsModalOpen(false);
                navigate("/dashboard");
            } else if (res.message === "잔액 부족으로 송금할 수 없습니다.") {
                setError("잔액이 부족합니다.");
            } else {
                setError(res.message || "송금에 실패했습니다.");
            }
        } catch (err) {
            console.error("송금 오류:", err);
            setError("송금 중 오류가 발생했습니다.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-center">송금하기</h2>

                <form className="mt-6 space-y-6" onSubmit={(e) => e.preventDefault()}>
                    <div>
                        <label className="block text-gray-700">은행 선택</label>
                        <select
                            className="w-full px-4 py-2 mt-2 border rounded-lg focus:ring focus:ring-blue-200"
                            value={selectedBank}
                            onChange={(e) => setSelectedBank(e.target.value)}
                        >
                            {banks.map((bank) => (
                                <option key={bank} value={bank}>
                                    {bank}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Input
                        label="받는 사람 계좌번호"
                        type="text"
                        placeholder="계좌번호 입력"
                        value={receiverAccount}
                        onChange={(e) => setReceiverAccount(e.target.value)}
                    />

                    <Input
                        label="송금할 금액"
                        type="number"
                        placeholder="금액 입력"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    <Button
                        text="송금하기"
                        onClick={handleOpenModal}
                        className="w-full bg-blue-500 text-white hover:bg-blue-600"
                    />
                </form>
            </div>

            {/* 팝업창 (송금 확인) */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div
                        className="bg-white w-96 p-6 rounded-lg shadow-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="text-xl font-semibold text-center">송금 확인</h2>
                        <p className="mt-4 text-gray-700">아래 정보가 맞는지 확인해주세요.</p>

                        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                            <p><strong>은행:</strong> {selectedBank}</p>
                            <p><strong>계좌번호:</strong> {receiverAccount}</p>
                            <p><strong>송금 금액:</strong> {Number(amount).toLocaleString()} 원</p>
                        </div>

                        <Button
                            text="계좌 확인"
                            className="w-full mt-4 bg-gray-500 text-white hover:bg-gray-600"
                            onClick={handleCheckAccount}
                        />

                        {receiverName && (
                            <p className="mt-4 text-green-600 font-semibold">
                                {receiverAccount} 계좌의 예금주는 {receiverName} 님입니다.
                            </p>
                        )}
                        {!receiverName && error && (
                            <p className="mt-4 text-red-500">{error}</p>
                        )}

                        <Button
                            text={isSending ? "송금 중..." : "송금하기"}
                            className={`w-full mt-4 ${receiverName ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
                            onClick={handleSendMoney}
                            disabled={!receiverName || isSending}
                        />

                        <Button
                            text="취소"
                            onClick={() => setIsModalOpen(false)}
                            className="w-full mt-2 bg-red-500 text-white hover:bg-red-600"
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SendMoney;