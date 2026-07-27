import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Maximize2, X } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { useEffect, useMemo, useState } from 'react';
import './ProfitChart.css';
import { getSessionAllInEvBb, parseBigBlind } from '../../utils/sessionUnits';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler, Legend);

const optionalMetrics = [
  { key: 'allInEV', label: 'All-In EV', color: '#14b8a6', axis: 'allInEV', format: (value) => `${formatSigned(value, 1)} BB` },
  { key: 'bbWon', label: 'BB Won', color: '#38bdf8', axis: 'bb', format: (value) => `${formatSigned(value, 1)} BB` },
  { key: 'bb100', label: 'BB/100', color: '#f59e0b', axis: 'rate', format: (value) => formatSigned(value, 2) },
  {
    key: 'hourlyProfit',
    label: 'Hourly Profit',
    color: '#f43f5e',
    axis: 'hourly',
    format: (value) => formatCurrency(value),
  },
];

function formatCurrency(value) {
  return `${value < 0 ? '-' : ''}$${Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatSigned(value, digits) {
  return `${value > 0 ? '+' : ''}${value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}

function getSessionBbWon(session) {
  const profit = Number(session.profit) || 0;
  const bigBlind = parseBigBlind(session.stakes);

  if (bigBlind > 0) {
    return profit / bigBlind;
  }

  const hands = Number(session.hands) || 0;
  const bb100 = Number(session.bb100);

  return hands > 0 && Number.isFinite(bb100) ? (bb100 * hands) / 100 : null;
}

function getMetricSeries(chartData, key) {
  return chartData.map((item) => item[key]);
}

function formatChartDate(value, options = {}) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

export default function ProfitChart({
  sessions,
  periods = [],
  selectedPeriod = 'all-time',
  onPeriodChange,
  isLoading = false,
}) {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState({
    allInEV: false,
    bbWon: false,
    bb100: false,
    hourlyProfit: true,
  });
  const activePeriod = useMemo(
    () => periods.find((period) => period.id === selectedPeriod) || periods[0],
    [periods, selectedPeriod],
  );
  const isLightTheme = theme === 'light';
  const chartTextColor = isLightTheme ? '#111827' : '#cbd5e1';
  const chartGridColor = isLightTheme ? 'rgba(17, 24, 39, 0.14)' : 'rgba(148, 163, 184, 0.15)';
  const fullScreenTextColor = isLightTheme ? '#111827' : '#d8dee8';
  const fullScreenGridColor = isLightTheme ? '#d1d5db' : '#263545';

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setTheme(document.documentElement.dataset.theme || 'dark');
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isFullScreen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        setIsFullScreen(false);
      }
    }

    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isFullScreen]);

  const { chartData, runningHands, runningProfit, visibleSessionCount } = useMemo(() => {
    const visibleSessions = [...sessions].sort(
      (firstSession, secondSession) => new Date(firstSession.date) - new Date(secondSession.date),
    );

    let nextRunningProfit = 0;
    let runningBbWon = 0;
    let nextRunningHands = 0;
    let runningMinutes = 0;

    const nextChartData = visibleSessions.map((session, index) => {
      const sessionDate = new Date(session.date);
      const formattedDate = formatChartDate(sessionDate);
      const sessionBbWon = getSessionBbWon(session);
      const sessionHands = Number(session.hands) || 0;
      const sessionDuration = Number(session.duration);
      const sessionAllInEV = getSessionAllInEvBb(session);
      const sessionProfit = Number(session.profit) || 0;

      nextRunningProfit += sessionProfit;
      runningBbWon += Number.isFinite(sessionBbWon) ? sessionBbWon : 0;
      nextRunningHands += sessionHands;
      runningMinutes += Number.isFinite(sessionDuration) ? sessionDuration : 0;
      const runningHours = runningMinutes / 60;

      return {
        date: formattedDate,
        xLabel: `Session ${index + 1}`,
        timestamp: sessionDate.getTime(),
        profit: Number(nextRunningProfit.toFixed(2)),
        allInEV: Number.isFinite(sessionAllInEV) ? Number(sessionAllInEV.toFixed(1)) : null,
        bbWon: Number(runningBbWon.toFixed(1)),
        bb100: nextRunningHands > 0 ? Number(((runningBbWon / nextRunningHands) * 100).toFixed(2)) : null,
        handsPlayed: nextRunningHands,
        hourlyProfit: runningHours > 0 ? Number((nextRunningProfit / runningHours).toFixed(2)) : null,
      };
    });

    return {
      chartData: nextChartData,
      runningHands: nextRunningHands,
      runningProfit: nextRunningProfit,
      visibleSessionCount: visibleSessions.length,
    };
  }, [sessions]);

  const metricBounds = useMemo(() => {
    function getMetricBounds(key, paddingRatio = 0.28) {
      const values = chartData.map((item) => Number(item[key])).filter((value) => Number.isFinite(value));

      if (!values.length) {
        return {};
      }

      const min = Math.min(0, ...values);
      const max = Math.max(0, ...values);
      const span = Math.max(max - min, Math.abs(max), Math.abs(min), 1);
      const padding = span * paddingRatio;

      return {
        suggestedMin: min < 0 ? min - padding : 0,
        suggestedMax: max > 0 ? max + padding : 0,
      };
    }

    return {
      profit: getMetricBounds('profit'),
      allInEV: getMetricBounds('allInEV'),
      bbWon: getMetricBounds('bbWon'),
      bb100: getMetricBounds('bb100'),
    };
  }, [chartData]);

  const datasets = useMemo(
    () => [
      {
        label: 'Total Profit',
        data: getMetricSeries(chartData, 'profit'),
        yAxisID: 'money',
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
        metricKey: 'profit',
      },
      ...optionalMetrics
        .filter((metric) => selectedMetrics[metric.key])
        .map((metric) => ({
          label: metric.label,
          data: getMetricSeries(chartData, metric.key),
          yAxisID: metric.axis,
          borderColor: metric.color,
          backgroundColor: `${metric.color}26`,
          fill: false,
          tension: 0,
          pointRadius: 0,
          pointHoverRadius: 5,
          pointHitRadius: 16,
          pointHoverBackgroundColor: metric.color,
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 2,
          borderWidth: 2,
          spanGaps: false,
          metricKey: metric.key,
        })),
    ],
    [chartData, selectedMetrics],
  );

  const data = useMemo(
    () => ({
      labels: chartData.map((item) => item.xLabel),
      datasets,
    }),
    [chartData, datasets],
  );

  const fullScreenData = useMemo(
    () => ({
      labels: data.labels,
      datasets: datasets.map((dataset) => ({
        ...dataset,
        backgroundColor: 'transparent',
        fill: false,
        borderWidth: dataset.metricKey === 'profit' ? 2.5 : 2,
        pointRadius: 0,
        pointHoverRadius: 4,
      })),
    }),
    [data.labels, datasets],
  );

  function getChartOptions({ fullScreen = false } = {}) {
    const textColor = fullScreen ? fullScreenTextColor : chartTextColor;
    const gridColor = fullScreen ? fullScreenGridColor : chartGridColor;

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },

      plugins: {
        legend: {
          display: datasets.length > 1,
          align: 'start',
          labels: {
            color: textColor,
            boxHeight: 2,
            boxWidth: 28,
            usePointStyle: false,
          },
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
          displayColors: true,
          callbacks: {
            title: (items) => {
              const item = chartData[items[0]?.dataIndex];
              return item ? formatChartDate(item.timestamp, { year: 'numeric' }) : '';
            },
            afterTitle: (items) => {
              const item = chartData[items[0]?.dataIndex];

              if (!item) {
                return '';
              }

              const details = [item.xLabel];

              if (Number.isFinite(item.handsPlayed)) {
                details.push(`${item.handsPlayed.toLocaleString('en-US')} hands`);
              }

              return details;
            },
            label: (context) => {
              const metric = optionalMetrics.find((item) => item.key === context.dataset.metricKey);
              const formatter = metric?.format || formatCurrency;
              return `${context.dataset.label}: ${formatter(Number(context.parsed.y) || 0)}`;
            },
          },
        },
      },

      scales: {
        x: {
          type: 'category',
          title: {
            display: false,
            color: textColor,
            font: {
              weight: '700',
            },
            text: 'Date',
          },
          grid: {
            color: gridColor,
            display: fullScreen,
          },
          ticks: {
            color: textColor,
            maxTicksLimit: fullScreen ? 12 : 7,
          },
          border: {
            color: gridColor,
            display: fullScreen,
          },
        },

        money: {
          type: 'linear',
          position: 'left',
          beginAtZero: true,
          ...metricBounds.profit,
          ticks: {
            color: textColor,
            maxTicksLimit: fullScreen ? 9 : 5,
            callback: (value) => `$${value.toLocaleString()}`,
          },
          grid: {
            color: gridColor,
            borderDash: fullScreen ? [] : [6, 6],
          },
          border: {
            color: gridColor,
            display: fullScreen,
          },
        },
        allInEV: {
          type: 'linear',
          display: selectedMetrics.allInEV,
          position: 'right',
          ...metricBounds.allInEV,
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            color: textColor,
            maxTicksLimit: fullScreen ? 9 : 5,
            callback: (value) => `${value.toLocaleString()} BB`,
          },
          border: {
            color: gridColor,
            display: fullScreen,
          },
        },
        bb: {
          type: 'linear',
          display: selectedMetrics.bbWon,
          position: 'right',
          ...metricBounds.bbWon,
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            color: textColor,
            maxTicksLimit: fullScreen ? 9 : 5,
            callback: (value) => `${value.toLocaleString()} BB`,
          },
          border: {
            color: gridColor,
            display: fullScreen,
          },
        },
        rate: {
          type: 'linear',
          display: selectedMetrics.bb100,
          position: 'right',
          ...metricBounds.bb100,
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            color: textColor,
            maxTicksLimit: fullScreen ? 9 : 5,
            callback: (value) => value.toLocaleString(),
          },
          border: {
            color: gridColor,
            display: fullScreen,
          },
        },
        hourly: {
          type: 'linear',
          display: selectedMetrics.hourlyProfit,
          position: 'right',
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            color: textColor,
            maxTicksLimit: fullScreen ? 9 : 5,
            callback: (value) => `${formatCurrency(value)}/hr`,
          },
          border: {
            color: gridColor,
            display: fullScreen,
          },
        },
      },
    };
  }

  const options = useMemo(
    () => getChartOptions(),
    [chartData, chartGridColor, chartTextColor, datasets.length, metricBounds, selectedMetrics],
  );
  const fullScreenOptions = useMemo(
    () => getChartOptions({ fullScreen: true }),
    [chartData, datasets.length, fullScreenGridColor, fullScreenTextColor, metricBounds, selectedMetrics],
  );

  return (
    <div className='profit-card'>
      <div className='profit-header'>
        <h2>{activePeriod?.chartLabel || 'Total Profit'}</h2>
        <div className='profit-header-actions'>
          <div className='profit-period-buttons' aria-label='Profit chart period'>
            {periods.map((period) => (
              <button
                className={selectedPeriod === period.id ? 'active' : ''}
                type='button'
                aria-pressed={selectedPeriod === period.id}
                disabled={!period.available}
                title={!period.available ? 'No sessions found for this period' : undefined}
                onClick={() => onPeriodChange?.(period.id)}
                key={period.id}
              >
                {period.label}
                {!period.available && <span className='period-unavailable'>N/A</span>}
              </button>
            ))}
          </div>
          <button
            className='profit-expand-button'
            type='button'
            aria-label='Open graph full page'
            onClick={() => setIsFullScreen(true)}
          >
            <Maximize2 aria-hidden='true' />
          </button>
        </div>
      </div>

      <div className='profit-metric-toggles' aria-label='Profit chart metrics'>
        {optionalMetrics.map((metric) => (
          <label style={{ '--metric-color': metric.color }} key={metric.key}>
            <input
              type='checkbox'
              checked={selectedMetrics[metric.key]}
              onChange={(event) =>
                setSelectedMetrics((currentMetrics) => ({
                  ...currentMetrics,
                  [metric.key]: event.target.checked,
                }))
              }
            />
            <span className='metric-check' aria-hidden='true'></span>
            <span className='metric-label'>{metric.label}</span>
          </label>
        ))}
      </div>

      <div className='chart-wrapper' aria-busy={isLoading}>
        <Line data={data} options={options} />
        {isLoading && (
          <div className='profit-chart-loading' role='status' aria-live='polite'>
            <span aria-hidden='true'></span>
            <strong>Updating graph...</strong>
          </div>
        )}
      </div>

      {isFullScreen && (
        <div className='profit-fullscreen' role='dialog' aria-modal='true' aria-labelledby='profit-fullscreen-title'>
          <div className='profit-fullscreen__surface'>
            <header className='profit-fullscreen__header'>
              <div>
                <h2 id='profit-fullscreen-title'>Results Graph</h2>
                <p>
                  {activePeriod?.label || 'All Time'} · {visibleSessionCount.toLocaleString('en-US')} sessions
                </p>
              </div>
              <button type='button' aria-label='Close full page graph' onClick={() => setIsFullScreen(false)}>
                <X aria-hidden='true' />
              </button>
            </header>

            <div className='profit-fullscreen__toolbar'>
              <span>Graph</span>
              <span>Hands: {runningHands.toLocaleString('en-US')}</span>
              <span>Profit: {formatCurrency(runningProfit)}</span>
            </div>

            <div className='profit-fullscreen__chart'>
              <Line data={fullScreenData} options={fullScreenOptions} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
