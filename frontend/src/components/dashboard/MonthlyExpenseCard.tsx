import DashboardCard from "./DashboardCard";
import ExpenseBarChart from "./charts/ExpenseBarChart";
import type { ChartPoint } from "./types";

interface MonthlyExpenseCardProps {
  data: ChartPoint[];
}

/**
 * 월별 지출 카드. 막대 차트를 감싼다.
 */
const MonthlyExpenseCard = ({ data }: MonthlyExpenseCardProps) => (
  <DashboardCard title="월별 지출">
    <ExpenseBarChart data={data} />
  </DashboardCard>
);

export default MonthlyExpenseCard;
