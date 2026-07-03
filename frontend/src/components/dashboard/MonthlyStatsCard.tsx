import DashboardCard from "./DashboardCard";
import type { StatItem } from "./types";

interface MonthlyStatsCardProps {
  stats: StatItem[];
}

/**
 * 이달의 통계 카드. 2×2 그리드로 총 송금/입금/건수/평균을 보여준다.
 */
const MonthlyStatsCard = ({ stats }: MonthlyStatsCardProps) => (
  <DashboardCard title="이달의 통계">
    <div className="grid grid-cols-2 gap-3">
      {stats.map((s) => (
        <div key={s.label} className="rounded-xl bg-slate-50 px-4 py-3">
          <p className="mb-1 text-xs text-slate-400">{s.label}</p>
          <p className="text-lg font-extrabold tabular-nums text-slate-800">{s.value}</p>
        </div>
      ))}
    </div>
  </DashboardCard>
);

export default MonthlyStatsCard;
