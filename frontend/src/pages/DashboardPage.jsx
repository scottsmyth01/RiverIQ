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

// data
const dashboardPeriods = [
  { id: 'all-time', value: 'all', label: 'All Time', chartLabel: 'Total Profit' },
  { id: 'past-90', value: 90, label: 'Past 90 Days', chartLabel: 'Past 90 Days Profit' },
  { id: 'past-30', value: 30, label: 'Past 30 Days', chartLabel: 'Past 30 Days Profit' },
  { id: 'past-7', value: 7, label: 'Past 7 Days', chartLabel: 'Past 7 Days Profit' },
];

const DashboardPage = () => {
  // STATE
  const { user } = useAuth();
  const { data: allSessions = [], isLoading: isAllSessionsLoading } = useSessions();
  const defaultPeriod = getPeriodFromDefaultTimeFilter(user?.preferences?.defaultTimeFilter);
  const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod);
  const username = user?.username || user?.name;

  // UE: get default time period (edit in settings) and update when changed
  useEffect(() => {
    setSelectedPeriod(defaultPeriod);
  }, [defaultPeriod]);

  // MEMO: returns the period, along with availibility and session count.
  const periodsWithAvailability = useMemo(() => {
    return dashboardPeriods.map((period) => {
      // if all-time, just return the object with allSessions.length
      if (period.id === 'all-time') {
        return {
          ...period,
          available: allSessions.length > 1,
          sessionCount: allSessions.length,
        };
      }

      // else, we need to calculate the session count by filtering the allSessions for documents in that date range
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - period.value);

      const today = new Date();

      const sessionCount = allSessions.filter((session) => {
        const sessionDate = new Date(session.date);
        return !Number.isNaN(sessionDate.getTime()) && sessionDate >= cutoffDate && sessionDate <= today;
      }).length;

      return {
        ...period,
        available: sessionCount > 1,
        sessionCount,
      };
    });
  }, [allSessions]);

  // MEMO: filter the allSessions into a new array that contains documents in the specified date range.
  const sessions = useMemo(() => filterSessions(allSessions, selectedPeriod), [allSessions, selectedPeriod]);

  // UE: if the time period is not available (< 2 sessions) then set the period to 'all time'
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
      {/* ^^ If there are less than 3 sessions for a given user, then render the NewUserPage */}

      <section className='dashboard-content dashboard-home-page'>
        <header className='dashboard-page-header'>
          <div className='dashboard-page-header__top'>
            <div>
              <h1>Dashboard</h1>
              <p>Welcome back, {username}! Here is your poker performance review.</p>
            </div>
          </div>
        </header>
        <StatCards
          sessions={sessions} //filtered session array
          periods={periodsWithAvailability} //all periods and availability
          selectedPeriod={selectedPeriod} //selected period (via buttons)
          setSelectedPeriod={setSelectedPeriod} //call this function when clicking a new time period (pass up period.id)
        />
        <ProfitChart
          sessions={sessions} //filtered session array
          periods={periodsWithAvailability} //all periods and availibility
          selectedPeriod={selectedPeriod} //selected period (via buttons)
          setSelectedPeriod={setSelectedPeriod} //call this function when clicking a new time period (pass up period.id)
        />
        <SessionsTable sessions={sessions} sessionsPerPage={5} variant='home-page' />
      </section>
    </>
  );
};

export default DashboardPage;
