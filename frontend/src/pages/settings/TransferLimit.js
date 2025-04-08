import { useEffect, useState } from "react";
import { getTransferLimit, updateTransferLimit } from "../../api/UserAPI";
import toast from "react-hot-toast";

const TransferLimit = () => {
    const [userId, setUserId] = useState(null);
    const [perLimit, setPerLimit] = useState(0);
    const [dailyLimit, setDailyLimit] = useState(0);

    useEffect(() => {
        const fetchLimit = async () => {
            try {
                const userData = JSON.parse(localStorage.getItem("user"));
                if (!userData || !userData.id) return;
                setUserId(userData.id);

                const res = await getTransferLimit(userData.id);
                setPerLimit(res.data.perTransactionLimit);
                setDailyLimit(res.data.dailyLimit);
            } catch (err) {
                toast.error("송금 한도 불러오기 실패");
            }
        };

        fetchLimit();
    }, []);

    const handleSubmit = async () => {
        try {
            await updateTransferLimit(userId, perLimit, dailyLimit);
            toast.success("송금 한도 저장 완료");
        } catch (err) {
            toast.error("송금 한도 저장 실패");
        }
    };

    const formatNumber = (value) => {
        const numericValue = value.toString().replace(/[^0-9]/g, "");
        return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const handleChange = (setter) => (e) => {
        const raw = e.target.value.replace(/[^0-9]/g, "");
        setter(Number(raw));
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold text-gray-800">송금 한도 설정</h2>

            <label className="block mt-4 text-sm font-medium text-gray-700">
                1회 송금 한도
            </label>
            <input
                type="text"
                value={formatNumber(perLimit)}
                onChange={handleChange(setPerLimit)}
                className="mt-1 w-full border px-3 py-2 rounded"
            />

            <label className="block mt-4 text-sm font-medium text-gray-700">
                1일 송금 한도
            </label>
            <input
                type="text"
                value={formatNumber(dailyLimit)}
                onChange={handleChange(setDailyLimit)}
                className="mt-1 w-full border px-3 py-2 rounded"
            />

            <button
                onClick={handleSubmit}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
            >
                저장하기
            </button>
        </div>
    );
};

export default TransferLimit;
