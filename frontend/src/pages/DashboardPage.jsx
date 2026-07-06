import './DashboardPage.css';
import StatCards from '../components/StatCards/StatCards';
import { useSessions } from '../hooks/useSessions';
import ProfitChart from '../components/ProfitChart/ProfitChart';
import SessionsTable from '../components/SessionsTable/SessionsTable';
import { NewUserPage } from './NewUserPage';

const DashboardPage = () => {
  const { data: sessions = [] } = useSessions();

  return (
    <>
      {sessions.length < 5 && <NewUserPage sessions={sessions} />}
      {sessions.length > 4 && (
        <section className='dashboard-content'>
          <div className='stat-cards'>
            <StatCards sessions={sessions} />
          </div>
          <ProfitChart sessions={sessions} />
          <SessionsTable sessions={sessions} />
        </section>
      )}
    </>
  );
};

export default DashboardPage;
