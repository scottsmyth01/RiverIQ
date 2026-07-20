import './ReportsPage.css';
import './SavedReportsPage.css';

import { ChevronLeft, ChevronRight, FileText, Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { useDeleteSavedReport, useSavedReports } from '../hooks/useSavedReports';
import { useSessions } from '../hooks/useSessions';
import {
  formatCell,
  formatCurrency,
  formatNumber,
  getReportRows,
  reportColumns,
  rowMatchesReportFilters,
} from '../utils/reports/reportData';

function getReportSummary(rows) {
  const totals = rows.reduce(
    (summary, row) => {
      const hands = Number(row.hands) || 0;
      summary.hands += hands;
      summary.profit += Number(row.profit) || 0;
      summary.bbWeighted += (Number(row.bb100) || 0) * hands;
      return summary;
    },
    { hands: 0, profit: 0, bbWeighted: 0 },
  );

  return {
    hands: totals.hands,
    profit: totals.profit,
    bb100: totals.hands ? totals.bbWeighted / totals.hands : 0,
  };
}

function getResultRows(rows, report) {
  const filters = report?.appliedFilters || report?.filters;
  const sort = report?.sort || { key: 'date', direction: 'desc' };

  return rows
    .filter((row) => rowMatchesReportFilters(row, filters))
    .sort((a, b) => {
      const aValue = a[sort.key];
      const bValue = b[sort.key];
      const direction = sort.direction === 'asc' ? 1 : -1;

      if (typeof aValue === 'number' && typeof bValue === 'number') return (aValue - bValue) * direction;
      return String(aValue).localeCompare(String(bValue)) * direction;
    });
}

const SavedReportsPage = () => {
  const { data: sessions = [] } = useSessions();
  const { data: savedReports = [], isLoading, error } = useSavedReports();
  const { mutateAsync: deleteSavedReport, isPending: isDeletingReport } = useDeleteSavedReport();
  const [activeReportId, setActiveReportId] = useState(null);
  const [page, setPage] = useState(1);
  const rows = useMemo(() => getReportRows(sessions), [sessions]);
  const activeReport = savedReports.find((report) => report.id === activeReportId) || savedReports[0];
  const visibleColumns = reportColumns.filter((column) =>
    (activeReport?.visibleColumnKeys || reportColumns.map((reportColumn) => reportColumn.key)).includes(column.key),
  );
  const resultRows = useMemo(() => (activeReport ? getResultRows(rows, activeReport) : []), [rows, activeReport]);
  const rowsPerPage = activeReport?.rowsPerPage || 10;
  const totalPages = Math.max(1, Math.ceil(resultRows.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const firstRowIndex = (currentPage - 1) * rowsPerPage;
  const visibleRows = resultRows.slice(firstRowIndex, firstRowIndex + rowsPerPage);
  const summary = getReportSummary(resultRows);

  useEffect(() => {
    if (!activeReportId && savedReports[0]?.id) {
      setActiveReportId(savedReports[0].id);
    }
  }, [activeReportId, savedReports]);

  async function removeReport(reportId) {
    try {
      await deleteSavedReport(reportId);
      setActiveReportId(null);
      setPage(1);
    } catch (deleteError) {
      console.error(deleteError);
    }
  }

  return (
    <main className='saved-reports-page reports-page'>
      <header className='reports-header'>
        <div>
          <h1>Saved Reports</h1>
          <p>Open a saved report and review its resulting table.</p>
        </div>
        <div className='reports-header-actions'>
          <Link className='reports-action reports-action--secondary' to='/dashboard/reports'>
            <Plus aria-hidden='true' />
            New Report
          </Link>
        </div>
      </header>

      <div className='saved-reports-layout'>
        <aside className='saved-reports-list'>
          <h2>Reports</h2>
          {isLoading ? (
            <div className='saved-reports-empty'>
              <FileText aria-hidden='true' />
              <strong>Loading reports...</strong>
            </div>
          ) : error ? (
            <div className='saved-reports-empty'>
              <FileText aria-hidden='true' />
              <strong>{error.message}</strong>
            </div>
          ) : savedReports.length === 0 ? (
            <div className='saved-reports-empty'>
              <FileText aria-hidden='true' />
              <strong>No saved reports yet</strong>
              <span>Build a report, then use Save Report.</span>
            </div>
          ) : (
            savedReports.map((report) => (
              <button
                className={`saved-report-item ${report.id === activeReport?.id ? 'saved-report-item--active' : ''}`}
                key={report.id}
                type='button'
                onClick={() => {
                  setActiveReportId(report.id);
                  setPage(1);
                }}
              >
                <span>{report.title}</span>
                <small>{new Date(report.updatedAt).toLocaleDateString()}</small>
              </button>
            ))
          )}
        </aside>

        <section className='reports-workspace'>
          <article className='reports-results-panel'>
            <div className='reports-results-header'>
              <h2>{activeReport?.title || 'No report selected'}</h2>
              {activeReport && (
                <button
                  className='reports-action reports-action--secondary'
                  type='button'
                  disabled={isDeletingReport}
                  onClick={() => removeReport(activeReport.id)}
                >
                  <Trash2 aria-hidden='true' />
                  {isDeletingReport ? 'Deleting...' : 'Delete'}
                </button>
              )}
            </div>

            <div className='saved-report-summary'>
              <span>{resultRows.length} sessions</span>
              <span>{summary.hands.toLocaleString()} hands</span>
              <span className={summary.profit >= 0 ? 'reports-positive' : 'reports-negative'}>
                {formatCurrency(summary.profit)}
              </span>
              <span className={summary.bb100 >= 0 ? 'reports-positive' : 'reports-negative'}>
                {summary.bb100.toFixed(2)} bb/100
              </span>
            </div>

            <div className='reports-table-scroll'>
              <table className='reports-table'>
                <thead>
                  <tr>
                    {visibleColumns.map((column) => (
                      <th key={column.key}>
                        <span>{column.label}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleRows.map((row, rowIndex) => (
                    <tr key={`${row.date}-${rowIndex}`}>
                      {visibleColumns.map((column) => {
                        const cellNumber = Number(row[column.key]);
                        const isSigned = column.key === 'profit' || column.key === 'bb100';

                        return (
                          <td
                            className={
                              isSigned ? (cellNumber >= 0 ? 'reports-positive' : 'reports-negative') : undefined
                            }
                            key={column.key}
                          >
                            {formatCell(row[column.key], column.type)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {!visibleRows.length && (
                    <tr>
                      <td className='reports-empty-cell' colSpan={visibleColumns.length}>
                        This saved report has no matching sessions.
                      </td>
                    </tr>
                  )}
                  {activeReport && (
                    <tr className='reports-total-row'>
                      <td>Totals ({resultRows.length} sessions)</td>
                      {visibleColumns.slice(1).map((column) => {
                        if (column.key === 'hands') return <td key={column.key}>{summary.hands.toLocaleString()}</td>;
                        if (column.key === 'profit') {
                          return (
                            <td className={summary.profit >= 0 ? 'reports-positive' : 'reports-negative'} key={column.key}>
                              {formatCurrency(summary.profit)}
                            </td>
                          );
                        }
                        if (column.key === 'bb100') {
                          return (
                            <td className={summary.bb100 >= 0 ? 'reports-positive' : 'reports-negative'} key={column.key}>
                              {summary.bb100.toFixed(2)}
                            </td>
                          );
                        }
                        if (
                          ['vpip', 'pfr', 'threeBet', 'foldToThreeBet', 'fourBet', 'foldToFourBet', 'wtsd', 'wsd'].includes(
                            column.key,
                          )
                        ) {
                          return (
                            <td key={column.key}>
                              {formatNumber(
                                resultRows.reduce((sum, row) => sum + (Number(row[column.key]) || 0), 0) /
                                  Math.max(1, resultRows.length),
                              )}
                            </td>
                          );
                        }
                        return <td key={column.key} />;
                      })}
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <footer className='reports-table-footer'>
              <span />
              <div>
                <span>
                  {resultRows.length ? firstRowIndex + 1 : 0}-{Math.min(firstRowIndex + rowsPerPage, resultRows.length)} of{' '}
                  {resultRows.length}
                </span>
                <button type='button' aria-label='Previous page' disabled={currentPage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                  <ChevronLeft aria-hidden='true' />
                </button>
                <button type='button' aria-label='Next page' disabled={currentPage === totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))}>
                  <ChevronRight aria-hidden='true' />
                </button>
              </div>
            </footer>
          </article>
        </section>
      </div>
    </main>
  );
};

export default SavedReportsPage;
