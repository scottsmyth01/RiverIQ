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
import { createPortal } from 'react-dom';
import './ProfitChart.css';
import { formatCurrency } from '../../utils/sessionUnits';
import { useAuth } from '../../hooks/useAuth';
import { convertFromUsd, getCurrencySymbol, getPreferredCurrency } from '../../utils/currency';

/*
Whenever the component renders, it follows this sequence:

1. Receive sessions and other props.
2. Calculate running totals (profit, hands, and hourly profit) with useMemo.
3. Build the Chart.js datasets from those calculations.
4. Generate the chart options (colors, tooltips, axes, legends, etc.).
5. Render the <Line /> chart.
6. If the user changes the date range, metric checkboxes, theme, or fullscreen state, React updates the relevant state, recomputes only what changed, and redraws the chart.
*/

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler, Legend);

const HOURLY_PROFIT_MIN_HANDS = 250;

const getOptionalMetrics = (currency) => [
  {
    key: 'hourlyProfit',
    label: 'Hourly Profit',
    color: '#ff3b4b',
    axis: 'hourlyProfit',
    format: (value) => `${formatCurrency(value, currency)}/hr`,
  },
];

// returns key value of specified key
/*
Example:

sessionsWithData = [
    {profit:5},
    {profit:8},
    {profit:10}
]
getMetricValues(sessionsWithData,"profit")
returns [5,8,10]
*/
function getMetricValues(sessionsWithData, key) {
  return sessionsWithData.map((item) => item[key]);
}

function formatAxisCurrency(value, currency) {
  const convertedValue = convertFromUsd(value, currency);

  if (!Number.isFinite(convertedValue)) return 'N/A';

  const roundedValue = Math.round(convertedValue / 10) * 10;
  const sign = roundedValue < 0 ? '-' : '';

  return `${sign}${getCurrencySymbol(currency)}${Math.abs(roundedValue).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  })}`;
}

function formatHandsAxisLabel(label) {
  const hands = Number(String(label).replace(/,/g, ''));

  if (!Number.isFinite(hands)) return label;

  return (Math.round(hands / 10) * 10).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });
}

function getSessionTime(session) {
  const date = new Date(session.date || session.createdAt || session.updatedAt);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getPointTime(point, session) {
  const date = new Date(point.date || session.date || session.createdAt || session.updatedAt);

  return Number.isNaN(date.getTime()) ? getSessionTime(session) : date.getTime();
}

// turn 2026-07-30 into Jul 30

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
  sessions = [], //all sessions array
  periods = [], //periods array (time period + availability)
  selectedPeriod = 'all-time', //currently selected period, set to preferences value
  setSelectedPeriod, //change the selected period
  isLoading = false, //if isLoading show the loading spinner
}) {
  const { user } = useAuth();
  const currency = getPreferredCurrency(user);
  const optionalMetrics = useMemo(() => getOptionalMetrics(currency), [currency]);
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark'); // store light/dark
  const [isFullScreen, setIsFullScreen] = useState(false); //controls fullscreen graph
  const [isMobileChart, setIsMobileChart] = useState(() => window.matchMedia?.('(max-width: 760px)').matches ?? false);
  const [metricFlags, setMetricFlags] = useState({
    hourlyProfit: true,
  });

  //
  const activePeriod = useMemo(
    () => periods.find((period) => period.id === selectedPeriod) || periods[0],
    [periods, selectedPeriod],
  );

  // change graph colors based on selected theme.
  const isLightTheme = theme === 'light';
  const chartTextColor = isLightTheme ? '#111827' : '#cbd5e1';
  const chartGridColor = isLightTheme ? 'rgba(17, 24, 39, 0.14)' : 'rgba(148, 163, 184, 0.15)';
  const fullScreenTextColor = isLightTheme ? '#111827' : '#d8dee8';
  const fullScreenGridColor = isLightTheme ? '#d1d5db' : '#263545';

  useEffect(() => {
    //observes any HTML element with the data-theme attr. Without this the line graph would not know that the theme changed.
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
    const mediaQuery = window.matchMedia('(max-width: 760px)');
    const updateMobileChart = () => setIsMobileChart(mediaQuery.matches);

    updateMobileChart();
    mediaQuery.addEventListener('change', updateMobileChart);

    return () => mediaQuery.removeEventListener('change', updateMobileChart);
  }, []);

  useEffect(() => {
    //runs when in fullscreen mode. Disabled scrolling behind the modal and allow pressing escape to close the modal.
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

  // MEMO - the heart of the component
  const { sessionsWithData, runningHands, runningProfit, sessionsCount } = useMemo(() => {
    // Sort the sessions by date
    // Don't mutate the sessions prop (props are immutable)
    const sortedSessions = [...sessions].sort((firstSession, secondSession) => {
      const dateDiff = getSessionTime(firstSession) - getSessionTime(secondSession);

      if (dateDiff !== 0) return dateDiff;

      return new Date(firstSession.createdAt || 0) - new Date(secondSession.createdAt || 0);
    });

    let runningProfit = 0;
    let runningDurationMinutes = 0;
    let runningHands = 0;
    const sessionsWithData = [];

    if (sortedSessions.length) {
      const firstSession = sortedSessions[0];
      const startTimestamp = getSessionTime(firstSession);

      sessionsWithData.push({
        date: formatChartDate(startTimestamp),
        xLabel: '0',
        timestamp: startTimestamp,
        profit: 0,
        hourlyProfit: 0,
        handsPlayed: 0,
        sessionLabel: 'Start',
      });
    }

    // map through the visible sessions and popualte the following:

    sortedSessions.forEach((session, index) => {
      const sessionDate = new Date(session.date); //session date
      const formattedDate = formatChartDate(sessionDate); //formatted date
      const sessionDuration = Number(session.duration);
      const sessionDurationMinutes = Number.isFinite(sessionDuration) && sessionDuration > 0 ? sessionDuration : 0;
      const sessionHands = Number(session.hands ?? session.stats?.handsPlayed) || 0; //get number of hands played
      const sessionProfit = Number(session.profit) || 0; //get session profit
      const handResults = Array.isArray(session.handResults) ? session.handResults : [];
      const previousHands = runningHands;
      const previousDurationMinutes = runningDurationMinutes;

      const points = handResults.length
        ? handResults
        : [
            {
              date: session.date,
              profit: sessionProfit,
              cumulativeProfit: sessionProfit,
            },
          ];

      points.forEach((point, pointIndex) => {
        const handProfit = Number(point.profit);
        const pointProfit = Number.isFinite(handProfit) ? handProfit : 0;
        const handCount = handResults.length ? previousHands + pointIndex + 1 : previousHands + sessionHands;
        const sessionProgress = handResults.length ? (pointIndex + 1) / handResults.length : 1;
        const pointDurationMinutes = previousDurationMinutes + sessionDurationMinutes * sessionProgress;

        runningProfit += pointProfit; //running profit value
        runningHands = handCount; //running hands played value

        //For each hand, return:
        sessionsWithData.push({
          date: formattedDate, //date of the session
          xLabel: runningHands.toLocaleString('en-US'), //hand number (x-axis)
          timestamp: getPointTime(point, session), //hand/session timestamp
          profit: Number(runningProfit.toFixed(2)), //running profit value
          hourlyProfit:
            runningHands < HOURLY_PROFIT_MIN_HANDS || pointDurationMinutes <= 0
              ? 0
              : Number((runningProfit / (pointDurationMinutes / 60)).toFixed(2)),
          handsPlayed: runningHands, // running hands value
          sessionLabel: session.sessionName || `Session ${index + 1}`,
        });
      });

      runningDurationMinutes = previousDurationMinutes + sessionDurationMinutes;
    });

    // after iterating through the visible sessions
    // **THESE VALUES ARE USED THROUGHOUT THE FILE
    return {
      sessionsWithData, //required chart meta data
      runningHands, //running hands played
      runningProfit, //running total profit
      sessionsCount: sortedSessions.length, //length of sessions (sorted array)
    };
  }, [sessions]); // when the sessions mutates, run this memo

  // MEMO: get min/max axes values while keeping both y-axis zero lines aligned.
  const axesMinMax = useMemo(() => {
    function getAxisValues(keys) {
      const values = keys
        .flatMap((key) => sessionsWithData.map((item) => Number(item[key])))
        .filter((value) => Number.isFinite(value));

      if (!values.length) {
        return {};
      }

      return {
        min: Math.min(0, ...values),
        max: Math.max(0, ...values),
      };
    }

    function getAxesMinMax(range, alignAroundZero, paddingRatio = 0.38) {
      if (!Number.isFinite(range.min) || !Number.isFinite(range.max)) {
        return {};
      }

      const min = range.min;
      const max = range.max;
      const span = Math.max(max - min, Math.abs(max), Math.abs(min), 1);
      const padding = span * paddingRatio;

      if (alignAroundZero) {
        const limit = Math.max(Math.abs(min), Math.abs(max), 1) + padding;

        return {
          min: -limit,
          max: limit,
        };
      }

      return {
        min: min < 0 ? min - padding : 0,
        max: max > 0 ? max + padding : 0,
      };
    }

    const profitRange = getAxisValues(['profit']);
    const hourlyProfitRange = getAxisValues(['hourlyProfit']);
    const ranges = [profitRange, hourlyProfitRange];
    const hasNegative = ranges.some((range) => Number.isFinite(range.min) && range.min < 0);
    const hasPositive = ranges.some((range) => Number.isFinite(range.max) && range.max > 0);
    const alignAroundZero = hasNegative && hasPositive;

    return {
      profit: getAxesMinMax(profitRange, alignAroundZero),
      hourlyProfit: getAxesMinMax(hourlyProfitRange, alignAroundZero),
    };
  }, [sessionsWithData]);

  /*
  example dataset:
    {
    label:"Total Profit",
    data:[5,12,18,14]
    }
  */
  const datasets = useMemo(
    () => [
      {
        label: 'Total Profit', //main title
        data: getMetricValues(sessionsWithData, 'profit'), //get the profit values from sessionsWithData
        yAxisID: 'money', //axes ID
        borderColor: '#39ff64', //color of the line
        backgroundColor: (context) => {
          //add color underneath the line
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return null;
          // more color code
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(9, 255, 0, 0.344)');
          gradient.addColorStop(1, 'rgba(57, 255, 100, 0)');
          return gradient;
        },
        // misc settings to make graph pop
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
        .filter((metric) => metricFlags[metric.key])
        .map((metric) => ({
          label: metric.label,
          data: sessionsWithData.map((item) => (item.handsPlayed > 0 ? item[metric.key] : null)),
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
    [sessionsWithData, metricFlags, optionalMetrics],
  );

  // Exactly what Chart.js expects.
  // Lables from sessionsWithData array (xLabel)
  // Datasets provides the data for each line
  const data = useMemo(
    () => ({
      labels: sessionsWithData.map((item) => item.xLabel),
      datasets,
    }),
    [sessionsWithData, datasets],
  );

  //Same as the above MEMO but data for fullscreen mode
  //
  const fullScreenData = useMemo(
    () => ({
      labels: data.labels,
      datasets: datasets.map((dataset) => ({
        ...dataset,
        // fullscreen options
        backgroundColor: 'transparent',
        fill: false,
        borderWidth: dataset.metricKey === 'profit' ? 2.5 : 2,
        pointRadius: 0,
        pointHoverRadius: 4,
      })),
    }),
    [data.labels, datasets],
  );

  // Chart Options
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
          display: !isMobileChart && datasets.length > 1,
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
              const item = sessionsWithData[items[0]?.dataIndex];
              return item ? formatChartDate(item.timestamp, { year: 'numeric' }) : '';
            },
            afterTitle: (items) => {
              const item = sessionsWithData[items[0]?.dataIndex];

              if (!item) {
                return '';
              }

              const details = [item.sessionLabel || item.xLabel, item.xLabel];

              if (Number.isFinite(item.handsPlayed)) {
                details.push(`${item.handsPlayed.toLocaleString('en-US')} hands`);
              }

              return details;
            },
            label: (context) => {
              const metric = optionalMetrics.find((item) => item.key === context.dataset.metricKey);
              const formatter = metric?.format || ((value) => formatCurrency(value, currency));
              return `${context.dataset.label}: ${formatter(Number(context.parsed.y) || 0)}`;
            },
          },
        },
      },

      scales: {
        x: {
          type: 'category',
          title: {
            display: true,
            color: textColor,
            font: {
              weight: '700',
            },
            text: 'Hands',
          },
          grid: {
            color: gridColor,
            display: fullScreen,
          },
          ticks: {
            color: textColor,
            maxTicksLimit: fullScreen ? 12 : isMobileChart ? 4 : 7,
            autoSkip: true,
            maxRotation: 0,
            callback(value) {
              return formatHandsAxisLabel(this.getLabelForValue(value));
            },
          },
          border: {
            color: gridColor,
            display: fullScreen,
          },
        },

        money: {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          ...axesMinMax.profit,
          title: {
            display: true,
            color: textColor,
            font: {
              weight: '700',
            },
            text: 'Profit',
          },
          ticks: {
            color: textColor,
            maxTicksLimit: fullScreen ? 9 : isMobileChart ? 4 : 5,
            precision: 0,
            stepSize: 10,
            callback: (value) => formatAxisCurrency(value, currency),
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
        hourlyProfit: {
          type: 'linear',
          display: metricFlags.hourlyProfit,
          position: 'left',
          ...axesMinMax.hourlyProfit,
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            color: textColor,
            maxTicksLimit: fullScreen ? 9 : isMobileChart ? 4 : 5,
            precision: 0,
            stepSize: 10,
            callback: (value) => `${formatAxisCurrency(value, currency)}/hr`,
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
    [sessionsWithData, chartGridColor, chartTextColor, datasets.length, axesMinMax, metricFlags, isMobileChart, currency],
  );
  const fullScreenOptions = useMemo(
    () => getChartOptions({ fullScreen: true }),
    [
      sessionsWithData,
      datasets.length,
      fullScreenGridColor,
      fullScreenTextColor,
      axesMinMax,
      metricFlags,
      isMobileChart,
      currency,
    ],
  );

  const fullScreenChart = isFullScreen
    ? createPortal(
        <div className='profit-fullscreen' role='dialog' aria-modal='true' aria-labelledby='profit-fullscreen-title'>
          <div className='profit-fullscreen__surface'>
            <header className='profit-fullscreen__header'>
              <div>
                <h2 id='profit-fullscreen-title'>Results Graph</h2>
                <p>
                  {activePeriod?.label || 'All Time'} · {sessionsCount.toLocaleString('en-US')} sessions
                </p>
              </div>
              <button type='button' aria-label='Close full page graph' onClick={() => setIsFullScreen(false)}>
                <X aria-hidden='true' />
              </button>
            </header>

            <div className='profit-fullscreen__toolbar'>
              <span>Graph</span>
              <span>Hands: {runningHands.toLocaleString('en-US')}</span>
              <span>Profit: {formatCurrency(runningProfit, currency)}</span>
            </div>

            <div className='profit-fullscreen__chart'>
              <Line key='profit-fullscreen-chart' data={fullScreenData} options={fullScreenOptions} />
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div className='profit-card'>
      <div className='profit-header'>
        <h2>{activePeriod?.chartLabel || 'Total Profit'}</h2>
        <div className='profit-header-actions'>
          <div className='profit-period-buttons' aria-label='Profit chart period'>
            {/* Same code as in the stat cards, date range buttons/availability*/}
            {periods.map((period) => (
              <button
                className={selectedPeriod === period.id ? 'active' : ''}
                type='button'
                aria-pressed={selectedPeriod === period.id}
                disabled={!period.available}
                title={!period.available ? period.disabledReason || 'No sessions found for this period' : undefined}
                onClick={() => setSelectedPeriod?.(period.id)}
                key={period.id}
              >
                {period.label}
                {!period.available && <span className='period-unavailable'>N/A</span>}
              </button>
            ))}
          </div>
          {/* button to expand the graph to full screen */}
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
              checked={metricFlags[metric.key]}
              onChange={(event) =>
                setMetricFlags((prev) => ({
                  ...prev,
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

      {fullScreenChart}
    </div>
  );
}
