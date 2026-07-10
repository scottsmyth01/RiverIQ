import SessionsTable from '../components/SessionsTable/SessionsTable';
import { useSessions } from '../hooks/useSessions';
import './SessionsPage.css';

const SessionsPage = () => {
  const { data: sessions = [] } = useSessions();

  return (
    <section className='dashboard-content sessions-page'>
      <h1>Sessions</h1>
      <SessionsTable sessions={sessions} sessionsPerPage={10} variant='sessions-page' />
    </section>
  );
};

export default SessionsPage;
