import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/Button";
import { createAccount } from "../api/UserAPI";
import { User } from "../types";
import { getUserData } from "../utils/storage";

const BANK_OPTIONS = [
  "국민은행",
  "신한은행",
  "우리은행",
  "하나은행",
  "기업은행",
  "농협은행",
  "카카오뱅크",
  "토스뱅크",
];

const CreateAccount: React.FC = () => {
  const navigate = useNavigate();
  const user = useMemo<User | null>(() => getUserData(), []);

  const [bankName, setBankName] = useState(BANK_OPTIONS[0]);
  const [balance, setBalance] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const userId = user?.userId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setError("로그인 정보가 없습니다.");
      return;
    }

    const parsedBalance = parseInt(balance.replace(/,/g, ""), 10);
    if (isNaN(parsedBalance) || parsedBalance < 0) {
      setError("초기 잔액을 올바르게 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await createAccount({ userId, bankName, balance: parsedBalance });
      navigate("/accounts");
    } catch (err) {
      const message = (err as any)?.response?.data?.message || "계좌 개설에 실패했습니다.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-lg">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm backdrop-blur">
          <div className="mb-8">
            <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-600">
              Account
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">
              계좌 개설
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              은행과 초기 잔액을 선택하여 새 계좌를 개설합니다.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                은행 선택
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 focus:border-slate-400 focus:outline-none"
              >
                {BANK_OPTIONS.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                초기 잔액 (원)
              </label>
              <input
                type="number"
                min="0"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                placeholder="0"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                text="취소"
                onClick={() => navigate("/accounts")}
                className="flex-1 border border-slate-200 !bg-white !text-slate-700 hover:!bg-slate-50"
              />
              <Button
                text={isSubmitting ? "개설 중..." : "계좌 개설"}
                disabled={isSubmitting}
                className="flex-1 bg-slate-900 hover:bg-slate-800"
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;
