import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import * as Sentry from "@sentry/react";
import toast from "react-hot-toast";
import {
  ArrowUpRight,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock,
  X,
} from "lucide-react";
import { AxiosError } from "axios";
import { getAccountOwner, transferMoney, getMyAccounts, getDashboardInfo } from "../api/UserAPI";
import { handleTransferError } from "../utils/errorHandler";
import { Account, Transaction } from "../types";
import {
  formatAccountNumber,
  formatCurrency,
  formatDateShort,
  parseDate,
} from "../utils/formatters";
import UserShell from "../components/UserShell";

interface AccountWithMain extends Account {
  main?: boolean;
  bankName?: string;
}

interface AccountOwnerResponse {
  ownerName: string;
  accountId: number;
}

interface RecentSender {
  name: string;
  bank: string;
  accountNumber: string;
  accountId: number;
  avatarColor: string;
}

interface RecentTransfer {
  name: string;
  date: string;
  amount: number;
}

const QUICK_AMOUNTS = [10000, 50000, 100000, 300000];

const AVATAR_COLORS = [
  "bg-blue-600",
  "bg-slate-800",
  "bg-cyan-500",
  "bg-slate-700",
  "bg-indigo-500",
];

const BANK_OPTIONS = [
  "국민은행", "신한은행", "우리은행", "하나은행",
  "기업은행", "농협은행", "카카오뱅크", "토스뱅크",
];

const formatInputAmount = (value: string): string => {
  const numeric = value.replace(/[^\d]/g, "");
  if (!numeric) return "";
  return Number(numeric).toLocaleString("ko-KR");
};

const parseAmount = (value: string): number =>
  Number(value.replace(/[^\d]/g, "")) || 0;

interface TransferPrefill {
  bank?: string;
  accountNumber?: string;
  name?: string;
}

const SendMoney: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [accounts, setAccounts] = useState<AccountWithMain[]>([]);
  const [fromAccountId, setFromAccountId] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // 받는 사람
  const [receiverBank, setReceiverBank] = useState("");
  const [toAccountNumber, setToAccountNumber] = useState("");
  const [receiverInputName, setReceiverInputName] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverAccountId, setReceiverAccountId] = useState<number | null>(null);
  const [isCheckingAccount, setIsCheckingAccount] = useState(false);
  const [checkError, setCheckError] = useState("");

  // 금액 & 메모
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");

  // AI 분석
  const [aiCategory, setAiCategory] = useState("");
  const [aiConfidence, setAiConfidence] = useState(0);

  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.accountId === fromAccountId),
    [accounts, fromAccountId]
  );

  // 자주 보내는 사람 계산
  const ownAccountIds = useMemo(
    () => new Set(accounts.map((a) => a.accountId)),
    [accounts]
  );

  const recentSenders = useMemo((): RecentSender[] => {
    const freq: Record<number, { name: string; bank: string; accountNumber: string; count: number }> = {};
    transactions
      .filter((t) => ownAccountIds.has(t.senderAccount?.accountId))
      .forEach((t) => {
        const id = t.receiverAccount?.accountId;
        const name = t.receiverAccount?.ownerName || t.receiverAccount?.bankName || "상대방";
        const bank = t.receiverAccount?.bankName || "";
        const accountNumber = t.receiverAccount?.accountNumber || "";
        if (id != null) {
          if (!freq[id]) freq[id] = { name, bank, accountNumber, count: 0 };
          freq[id].count++;
        }
      });
    return Object.entries(freq)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([id, { name, bank, accountNumber }], i) => ({
        name,
        bank,
        accountNumber,
        accountId: Number(id),
        avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
      }));
  }, [ownAccountIds, transactions]);

  const recentTransfers = useMemo((): RecentTransfer[] => {
    return [...transactions]
      .filter((t) => ownAccountIds.has(t.senderAccount?.accountId))
      .sort((a, b) => parseDate(b.transactionDate).getTime() - parseDate(a.transactionDate).getTime())
      .slice(0, 3)
      .map((t) => ({
        name: t.receiverAccount?.ownerName || t.receiverAccount?.bankName || "상대방",
        date: formatDateShort(t.transactionDate),
        amount: t.amount,
      }));
  }, [ownAccountIds, transactions]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [accs, dash] = await Promise.all([
          getMyAccounts(),
          getDashboardInfo(),
        ]);
        const accountList = accs as AccountWithMain[];
        accountList.sort((a, b) => (b.main ? 1 : 0) - (a.main ? 1 : 0));
        setAccounts(accountList);
        const main = accountList.find((a) => a.main) || accountList[0];
        if (main) setFromAccountId(main.accountId);
        setTransactions((dash.data?.transactions || []) as Transaction[]);
      } catch (err) {
        console.error("데이터 로드 실패", err);
      }
    };
    fetchAll();
  }, []);

  // 친구 화면에서 넘어온 수취인 정보(은행/계좌번호/이름) 자동 채움.
  // 계좌번호가 채워지면 아래 자동 조회 effect가 실제 계좌를 확인한다.
  useEffect(() => {
    const prefill = (location.state as { prefill?: TransferPrefill } | null)?.prefill;
    if (!prefill) return;
    if (prefill.bank) setReceiverBank(prefill.bank);
    if (prefill.name) setReceiverInputName(prefill.name);
    if (prefill.accountNumber) setToAccountNumber(prefill.accountNumber.replace(/\D/g, ""));
    // 소비한 state는 비워 뒤로가기/새로고침 시 재적용을 막는다.
    window.history.replaceState({}, "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 메모 + 수신자명 → AI 카테고리 예측
  // 모델은 "메모 + ' ' + 수신자명"으로 학습되므로(train/data_loader.py) 추론 입력도 동일하게 맞춘다.
  useEffect(() => {
    if (memo.trim().length <= 1) {
      setAiCategory("");
      setAiConfidence(0);
      return;
    }
    // 조회로 확정된 이름을 우선 사용하고, 없으면 사용자가 입력한 이름을 사용한다.
    const receiver = (receiverName || receiverInputName || "").trim();
    const text = receiver ? `${memo.trim()} ${receiver}` : memo.trim();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_AI_SERVICE_URL}/predict-prob`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        const result = await res.json();
        if (result.confidence >= 0.4) {
          setAiCategory(result.category);
          setAiConfidence(result.confidence);
        } else {
          setAiCategory("기타");
          setAiConfidence(result.confidence);
        }
      } catch (e) {
        Sentry.captureException(e);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [memo, receiverName, receiverInputName]);

  const handleCheckAccount = useCallback(async (): Promise<AccountOwnerResponse | null> => {
    if (!toAccountNumber) return null;
    setIsCheckingAccount(true);
    setCheckError("");
    try {
      const res = await getAccountOwner(toAccountNumber);
      const data = res as AccountOwnerResponse;
      setReceiverName(data.ownerName);
      setReceiverAccountId(data.accountId);
      setReceiverInputName(data.ownerName);
      return data;
    } catch (err) {
      const status = err instanceof AxiosError ? err.response?.status : undefined;
      // 404는 실제 미존재 계좌, 그 외(네트워크/500/인증 등)는 조회 실패로 구분해 오해를 줄인다.
      setCheckError(
        status === 404
          ? "존재하지 않는 계좌번호입니다."
          : "계좌 조회에 실패했어요. 잠시 후 다시 시도해주세요."
      );
      setReceiverName("");
      setReceiverAccountId(null);
      return null;
    } finally {
      setIsCheckingAccount(false);
    }
  }, [toAccountNumber]);

  // 계좌번호 입력 완료 시 자동 조회
  useEffect(() => {
    if (toAccountNumber.length >= 10) {
      handleCheckAccount();
    }
  }, [toAccountNumber, handleCheckAccount]);

  const handleQuickRecipient = (sender: RecentSender) => {
    setReceiverInputName(sender.name);
    setReceiverName(sender.name);
    setReceiverAccountId(sender.accountId);
    setReceiverBank(sender.bank);
    setToAccountNumber(sender.accountNumber.replace(/\D/g, ""));
    setCheckError("");
  };

  const handleQuickAmount = (val: number) => {
    setAmount(formatInputAmount(String(parseAmount(amount) + val)));
  };

  const handleNext = async () => {
    // 최근 보낸 사람을 선택하면 계좌번호 입력 없이도 receiverAccountId가 채워진다.
    if ((!toAccountNumber && !receiverAccountId) || !amount) {
      toast.error("받는 사람과 금액을 입력해주세요.");
      return;
    }
    const parsed = parseAmount(amount);
    if (parsed <= 0) { toast.error("송금 금액은 1원 이상이어야 합니다."); return; }
    if (!fromAccountId) { toast.error("출금 계좌를 선택해주세요."); return; }
    if (selectedAccount && parsed > selectedAccount.balance) { toast.error("잔액이 부족합니다."); return; }
    if (selectedAccount?.accountNumber === toAccountNumber) { toast.error("본인 계좌로는 송금할 수 없습니다."); return; }
    if (!receiverAccountId) {
      const result = await handleCheckAccount();
      if (!result) return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirm = async () => {
    setShowConfirmModal(false);
    setIsLoading(true);
    if (!fromAccountId || !receiverAccountId) {
      toast.error("계좌 정보가 없습니다.");
      setIsLoading(false);
      return;
    }
    try {
      await transferMoney({
        fromAccountId,
        toAccountId: receiverAccountId,
        amount: parseAmount(amount),
        memo,
        category: aiCategory || "기타",
      });
      toast.success("송금이 완료되었습니다!");
      navigate(`/account/${fromAccountId}`);
    } catch (err) {
      toast.error(handleTransferError(err));
      Sentry.captureException(err);
    } finally {
      setIsLoading(false);
    }
  };

  const aiAnalysisReady = (receiverInputName || receiverName) && parseAmount(amount) > 0;

  return (
    <>
    <UserShell title="송금하기" backTo="/dashboard">
          <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
            {/* ── 메인 폼 ── */}
            <div className="flex flex-col gap-4">

              {/* 최근 보낸 사람 */}
              <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-black text-slate-950">최근 보낸 사람</p>
                  <button
                    type="button"
                    onClick={() => navigate("/transactions")}
                    className="flex items-center gap-1 text-xs font-bold text-slate-400 transition hover:text-slate-700"
                  >
                    친구 전체보기 <ChevronRight size={13} />
                  </button>
                </div>
                {recentSenders.length > 0 ? (
                  <div className="flex gap-4">
                    {recentSenders.map((s) => (
                      <button
                        key={s.accountId}
                        type="button"
                        onClick={() => handleQuickRecipient(s)}
                        className="flex flex-col items-center gap-1.5 group"
                      >
                        <div className={`flex h-12 w-12 items-center justify-center rounded-full text-base font-black text-white ring-2 ring-transparent transition group-hover:ring-slate-300 ${s.avatarColor} ${receiverAccountId === s.accountId ? "ring-slate-950 ring-offset-2" : ""}`}>
                          {s.name.charAt(0)}
                        </div>
                        <p className="text-xs font-bold text-slate-700">{s.name}</p>
                        <p className="text-[10px] font-medium text-slate-400 leading-none">{s.bank}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-medium text-slate-400">거래 내역이 없습니다.</p>
                )}
              </div>

              {/* 출금 계좌 */}
              <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
                <p className="mb-3 text-sm font-black text-slate-950">출금 계좌</p>
                <div className="space-y-2">
                  {accounts.map((acc) => {
                    const selected = fromAccountId === acc.accountId;
                    return (
                      <button
                        key={acc.accountId}
                        type="button"
                        onClick={() => setFromAccountId(acc.accountId)}
                        className={`flex w-full items-center justify-between rounded-[16px] border-2 px-4 py-3.5 text-left transition ${
                          selected
                            ? "border-slate-950 bg-slate-950/[0.03]"
                            : "border-slate-100 bg-slate-50 hover:border-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${selected ? "bg-slate-950" : "bg-slate-300"}`} />
                          <div>
                            <p className="text-sm font-black text-slate-900">
                              {acc.accountName || acc.bankName || "계좌"}
                            </p>
                            <p className="text-xs font-semibold text-slate-400">
                              {acc.bankName} · {formatAccountNumber(acc.accountNumber).replace(/\d(?=\d{4})/g, "●")}
                            </p>
                          </div>
                        </div>
                        <p className={`text-sm font-black ${selected ? "text-slate-950" : "text-slate-600"}`}>
                          {formatCurrency(acc.balance)}
                        </p>
                      </button>
                    );
                  })}
                  {accounts.length === 0 && (
                    <p className="py-4 text-center text-sm text-slate-400">계좌를 불러오는 중...</p>
                  )}
                </div>
              </div>

              {/* 받는 사람 */}
              <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
                <p className="mb-4 text-sm font-black text-slate-950">받는 사람</p>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="receiverBank" className="mb-1.5 block text-xs font-bold text-slate-500">은행</label>
                    <input
                      id="receiverBank"
                      type="text"
                      list="bank-list"
                      placeholder="토스뱅크"
                      value={receiverBank}
                      onChange={(e) => setReceiverBank(e.target.value)}
                      className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                    />
                    <datalist id="bank-list">
                      {BANK_OPTIONS.map((b) => <option key={b} value={b} />)}
                    </datalist>
                  </div>

                  <div>
                    <label htmlFor="toAccountNumber" className="mb-1.5 block text-xs font-bold text-slate-500">계좌번호</label>
                    <div className="relative">
                      <input
                        id="toAccountNumber"
                        type="text"
                        inputMode="numeric"
                        placeholder="숫자만 입력"
                        value={toAccountNumber}
                        onChange={(e) => {
                          setToAccountNumber(e.target.value.replace(/\D/g, ""));
                          setReceiverName("");
                          setReceiverAccountId(null);
                          setCheckError("");
                        }}
                        className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                      />
                      {isCheckingAccount && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <svg className="h-4 w-4 animate-spin text-slate-400" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        </div>
                      )}
                      {receiverName && !isCheckingAccount && (
                        <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" />
                      )}
                    </div>
                    {checkError && <p className="mt-1 text-xs font-semibold text-rose-500">{checkError}</p>}
                  </div>

                  <div>
                    <label htmlFor="receiverInputName" className="mb-1.5 block text-xs font-bold text-slate-500">받는 사람 이름</label>
                    <input
                      id="receiverInputName"
                      type="text"
                      placeholder="예: 김민수"
                      value={receiverInputName}
                      onChange={(e) => setReceiverInputName(e.target.value)}
                      className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                    />
                  </div>

                  {/* 최근 수신인 칩 */}
                  {recentSenders.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {recentSenders.slice(0, 4).map((s) => (
                        <button
                          key={s.accountId}
                          type="button"
                          onClick={() => handleQuickRecipient(s)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
                            receiverAccountId === s.accountId
                              ? "border-slate-950 bg-slate-950 text-white"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300"
                          }`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 송금 금액 */}
              <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
                <p className="mb-4 text-sm font-black text-slate-950">송금 금액</p>
                <div className="relative mb-3">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-slate-400">₩</span>
                  <input
                    type="text"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(formatInputAmount(e.target.value))}
                    className="w-full rounded-[14px] border border-slate-200 bg-slate-50 py-3.5 pl-9 pr-4 text-[1.4rem] font-black text-slate-950 placeholder-slate-300 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {QUICK_AMOUNTS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => handleQuickAmount(q)}
                      className="rounded-[12px] bg-slate-100 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                    >
                      +{q >= 10000 ? `${q / 10000}만` : q.toLocaleString()}
                    </button>
                  ))}
                </div>
                <div>
                  <label htmlFor="memo" className="mb-1.5 block text-xs font-bold text-slate-500">메모 (선택)</label>
                  <input
                    id="memo"
                    type="text"
                    placeholder="예: 점심값 정산"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="w-full rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>

              {/* 다음 버튼 */}
              <button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-[20px] bg-slate-950 py-4 text-base font-black text-white shadow-[0_18px_30px_rgba(15,23,42,0.2)] transition hover:bg-slate-800 disabled:bg-slate-400"
              >
                {isLoading ? (
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : null}
                다음 · 송금 내용 확인
              </button>
            </div>

            {/* ── 우측 패널 ── */}
            <div className="flex flex-col gap-4">
              {/* AI 송금 분석 */}
              <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-cyan-100 text-cyan-600">
                      <Bot size={16} />
                    </div>
                    <p className="text-sm font-black text-slate-950">AI 송금 분석</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                    EzPay 내부 기기
                  </span>
                </div>

                {aiAnalysisReady && aiCategory ? (
                  <div className="space-y-3">
                    <div className="rounded-[14px] bg-cyan-50 px-4 py-3">
                      <p className="text-xs font-semibold text-cyan-600">예측 카테고리</p>
                      <p className="mt-1 text-base font-black text-cyan-800">{aiCategory}</p>
                      <p className="mt-0.5 text-xs font-medium text-cyan-600">
                        신뢰도 {(aiConfidence * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="rounded-[14px] bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold text-slate-500">수신자</p>
                      <p className="mt-0.5 text-sm font-black text-slate-900">{receiverInputName || receiverName}</p>
                    </div>
                    <div className="rounded-[14px] bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold text-slate-500">금액</p>
                      <p className="mt-0.5 text-sm font-black text-slate-900">{amount ? `₩${amount}` : "-"}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-6 text-center">
                    <Clock size={28} className="text-slate-300 mb-3" />
                    <p className="text-sm font-semibold text-slate-400">
                      수신자와 금액을 입력하면<br />AI 분석이 시작됩니다
                    </p>
                  </div>
                )}
              </div>

              {/* 최근 송금 */}
              <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_20px_60px_rgba(15,23,42,0.06)]">
                <p className="mb-4 text-sm font-black text-slate-950">최근 송금</p>
                {recentTransfers.length > 0 ? (
                  <div className="space-y-3">
                    {recentTransfers.map((t, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100">
                            <ArrowUpRight size={14} className="text-rose-500" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">{t.name}</p>
                            <p className="text-xs font-medium text-slate-400">{t.date}</p>
                          </div>
                        </div>
                        <p className="text-sm font-black text-slate-700">
                          {formatCurrency(t.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-4 text-center text-sm text-slate-400">최근 송금 내역이 없습니다.</p>
                )}
              </div>
            </div>
          </div>
    </UserShell>

      {/* 송금 확인 모달 */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <h3 className="text-base font-black text-slate-950">송금 확인</h3>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2.5 px-6 py-5">
              {[
                { label: "출금 계좌", value: selectedAccount ? `${selectedAccount.bankName} · ${formatAccountNumber(selectedAccount.accountNumber)}` : "-" },
                { label: "받는 분", value: receiverInputName || receiverName || "-" },
                ...(toAccountNumber ? [{ label: "받는 계좌", value: formatAccountNumber(toAccountNumber) }] : []),
                { label: "송금 금액", value: `₩${amount}`, highlight: true },
                ...(memo ? [{ label: "메모", value: memo }] : []),
                ...(aiCategory ? [{ label: "카테고리", value: aiCategory }] : []),
              ].map(({ label, value, highlight }) => (
                <div key={label} className="flex items-center justify-between rounded-[14px] bg-slate-50 px-4 py-3">
                  <p className="text-sm font-semibold text-slate-500">{label}</p>
                  <p className={`text-sm font-black ${highlight ? "text-cyan-700" : "text-slate-900"}`}>{value}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 px-6 py-4">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="rounded-[16px] border border-slate-200 bg-white py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="rounded-[16px] bg-slate-950 py-3.5 text-sm font-bold text-white hover:bg-slate-800"
              >
                확인 송금
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SendMoney;
