import './SessionsTable.css';

import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, ChevronLeft, ChevronRight, ExternalLink, Lock, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import SessionToolbar from './SessionToolbar';
import { applySorting, applyDateFilter, numTables as tables, finish as applyFinish } from './sessionTableFilters';
import { useAuth } from '../../hooks/useAuth';
import { useDeleteSession } from '../../hooks/useSessions';
import { getPeriodFromDefaultTimeFilter } from '../../utils/dateRangePreferences';

const SessionsTable = ({ sessions = [], sessionsPerPage = 5, variant }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const hasProMembership = user?.subscription === 'pro';
  const { mutateAsync: deleteSession, isPending: isDeletingSession } = useDeleteSession();
  const defaultDateRange = getPeriodFromDefaultTimeFilter(user?.preferences?.defaultTimeFilter);
  const [dateRange, setDateRange] = useState(defaultDateRange);
  const [sortBy, setSortBy] = useState('newest');
  const [numTables, setNumTables] = useState('all');
  const [finish, setFinish] = useState('all');
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const [sessionPendingDelete, setSessionPendingDelete] = useState(null);

  const filteredSessions = useMemo(() => {
    let result = [...sessions];
    const activeDateRange = variant === 'sessions-page' ? dateRange : 'all-time';
    // 1) APPLY DATE RANGE
    result = applyDateFilter(activeDateRange, result);
    // 2) APPLY # TABLES
    result = tables(numTables, result);
    // 3) APPLY SORT
    result = applySorting(sortBy, result);
    // 4) APPLY RESULT
    result = applyFinish(finish, result);

    return result;
  }, [sessions, dateRange, numTables, sortBy, finish, variant]);

  const [currentPage, setCurrentPage] = useState(1);

  const lastIndex = currentPage * sessionsPerPage;
  const firstIndex = lastIndex - sessionsPerPage;

  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange, numTables, sortBy, finish]);

  useEffect(() => {
    setDateRange(defaultDateRange);
  }, [defaultDateRange]);

  useEffect(() => {
    function closeActionMenu(event) {
      if (!event.target.closest('.sessions-actions-cell')) {
        setOpenActionMenuId(null);
      }
    }

    document.addEventListener('pointerdown', closeActionMenu);
    return () => document.removeEventListener('pointerdown', closeActionMenu);
  }, []);

  useEffect(() => {
    if (!sessionPendingDelete) return undefined;

    function closeOnEscape(event) {
      if (event.key === 'Escape') {
        closeDeleteModal();
      }
    }

    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [sessionPendingDelete, isDeletingSession]);

  const currentSessions = filteredSessions.slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(filteredSessions.length / sessionsPerPage);
  const firstVisiblePage = currentPage === totalPages ? Math.max(1, totalPages - 1) : currentPage;
  const visiblePages = Array.from({ length: Math.min(2, totalPages) }, (_, index) => firstVisiblePage + index);
  const firstVisibleSession = filteredSessions.length === 0 ? 0 : firstIndex + 1;
  const lastVisibleSession = Math.min(lastIndex, filteredSessions.length);

  function getSessionWinRate(session) {
    if (typeof session.bb100 === 'number') return session.bb100;
    if (typeof session.winRate === 'number') return session.winRate;

    const profit = Number(session.profit) || 0;
    const hands = Number(session.hands) || 0;

    return hands > 0 ? (profit / 0.1 / hands) * 100 : 0;
  }

  function openDeleteModal(event, session) {
    event.stopPropagation();
    setOpenActionMenuId(null);
    setSessionPendingDelete(session);
  }

  function closeDeleteModal() {
    if (isDeletingSession) return;
    setSessionPendingDelete(null);
  }

  async function handleConfirmDelete() {
    if (!sessionPendingDelete) return;

    const sessionId = sessionPendingDelete._id || sessionPendingDelete.id;

    try {
      await deleteSession(sessionId);
      setOpenActionMenuId(null);
      setSessionPendingDelete(null);
      toast.success('Session deleted');
    } catch (error) {
      toast.error(error.message || 'Could not delete session');
    }
  }

  return (
    <section className='sessions-card'>
      <div className='sessions-card-header'>
        <div>
          <span>Session history</span>
          {variant === 'home-page' && <h2>Recent Sessions</h2>}
        </div>
      </div>

      {variant === 'sessions-page' && (
        <SessionToolbar
          dateRange={dateRange}
          setDateRange={setDateRange}
          sortBy={sortBy}
          setSortBy={setSortBy}
          numTables={numTables}
          setNumTables={setNumTables}
          finish={finish}
          setFinish={setFinish}
        />
      )}

      <div className='sessions-table-wrapper'>
        <table className='sessions-table'>
          <thead>
            <tr>
              <th scope='col'>Date</th>
              <th scope='col'>Game</th>
              <th scope='col'>Stakes</th>
              <th scope='col'>Profit</th>
              <th scope='col'>Win Rate</th>
              <th scope='col'>Duration</th>
              <th scope='col' aria-label='Session actions'></th>
            </tr>
          </thead>

          <tbody>
            {currentSessions?.map((session) => {
              const formattedDate = new Date(session.date).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              });
              const mobileFormattedDate = new Date(session.date).toLocaleDateString('en-US', {
                month: 'numeric',
                day: 'numeric',
                year: '2-digit',
              });

              const duration = Number(session.duration);
              const hasDuration = Number.isFinite(duration);
              const profit = Number(session.profit) || 0;
              const winRate = getSessionWinRate(session);
              const hours = hasDuration ? Math.floor(duration / 60) : 0;
              const minutes = hasDuration ? duration % 60 : 0;
              const profitIsPositive = profit >= 0;
              const winRateIsPositive = winRate >= 0;
              const sessionId = session._id || session.id;

              return (
                <tr className='sessions-table__row' key={sessionId}>
                  <td>
                    <span className='session-date-desktop'>{formattedDate}</span>
                    <span className='session-date-mobile'>{mobileFormattedDate}</span>
                  </td>
                  <td>{session.game}</td>
                  <td>{session.stakes}</td>
                  <td
                    className={`session-result ${profitIsPositive ? 'session-result--positive' : 'session-result--negative'}`}
                  >
                    {profitIsPositive ? '+' : '-'}${Math.abs(profit).toFixed(2)}
                  </td>
                  <td
                    className={`session-result ${winRateIsPositive ? 'session-result--positive' : 'session-result--negative'}`}
                  >
                    {winRate.toFixed(2)} BB/100
                  </td>
                  <td>{hasDuration ? `${hours}h ${minutes}m` : 'N/A'}</td>
                  <td className='sessions-actions-cell' onClick={(event) => event.stopPropagation()}>
                    <div className='sessions-row-actions'>
                      <button
                        className={`sessions-stats-button${hasProMembership ? '' : ' sessions-stats-button--locked'}`}
                        type='button'
                        aria-label={
                          hasProMembership
                            ? `View stats for ${session.sessionName || formattedDate}`
                            : 'Stats are locked. Upgrade to Pro to view stats.'
                        }
                        title={hasProMembership ? 'View stats' : 'Upgrade to Pro to view stats'}
                        onClick={() =>
                          navigate(hasProMembership ? `/dashboard/sessions/${sessionId}/stats` : '/subscription/payment')
                        }
                      >
                        {hasProMembership ? <BarChart3 aria-hidden='true' /> : <Lock aria-hidden='true' />}
                      </button>
                      <button
                        className='sessions-details-button'
                        type='button'
                        aria-label={`View details for ${session.sessionName || formattedDate}`}
                        title='View details'
                        onClick={() => navigate(`/dashboard/sessions/${sessionId}`)}
                      >
                        <ExternalLink aria-hidden='true' />
                      </button>
                      <button
                        className='sessions-actions-button'
                        type='button'
                        aria-label={`Actions for ${session.sessionName || formattedDate}`}
                        aria-expanded={openActionMenuId === sessionId}
                        onClick={() => setOpenActionMenuId(openActionMenuId === sessionId ? null : sessionId)}
                      >
                        <MoreVertical aria-hidden='true' />
                      </button>
                    </div>
                    {openActionMenuId === sessionId && (
                      <div className='sessions-actions-menu'>
                        <button type='button' onClick={() => navigate(`/dashboard/sessions/${sessionId}`)}>
                          <Pencil aria-hidden='true' />
                          <span>Edit</span>
                        </button>
                        <button type='button' disabled={isDeletingSession} onClick={(event) => openDeleteModal(event, session)}>
                          <Trash2 aria-hidden='true' />
                          <span>{isDeletingSession ? 'Deleting...' : 'Delete'}</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className='sessions-card-footer'>
          <p>
            Showing {firstVisibleSession}-{lastVisibleSession} of {filteredSessions.length} sessions
          </p>
          <nav className='sessions-pagination' aria-label='Sessions pagination'>
            <button
              type='button'
              aria-label='Previous page'
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            >
              <ChevronLeft aria-hidden='true' />
            </button>
            {visiblePages[0] > 2 && (
              <>
                <button type='button' onClick={() => setCurrentPage(1)} aria-label='Go to page 1'>
                  1
                </button>
                <span aria-hidden='true'>...</span>
              </>
            )}
            {visiblePages.map((page) => (
              <button
                key={page}
                type='button'
                onClick={() => setCurrentPage(page)}
                className={currentPage === page ? 'active' : ''}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </button>
            ))}
            {visiblePages.at(-1) < totalPages && (
              <>
                <span aria-hidden='true'>...</span>
                <button
                  type='button'
                  onClick={() => setCurrentPage(totalPages)}
                  aria-label={`Go to page ${totalPages}`}
                >
                  {totalPages}
                </button>
              </>
            )}
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
              type='button'
              aria-label='Next page'
            >
              <ChevronRight aria-hidden='true' />
            </button>
          </nav>
        </div>
      </div>

      {sessionPendingDelete && (
        <div className='session-delete-modal-backdrop' role='presentation' onMouseDown={closeDeleteModal}>
          <section
            className='session-delete-modal'
            role='dialog'
            aria-modal='true'
            aria-labelledby='session-delete-modal-title'
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className='session-delete-modal-icon'>
              <Trash2 aria-hidden='true' />
            </div>
            <div>
              <h2 id='session-delete-modal-title'>Delete this session?</h2>
              <p>This cannot be undone.</p>
            </div>
            <div className='session-delete-modal-actions'>
              <button type='button' disabled={isDeletingSession} onClick={closeDeleteModal}>
                Cancel
              </button>
              <button type='button' disabled={isDeletingSession} onClick={handleConfirmDelete}>
                {isDeletingSession ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
};

export default SessionsTable;
