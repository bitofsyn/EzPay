import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  ChevronRight,
  CreditCard,
  Plus,
  Star,
  X,
} from "lucide-react";
import { createAccount, getMyAccounts } from "../api/UserAPI";
import { Account } from "../types";
import { formatAccountNumber, formatCurrency } from "../utils/formatters";
import { getUserData } from "../utils/storage";
import UserSidebar from "../components/UserSidebar";

interface AccountWithBank extends Account {
  bankName?: string;
}

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

const ACCOUNT_TYPES = ["입출금", "적금", "예금", "청약"];

const ViewAccounts: React.FC = () => {
  const navigate = useNavigate();
  const user = getUserData();

  const [accounts, setAccounts] = useState<AccountWithBank[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // 모달 상태
  const [showModal, setShowModal] = useState(false);
  const [modalBankName, setModalBankName] = useState(BANK_OPTIONS[0]);
  const [modalAlias, setModalAlias] = useState("");
  const [modalAccountNumber, setModalAccountNumber] = useState("");
  const [modalAccountType, setModalAccountType] = useState(ACCOUNT_TYPES[0]);
  const [modalBalance, setModalBalance] = useState("0");
  const [modalIsMain, setModalIsMain] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const fetchAccounts = async () => {
    try {
      const data = await getMyAccounts();
      const sorted = [...(data as AccountWithBank[])].sort((a, b) =>
        a.isMain === b.isMain ? 0 : a.isMain ? -1 : 1
      );
      setAccounts(sorted);
    } catch {
      setError("계좌 정보를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const openModal = () => {
    setModalBankName(BANK_OPTIONS[0]);
    setModalAlias("");
    setModalAccountNumber("");
    setModalAccountType(ACCOUNT_TYPES[0]);
    setModalBalance("0");
    setModalIsMain(accounts.length === 0);
    setModalError("");
    setShowModal(true);
  };

  const handleModalSubmit = async () => {
    const parsedBalance = parseInt(modalBalance.replace(/,/g, ""), 10);
    if (isNaN(parsedBalance) || parsedBalance < 0) {
      setModalError("초기 잔액을 올바르게 입력해주세요.");
      return;
    }
    if (!user?.userId) {
      setModalError("로그인 정보가 없습니다.");
      return;
    }

    setModalSubmitting(true);
    setModalError("");

    try {
      await createAccount({
        userId: user.userId,
        bankName: modalBankName,
        balance: parsedBalance,
      });
      setShowModal(false);
      setLoading(true);
      await fetchAccounts();
    } catch (err: unknown) {
      let message = "계좌 등록에 실패했습니다.";
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as Record<string, unknown>;
        const response = axiosError.response as Record<string, unknown> | undefined;
        const data = response?.data as Record<string, unknown> | undefined;
        message = String(data?.message ?? "계좌 등록에 실패했습니다.");
      }
      setModalError(message);
    } finally {
      setModalSubmitting(false);
    }
  };

  const totalBalance = accounts.reduce((s, acc) => s + Number(acc.balance || 0), 0);

  const cardGradients = [
    "from-[#264997] via-[#175f8b] to-[#17667b]",
    "from-slate-700 via-slate-800 to-slate-900",
    "from-cyan-600 via-cyan-700 to-cyan-900",
    "from-indigo-600 via-indigo-700 to-indigo-900",
  ];

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
                  onClick={() => navigate("/dashboard")}
                  className="flex h-10 w-10 items-center justify-center rounded-[14px] border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                >
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <h1 className="text-[2rem] font-black tracking-tight text-slate-950">내 계좌</h1>
                  <p className="text-sm font-semibold text-slate-400">전체 계좌 조회 및 관리</p>
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

          {/* Total balance hero */}
          {!loading && accounts.length > 0 && (
            <div className="rounded-[28px] bg-gradient-to-r from-[#264997] via-[#175f8b] to-[#17667b] p-6 text-white shadow-[0_30px_70px_rgba(23,53,120,0.32)]">
              <p className="text-sm font-semibold text-white/70">총 보유 자산</p>
              <p className="mt-2 text-[3rem] font-black tracking-tight">
                ₩{totalBalance.toLocaleString()}
              </p>
              <p className="mt-1 text-sm font-semibold text-white/60">
                계좌 {accounts.length}개 연결됨
              </p>
            </div>
          )}

          {/* Account list */}
          <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[1.4rem] font-black tracking-tight text-slate-950">계좌 목록</h2>
              <button
                type="button"
                onClick={openModal}
                className="flex items-center gap-2 rounded-[14px] bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <Plus size={15} />
                계좌 추가
              </button>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-[20px] bg-slate-100" />
                ))}
              </div>
            ) : error ? (
              <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-5 py-8 text-center">
                <p className="text-sm font-semibold text-rose-600">{error}</p>
              </div>
            ) : accounts.length > 0 ? (
              <div className="space-y-4">
                {accounts.map((account, index) => (
                  <button
                    key={account.accountId}
                    type="button"
                    onClick={() => navigate(`/account/${account.accountId}`)}
                    className="group w-full text-left"
                  >
                    <div className={`relative overflow-hidden rounded-[24px] bg-gradient-to-r ${cardGradients[index % cardGradients.length]} p-5 text-white shadow-lg transition group-hover:shadow-xl group-hover:scale-[1.01]`}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold text-white/80">
                              {account.bankName || "EzPay Bank"}
                            </p>
                            {account.isMain && (
                              <span className="flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold text-white">
                                <Star size={10} fill="currentColor" />
                                대표
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm font-semibold tracking-[0.14em] text-white/60">
                            {formatAccountNumber(account.accountNumber)}
                          </p>
                        </div>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                          <CreditCard size={18} />
                        </div>
                      </div>
                      <div className="mt-4 flex items-end justify-between">
                        <p className="text-[1.8rem] font-black">
                          {formatCurrency(account.balance).replace(" 원", "")}
                          <span className="ml-1 text-base font-bold text-white/60">원</span>
                        </p>
                        <div className="flex items-center gap-1 text-sm font-bold text-white/60 transition group-hover:text-white">
                          상세보기
                          <ChevronRight size={16} />
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-16 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                  <CreditCard size={28} className="text-slate-400" />
                </div>
                <p className="text-base font-bold text-slate-500">보유한 계좌가 없습니다</p>
                <p className="mt-1 mb-5 text-sm font-medium text-slate-400">새 계좌를 추가해 EzPay를 시작해 보세요.</p>
                <button
                  type="button"
                  onClick={openModal}
                  className="flex items-center gap-2 rounded-[16px] bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  <Plus size={16} />
                  계좌 추가
                </button>
              </div>
            )}
          </div>

          {/* Quick actions */}
          {accounts.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => navigate("/send")}
                className="flex items-center gap-4 rounded-[24px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] transition hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-slate-950 text-white">
                  <CreditCard size={20} />
                </div>
                <div className="text-left">
                  <p className="text-base font-black text-slate-950">송금하기</p>
                  <p className="text-sm font-medium text-slate-400">빠른 계좌 이체</p>
                </div>
                <ChevronRight size={18} className="ml-auto text-slate-400" />
              </button>
              <button
                type="button"
                onClick={() => navigate("/transactions")}
                className="flex items-center gap-4 rounded-[24px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)] transition hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-slate-950 text-white">
                  <Bell size={20} />
                </div>
                <div className="text-left">
                  <p className="text-base font-black text-slate-950">거래 내역</p>
                  <p className="text-sm font-medium text-slate-400">입출금 내역 조회</p>
                </div>
                <ChevronRight size={18} className="ml-auto text-slate-400" />
              </button>
            </div>
          )}
        </main>
      </div>

      {/* 계좌 추가 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] bg-white shadow-2xl">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h3 className="text-[1.2rem] font-black text-slate-950">등록된 계좌 추가</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            {/* 모달 본문 */}
            <div className="space-y-4 px-6 py-5">
              {/* 은행 선택 */}
              <div>
                <label htmlFor="modalBankName" className="mb-1.5 block text-sm font-bold text-slate-700">은행 선택</label>
                <div className="relative">
                  <select
                    id="modalBankName"
                    value={modalBankName}
                    onChange={(e) => setModalBankName(e.target.value)}
                    className="w-full appearance-none rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                  >
                    {BANK_OPTIONS.map((bank) => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                  <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* 계좌 별칭 */}
              <div>
                <label htmlFor="modalAlias" className="mb-1.5 block text-sm font-bold text-slate-700">계좌 별칭</label>
                <input
                  id="modalAlias"
                  type="text"
                  placeholder="예: 생활비 통장"
                  value={modalAlias}
                  onChange={(e) => setModalAlias(e.target.value)}
                  className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                />
              </div>

              {/* 계좌번호 */}
              <div>
                <label htmlFor="modalAccountNumber" className="mb-1.5 block text-sm font-bold text-slate-700">계좌번호 (숫자만 입력)</label>
                <input
                  id="modalAccountNumber"
                  type="text"
                  inputMode="numeric"
                  placeholder="01012345678"
                  value={modalAccountNumber}
                  onChange={(e) => setModalAccountNumber(e.target.value.replace(/\D/g, ""))}
                  className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 transition focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                />
                <p className="mt-1.5 text-xs font-medium text-slate-400">
                  화면에는 마스킹 처리된 번호만 표시됩니다
                </p>
              </div>

              {/* 계좌 유형 + 초기 잔액 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="modalAccountType" className="mb-1.5 block text-sm font-bold text-slate-700">계좌 유형</label>
                  <div className="relative">
                    <select
                      id="modalAccountType"
                      value={modalAccountType}
                      onChange={(e) => setModalAccountType(e.target.value)}
                      className="w-full appearance-none rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 transition focus:border-slate-400 focus:outline-none"
                    >
                      {ACCOUNT_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label htmlFor="modalBalance" className="mb-1.5 block text-sm font-bold text-slate-700">초기 잔액</label>
                  <input
                    id="modalBalance"
                    type="number"
                    min="0"
                    value={modalBalance}
                    onChange={(e) => setModalBalance(e.target.value)}
                    className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 transition focus:border-slate-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* 대표 계좌 설정 */}
              <label className="flex cursor-pointer items-center gap-3 rounded-[14px] border border-slate-100 bg-slate-50 px-4 py-3 transition hover:bg-slate-100">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={modalIsMain}
                    onChange={(e) => setModalIsMain(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`flex h-5 w-5 items-center justify-center rounded-[6px] border-2 transition ${modalIsMain ? "border-slate-950 bg-slate-950" : "border-slate-300 bg-white"}`}>
                    {modalIsMain && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-700">대표 계좌로 설정</span>
              </label>

              {modalError && (
                <div className="rounded-[14px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
                  {modalError}
                </div>
              )}
            </div>

            {/* 모달 푸터 */}
            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="rounded-[16px] border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleModalSubmit}
                disabled={modalSubmitting}
                className="flex items-center justify-center gap-2 rounded-[16px] bg-slate-950 py-3.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:bg-slate-400"
              >
                {modalSubmitting ? (
                  <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : null}
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewAccounts;
