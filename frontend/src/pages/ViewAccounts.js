import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { getMyAccounts } from "../api/UserAPI";

const ViewAccounts = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await getMyAccounts();
        console.log("===== data :", data);
        setAccounts(data.data);
      } catch (err) {
        console.error("계좌 조회 실패 :", err);
        setError("계좌 정보를 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchAccounts();
  }, []);

  const formatAccountNumber = (number) => {
    return `${number.slice(0, 2)}-${number.slice(2, 6)}-${number.slice(6)}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center bg-gray-50 p-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">전체 계좌 조회</h2>

      <div className="w-full max-w-lg bg-white shadow-lg rounded-2xl p-6">
        {loading ? (
          <p className="text-center text-gray-500">불러오는 중...</p>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : accounts.length > 0 ? (
          <ul className="space-y-4">
            {accounts.map((account) => (
              <li
                key={account.accountId}
                className="p-5 bg-gray-50 border rounded-2xl shadow-sm hover:shadow-md flex justify-between items-center cursor-pointer transition-all"
                onClick={() => navigate(`/account/${account.accountId}`)}
              >
                <div>
                  <p className="text-md font-semibold text-gray-800">{account.bankName}</p>
                  <p className="text-sm text-gray-500">{formatAccountNumber(account.accountNumber)}</p>
                </div>
                <p className="text-lg font-semibold text-gray-700">
                  {account.balance.toLocaleString()} 원
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-gray-500">보유한 계좌가 없습니다.</p>
            <Button
              text="새 계좌 개설"
              className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
              onClick={() => navigate("/create-account")}
            />
          </div>
        )}
      </div>

      <Button
        text="대시보드로 이동"
        className="mt-8 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
        onClick={() => navigate("/dashboard")}
      />
    </div>
  );
};

export default ViewAccounts;
