import './DashboardPage.css';
import StatCards from '../components/StatCards/StatCards';
import { useSessions } from '../hooks/useSessions';
import ProfitChart from '../components/ProfitChart/ProfitChart';
import SessionsTable from '../components/SessionsTable/SessionsTable';
import { NewUserPage } from './NewUserPage';
import { useAuth } from '../hooks/useAuth';

const DashboardPage = () => {
  const { data: sessions = [] } = useSessions();
  const { user } = useAuth();
  const username = user?.username || user?.name || 'there';

  return (
    <>
      {sessions.length < 5 && <NewUserPage sessions={sessions} />}
      {sessions.length > 4 && (
        <section className='dashboard-content'>
          <header className='dashboard-page-header'>
            <h1>Dashboard</h1>
            <p>Welcome back, {username}! Here is your poker performance review.</p>
          </header>
          <StatCards sessions={sessions} />
          <ProfitChart sessions={sessions} />
          <SessionsTable sessions={sessions} sessionsPerPage={5} variant='home-page' />
        </section>
      )}
    </>
  );
};

export default DashboardPage;
