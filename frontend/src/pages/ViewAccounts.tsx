import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, CreditCard, Plus, Trash2, X } from "lucide-react";
import {
  createAccount,
  deleteAccount,
  getMyAccounts,
  setMainAccount,
} from "../api/UserAPI";
import { Account } from "../types";
import { formatAccountNumber } from "../utils/formatters";
import { getUserData } from "../utils/storage";
import UserShell from "../components/UserShell";

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

/** 은행별 카드 상단 컬러 바 / 은행명 색상 (참고 목업 기준) */
const BANK_COLORS: Record<string, [string, string]> = {
  토스뱅크: ["#0f172a", "#1e3a5f"],
  카카오뱅크: ["#0c4a6e", "#155e75"],
  신한은행: ["#1e3a8a", "#1d4ed8"],
  국민은행: ["#334155", "#475569"],
  우리은행: ["#0f4c75", "#1a6ea8"],
  하나은행: ["#064e3b", "#065f46"],
  기업은행: ["#312e81", "#3730a3"],
  농협은행: ["#14532d", "#166534"],
};

const bankColors = (bank?: string): [string, string] =>
  (bank && BANK_COLORS[bank]) || ["#475569", "#334155"];

const won = (amount: number | string) =>
  `₩${Math.floor(Number(amount) || 0).toLocaleString()}`;

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

  // 대표 설정 / 삭제 상태
  const [actionId, setActionId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

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
  const mainAccount = accounts.find((acc) => acc.isMain);

  const handleSetMain = async (accountId: number) => {
    setActionId(accountId);
    try {
      await setMainAccount(accountId);
      await fetchAccounts();
    } catch {
      setError("대표 계좌 설정에 실패했습니다.");
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (accountId: number) => {
    setActionId(accountId);
    try {
      await deleteAccount(accountId);
      setDeleteConfirmId(null);
      await fetchAccounts();
    } catch {
      setError("계좌 삭제에 실패했습니다.");
    } finally {
      setActionId(null);
    }
  };

  return (
    <>
    <UserShell title="내 계좌" showViewToggle>

          {/* 헤더 */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-950">내 계좌</h2>
              <p className="mt-1 text-xs font-medium text-slate-400">
                등록된 계좌를 관리합니다 · 총 {accounts.length}개
              </p>
            </div>
            <button
              type="button"
              onClick={openModal}
              className="flex shrink-0 items-center gap-2 rounded-[14px] bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              <Plus size={15} />
              계좌 추가
            </button>
          </div>

          {/* 총 보유 잔액 + 대표 계좌 히어로 */}
          {!loading && mainAccount && (
            <div className="rounded-[20px] bg-gradient-to-br from-[#1e3a8a] via-[#0c4a6e] to-[#155e75] p-6 text-white shadow-[0_12px_32px_rgba(14,57,107,0.25)]">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-white/70">
                    총 보유 잔액
                  </p>
                  <p className="mt-1.5 break-words text-3xl font-black tracking-tight tabular-nums">
                    {won(totalBalance)}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold backdrop-blur">
                  대표 계좌
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/account/${mainAccount.accountId}`)}
                className="flex w-full items-center justify-between rounded-xl bg-white/10 px-4 py-3 text-left transition hover:bg-white/15"
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-white/70">
                    {mainAccount.bankName || "EzPay Bank"}
                  </p>
                  <p className="mt-0.5 truncate text-sm font-bold">
                    {mainAccount.accountName || "대표 통장"}
                  </p>
                  <p className="mt-1 font-mono text-[11px] tracking-[0.12em] text-white/75">
                    {formatAccountNumber(mainAccount.accountNumber)}
                  </p>
                </div>
                <div className="shrink-0 pl-4 text-right">
                  <p className="text-lg font-black tabular-nums">{won(mainAccount.balance)}</p>
                  <p className="mt-0.5 text-[10px] text-white/60">잔액 →</p>
                </div>
              </button>
            </div>
          )}

          {/* 계좌 목록 */}
          {loading ? (
            <div className="grid gap-3.5 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-44 animate-pulse rounded-2xl bg-white shadow-sm" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-8 text-center">
              <p className="text-sm font-semibold text-rose-600">{error}</p>
            </div>
          ) : accounts.length > 0 ? (
            <div className="grid gap-3.5 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
              {accounts.map((account) => {
                const [c0, c1] = bankColors(account.bankName);
                const busy = actionId === account.accountId;
                return (
                  <div
                    key={account.accountId}
                    onClick={() => navigate(`/account/${account.accountId}`)}
                    className="cursor-pointer overflow-hidden rounded-2xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.1)]"
                  >
                    {/* 상단 컬러 바 */}
                    <div
                      className="h-[5px]"
                      style={{ background: `linear-gradient(90deg,${c0},${c1})` }}
                    />
                    <div className="p-[18px]">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold" style={{ color: c0 }}>
                            {account.bankName || "EzPay Bank"}
                          </span>
                          {account.isMain && (
                            <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[9px] font-bold text-cyan-600">
                              대표
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm font-extrabold text-slate-900">
                        {account.accountName || "입출금 통장"}
                      </p>
                      <p className="mt-1 font-mono text-[11px] tracking-[0.1em] text-slate-400">
                        {formatAccountNumber(account.accountNumber)}
                      </p>
                      <p className="mt-3 text-xl font-black tabular-nums text-slate-900">
                        {won(account.balance)}
                      </p>

                      {/* 액션 버튼 */}
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-3.5 flex gap-1.5 border-t border-slate-100 pt-3"
                      >
                        {!account.isMain && (
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleSetMain(account.accountId)}
                            className="flex-1 rounded-lg bg-sky-50 py-1.5 text-[11px] font-bold text-cyan-600 transition hover:bg-sky-100 disabled:opacity-50"
                          >
                            대표 설정
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setDeleteConfirmId(account.accountId)}
                          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-rose-50 py-1.5 text-[11px] font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50"
                        >
                          <Trash2 size={12} />
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-2xl bg-white py-16 text-center shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <CreditCard size={28} className="text-slate-400" />
              </div>
              <p className="text-base font-bold text-slate-500">등록된 계좌가 없습니다</p>
              <p className="mt-1 mb-5 text-sm font-medium text-slate-400">
                계좌를 추가하여 자산을 관리해보세요.
              </p>
              <button
                type="button"
                onClick={openModal}
                className="flex items-center gap-2 rounded-[16px] bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <Plus size={16} />
                첫 번째 계좌 추가하기
              </button>
            </div>
          )}
    </UserShell>

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

      {/* 삭제 확인 모달 */}
      {deleteConfirmId !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
          onClick={() => setDeleteConfirmId(null)}
        >
          <div
            className="w-full max-w-[320px] rounded-[18px] bg-white p-7 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-3.5 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50">
              <Trash2 size={22} className="text-rose-500" />
            </div>
            <p className="text-sm font-extrabold text-slate-900">계좌를 삭제할까요?</p>
            <p className="mt-2 mb-5 text-xs font-medium text-slate-400">
              삭제된 계좌는 복구할 수 없습니다.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
              >
                취소
              </button>
              <button
                type="button"
                disabled={actionId === deleteConfirmId}
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 rounded-xl bg-rose-500 py-2.5 text-sm font-bold text-white transition hover:bg-rose-600 disabled:opacity-60"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ViewAccounts;
