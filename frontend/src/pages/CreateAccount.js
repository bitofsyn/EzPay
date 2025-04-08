import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import { createAccount } from "../api/UserAPI";

const CreateAccount = () => {
    const navigate = useNavigate();
    
    const banks = ["KB국민은행", "신한은행", "우리은행", "하나은행", "NH농협은행", "카카오뱅크", "토스뱅크"];
    const [selectedBank, setSelectedBack] = useState(banks[0]);
    const [initialDeposit, setInitialDeposit] = useState("");
    const [error, setError] = useState("");

    const handleCreateAccount = async (e) => {
        e.preventDefault();
        setError("");

        try {
            await createAccount(selectedBank, parseFloat(initialDeposit) || 0);
            navigate("/dashboard");
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-center">계좌 개설</h2>

                {/* 계좌 개설 폼 */}
                <form onSubmit={handleCreateAccount} className="mt-6 space-y-6">
                    <label className="block text-gray-700">은행 선택</label>
                    <select
                        className="w-full px-4 py-2 mt-2 border rounded-lg focus:ring focus:ring-blue-200"
                        value={selectedBank}
                        onChange={(e) => setSelectedBack(e.target.value)}
                    >
                        {banks.map((bank) => (
                            <option key={bank} value={bank}>
                                {bank}
                            </option>
                        ))}
                    </select>

                    <Input
                        className="w-full px-4 py-2 mt-2 border rounded-lg focus:ring focus:ring-blue-200"
                        label="초기 입금 금액 (선택)"
                        type="number"
                        placeholder="초기 입금 금액 입력"
                        value={initialDeposit}
                        onChange={(e) => setInitialDeposit(e.target.value)}
                    />

                    {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                    <Button 
                        text="계좌 개설하기" 
                        className="w-full mt-6 bg-blue-500 text-white hover:bg-blue-600" 
                        onClick={() => navigate("/dashboard")}
                    />
                </form>
            </div>
        </div>
    );
};

export default CreateAccount;