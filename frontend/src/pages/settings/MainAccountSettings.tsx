import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getMyAccounts, setMainAccount } from "../../api/UserAPI";
import { Account } from "../../types";
import toast from "react-hot-toast";

// 계좌번호 포맷팅 (XX-XXXX-XXXX)
const formatAccountNumber = (accountNumber: string): string => {
  const cleaned = accountNumber.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6, 10)}`;
  }
  return accountNumber;
};

const MainAccountSettings: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [currentMainId, setCurrentMainId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchAccounts = async (): Promise<void> => {
      try {
        const res = await getMyAccounts();
        console.log("res : ", res);
        const accountList: Account[] = res;
        setAccounts(accountList);

        // 현재 대표계좌 찾기
        const main = accountList.find(acc => acc.isMain);

        if (main) {
          setCurrentMainId(main.accountId);
        } else if (accountList.length > 0) {
          // 대표계좌가 없으면 첫 번째 계좌를 대표계좌로 자동 설정
          const firstAccount = accountList[0];
          await setMainAccount(firstAccount.accountId);
          setCurrentMainId(firstAccount.accountId);
          // 계좌 목록 다시 불러오기
          const updatedRes = await getMyAccounts();
          setAccounts(updatedRes);
        }
      } catch (err) {
        console.error("계좌 목록 불러오기 실패", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  const handleSelectMain = async (accountId: number): Promise<void> => {
    if (accountId === currentMainId) return;

    try {
      await setMainAccount(accountId);

      // 대표 계좌 변경 성공 후 계좌 목록 다시 불러오기
      const res = await getMyAccounts();
      const updatedAccounts: Account[] = res;
      setAccounts(updatedAccounts);

      const main = updatedAccounts.find(acc => acc.isMain);
      if (main) {
        setCurrentMainId(main.accountId);
      }

      toast.success("대표 계좌가 변경되었습니다!");
    } catch {
      toast.error("대표 계좌 변경에 실패했습니다.");
    }
  };


  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">로딩 중...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">대표 계좌 설정</h2>

      {accounts.length === 0 ? (
        <div className="text-center text-gray-500">등록된 계좌가 없습니다.</div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => (
            <div
              key={account.accountId}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-all
                ${account.isMain
                  ? "bg-blue-50 border-blue-500 shadow-md"
                  : "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300"}`}
              onClick={() => handleSelectMain(account.accountId)}
            >
              {account.isMain && (
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    대표 계좌
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <div>
                  <p className={`font-semibold ${account.isMain ? "text-blue-800" : "text-gray-800"}`}>
                    {account.accountName}
                  </p>
                  <p className={`text-sm font-mono ${account.isMain ? "text-blue-600" : "text-gray-600"}`}>
                    {formatAccountNumber(account.accountNumber)}
                  </p>
                  <p className="text-gray-500 text-sm mt-1">{account.balance.toLocaleString()} 원</p>
                </div>
                {!account.isMain && (
                  <span className="text-gray-400 text-sm">클릭하여 대표 설정</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 뒤로가기 버튼 */}
      <div className="mt-10 text-center">
        <button
          onClick={() => navigate("/settings")}
          className="bg-gray-700 hover:bg-gray-600 text-white py-2 px-6 rounded-lg font-semibold"
        >
          설정으로 돌아가기
        </button>
      </div>
    </div>
  );
};

export default MainAccountSettings;
