import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";

const banks = ["KB국민은행", "신한은행", "우리은행", "하나은행", "NH농협은행", "카카오뱅크", "토스뱅크"];

// 송금 화면 
const SendMoney = () => {
    const navigate = useNavigate();

    // 입력 필드 상태
    const[selectedBank, setSelectedBank] = useState(banks[0]);
    const [receiverAccount, setReceiverAccount] = useState(""); // 받는 사람 계좌번호
    const [amount, setAmount] = useState(""); // 송금할 금액
    // const [message, setMessage] = useState(""); // 사용자에게 보여줄 메시지 
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [receiverName, setReceiverName] = useState("");
    const [error, setError] = useState("");
    // const [isSending, setIsSending] = useState(false); // 송금 중 상태

    const handleOpenModal = () => {
        if (!receiverAccount || !amount) {
            setError("은행명, 계좌번호, 금액을 입력해주세요.");
            return;
        }
        setError("");
        setIsModalOpen(true);
    };

    // 계좌 확인(임시 데이터 -> 나중에 백엔드와 연동 필요)
    const handleCheckAccount = () => {
        const dummyAccounts = {
            "1234567890": "김철수",
            "0987664321": "이영희"
        };

        if (dummyAccounts[receiverAccount]) {
            setReceiverName(dummyAccounts[receiverAccount]);
        } else {
            setReceiverName("");
        }
    };

    // 송금 처리
    const handleSendMoney = () => {
        if (!receiverName) {
            setError("해당 계좌가 존재하지 않습니다. 다시 확인해주세요.");
            return;
        }

        // 송금 완료 처리 (실제 백엔드 연동 필요)
        setTimeout(() => {
            alert(`송금 완료! ${receiverName} 님에게 ${Number(amount).toLocaleString()} 원 송금되었습니다.`);
            setIsModalOpen(false); // 팝업 닫기
            navigate("/dashboard"); // 대시보드로 이동
        }, 1000);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-center">송금하기</h2>

                {/* 송금 폼 */}
                <form className="mt-6 space-y-6">
                    {/* 은행 선택 */}
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

                    {/* 계좌번호 입력 */}
                    <Input
                        label="받는 사람 계좌번호"
                        type="text"
                        placeholder="계좌번호 입력"
                        value={receiverAccount}
                        onChange={(e) => setReceiverAccount(e.target.value)}
                    />

                    {/* 송금할 금액 입력 */}
                    <Input
                        label="송금할 금액"
                        type="number"
                        placeholder="금액 입력"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />

                    {error && <p className="text-red-500 text-sm">{error}</p>}

                    {/* 송금 버튼 */}
                    <Button text="송금하기" onClick={handleOpenModal} className="w-full bg-blue-500 text-white hover:bg-blue-600" />
                </form>
            </div>

            {/* ✅ 팝업창 (송금 확인) */}
            {isModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white w-96 p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-semibold text-center">송금 확인</h2>
                        <p className="mt-4 text-gray-700">아래 정보가 맞는지 확인해주세요.</p>

                        {/* 입력한 송금 정보 표시 */}
                        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                            <p><strong>은행:</strong> {selectedBank}</p>
                            <p><strong>계좌번호:</strong> {receiverAccount}</p>
                            <p><strong>송금 금액:</strong> {Number(amount).toLocaleString()} 원</p>
                        </div>

                        {/* 계좌 확인 버튼 */}
                        <Button
                            text="계좌 확인"
                            className="w-full mt-4 bg-gray-500 text-white hover:bg-gray-600"
                            onClick={handleCheckAccount}
                        />

                        {/* 계좌 확인 결과 */}
                        {receiverName && (
                            <p className="mt-4 text-green-600 font-semibold">{receiverAccount} 계좌의 예금주는 {receiverName} 님입니다.</p>
                        )}
                        {receiverName === "" && (
                            <p className="mt-4 text-red-500">해당 계좌가 존재하지 않습니다. 다시 확인해주세요.</p>
                        )}

                        {/* 송금 버튼 */}
                        <Button
                            text="송금하기"
                            className={`w-full mt-4 ${receiverName ? "bg-blue-500 text-white hover:bg-blue-600" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
                            onClick={handleSendMoney}
                            disabled={!receiverName}
                        />

                        {/* 팝업 닫기 버튼 */}
                        <Button text="취소" onClick={() => setIsModalOpen(false)} className="w-full mt-2 bg-red-500 text-white hover:bg-red-600" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default SendMoney;