import SessionsTable from '../components/SessionsTable/SessionsTable';
import { useSessions } from '../hooks/useSessions';
import { useEffect, useState } from 'react';
import './SessionsPage.css';

const mobileSessionsQuery = '(max-width: 760px)';

const SessionsPage = () => {
  const { data: sessions = [] } = useSessions();
  const [sessionsPerPage, setSessionsPerPage] = useState(() => {
    if (typeof window === 'undefined') return 10;
    return window.matchMedia(mobileSessionsQuery).matches ? 5 : 10;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(mobileSessionsQuery);

    function updateSessionsPerPage() {
      setSessionsPerPage(mediaQuery.matches ? 5 : 10);
    }

    updateSessionsPerPage();
    mediaQuery.addEventListener('change', updateSessionsPerPage);
    return () => mediaQuery.removeEventListener('change', updateSessionsPerPage);
  }, []);

  return (
    <section className='dashboard-content sessions-page'>
      <header className='sessions-header'>
        <h1>Sessions</h1>
        <p>Review, edit, and manage every imported poker session.</p>
      </header>
      <SessionsTable sessions={sessions} sessionsPerPage={sessionsPerPage} variant='sessions-page' />
    </section>
  );
};

export default SessionsPage;
