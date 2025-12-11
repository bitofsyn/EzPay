import { Bar } from "react-chartjs-2";
import { HourlyTransaction } from "../../types";

interface HourlyTransactionChartProps {
  hourlyTransactions: HourlyTransaction[];
}

const HourlyTransactionChart = ({ hourlyTransactions }: HourlyTransactionChartProps) => {
  const data = {
    labels: hourlyTransactions.map(h => h.hour) || [],
    datasets: [
      {
        label: '거래 건수',
        data: hourlyTransactions.map(h => h.count) || [],
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, 'rgba(236, 72, 153, 0.8)');
          gradient.addColorStop(1, 'rgba(168, 85, 247, 0.8)');
          return gradient;
        },
        borderColor: 'rgba(236, 72, 153, 1)',
        borderWidth: 2,
        borderRadius: 8,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: 'rgba(156, 163, 175, 1)',
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: 'rgba(34, 211, 238, 1)',
        bodyColor: 'rgba(229, 231, 235, 1)',
        borderColor: 'rgba(99, 102, 241, 0.5)',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
      }
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(156, 163, 175, 1)',
        }
      },
      y: {
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: 'rgba(156, 163, 175, 1)',
        }
      }
    }
  };

  return <Bar data={data} options={options} />;
};

export default HourlyTransactionChart;
