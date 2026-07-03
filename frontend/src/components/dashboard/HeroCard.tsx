import type { HeroAccount, QuickAction } from "./types";
import { won } from "./format";

interface HeroCardProps {
  totalBalance: number;
  accountCount: number;
  /** 전월 대비 증감률 라벨 (예: "+12.5%") */
  changeLabel?: string;
  primaryAccount: HeroAccount | null;
  quickActions: QuickAction[];
  onViewAccounts?: () => void;
}

/**
 * 대시보드 히어로 카드.
 * 총 보유 자산 · 대표 계좌 · 퀵 액션(이체/충전/내역/친구)을 담는다.
 * 원본 목업의 딥네이비→시안 그라디언트와 글래스 패널을 그대로 재현했다.
 */
const HeroCard = ({
  totalBalance,
  accountCount,
  changeLabel,
  primaryAccount,
  quickActions,
  onViewAccounts,
}: HeroCardProps) => (
  <div className="rounded-[20px] bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#0c4a6e] p-[22px] text-white shadow-[0_12px_32px_rgba(14,57,107,0.3)]">
    {/* 총 자산 */}
    <div className="mb-5">
      <p className="text-xs tracking-wide text-white/65">총 보유 자산</p>
      <p className="mt-1 text-[34px] font-black leading-tight tracking-[-1px] tabular-nums">{won(totalBalance)}</p>
      <p className="mt-1 text-xs text-white/60">
        계좌 {accountCount}개
        {changeLabel && (
          <>
            {" · 전월 대비 "}
            <span className="font-bold text-emerald-300">{changeLabel}</span>
          </>
        )}
      </p>
    </div>

    {/* 대표 계좌 */}
    {primaryAccount && (
      <div className="mb-5 rounded-2xl bg-white/10 p-4 backdrop-blur-sm transition hover:bg-white/[0.14]">
        <div className="mb-2.5 flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-1.5">
              <p className="text-xs text-white/75">{primaryAccount.bankName}</p>
              <span className="rounded-full bg-white/20 px-2 py-px text-[10px] font-bold">대표</span>
            </div>
            <p className="font-mono text-xs tracking-[1.5px] text-white/70">{primaryAccount.maskedNumber}</p>
          </div>
          <button
            type="button"
            onClick={onViewAccounts}
            className="rounded-lg bg-white/15 px-3 py-1.5 text-xs font-bold transition hover:bg-white/25"
          >
            전체 계좌 →
          </button>
        </div>
        <p className="text-2xl font-black tabular-nums">{won(primaryAccount.balance)}</p>
      </div>
    )}

    {/* 퀵 액션 */}
    <div className="grid grid-cols-4 gap-2.5">
      {quickActions.map((q) => (
        <button
          key={q.key}
          type="button"
          onClick={q.onClick}
          className="flex flex-col items-center gap-1.5 rounded-xl bg-white/[0.12] px-1.5 py-3 transition hover:-translate-y-0.5 hover:bg-white/20"
        >
          <span className="text-lg leading-none">{q.icon}</span>
          <span className="text-xs font-bold text-white/90">{q.label}</span>
        </button>
      ))}
    </div>
  </div>
);

export default HeroCard;
