import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import './DashboardPage.css';
import StatCards from '../components/StatCards/StatCards';
import { useSessions } from '../hooks/useSessions';
import ProfitChart from '../components/ProfitChart/ProfitChart';
import SessionsTable from '../components/SessionsTable/SessionsTable';
import { NewUserPage } from './NewUserPage';
import { useAuth } from '../hooks/useAuth';
import { getPeriodFromDefaultTimeFilter } from '../utils/dateRangePreferences';

const dashboardPeriods = [
  { id: 'all-time', label: 'All Time', chartLabel: 'Total Profit' },
  { id: 'past-90', label: 'Past 90 Days', chartLabel: 'Past 90 Days Profit' },
  { id: 'past-30', label: 'Past 30 Days', chartLabel: 'Past 30 Days Profit' },
  { id: 'past-7', label: 'Past 7 Days', chartLabel: 'Past 7 Days Profit' },
];

const DashboardPage = () => {
  const { user } = useAuth();
  const defaultPeriod = getPeriodFromDefaultTimeFilter(user?.preferences?.defaultTimeFilter);
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod);
  const { data: allSessions = [] } = useSessions();
  const { data: sessions = [] } = useSessions({ period: selectedPeriod });
  const username = user?.username || user?.name || 'there';

  useEffect(() => {
    setSelectedPeriod(defaultPeriod);
  }, [defaultPeriod]);

  const periodsWithAvailability = useMemo(() => {
    const periodDays = {
      'past-7': 7,
      'past-30': 30,
      'past-90': 90,
    };

    return dashboardPeriods.map((period) => {
      if (period.id === 'all-time') {
        return {
          ...period,
          available: allSessions.length > 0,
          sessionCount: allSessions.length,
        };
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - periodDays[period.id]);

      const sessionCount = allSessions.filter((session) => {
        const sessionDate = new Date(session.date);
        return !Number.isNaN(sessionDate.getTime()) && sessionDate >= cutoffDate && sessionDate <= new Date();
      }).length;

      return {
        ...period,
        available: sessionCount > 0,
        sessionCount,
      };
    });
  }, [allSessions]);

  const chartPeriodsWithAvailability = useMemo(
    () =>
      periodsWithAvailability.map((period) =>
        period.id === 'past-7'
          ? {
              ...period,
              available: period.sessionCount > 1,
            }
          : period,
      ),
    [periodsWithAvailability],
  );

  return (
    <>
      {allSessions.length < 5 && <NewUserPage sessions={allSessions} />}
      {allSessions.length > 4 && (
        <section className='dashboard-content'>
          <header className='dashboard-page-header'>
            <div className='dashboard-page-header__top'>
              <div>
                <h1>Dashboard</h1>
                <p>Welcome back, {username}! Here is your poker performance review.</p>
              </div>
            </div>
          </header>
          <StatCards
            sessions={sessions}
            periods={periodsWithAvailability}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
          <ProfitChart
            sessions={sessions}
            periods={chartPeriodsWithAvailability}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />
          <SessionsTable sessions={sessions} sessionsPerPage={5} variant='home-page' />
        </section>
      )}
    </>
  );
};

export default DashboardPage;
