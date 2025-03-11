import {useState} from "react";

// 송금 화면 
const SendMoney = () => {
    const [recipient, setRecipient] = useState(""); // 받는 사람 계좌번호
    const [amount, setAmount] = useState(""); // 송금할 금액
    const [message ,setMessage] = useState(""); // 사용자에게 보여줄 메시지 

    const handleTransfer = () => {
        if(!recipient || !amount) {
            setMessage("계좌번호와 금액을 입력하세요.");
            return;
        }

        if(!isNaN(amount) || amount <= 0) {
            setMessage("올바른 금액을 입력하세요.");
            return;
        }

        // TODO: 백엔드 API 연동
        console.log(`송금 요청: ${recipient}에게 ${amount}원 송금`);
        setMessage(`송금 성공! ${recipient}에게 ${amount}원을 보냈습니다.`);
    };

    return(
        <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-6">
            <h2 className="text-2xl font-bold mb-4">송금하기</h2>

            <input
                type="text"
                placeholder="받는 사람 계좌번호"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)} // 입력시 recipient 업데이트
                className="mb-2 p-2 border rounded w-80"
            />
            <input
                type="number"
                placeholder="송금 금액"
                value={amount}
                onChange={(e) => setAmount(e.target.value)} // 입력시 amount 업데이트
                className="mb-2 p-2 border rounded w-80"
            />

            <button 
                onClick={handleTransfer} /// 버튼 클릭시 송금 실행
                className="px-4 py-2 bg-blue-500 text-white rounded w-80"
            >
                송금하기
            </button>

            {message && <p className="mt-4 text-red-500">{message}</p>}
        </div>
    );
};

export default SendMoney;