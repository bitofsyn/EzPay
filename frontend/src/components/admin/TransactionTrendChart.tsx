import { Chart as ChartJS } from "chart.js";
import { useEffect, useRef } from "react";
import "../../lib/chartSetup";
import { WeeklyTrendData } from "../../types";

interface TransactionTrendChartProps {
  weeklyTrend: WeeklyTrendData[];
}

const TransactionTrendChart = ({ weeklyTrend }: TransactionTrendChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // StrictMode double-mount 방어: 캔버스에 이미 존재하는 차트 제거
    const stale = ChartJS.getChart(canvasRef.current);
    stale?.destroy();

    chartRef.current = new ChartJS(canvasRef.current, {
      type: "line",
      data: {
        labels: weeklyTrend.map((d) => d.date),
        datasets: [
          {
            label: "거래 건수",
            data: weeklyTrend.map((d) => d.transactionCount),
            borderColor: "rgba(34, 211, 238, 1)",
            backgroundColor: "rgba(34, 211, 238, 0.1)",
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: "rgba(34, 211, 238, 1)",
            pointBorderColor: "#fff",
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            labels: { color: "rgba(71, 85, 105, 1)", font: { size: 12 } },
          },
          tooltip: {
            backgroundColor: "rgba(17, 24, 39, 0.9)",
            titleColor: "rgba(34, 211, 238, 1)",
            bodyColor: "rgba(229, 231, 235, 1)",
            borderColor: "rgba(99, 102, 241, 0.5)",
            borderWidth: 1,
            padding: 12,
            displayColors: true,
          },
        },
        scales: {
          x: {
            grid: { color: "rgba(148, 163, 184, 0.18)" },
            ticks: { color: "rgba(100, 116, 139, 1)" },
          },
          y: {
            grid: { color: "rgba(148, 163, 184, 0.18)" },
            ticks: { color: "rgba(100, 116, 139, 1)" },
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [weeklyTrend]);

  return <canvas ref={canvasRef} />;
};

export default TransactionTrendChart;
