import DashboardCard from "./DashboardCard";
import AssetTrendChart from "./charts/AssetTrendChart";
import type { ChartPoint } from "./types";

interface AssetTrendCardProps {
  data: ChartPoint[];
  changeLabel?: string;
}

/**
 * 자산 추이 카드. 헤더에 증감 뱃지, 본문에 라인 차트를 배치한다.
 */
const AssetTrendCard = ({ data, changeLabel }: AssetTrendCardProps) => (
  <DashboardCard
    title="자산 추이"
    action={
      changeLabel ? (
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
          {changeLabel}
        </span>
      ) : undefined
    }
  >
    <AssetTrendChart data={data} />
  </DashboardCard>
);

export default AssetTrendCard;
