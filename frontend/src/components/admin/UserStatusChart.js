import { Doughnut } from "react-chartjs-2";

const UserStatusChart = ({ activeUsers, inactiveUsers, lockedUsers }) => {
  const data = {
    labels: ['활성', '비활성', '잠금'],
    datasets: [
      {
        data: [activeUsers, inactiveUsers, lockedUsers],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(251, 146, 60, 0.8)',
          'rgba(239, 68, 68, 0.8)',
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(251, 146, 60, 1)',
          'rgba(239, 68, 68, 1)',
        ],
        borderWidth: 2,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: 'rgba(156, 163, 175, 1)',
          font: { size: 12 },
          padding: 15,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: 'rgba(34, 211, 238, 1)',
        bodyColor: 'rgba(229, 231, 235, 1)',
        borderColor: 'rgba(99, 102, 241, 0.5)',
        borderWidth: 1,
        padding: 12,
      }
    }
  };

  return <Doughnut data={data} options={options} />;
};

export default UserStatusChart;
