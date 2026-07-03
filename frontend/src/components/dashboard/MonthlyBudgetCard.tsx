import DashboardCard from "./DashboardCard";
import type { BudgetItem } from "./types";
import { wonK } from "./format";

interface MonthlyBudgetCardProps {
  items: BudgetItem[];
}

/**
 * 월간 예산 카드. 카테고리별 사용액/한도 진행바를 보여준다.
 * 진행바는 width 트랜지션으로 부드럽게 채워지고, 한도 임박 항목은 색으로 구분한다.
 */
const MonthlyBudgetCard = ({ items }: MonthlyBudgetCardProps) => (
  <DashboardCard title="월간 예산">
    <div className="space-y-3">
      {items.map((b) => {
        const pct = b.limit > 0 ? Math.round((b.used / b.limit) * 100) : 0;
        const remain = Math.max(b.limit - b.used, 0);
        return (
          <div key={b.category}>
            <div className="mb-1.5 flex justify-between">
              <span className="text-sm font-semibold text-slate-700">{b.category}</span>
              <span className="text-xs tabular-nums text-slate-400">
                {wonK(b.used)} / {wonK(b.limit)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${Math.min(pct, 100)}%`, background: b.color ?? "#334155" }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {pct}% 사용 · 남은 {wonK(remain)}
            </p>
          </div>
        );
      })}
    </div>
  </DashboardCard>
);

export default MonthlyBudgetCard;
