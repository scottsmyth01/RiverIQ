import { Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import SessionsTable from '../components/SessionsTable/SessionsTable';
import { usePurgeSessions, useSessions } from '../hooks/useSessions';
import { useEffect, useState } from 'react';
import './SessionsPage.css';

const mobileSessionsQuery = '(max-width: 760px)';

const SessionsPage = () => {
  const { data: sessions = [] } = useSessions();
  const { mutateAsync: purgeSessions, isPending: isPurgingSessions } = usePurgeSessions();
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
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

  useEffect(() => {
    if (!isPurgeModalOpen) return undefined;

    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        closePurgeModal();
      }
    }

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isPurgeModalOpen, isPurgingSessions]);

  function openPurgeModal() {
    if (!sessions.length || isPurgingSessions) return;
    setIsPurgeModalOpen(true);
  }

  function closePurgeModal() {
    if (isPurgingSessions) return;
    setIsPurgeModalOpen(false);
  }

  async function handleConfirmPurgeSessions() {
    if (!sessions.length || isPurgingSessions) return;

    try {
      const { deletedCount } = await purgeSessions();
      setIsPurgeModalOpen(false);
      toast.success(deletedCount === 1 ? '1 session purged' : `${deletedCount} sessions purged`);
    } catch (error) {
      toast.error(error.message || 'Could not purge sessions');
    }
  }

  return (
    <section className='dashboard-content sessions-page'>
      <header className='sessions-header'>
        <div>
          <h1>Sessions</h1>
          <p>Review, edit, and manage every imported poker session.</p>
        </div>
      </header>
      <SessionsTable
        sessions={sessions}
        sessionsPerPage={sessionsPerPage}
        variant='sessions-page'
        onPurgeSessions={openPurgeModal}
        isPurgingSessions={isPurgingSessions}
      />

      {isPurgeModalOpen && createPortal(
        <div className='sessions-purge-modal-backdrop' role='presentation' onMouseDown={closePurgeModal}>
          <section
            className='sessions-purge-modal'
            role='dialog'
            aria-modal='true'
            aria-labelledby='sessions-purge-modal-title'
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className='sessions-purge-modal-icon'>
              <Trash2 aria-hidden='true' />
            </div>
            <div>
              <h2 id='sessions-purge-modal-title'>Purge all sessions?</h2>
              <p>
                This will permanently delete all {sessions.length} imported sessions and update your bankroll. This
                cannot be undone.
              </p>
            </div>
            <div className='sessions-purge-modal-actions'>
              <button type='button' disabled={isPurgingSessions} onClick={closePurgeModal}>
                Cancel
              </button>
              <button type='button' disabled={isPurgingSessions} onClick={handleConfirmPurgeSessions}>
                {isPurgingSessions ? 'Purging...' : 'Purge Sessions'}
              </button>
            </div>
          </section>
        </div>,
        document.body,
      )}
    </section>
  );
};

export default SessionsPage;
