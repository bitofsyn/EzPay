import { Chart as ChartJS } from "chart.js";
import { useEffect, useRef } from "react";
import "../../lib/chartSetup";
import { HourlyTransaction } from "../../types";

interface HourlyTransactionChartProps {
  hourlyTransactions: HourlyTransaction[];
}

const HourlyTransactionChart = ({ hourlyTransactions }: HourlyTransactionChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // StrictMode double-mount 방어: 캔버스에 이미 존재하는 차트 제거
    const stale = ChartJS.getChart(canvasRef.current);
    stale?.destroy();

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, "rgba(236, 72, 153, 0.8)");
    gradient.addColorStop(1, "rgba(168, 85, 247, 0.8)");

    chartRef.current = new ChartJS(canvasRef.current, {
      type: "bar",
      data: {
        labels: hourlyTransactions.map((h) => h.hour),
        datasets: [
          {
            label: "거래 건수",
            data: hourlyTransactions.map((h) => h.transactionCount),
            backgroundColor: gradient,
            borderColor: "rgba(236, 72, 153, 1)",
            borderWidth: 2,
            borderRadius: 8,
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
  }, [hourlyTransactions]);

  return <canvas ref={canvasRef} />;
};

export default HourlyTransactionChart;
