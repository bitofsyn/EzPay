import { useState } from "react";
import type { ChartPoint } from "../types";
import { wonK } from "../format";

interface ExpenseBarChartProps {
  data: ChartPoint[];
  /** color 미지정 데이터 포인트에 쓰일 기본 막대 색 */
  defaultColor?: string;
}

const BAR_MAX_H = 68;

/**
 * 월별 지출 막대 차트 (순수 SVG/flex).
 * 원본 목업 BarChart 재현: 최고값 기준 정규화 · hover 툴팁 · 막대 grow 트랜지션.
 */
const ExpenseBarChart = ({ data, defaultColor = "#94a3b8" }: ExpenseBarChartProps) => {
  const [hovered, setHovered] = useState<number | null>(null);

  if (data.length === 0) {
    return <div className="flex h-[90px] items-center justify-center text-xs text-slate-400">데이터가 없습니다</div>;
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex h-[90px] items-end gap-2">
      {data.map((d, i) => {
        const h = Math.round((d.value / max) * BAR_MAX_H);
        return (
          <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
            <div
              className="relative flex h-[68px] w-full cursor-pointer items-end"
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {hovered === i && (
                <div className="absolute bottom-[110%] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-950 px-2 py-1 text-[10px] font-bold text-white shadow-lg">
                  {wonK(d.value)}
                </div>
              )}
              <div
                className="w-full rounded-t transition-[height,opacity] duration-500 ease-out"
                style={{
                  height: h,
                  background: d.color ?? defaultColor,
                  opacity: hovered === null || hovered === i ? 1 : 0.55,
                }}
              />
            </div>
            <span className="text-xs font-semibold text-slate-400">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
};

export default ExpenseBarChart;
