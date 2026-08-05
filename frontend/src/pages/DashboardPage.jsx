import './DashboardPage.css';
import { filterSessions } from '../utils/filterSessions';
import { getPeriodFromDefaultTimeFilter } from '../utils/dateRangePreferences';
import { NewUserPage } from './NewUserPage';
import { useAuth } from '../hooks/useAuth';
import { useEffect, useMemo, useState } from 'react';
import { useSessions } from '../hooks/useSessions';
import ProfitChart from '../components/ProfitChart/ProfitChart';
import SessionsTable from '../components/SessionsTable/SessionsTable';
import StatCards from '../components/StatCards/StatCards';

const dashboardPeriods = [
  { id: 'all-time', value: 'all', label: 'All Time', chartLabel: 'Total Profit' },
  { id: 'past-90', value: 90, label: 'Past 90 Days', chartLabel: 'Past 90 Days Profit' },
  { id: 'past-30', value: 30, label: 'Past 30 Days', chartLabel: 'Past 30 Days Profit' },
  { id: 'past-7', value: 7, label: 'Past 7 Days', chartLabel: 'Past 7 Days Profit' },
];

function getOldestSessionAgeDays(sessions) {
  const sessionTimes = sessions
    .map((session) => new Date(session.date || session.createdAt).getTime())
    .filter((time) => !Number.isNaN(time));

  if (!sessionTimes.length) return 0;

  const oldestSessionTime = Math.min(...sessionTimes);
  const today = new Date();

  return Math.floor((today.getTime() - oldestSessionTime) / 86400000);
}

function formatLastSessionDate(sessions) {
  const latestSessionTime = sessions
    .map((session) => new Date(session.date || session.createdAt).getTime())
    .filter((time) => !Number.isNaN(time))
    .sort((a, b) => b - a)[0];

  if (!latestSessionTime) return 'No sessions yet';

  return new Date(latestSessionTime).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

const DashboardPage = () => {
  const { user } = useAuth();
  const { data: allSessions = [], isLoading: isAllSessionsLoading } = useSessions();
  const defaultPeriod = getPeriodFromDefaultTimeFilter(user?.preferences?.defaultTimeFilter);
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod);
  const username = user?.username || user?.name;

  useEffect(() => {
    setSelectedPeriod(defaultPeriod);
  }, [defaultPeriod]);

  const periodsWithAvailability = useMemo(() => {
    const oldestSessionAgeDays = getOldestSessionAgeDays(allSessions);

    return dashboardPeriods.map((period) => {
      if (period.id === 'all-time') {
        return {
          ...period,
          available: allSessions.length > 1,
          sessionCount: allSessions.length,
        };
      }

      const hasElapsed = typeof period.value !== 'number' || period.value <= 7 || oldestSessionAgeDays >= period.value;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - period.value);

      const today = new Date();

      const sessionCount = allSessions.filter((session) => {
        const sessionDate = new Date(session.date);
        return !Number.isNaN(sessionDate.getTime()) && sessionDate >= cutoffDate && sessionDate <= today;
      }).length;

      return {
        ...period,
        available: hasElapsed && sessionCount > 1,
        disabledReason: !hasElapsed
          ? `${period.label} will unlock after ${period.value} days of session history`
          : 'No sessions found for this period',
        sessionCount,
      };
    });
  }, [allSessions]);

  const sessions = useMemo(() => filterSessions(allSessions, selectedPeriod), [allSessions, selectedPeriod]);
  const lastSessionDate = useMemo(() => formatLastSessionDate(allSessions), [allSessions]);

  useEffect(() => {
    const activePeriod = periodsWithAvailability.find((period) => period.id === selectedPeriod);

    if (activePeriod && !activePeriod.available) {
      setSelectedPeriod('all-time');
    }
  }, [periodsWithAvailability, selectedPeriod]);

  if (isAllSessionsLoading) {
    return (
      <section className='dashboard-content dashboard-home-page'>
        <div className='dashboard-empty-state dashboard-loading-state' role='status' aria-live='polite'>
          <span>Loading dashboard...</span>
          <span className='dashboard-loading-spinner' aria-hidden='true' />
        </div>
      </section>
    );
  }

  if (allSessions.length <= 2) {
    return <NewUserPage sessions={allSessions} />;
  }

  return (
    <section className='dashboard-content dashboard-home-page'>
      <header className='dashboard-page-header'>
        <div className='dashboard-page-header__top'>
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back, {username}! Here is your poker performance review.</p>
          </div>
          <div className='dashboard-header-meta' aria-label='Dashboard summary'>
            <span>
              <strong>{sessions.length}</strong>
              Sessions
            </span>
            <span>
              <strong>{lastSessionDate}</strong>
              Last session
            </span>
          </div>
        </div>
      </header>
      <StatCards
        sessions={sessions}
        periods={periodsWithAvailability}
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
      />
      <ProfitChart
        sessions={sessions}
        periods={periodsWithAvailability}
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
      />
      <SessionsTable sessions={sessions} sessionsPerPage={5} variant='home-page' />
    </section>
  );
};

export default DashboardPage;
