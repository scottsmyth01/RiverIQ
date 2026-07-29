import './DashboardPage.css';
import { filterSessions } from '../utils/filterSessions';
import { getPeriodFromDefaultTimeFilter } from '../utils/dateRangePreferences';
import { Link } from 'react-router';
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
    return dashboardPeriods.map((period) => {
      // if all-time, just return the object with allSessions.length
      if (period.id === 'all-time') {
        return {
          ...period,
          available: allSessions.length > 0,
          sessionCount: allSessions.length,
        };
      }

      // else, we need to calculate the session count by filtering the allSessions for documents in that date range
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - period.value);

      const sessionCount = allSessions.filter((session) => {
        const sessionDate = new Date(session.date);
        return !Number.isNaN(sessionDate.getTime()) && sessionDate >= cutoffDate && sessionDate <= new Date();
      }).length;

      return {
        ...period,
        available: sessionCount > 1,
        sessionCount,
      };
    });
  }, [allSessions]);

  const sessions = useMemo(() => filterSessions(allSessions, selectedPeriod), [allSessions, selectedPeriod]);

  useEffect(() => {
    const activePeriod = periodsWithAvailability.find((period) => period.id === selectedPeriod);

    if (activePeriod && !activePeriod.available) {
      setSelectedPeriod('all-time');
    }
  }, [periodsWithAvailability, selectedPeriod]);

  if (isAllSessionsLoading) {
    return null;
  }

  return (
    <>
      {allSessions.length <= 2 && <NewUserPage sessions={allSessions} />}
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
          periods={periodsWithAvailability}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
        <SessionsTable sessions={sessions} sessionsPerPage={5} variant='home-page' />
      </section>
    </>
  );
};

export default DashboardPage;
