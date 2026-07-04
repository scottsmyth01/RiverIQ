import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useState } from 'react';
import './ProfitChart.css';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler);

const profitPeriods = [
  { id: 'all-time', label: 'Total Profit', days: null },
  { id: 'last-month', label: 'Monthly Profit', days: 30 },
  { id: 'last-week', label: 'Weekly Profit', days: 7 },
];

export default function ProfitChart({ sessions }) {
  const [selectedPeriod, setSelectedPeriod] = useState('all-time');
  const activePeriod = profitPeriods.find((period) => period.id === selectedPeriod) || profitPeriods[0];
  const today = new Date();
  const cutoffDate = activePeriod.days ? new Date(today) : null;

  if (cutoffDate) {
    cutoffDate.setDate(today.getDate() - activePeriod.days);
  }

  const visibleSessions = sessions
    .filter((session) => {
      const sessionDate = new Date(session.date);
      return (!cutoffDate || sessionDate >= cutoffDate) && sessionDate <= today;
    })
    .sort((firstSession, secondSession) => new Date(firstSession.date) - new Date(secondSession.date));

  let runningProfit = 0;

  const chartData = visibleSessions.map((session) => {
    runningProfit += session.profit;

    return {
      date: new Date(session.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      profit: Number(runningProfit.toFixed(2)),
    };
  });

  const data = {
    labels: chartData.map((item) => item.date),
    datasets: [
      {
        label: 'Total Profit',
        data: chartData.map((item) => item.profit),
        borderColor: '#39ff64',
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;

          if (!chartArea) return null;

          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);

          gradient.addColorStop(0, 'rgba(57, 255, 100, 0.35)');
          gradient.addColorStop(1, 'rgba(57, 255, 100, 0)');

          return gradient;
        },
        fill: true,
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHitRadius: 16,
        pointHoverBackgroundColor: '#39ff64',
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },

    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
        backgroundColor: '#0f1720',
        titleColor: '#ffffff',
        bodyColor: '#d1d5db',
        borderColor: '#263545',
        borderWidth: 1,
        displayColors: false,
        callbacks: {
          label: (context) =>
            `Profit: ${context.raw < 0 ? '-' : ''}$${Math.abs(context.raw).toLocaleString('en-US', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`,
        },
      },
    },

    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#cbd5e1',
          maxTicksLimit: 7,
        },
        border: {
          display: false,
        },
      },

      y: {
        beginAtZero: true,
        grace: '10%',
        ticks: {
          color: '#cbd5e1',
          maxTicksLimit: 5,
          callback: (value) => `$${value.toLocaleString()}`,
        },
        grid: {
          color: 'rgba(148, 163, 184, 0.15)',
          borderDash: [6, 6],
        },
        border: {
          display: false,
        },
      },
    },
  };

  return (
    <div className='profit-card'>
      <div className='profit-header'>
        <h2>{activePeriod.label}</h2>
        <div className='profit-period-buttons' aria-label='Profit chart period'>
          {profitPeriods.map((period) => (
            <button
              className={selectedPeriod === period.id ? 'active' : ''}
              type='button'
              aria-pressed={selectedPeriod === period.id}
              onClick={() => setSelectedPeriod(period.id)}
              key={period.id}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      <div className='chart-wrapper'>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
