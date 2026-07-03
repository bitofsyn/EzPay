import DashboardCard from "./DashboardCard";
import type { RecentTx } from "./types";

interface RecentTransactionsCardProps {
  transactions: RecentTx[];
  onSelectTx?: (tx: RecentTx) => void;
  onViewAll?: () => void;
}

/**
 * 최근 거래 카드.
 * 방향(출금/입금) 뱃지 · 상대/카테고리·날짜 · 금액을 한 줄로 보여준다.
 */
const RecentTransactionsCard = ({ transactions, onSelectTx, onViewAll }: RecentTransactionsCardProps) => (
  <DashboardCard title="최근 거래">
    <div className="flex flex-col gap-1.5">
      {transactions.length === 0 ? (
        <div className="rounded-xl bg-slate-50 py-8 text-center text-xs text-slate-400">최근 거래 내역이 없습니다</div>
      ) : (
        transactions.map((tx) => {
          const isOut = tx.direction === "out";
          return (
            <button
              key={tx.id}
              type="button"
              onClick={() => onSelectTx?.(tx)}
              className="flex items-center justify-between rounded-xl px-3 py-3 text-left transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/10"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    isOut ? "bg-rose-50 text-rose-500" : "bg-cyan-50 text-cyan-600"
                  }`}
                >
                  {isOut ? "출금" : "입금"}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{tx.counterparty}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {tx.category ? `${tx.category} · ` : ""}
                    {tx.dateLabel}
                  </p>
                </div>
              </div>
              <p className={`text-sm font-bold tabular-nums ${isOut ? "text-slate-800" : "text-cyan-700"}`}>
                {isOut ? "−" : "+"}₩{tx.amount.toLocaleString("ko-KR")}
              </p>
            </button>
          );
        })
      )}

      <div className="mt-2 text-center">
        <button
          type="button"
          onClick={onViewAll}
          className="text-sm font-semibold text-slate-500 transition hover:text-slate-900"
        >
          거래 내역 전체 보기 →
        </button>
      </div>
    </div>
  </DashboardCard>
);

export default RecentTransactionsCard;
