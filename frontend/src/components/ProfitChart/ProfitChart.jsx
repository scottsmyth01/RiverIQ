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
import { Link } from 'react-router';
import './ProfitChart.css';
import { formatCurrency } from '../../utils/sessionUnits';
import { useAuth } from '../../hooks/useAuth';
import { convertFromUsd, getCurrencySymbol, getPreferredCurrency } from '../../utils/currency';

/*
Whenever the component renders, it follows this sequence:

1. Receive sessions and other props.
2. Calculate running totals (profit and hands) with useMemo.
3. Build the Chart.js datasets from those calculations.
4. Generate the chart options (colors, tooltips, axes, legends, etc.).
5. Render the <Line /> chart.
6. If the user changes the date range, theme, or fullscreen state, React updates the relevant state, recomputes only what changed, and redraws the chart.
*/

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Filler, Legend);

const chartAreaBorderPlugin = {
  id: 'chartAreaBorder',
  afterDraw(chart, args, options) {
    const { ctx, chartArea } = chart;

    if (!chartArea) return;

    ctx.save();
    ctx.strokeStyle = options.borderColor;
    ctx.lineWidth = options.borderWidth;
    ctx.strokeRect(chartArea.left, chartArea.top, chartArea.right - chartArea.left, chartArea.bottom - chartArea.top);
    ctx.restore();
  },
};

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

function formatMobileAxisCurrency(value, currency) {
  const convertedValue = convertFromUsd(value, currency);

  if (!Number.isFinite(convertedValue)) return 'N/A';

  const sign = convertedValue < 0 ? '-' : '';
  const absValue = Math.abs(convertedValue);
  const symbol = getCurrencySymbol(currency);

  if (absValue >= 1000) {
    const compactValue = absValue / 1000;
    const formattedValue = Number.isInteger(compactValue) ? compactValue : compactValue.toFixed(1);

    return `${sign}${symbol}${formattedValue}K`;
  }

  return `${sign}${symbol}${Math.round(absValue)}`;
}

function formatHandsAxisLabel(label) {
  const hands = Number(String(label).replace(/,/g, ''));

  if (!Number.isFinite(hands)) return label;

  return (Math.round(hands / 10) * 10).toLocaleString('en-US', {
    maximumFractionDigits: 0,
  });
}

function getThemeColor(name, fallback) {
  if (typeof window === 'undefined') return fallback;

  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
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
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'dark'); // store light/dark
  const [isFullScreen, setIsFullScreen] = useState(false); //controls fullscreen graph
  const [isMobileChart, setIsMobileChart] = useState(() => window.matchMedia?.('(max-width: 760px)').matches ?? false);

  //
  const activePeriod = useMemo(
    () => periods.find((period) => period.id === selectedPeriod) || periods[0],
    [periods, selectedPeriod],
  );

  // change graph colors based on selected theme.
  const isLightTheme = theme === 'light';
  const chartTextColor = isLightTheme ? '#111827' : '#ffffff';
  const chartGridColor = isLightTheme ? 'rgba(17, 24, 39, 0.14)' : 'rgba(148, 163, 184, 0.15)';
  const fullScreenTextColor = isLightTheme ? '#111827' : '#d8dee8';
  const fullScreenGridColor = isLightTheme ? '#d1d5db' : '#263545';
  const lightChartLineColor = '#13e044';
  const chartLineColor = isLightTheme ? lightChartLineColor : getThemeColor('--color-primary', '#00c853');

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
        handsPlayed: 0,
        sessionLabel: 'Start',
      });
    }

    // map through the visible sessions and popualte the following:

    sortedSessions.forEach((session, index) => {
      const sessionDate = new Date(session.date); //session date
      const formattedDate = formatChartDate(sessionDate); //formatted date
      const sessionHands = Number(session.hands ?? session.stats?.handsPlayed) || 0; //get number of hands played
      const sessionProfit = Number(session.profit) || 0; //get session profit
      const sessionProfitAdjustment = Number(session.profitAdjustment) || 0;
      const handResults = Array.isArray(session.handResults) ? session.handResults : [];
      const previousHands = runningHands;

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
        const isLastHandPoint = handResults.length && pointIndex === points.length - 1;
        const pointProfit =
          (Number.isFinite(handProfit) ? handProfit : 0) + (isLastHandPoint ? sessionProfitAdjustment : 0);
        const handCount = handResults.length ? previousHands + pointIndex + 1 : previousHands + sessionHands;

        runningProfit += pointProfit; //running profit value
        runningHands = handCount; //running hands played value

        //For each hand, return:
        sessionsWithData.push({
          date: formattedDate, //date of the session
          xLabel: runningHands.toLocaleString('en-US'), //hand number (x-axis)
          timestamp: getPointTime(point, session), //hand/session timestamp
          profit: Number(runningProfit.toFixed(2)), //running profit value
          handsPlayed: runningHands, // running hands value
          sessionLabel: session.sessionName || `Session ${index + 1}`,
        });
      });
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
  const mobileHandChartPoints = useMemo(() => {
    if (!sessionsWithData.length) return [];

    const lastIndex = sessionsWithData.length - 1;

    return sessionsWithData.filter((point, index) => {
      const handsPlayed = Number(point.handsPlayed);

      return index === 0 || index === lastIndex || (Number.isFinite(handsPlayed) && handsPlayed % 10 === 0);
    });
  }, [sessionsWithData]);
  const chartPoints = useMemo(() => {
    return isMobileChart ? mobileHandChartPoints : sessionsWithData;
  }, [isMobileChart, mobileHandChartPoints, sessionsWithData]);
  const hasChartData = sessionsCount > 0 && chartPoints.length > 0;

  // Keep each y-axis close to the values drawn on that axis.
  const axesMinMax = useMemo(() => {
    function getAxisValues(keys) {
      const values = keys
        .flatMap((key) => chartPoints.map((item) => Number(item[key])))
        .filter((value) => Number.isFinite(value));

      if (!values.length) {
        return {};
      }

      return {
        min: Math.min(0, ...values),
        max: Math.max(0, ...values),
      };
    }

    function getAxesMinMax(range) {
      if (!Number.isFinite(range.min) || !Number.isFinite(range.max)) {
        return {};
      }

      const maxAbsValue = Math.max(Math.abs(range.min), Math.abs(range.max));
      const intervalCountPerSide = 2;
      const tickInterval = Math.max(10, Math.ceil(maxAbsValue / intervalCountPerSide / 10) * 10);
      const roundedMaxAbsValue = tickInterval * intervalCountPerSide;

      return {
        min: -roundedMaxAbsValue,
        max: roundedMaxAbsValue,
        ticks: {
          stepSize: tickInterval,
        },
      };
    }

    return {
      profit: getAxesMinMax(getAxisValues(['profit'])),
    };
  }, [chartPoints]);

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
        data: getMetricValues(chartPoints, 'profit'),
        yAxisID: 'money', //axes ID
        borderColor: chartLineColor, //color of the line
        backgroundColor: 'transparent',
        fill: false,
        tension: 0,
        pointRadius: isMobileChart ? 2.5 : 0,
        pointHoverRadius: 5,
        pointHitRadius: 16,
        pointHoverBackgroundColor: chartLineColor,
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
        borderWidth: 1.8,
        metricKey: 'profit',
      },
    ],
    [chartLineColor, chartPoints, isMobileChart],
  );

  // Exactly what Chart.js expects.
  // Lables from sessionsWithData array (xLabel)
  // Datasets provides the data for each line
  const data = useMemo(
    () => ({
      labels: chartPoints.map((item) => item.xLabel),
      datasets,
    }),
    [chartPoints, datasets],
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
        borderWidth: 2,
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
    const axisColor = fullScreen
      ? fullScreenTextColor
      : isLightTheme
        ? 'rgba(17, 24, 39, 0.82)'
        : 'rgba(148, 163, 184, 0.48)';
    const zeroLineColor = '#000000';

    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          top: 6,
          right: 4,
          bottom: 0,
          left: 2,
        },
      },
      interaction: {
        mode: 'index',
        intersect: false,
      },

      plugins: {
        legend: {
          display: false,
          align: 'start',
          labels: {
            color: textColor,
            boxHeight: 2,
            boxWidth: 28,
            usePointStyle: false,
          },
        },
        chartAreaBorder: {
          borderColor: axisColor,
          borderWidth: 2,
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
              const item = chartPoints[items[0]?.dataIndex];
              return item ? formatChartDate(item.timestamp, { year: 'numeric' }) : '';
            },
            afterTitle: (items) => {
              const item = chartPoints[items[0]?.dataIndex];

              if (!item) {
                return '';
              }

              const details = [item.sessionLabel || item.xLabel];

              if (Number.isFinite(item.handsPlayed)) {
                details.push(`${item.handsPlayed.toLocaleString('en-US')} hands`);
              }

              return details;
            },
            label: (context) => {
              return `${context.dataset.label}: ${formatCurrency(Number(context.parsed.y) || 0, currency)}`;
            },
          },
        },
      },

      scales: {
        x: {
          type: 'category',
          title: {
            display: !isMobileChart,
            color: textColor,
            font: {
              weight: '700',
            },
            text: 'Hands Played',
          },
          grid: {
            color: gridColor,
            display: true,
            drawTicks: true,
          },
          ticks: {
            color: textColor,
            maxTicksLimit: fullScreen ? 14 : isMobileChart ? 4 : 12,
            autoSkip: true,
            maxRotation: 0,
            callback(value) {
              const label = this.getLabelForValue(value);

              return formatHandsAxisLabel(label);
            },
          },
          border: {
            color: axisColor,
            display: true,
            width: 2,
          },
        },

        money: {
          type: 'linear',
          position: 'right',
          beginAtZero: true,
          ...axesMinMax.profit,
          title: {
            display: !isMobileChart,
            color: textColor,
            font: {
              weight: '700',
            },
            text: 'Currency Won',
          },
          ticks: {
            ...axesMinMax.profit?.ticks,
            color: textColor,
            precision: 0,
            callback: (value) => {
              if (Number(value) === 0) return '0';

              return isMobileChart ? formatMobileAxisCurrency(value, currency) : formatAxisCurrency(value, currency);
            },
          },
          afterBuildTicks: (axis) => {
            if (!axis.ticks.some((tick) => Number(tick.value) === 0)) {
              axis.ticks.push({ value: 0 });
              axis.ticks.sort((firstTick, secondTick) => firstTick.value - secondTick.value);
            }
          },
          grid: {
            color: (context) => (Number(context.tick?.value) === 0 ? zeroLineColor : gridColor),
            lineWidth: (context) => (Number(context.tick?.value) === 0 ? 2 : 1),
            borderDash: [],
            drawTicks: true,
          },
          border: {
            color: axisColor,
            display: true,
            width: 2,
          },
        },
      },
    };
  }

  const options = useMemo(
    () => getChartOptions(),
    [chartPoints, chartGridColor, chartTextColor, datasets.length, axesMinMax, isMobileChart, currency, isLightTheme],
  );
  const fullScreenOptions = useMemo(
    () => getChartOptions({ fullScreen: true }),
    [chartPoints, datasets.length, fullScreenGridColor, fullScreenTextColor, axesMinMax, isMobileChart, currency],
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
              <Line
                key='profit-fullscreen-chart'
                data={fullScreenData}
                options={fullScreenOptions}
                plugins={[chartAreaBorderPlugin]}
              />
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div className='profit-card dashboard-profit-card'>
      <div className='profit-header'>
        <h2 className='profit-chart-title'>Total Profit</h2>
        <div className='profit-header-actions'>
          <div className='profit-period-buttons' aria-label='Profit chart period'>
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
          {!isMobileChart && (
            <button
              className='profit-expand-button'
              type='button'
              aria-label='Open graph full page'
              disabled={!hasChartData}
              onClick={() => setIsFullScreen(true)}
            >
              <Maximize2 aria-hidden='true' />
            </button>
          )}
        </div>
      </div>

      <div className='chart-wrapper' aria-busy={isLoading}>
        {hasChartData ? (
          <div className='profit-chart-stage'>
            <Line data={data} options={options} plugins={[chartAreaBorderPlugin]} />
          </div>
        ) : (
          <div className='profit-chart-stage'>
            <div className='profit-chart-empty'>
              <strong>No profit data for this period</strong>
              <span>Upload a session or choose a wider date range to populate the chart.</span>
              <Link to='/dashboard/sessions/new'>Upload Session</Link>
            </div>
          </div>
        )}
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
