import { useId, useState } from "react";
import type { ChartPoint } from "../types";
import { won } from "../format";

interface AssetTrendChartProps {
  data: ChartPoint[];
  /** 선/그라디언트 색 (기본 cyan-600) */
  color?: string;
}

const W = 340;
const H = 120;
const PX = 24;
const PY = 14;

/**
 * 자산 추이 라인 차트 (의존성 없는 순수 SVG).
 * 원본 목업의 LineChart를 재현: 가로 그리드 3줄 · 그라디언트 area · hover 포인트 툴팁.
 * viewBox 기반이라 컨테이너 폭에 맞춰 반응형으로 늘어난다.
 */
const AssetTrendChart = ({ data, color = "#0891b2" }: AssetTrendChartProps) => {
  const gradientId = useId();
  const [tip, setTip] = useState<{ x: number; point: ChartPoint } | null>(null);

  if (data.length === 0) {
    return <div className="flex h-[132px] items-center justify-center text-xs text-slate-400">데이터가 없습니다</div>;
  }

  const values = data.map((d) => d.value);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const cx = (i: number) => PX + (i / Math.max(data.length - 1, 1)) * (W - 2 * PX);
  const cy = (v: number) => PY + (1 - (v - lo) / (hi - lo || 1)) * (H - 2 * PY);
  const pts = data.map((d, i) => ({ x: cx(i), y: cy(d.value), point: d }));
  const line = pts.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(" ");
  const area = `${line} L${pts[pts.length - 1].x},${H - PY} L${pts[0].x},${H - PY} Z`;

  return (
    <div className="relative">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="block overflow-visible">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((r) => (
          <line
            key={r}
            x1={PX}
            y1={PY + (1 - r) * (H - 2 * PY)}
            x2={W - PX}
            y2={PY + (1 - r) * (H - 2 * PY)}
            stroke="#e2e8f0"
            strokeWidth="1"
          />
        ))}
        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={tip?.point.label === p.point.label ? 5.5 : 4}
            fill="#fff"
            stroke={color}
            strokeWidth="2.5"
            className="cursor-pointer transition-[r]"
            onMouseEnter={() => setTip({ x: p.x, point: p.point })}
            onMouseLeave={() => setTip(null)}
          />
        ))}
      </svg>

      {tip && (
        <div
          className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1 text-[11px] font-bold text-white shadow-lg"
          style={{ left: `${(tip.x / W) * 100}%` }}
        >
          {tip.point.label} · {won(tip.point.value)}
        </div>
      )}

      <div className="mt-2 flex justify-between px-6">
        {data.map((d) => (
          <span key={d.label} className="text-xs text-slate-400">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default AssetTrendChart;
