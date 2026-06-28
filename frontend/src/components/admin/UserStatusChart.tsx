import { Chart as ChartJS } from "chart.js";
import { useEffect, useRef } from "react";
import "../../lib/chartSetup";

interface UserStatusChartProps {
  activeUsers: number;
  inactiveUsers: number;
  lockedUsers?: number;
}

const UserStatusChart = ({ activeUsers, inactiveUsers, lockedUsers = 0 }: UserStatusChartProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<ChartJS | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // StrictMode double-mount 방어: 캔버스에 이미 존재하는 차트 제거
    const stale = ChartJS.getChart(canvasRef.current);
    stale?.destroy();

    chartRef.current = new ChartJS(canvasRef.current, {
      type: "doughnut",
      data: {
        labels: ["활성", "비활성", "잠금"],
        datasets: [
          {
            data: [activeUsers, inactiveUsers, lockedUsers],
            backgroundColor: [
              "rgba(16, 185, 129, 0.8)",
              "rgba(251, 146, 60, 0.8)",
              "rgba(239, 68, 68, 0.8)",
            ],
            borderColor: [
              "rgba(16, 185, 129, 1)",
              "rgba(251, 146, 60, 1)",
              "rgba(239, 68, 68, 1)",
            ],
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "rgba(71, 85, 105, 1)",
              font: { size: 12 },
              padding: 15,
            },
          },
          tooltip: {
            backgroundColor: "rgba(17, 24, 39, 0.9)",
            titleColor: "rgba(34, 211, 238, 1)",
            bodyColor: "rgba(229, 231, 235, 1)",
            borderColor: "rgba(99, 102, 241, 0.5)",
            borderWidth: 1,
            padding: 12,
          },
        },
      },
    });

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [activeUsers, inactiveUsers, lockedUsers]);

  return <canvas ref={canvasRef} />;
};

export default UserStatusChart;
