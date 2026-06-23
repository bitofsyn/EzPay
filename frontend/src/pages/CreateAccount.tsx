import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  Building2,
  CheckCircle2,
  ChevronDown,
  CreditCard,
} from "lucide-react";
import { createAccount } from "../api/UserAPI";
import { User } from "../types";
import { getUserData } from "../utils/storage";
import UserSidebar from "../components/UserSidebar";

const BANK_OPTIONS = [
  { name: "국민은행", color: "bg-yellow-500" },
  { name: "신한은행", color: "bg-blue-600" },
  { name: "우리은행", color: "bg-sky-500" },
  { name: "하나은행", color: "bg-emerald-500" },
  { name: "기업은행", color: "bg-slate-700" },
  { name: "농협은행", color: "bg-green-600" },
  { name: "카카오뱅크", color: "bg-yellow-400" },
  { name: "토스뱅크", color: "bg-blue-500" },
];

const formatInputAmount = (value: string): string => {
  const numeric = value.replace(/[^\d]/g, "");
  if (!numeric) return "";
  return Number(numeric).toLocaleString("ko-KR");
};

const CreateAccount: React.FC = () => {
  const navigate = useNavigate();
  const user = useMemo<User | null>(() => getUserData(), []);

  const [bankName, setBankName] = useState(BANK_OPTIONS[0].name);
  const [balance, setBalance] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const selectedBank = BANK_OPTIONS.find((b) => b.name === bankName) ?? BANK_OPTIONS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.userId) {
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
      await createAccount({ userId: user.userId, bankName, balance: parsedBalance });
      setSuccess(true);
      setTimeout(() => navigate("/accounts"), 1200);
    } catch (err) {
      const message = (err as any)?.response?.data?.message || "계좌 개설에 실패했습니다.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eef3fb] p-3 text-slate-900 lg:p-4">
      <div className="mx-auto grid max-w-[1440px] gap-5 lg:grid-cols-[250px_minmax(0,1fr)]">
        <UserSidebar />

        <main className="flex flex-col gap-5">
          {/* Header */}
          <header className="rounded-[28px] border border-white/70 bg-white/90 px-5 py-4 shadow-[0_20px_60px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/accounts")}
                  className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h1 className="text-[2rem] font-black tracking-tight text-slate-950">계좌 개설</h1>
                  <p className="text-sm font-semibold text-slate-400">새 계좌를 개설합니다</p>
                </div>
              </div>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300"
                onClick={() => navigate("/settings/notification")}
              >
                <Bell size={18} />
              </button>
            </div>
          </header>

          <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
            {/* Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Bank selector */}
              <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
                <h2 className="text-[1.2rem] font-black tracking-tight text-slate-950">은행 선택</h2>

                {/* Grid selector */}
                <div className="mt-4 grid grid-cols-4 gap-3">
                  {BANK_OPTIONS.map((bank) => (
                    <button
                      key={bank.name}
                      type="button"
                      onClick={() => setBankName(bank.name)}
                      className={`flex flex-col items-center gap-2 rounded-[18px] border-2 p-3 text-center transition ${
                        bankName === bank.name
                          ? "border-slate-950 bg-slate-950 text-white shadow-[0_8px_20px_rgba(15,23,42,0.2)]"
                          : "border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${bankName === bank.name ? "bg-white/20" : bank.color + " opacity-80"}`}>
                        <Building2 size={16} className={bankName === bank.name ? "text-white" : "text-white"} />
                      </div>
                      <span className="text-xs font-bold leading-tight">{bank.name}</span>
                    </button>
                  ))}
                </div>

                {/* Fallback dropdown */}
                <div className="relative mt-4">
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full appearance-none rounded-[16px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  >
                    {BANK_OPTIONS.map((bank) => (
                      <option key={bank.name} value={bank.name}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Initial balance */}
              <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
                <h2 className="text-[1.2rem] font-black tracking-tight text-slate-950">초기 잔액</h2>
                <div className="relative mt-4">
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={balance}
                    onChange={(e) => setBalance(formatInputAmount(e.target.value))}
                    className="w-full rounded-[16px] border border-slate-200 bg-slate-50 py-4 pr-12 pl-4 text-right text-[1.8rem] font-black text-slate-950 placeholder-slate-300 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">원</span>
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {[10000, 50000, 100000, 1000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        const current = parseInt(balance.replace(/,/g, "") || "0", 10);
                        setBalance(formatInputAmount(String(current + amt)));
                      }}
                      className="rounded-[14px] bg-slate-100 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                    >
                      +{amt >= 1000000 ? `${amt / 10000}만` : `${amt / 10000}만`}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <p className="text-sm font-bold text-emerald-700">계좌가 개설되었습니다. 이동 중...</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/accounts")}
                  className="rounded-[20px] border border-slate-200 bg-white py-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || success}
                  className="flex items-center justify-center gap-2 rounded-[20px] bg-slate-950 py-4 text-base font-black text-white shadow-[0_18px_30px_rgba(15,23,42,0.2)] transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      개설 중...
                    </>
                  ) : (
                    "계좌 개설"
                  )}
                </button>
              </div>
            </form>

            {/* Preview card */}
            <div className="flex flex-col gap-5">
              <div className="rounded-[28px] bg-gradient-to-r from-[#264997] via-[#175f8b] to-[#17667b] p-6 text-white shadow-[0_30px_70px_rgba(23,53,120,0.32)]">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">미리보기</p>
                <div className="mt-4 flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white/70">{selectedBank.name}</p>
                    <p className="mt-1 text-sm tracking-[0.12em] text-white/40">●●●● ●●●● ●●●●</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                    <CreditCard size={18} />
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-sm font-semibold text-white/60">초기 잔액</p>
                  <p className="mt-1 text-[2rem] font-black">
                    {balance ? balance : "0"}
                    <span className="ml-1 text-base font-bold text-white/60">원</span>
                  </p>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
                <h2 className="text-[1.1rem] font-black tracking-tight text-slate-950">계좌 개설 안내</h2>
                <ul className="mt-4 space-y-3">
                  {[
                    "계좌번호는 자동으로 생성됩니다.",
                    "최초 개설 계좌는 대표 계좌로 지정됩니다.",
                    "초기 잔액은 0원 이상이어야 합니다.",
                    "개설 후 대표 계좌 변경이 가능합니다.",
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-black text-slate-600">
                        {i + 1}
                      </span>
                      <p className="text-sm font-medium text-slate-600">{tip}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateAccount;
