import SessionsTable from '../components/SessionsTable/SessionsTable';
import { useSessions } from '../hooks/useSessions';
import './SessionsPage.css';

const SessionsPage = () => {
  const { data: sessions = [] } = useSessions();

  return (
    <section className='dashboard-content sessions-page'>
      <header className='sessions-header'>
        <h1>Sessions</h1>
        <p>Review, edit, and manage every imported poker session.</p>
      </header>
      <SessionsTable sessions={sessions} sessionsPerPage={10} variant='sessions-page' />
    </section>
  );
};

export default SessionsPage;
