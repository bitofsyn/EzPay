import React, { useEffect, useState } from "react";
import { getTransferLimit, updateTransferLimit, getUserInfo } from "../../api/UserAPI";
import toast from "react-hot-toast";

const TransferLimit: React.FC = () => {
    const [userId, setUserId] = useState<number | null>(null);
    const [perLimit, setPerLimit] = useState<number>(0);
    const [dailyLimit, setDailyLimit] = useState<number>(0);

    useEffect(() => {
        const fetchLimit = async (): Promise<void> => {
            try {
                const userInfo = await getUserInfo();
                if (!userInfo || !userInfo.userId) {
                    toast.error("로그인 정보가 없습니다. 다시 로그인 해주세요.");
                    return;
                }
                setUserId(userInfo.userId);

                const res = await getTransferLimit(userInfo.userId);
                setPerLimit(res.perTransactionLimit);
                setDailyLimit(res.dailyLimit);
            } catch (err) {
                toast.error("송금 한도 불러오기 실패");
            }
        };

        fetchLimit();
    }, []);

    const handleSubmit = async (): Promise<void> => {
        try {
            await updateTransferLimit(userId!, perLimit, dailyLimit);
            toast.success("송금 한도 저장 완료");
        } catch (err) {
            toast.error("송금 한도 저장 실패");
        }
    };

    const formatNumber = (value: number): string => {
        const numericValue = value.toString().replace(/[^0-9]/g, "");
        return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    const handleChange = (setter: React.Dispatch<React.SetStateAction<number>>) =>
        (e: React.ChangeEvent<HTMLInputElement>): void => {
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
