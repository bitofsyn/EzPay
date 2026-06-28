import React, { memo } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";

interface MetricCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  sparkData?: Array<{ v: number }>;
}

/**
 * 최적화된 지표 카드 컴포넌트
 * - React.memo로 props가 같으면 리렌더링 스킵
 * - Sparkline 차트는 필요할 때만 렌더링
 */
const MetricCard: React.FC<MetricCardProps> = memo(
  ({ label, value, sub, color, sparkData }) => {
    return (
      <div className="rounded-2xl bg-white border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-semibold text-gray-500 mb-3">{label}</p>
        <div className="flex items-end justify-between gap-2">
          <div>
            <p className="text-3xl font-black leading-none" style={{ color }}>
              {value}
            </p>
            {sub && <p className="text-xs text-gray-400 mt-1.5">{sub}</p>}
          </div>
          {sparkData && sparkData.length > 0 && (
            <div className="w-28 h-12 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkData}>
                  <Line
                    type="monotone"
                    dataKey="v"
                    stroke={color}
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    );
  }
);

MetricCard.displayName = "MetricCard";

export default MetricCard;
