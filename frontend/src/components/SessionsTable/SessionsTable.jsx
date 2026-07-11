import './SessionsTable.css';

import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import SessionToolbar from './SessionToolbar';
import { applySorting, applyDateFilter, numTables as tables, finish as applyFinish } from './sessionTableFilters';

const SessionsTable = ({ sessions = [], sessionsPerPage = 5, variant }) => {
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [numTables, setNumTables] = useState('all');
  const [finish, setFinish] = useState('all');

  const filteredSessions = useMemo(() => {
    let result = [...sessions];
    // 1) APPLY DATE RANGE
    result = applyDateFilter(dateRange, result);
    // 2) APPLY # TABLES
    result = tables(numTables, result);
    // 3) APPLY SORT
    result = applySorting(sortBy, result);
    // 4) APPLY RESULT
    result = applyFinish(finish, result);

    return result;
  }, [sessions, dateRange, numTables, sortBy, finish]);

  const [currentPage, setCurrentPage] = useState(1);

  const lastIndex = currentPage * sessionsPerPage;
  const firstIndex = lastIndex - sessionsPerPage;

  useEffect(() => {
    setCurrentPage(1);
  }, [dateRange, numTables, sortBy, finish]);

  const currentSessions = filteredSessions.slice(firstIndex, lastIndex);
  const totalPages = Math.ceil(filteredSessions.length / sessionsPerPage);
  const firstVisiblePage = currentPage === totalPages ? Math.max(1, totalPages - 1) : currentPage;
  const visiblePages = Array.from({ length: Math.min(2, totalPages) }, (_, index) => firstVisiblePage + index);
  const firstVisibleSession = filteredSessions.length === 0 ? 0 : firstIndex + 1;
  const lastVisibleSession = Math.min(lastIndex, filteredSessions.length);

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
              <th scope='col'># Tables</th>
              <th scope='col'>Profit</th>
              <th scope='col'>Win Rate</th>
              <th scope='col'>Duration</th>
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

              let hours = Math.floor(session.duration / 60);
              let minutes = session.duration % 60;
              const profitIsPositive = session.profit >= 0;
              const winRateIsPositive = session.bb100 >= 0;

              return (
                <tr key={session._id}>
                  <td>
                    <span className='session-date-desktop'>{formattedDate}</span>
                    <span className='session-date-mobile'>{mobileFormattedDate}</span>
                  </td>
                  <td>{session.game}</td>
                  <td>{session.stakes}</td>
                  <td>{session.numTables}</td>
                  <td
                    className={`session-result ${profitIsPositive ? 'session-result--positive' : 'session-result--negative'}`}
                  >
                    {profitIsPositive ? '+' : '-'}${Math.abs(session.profit).toFixed(2)}
                  </td>
                  <td
                    className={`session-result ${winRateIsPositive ? 'session-result--positive' : 'session-result--negative'}`}
                  >
                    {session.bb100.toFixed(2)} BB/100
                  </td>
                  <td>
                    {hours}h {minutes}m
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
    </section>
  );
};

export default SessionsTable;
