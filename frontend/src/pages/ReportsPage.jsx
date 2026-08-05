import './ReportsPage.css';

import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Download,
  Edit3,
  FileSearch,
  Grid2X2,
  MoreVertical,
  Play,
  Plus,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { useCreateSavedReport, useUpdateSavedReport } from '../hooks/useSavedReports';
import { useSessions } from '../hooks/useSessions';
import { formatCurrency, formatStakes, getPreferredCurrency } from '../utils/currency';

const columns = [
  { key: 'date', label: 'Session Date', type: 'text' },
  { key: 'site', label: 'Poker Site', type: 'text' },
  { key: 'stakes', label: 'Stakes', type: 'stakes' },
  { key: 'game', label: 'Game Type', type: 'text' },
  { key: 'tableSize', label: 'Table Size', type: 'text' },
  { key: 'hands', label: 'Hands', type: 'integer' },
  { key: 'profit', label: 'Profit', type: 'currency' },
  { key: 'bb100', label: 'bb/100', type: 'rate2' },
  { key: 'vpip', label: 'VPIP', type: 'rate1' },
  { key: 'pfr', label: 'PFR', type: 'rate1' },
  { key: 'threeBet', label: '3-Bet %', type: 'rate1' },
  { key: 'foldToThreeBet', label: 'F3Bet %', type: 'rate1' },
  { key: 'fourBet', label: '4-Bet %', type: 'rate1' },
  { key: 'foldToFourBet', label: 'F4Bet %', type: 'rate1' },
  { key: 'wtsd', label: 'WTSD%', type: 'rate1' },
  { key: 'wsd', label: 'WSD%', type: 'rate1' },
];

const defaultFilters = {
  dateRange: 'All Time',
  startDate: '',
  endDate: '',
  site: 'All Sites',
  game: 'All Games',
  stakes: 'All Stakes',
  tableSizes: [],
  position: 'All Positions',
  tags: 'All Tags',
};

const standardTableSizes = ['2-Max', '6-Max', '7-Max', '8-Max', '9-Max'];
const optionalReportFilters = [
  {
    key: 'site',
    label: 'Poker Site',
    description: 'Filter sessions by poker client or imported site.',
  },
  {
    key: 'game',
    label: 'Game Type',
    description: 'Filter by the poker format stored on each session.',
  },
  {
    key: 'stakes',
    label: 'Stakes',
    description: 'Filter sessions by blind level.',
  },
  {
    key: 'tableSize',
    label: 'Table Size',
    description: 'Filter by table format, such as 6-Max or 9-Max.',
  },
  {
    key: 'position',
    label: 'Position',
    description: 'Filter report rows by table position.',
  },
  {
    key: 'tags',
    label: 'Session Tags',
    description: 'Filter report rows by tags you apply to sessions.',
  },
];

function formatDate(date) {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return 'N/A';

  return parsedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function toDateInputValue(date) {
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return '';
  return parsedDate.toISOString().slice(0, 10);
}

function formatNumber(value, digits = 1) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : 'N/A';
}

function formatCell(value, type, currency = 'USD') {
  if (type === 'currency') return formatCurrency(value, currency);
  if (type === 'stakes') return formatStakes(value, currency);
  if (type === 'integer') return Number(value || 0).toLocaleString();
  if (type === 'rate2') return formatNumber(value, 2);
  if (type === 'rate1') return formatNumber(value, 1);
  return value || 'N/A';
}

function uniqueValues(rows, key) {
  return [...new Set(rows.map((row) => row[key]).filter(Boolean))].sort();
}

function normalizeTableSize(value) {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'string') {
    if (/^(hu|heads[-\s]?up)$/i.test(value.trim())) return '2-Max';
    const match = value.match(/\d+/);
    return match ? `${match[0]}-Max` : value;
  }

  const size = Number(value);
  return Number.isFinite(size) && size > 0 ? `${size}-Max` : null;
}

function getByPositionCount(byPosition) {
  if (!byPosition) return 0;

  if (byPosition instanceof Map) return byPosition.size;
  if (typeof byPosition === 'object') return Object.keys(byPosition).length;

  return 0;
}

function getTableSize(session) {
  const stats = session.stats || {};
  const explicitTableSize =
    normalizeTableSize(session.tableSize) ||
    normalizeTableSize(session.tableSizeMax) ||
    normalizeTableSize(session.maxPlayers) ||
    normalizeTableSize(session.numPlayers) ||
    normalizeTableSize(stats.tableSize) ||
    normalizeTableSize(stats.maxPlayers);

  if (explicitTableSize) return explicitTableSize;

  const positionCount = getByPositionCount(stats.byPosition);
  return positionCount ? `${positionCount}-Max` : 'N/A';
}

function getSessionRows(sessions) {
  if (!sessions.length) return [];

  return sessions.map((session) => {
    const stats = session.stats || {};
    const sessionDate = session.date || session.createdAt;

    return {
      rawDate: toDateInputValue(sessionDate),
      date: formatDate(sessionDate),
      site: session.pokerSite || session.game || 'PokerStars',
      stakes: session.stakes || 'N/A',
      game: session.gameType || 'NL Hold’em',
      tableSize: getTableSize(session),
      hands: Number(session.hands ?? stats.handsPlayed ?? 0),
      profit: Number(session.profit ?? stats.profit ?? 0),
      bb100: Number(session.bb100 ?? stats.bb100 ?? session.winRate ?? 0),
      vpip: stats.vpip,
      pfr: stats.pfr,
      threeBet: stats.threeBet,
      foldToThreeBet: stats.foldToThreeBet,
      fourBet: stats.fourBet,
      foldToFourBet: stats.foldToFourBet,
      wtsd: stats.wtsd,
      wsd: stats.wsd,
    };
  });
}

function rowMatchesFilters(row, filters) {
  if (filters.dateRange !== 'All Time') {
    const rowTime = new Date(row.rawDate).getTime();
    if (Number.isNaN(rowTime)) return false;

    if (filters.dateRange === 'Past 30 Days' || filters.dateRange === 'Past 90 Days') {
      const days = filters.dateRange === 'Past 30 Days' ? 30 : 90;
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      if (rowTime < cutoff.getTime()) return false;
    }

    if (filters.dateRange === 'Custom Range') {
      if (filters.startDate && rowTime < new Date(`${filters.startDate}T00:00:00`).getTime()) return false;
      if (filters.endDate && rowTime > new Date(`${filters.endDate}T23:59:59`).getTime()) return false;
    }
  }

  if (filters.site !== 'All Sites' && row.site !== filters.site) return false;
  if (filters.game !== 'All Games' && row.game !== filters.game) return false;
  if (filters.stakes !== 'All Stakes' && row.stakes !== filters.stakes) return false;
  if (filters.tableSizes.length && !filters.tableSizes.includes(row.tableSize)) return false;
  return true;
}

function getReportSummary(rows) {
  const totals = rows.reduce(
    (summary, row) => {
      const hands = Number(row.hands) || 0;

      summary.hands += hands;
      summary.profit += Number(row.profit) || 0;
      summary.bbWeighted += (Number(row.bb100) || 0) * hands;
      summary.threeBet += Number(row.threeBet) || 0;
      summary.foldToThreeBet += Number(row.foldToThreeBet) || 0;
      summary.fourBet += Number(row.fourBet) || 0;
      summary.foldToFourBet += Number(row.foldToFourBet) || 0;
      summary.wtsd += Number(row.wtsd) || 0;
      summary.wsd += Number(row.wsd) || 0;
      return summary;
    },
    {
      hands: 0,
      profit: 0,
      bbWeighted: 0,
      threeBet: 0,
      foldToThreeBet: 0,
      fourBet: 0,
      foldToFourBet: 0,
      wtsd: 0,
      wsd: 0,
    },
  );

  return {
    hands: totals.hands,
    profit: totals.profit,
    bb100: totals.hands ? totals.bbWeighted / totals.hands : 0,
    threeBet: rows.length ? totals.threeBet / rows.length : 0,
    foldToThreeBet: rows.length ? totals.foldToThreeBet / rows.length : 0,
    fourBet: rows.length ? totals.fourBet / rows.length : 0,
    foldToFourBet: rows.length ? totals.foldToFourBet / rows.length : 0,
    wtsd: rows.length ? totals.wtsd / rows.length : 0,
    wsd: rows.length ? totals.wsd / rows.length : 0,
  };
}

function downloadCsv(filename, rows, visibleColumns, currency) {
  const escapeValue = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csvRows = [
    visibleColumns.map((column) => escapeValue(column.label)).join(','),
    ...rows.map((row) =>
      visibleColumns.map((column) => escapeValue(formatCell(row[column.key], column.type, currency))).join(','),
    ),
  ];
  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function ReportSelect({ label, value, options, onChange, icon: Icon }) {
  return (
    <label className='report-filter'>
      <span>{label}</span>
      <span className='report-select-shell'>
        {Icon && <Icon aria-hidden='true' />}
        <span className='report-select-value'>{value}</span>
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden='true' />
      </span>
    </label>
  );
}

function ReportActionButton({ children, variant = 'secondary', icon: Icon, onClick, disabled = false, className = '' }) {
  const classes = `reports-action reports-action--${variant}${className ? ` ${className}` : ''}`;

  return (
    <button className={classes} type='button' onClick={onClick} disabled={disabled}>
      {Icon && <Icon aria-hidden='true' />}
      <span>{children}</span>
    </button>
  );
}

const ReportsPage = () => {
  const { user } = useAuth();
  const currency = getPreferredCurrency(user);
  const { data: sessions = [] } = useSessions();
  const createSavedReportMutation = useCreateSavedReport();
  const updateSavedReportMutation = useUpdateSavedReport();
  const rows = useMemo(() => getSessionRows(sessions), [sessions]);
  const columnsMenuRef = useRef(null);
  const mobileActionsRef = useRef(null);
  const runReportTimeoutRef = useRef(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [hasRunReport, setHasRunReport] = useState(false);
  const [isRunningReport, setIsRunningReport] = useState(false);
  const [visibleColumnKeys, setVisibleColumnKeys] = useState(columns.map((column) => column.key));
  const [sort, setSort] = useState({ key: 'date', direction: 'desc' });
  const [groupBy, setGroupBy] = useState('None');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [showColumns, setShowColumns] = useState(false);
  const [activeExtraFilters, setActiveExtraFilters] = useState([]);
  const [pendingExtraFilters, setPendingExtraFilters] = useState([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [reportTitle, setReportTitle] = useState('Untitled Report');
  const [draftReportTitle, setDraftReportTitle] = useState('Untitled Report');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [savedReportId, setSavedReportId] = useState(null);
  const [isMobileActionsOpen, setIsMobileActionsOpen] = useState(false);
  const isSavingReport = createSavedReportMutation.isPending || updateSavedReportMutation.isPending;

  const tableSizeOptions = useMemo(() => {
    return [...new Set([...standardTableSizes, ...uniqueValues(rows, 'tableSize')])]
      .filter((tableSize) => tableSize !== 'N/A')
      .sort((a, b) => Number(a.match(/\d+/)?.[0] || 0) - Number(b.match(/\d+/)?.[0] || 0));
  }, [rows]);
  const visibleColumns = columns.filter((column) => visibleColumnKeys.includes(column.key));
  const filteredRows = useMemo(
    () => (hasRunReport ? rows.filter((row) => rowMatchesFilters(row, appliedFilters)) : []),
    [rows, appliedFilters, hasRunReport],
  );
  const groupOptions = ['None', 'Poker Site', 'Stakes', 'Game Type', 'Table Size'];
  const groupKey = {
    'Poker Site': 'site',
    Stakes: 'stakes',
    'Game Type': 'game',
    'Table Size': 'tableSize',
  }[groupBy];
  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      if (groupKey) {
        const groupCompare = String(a[groupKey] || 'N/A').localeCompare(String(b[groupKey] || 'N/A'));
        if (groupCompare !== 0) return groupCompare;
      }

      const aValue = a[sort.key];
      const bValue = b[sort.key];
      const direction = sort.direction === 'asc' ? 1 : -1;

      if (typeof aValue === 'number' && typeof bValue === 'number') return (aValue - bValue) * direction;
      return String(aValue).localeCompare(String(bValue)) * direction;
    });
  }, [filteredRows, sort, groupKey]);
  const summary = useMemo(() => getReportSummary(sortedRows), [sortedRows]);
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const firstRowIndex = (currentPage - 1) * rowsPerPage;
  const visibleRows = sortedRows.slice(firstRowIndex, firstRowIndex + rowsPerPage);
  const isEmptyReportState = !isRunningReport && !visibleRows.length;
  const groupedVisibleRows = groupKey
    ? Object.entries(
        visibleRows.reduce((groups, row) => {
          const label = row[groupKey] || 'N/A';
          groups[label] = [...(groups[label] || []), row];
          return groups;
        }, {}),
      )
    : [];
  const groupedCounts = groupKey
    ? Object.entries(
        sortedRows.reduce((groups, row) => {
          groups[row[groupKey]] = (groups[row[groupKey]] || 0) + 1;
          return groups;
        }, {}),
      )
    : [];

  useEffect(() => {
    if (!showColumns && !isMobileActionsOpen) return undefined;

    function closeMenusOnOutsideClick(event) {
      if (showColumns && !columnsMenuRef.current?.contains(event.target)) {
        setShowColumns(false);
      }

      if (isMobileActionsOpen && !mobileActionsRef.current?.contains(event.target)) {
        setIsMobileActionsOpen(false);
      }
    }

    document.addEventListener('pointerdown', closeMenusOnOutsideClick);
    return () => document.removeEventListener('pointerdown', closeMenusOnOutsideClick);
  }, [showColumns, isMobileActionsOpen]);

  useEffect(() => {
    return () => window.clearTimeout(runReportTimeoutRef.current);
  }, []);

  function updateFilter(key, value) {
    setFilters((currentFilters) => ({ ...currentFilters, [key]: value }));
  }

  function runReport() {
    window.clearTimeout(runReportTimeoutRef.current);
    setIsRunningReport(true);
    setHasRunReport(false);
    setPage(1);

    runReportTimeoutRef.current = window.setTimeout(() => {
      setAppliedFilters(filters);
      setHasRunReport(true);
      setIsRunningReport(false);
      setNotice(`Report updated: ${rows.filter((row) => rowMatchesFilters(row, filters)).length} sessions found.`);
      toast.success('Report successfully run');
    }, 1400);
  }

  function clearFilters() {
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setHasRunReport(false);
    setIsRunningReport(false);
    window.clearTimeout(runReportTimeoutRef.current);
    setActiveExtraFilters([]);
    setPendingExtraFilters([]);
    setPage(1);
    setNotice('Filters cleared.');
  }

  function openFilterModal() {
    setPendingExtraFilters(activeExtraFilters);
    setIsFilterModalOpen(true);
  }

  function togglePendingFilter(filterKey) {
    setPendingExtraFilters((currentFilters) =>
      currentFilters.includes(filterKey)
        ? currentFilters.filter((key) => key !== filterKey)
        : [...currentFilters, filterKey],
    );
  }

  function applyExtraFilters() {
    setActiveExtraFilters(pendingExtraFilters);
    setIsFilterModalOpen(false);
  }

  function toggleColumn(columnKey) {
    setVisibleColumnKeys((currentKeys) => {
      if (currentKeys.includes(columnKey) && currentKeys.length === 1) return currentKeys;
      return currentKeys.includes(columnKey)
        ? currentKeys.filter((key) => key !== columnKey)
        : [...currentKeys, columnKey];
    });
  }

  function handleSort(columnKey) {
    setSort((currentSort) => ({
      key: columnKey,
      direction: currentSort.key === columnKey && currentSort.direction === 'desc' ? 'asc' : 'desc',
    }));
  }

  function startEditingTitle() {
    setDraftReportTitle(reportTitle);
    setIsEditingTitle(true);
  }

  function saveReportTitle() {
    const nextTitle = draftReportTitle.trim();
    if (nextTitle) setReportTitle(nextTitle);
    setIsEditingTitle(false);
  }

  function cancelTitleEdit() {
    setDraftReportTitle(reportTitle);
    setIsEditingTitle(false);
  }

  function getReportConfig(id = savedReportId, title = reportTitle) {
    return {
      id,
      title,
      reportType: 'session-report',
      dateRange: {
        preset: filters.dateRange,
        startDate: filters.startDate || null,
        endDate: filters.endDate || null,
      },
      filters,
      appliedFilters: filters,
      visibleColumnKeys,
      sort,
      groupBy,
      rowsPerPage,
      summary,
    };
  }

  async function saveCurrentReport() {
    try {
      const reportData = getReportConfig(savedReportId, reportTitle);
      const savedReport = savedReportId
        ? await updateSavedReportMutation.mutateAsync({ id: savedReportId, reportData })
        : await createSavedReportMutation.mutateAsync(reportData);

      setSavedReportId(savedReport.id);
      setReportTitle(savedReport.title);
      setAppliedFilters(filters);
      toast.success('Saved report successfully');
    } catch (error) {
      toast.error(error.message || 'Could not save report');
    }
  }

  return (
    <main className='reports-page'>
      {isFilterModalOpen && (
        <div className='report-modal-backdrop' role='presentation' onMouseDown={() => setIsFilterModalOpen(false)}>
          <section
            className='report-filter-modal'
            role='dialog'
            aria-modal='true'
            aria-labelledby='report-filter-modal-title'
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className='report-filter-modal-header'>
              <div>
                <h2 id='report-filter-modal-title'>Add Filters</h2>
                <p>Select the extra filters you want in this report builder.</p>
              </div>
              <button type='button' aria-label='Close filters modal' onClick={() => setIsFilterModalOpen(false)}>
                <X aria-hidden='true' />
              </button>
            </div>

            <div className='report-filter-options'>
              {optionalReportFilters.map((filter) => (
                <label className='report-filter-option' key={filter.key}>
                  <input
                    checked={pendingExtraFilters.includes(filter.key)}
                    type='checkbox'
                    onChange={() => togglePendingFilter(filter.key)}
                  />
                  <span>
                    <strong>{filter.label}</strong>
                    <small>{filter.description}</small>
                  </span>
                </label>
              ))}
            </div>

            <div className='report-filter-modal-actions'>
              <button type='button' onClick={() => setIsFilterModalOpen(false)}>
                Cancel
              </button>
              <button type='button' onClick={applyExtraFilters}>
                Update
              </button>
            </div>
          </section>
        </div>
      )}

      <header className='reports-header'>
        <div>
          <h1>Reports</h1>
          <p>Create a custom report to analyze your game.</p>
        </div>
        <div className='reports-header-actions'>
          <Link className='reports-action reports-action--secondary' to='/dashboard/reports'>
            Saved Reports
          </Link>
          <ReportActionButton
            className='reports-action--desktop-only'
            onClick={() => saveCurrentReport()}
            disabled={isSavingReport}
          >
            {isSavingReport ? 'Saving...' : 'Save Report'}
          </ReportActionButton>
          <ReportActionButton variant='primary' icon={Play} onClick={runReport} disabled={isRunningReport}>
            {isRunningReport ? 'Running...' : 'Run Report'}
          </ReportActionButton>
          <div className='reports-mobile-actions' ref={mobileActionsRef}>
            <button
              className='reports-mobile-actions-button'
              type='button'
              aria-label='More report actions'
              aria-expanded={isMobileActionsOpen}
              onClick={() => setIsMobileActionsOpen((isOpen) => !isOpen)}
            >
              <MoreVertical aria-hidden='true' />
            </button>
            {isMobileActionsOpen && (
              <div className='reports-mobile-actions-menu' role='menu'>
                <button
                  type='button'
                  role='menuitem'
                  disabled={isSavingReport}
                  onClick={() => {
                    setIsMobileActionsOpen(false);
                    saveCurrentReport();
                  }}
                >
                  <Check aria-hidden='true' />
                  <span>{isSavingReport ? 'Saving...' : 'Save Report'}</span>
                </button>
                <button
                  type='button'
                  role='menuitem'
                  onClick={() => {
                    setIsMobileActionsOpen(false);
                    downloadCsv(`${reportTitle}.csv`, sortedRows, visibleColumns, currency);
                  }}
                >
                  <Download aria-hidden='true' />
                  <span>Export CSV</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className='reports-layout'>
        <aside className='report-builder-panel'>
          <div className='report-builder-header'>
            <h2>Report Builder</h2>
          </div>

          <div className='report-filter-heading'>
            <span>Filters</span>
            <button type='button' onClick={clearFilters}>
              Clear All
            </button>
          </div>

          <ReportSelect
            label='Date Range'
            value={filters.dateRange}
            options={['Custom Range', 'All Time', 'Past 30 Days', 'Past 90 Days']}
            onChange={(value) => updateFilter('dateRange', value)}
            icon={CalendarDays}
          />

          {filters.dateRange === 'Custom Range' && (
            <div className='report-date-range'>
              <label>
                <span>Start</span>
                <input
                  type='date'
                  value={filters.startDate}
                  onChange={(event) => updateFilter('startDate', event.target.value)}
                />
              </label>
              <label>
                <span>End</span>
                <input
                  type='date'
                  value={filters.endDate}
                  onChange={(event) => updateFilter('endDate', event.target.value)}
                />
              </label>
            </div>
          )}

          {activeExtraFilters.includes('site') && (
            <ReportSelect
              label='Poker Site'
              value={filters.site}
              options={['All Sites', ...uniqueValues(rows, 'site')]}
              onChange={(value) => updateFilter('site', value)}
            />
          )}

          {activeExtraFilters.includes('game') && (
            <ReportSelect
              label='Game Type'
              value={filters.game}
              options={['All Games', ...uniqueValues(rows, 'game')]}
              onChange={(value) => updateFilter('game', value)}
            />
          )}

          {activeExtraFilters.includes('stakes') && (
            <ReportSelect
              label='Stakes'
              value={filters.stakes}
              options={['All Stakes', ...uniqueValues(rows, 'stakes')]}
              onChange={(value) => updateFilter('stakes', value)}
            />
          )}

          {activeExtraFilters.includes('tableSize') && (
            <ReportSelect
              label='Table Size'
              value={filters.tableSizes[0] || 'All Table Sizes'}
              options={['All Table Sizes', ...tableSizeOptions]}
              onChange={(value) => updateFilter('tableSizes', value === 'All Table Sizes' ? [] : [value])}
            />
          )}

          {activeExtraFilters.includes('position') && (
            <ReportSelect
              label='Position'
              value={filters.position}
              options={['All Positions', 'UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB']}
              onChange={(value) => updateFilter('position', value)}
            />
          )}

          {activeExtraFilters.includes('tags') && (
            <label className='report-filter'>
              <span>Session Tags</span>
              <textarea
                className='report-tags-textarea'
                placeholder='Type tags separated by commas'
                value={filters.tags === 'All Tags' ? '' : filters.tags}
                onChange={(event) => updateFilter('tags', event.target.value)}
              />
            </label>
          )}

          {activeExtraFilters.length > 0 && (
            <>
              <button className='report-more-button' type='button' onClick={openFilterModal}>
                <span>Manage Filters</span>
                <ChevronRight aria-hidden='true' />
              </button>
            </>
          )}

          <button className='report-add-filter' type='button' onClick={openFilterModal}>
            <Plus aria-hidden='true' />
            <span>Add Filter</span>
          </button>
        </aside>

        <section className='reports-workspace'>
          <article className='reports-results-panel'>
            <div className='reports-results-header'>
              <h2>
                {isEditingTitle ? (
                  <span className='reports-title-editor'>
                    <input
                      aria-label='Report title'
                      autoFocus
                      value={draftReportTitle}
                      onChange={(event) => setDraftReportTitle(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') saveReportTitle();
                        if (event.key === 'Escape') cancelTitleEdit();
                      }}
                    />
                    <button type='button' aria-label='Save report title' onClick={saveReportTitle}>
                      <Check aria-hidden='true' />
                    </button>
                    <button type='button' aria-label='Cancel report title edit' onClick={cancelTitleEdit}>
                      <X aria-hidden='true' />
                    </button>
                  </span>
                ) : (
                  <>
                    <button className='reports-title-button' type='button' onClick={startEditingTitle}>
                      {reportTitle}
                    </button>
                    <button
                      className='reports-title-edit-button'
                      type='button'
                      aria-label='Edit report title'
                      onClick={startEditingTitle}
                    >
                      <Edit3 aria-hidden='true' />
                    </button>
                  </>
                )}
              </h2>
              <div className='reports-panel-tools'>
                <div className='reports-menu-wrap' ref={columnsMenuRef}>
                  <ReportActionButton icon={Columns3} onClick={() => setShowColumns((isOpen) => !isOpen)}>
                    Columns
                  </ReportActionButton>
                  {showColumns && (
                    <div className='reports-popover'>
                      {columns.map((column) => (
                        <label key={column.key}>
                          <input
                            checked={visibleColumnKeys.includes(column.key)}
                            type='checkbox'
                            onChange={() => toggleColumn(column.key)}
                          />
                          <span>{column.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <label className='reports-group-select'>
                  <Grid2X2 aria-hidden='true' />
                  <span>{groupBy === 'None' ? 'Group By' : groupBy}</span>
                  <select value={groupBy} onChange={(event) => setGroupBy(event.target.value)}>
                    {groupOptions.map((option) => (
                      <option key={option} value={option}>
                        {option === 'None' ? 'Group By' : option}
                      </option>
                    ))}
                  </select>
                  <ChevronDown aria-hidden='true' />
                </label>
              </div>
            </div>
            <div className='reports-table-toolbar'>
              <span>
                {groupBy === 'None'
                  ? 'Click a column header to sort the report'
                  : groupedCounts.map(([label, count]) => `${label}: ${count}`).join('   |   ')}
              </span>
              <div>
                <ReportActionButton
                  className='reports-export-button'
                  icon={Download}
                  onClick={() => downloadCsv(`${reportTitle}.csv`, sortedRows, visibleColumns, currency)}
                >
                  Export
                </ReportActionButton>
              </div>
            </div>

            {notice && <div className='reports-notice'>{notice}</div>}

            <div className='reports-table-area'>
              {isRunningReport ? (
                <div className='reports-loading-state' role='status' aria-live='polite'>
                  <span className='reports-loading-spinner' aria-hidden='true' />
                  <strong>Running report...</strong>
                </div>
              ) : isEmptyReportState ? (
                <div className='reports-empty-state'>
                  <div className='reports-empty-state__visual' aria-hidden='true'>
                    <FileSearch />
                  </div>
                  <div className='reports-empty-state__copy'>
                    <strong>{hasRunReport ? 'No matching sessions' : 'Build your report and view it here.'}</strong>
                    <p>
                      {hasRunReport
                        ? 'Try widening your date range, removing a filter, or switching the grouping.'
                        : 'Choose your filters and columns, then run the report to turn sessions into a clean review table.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className='reports-table-scroll'>
                  <table className='reports-table'>
                    <thead>
                      <tr>
                        {visibleColumns.map((column) => (
                          <th key={column.key}>
                            <button type='button' onClick={() => handleSort(column.key)}>
                              <span>{column.label}</span>
                              {sort.key === column.key ? (
                                <ChevronDown
                                  className={sort.direction === 'asc' ? 'reports-sort-asc' : ''}
                                  aria-hidden='true'
                                />
                              ) : (
                                <SlidersHorizontal aria-hidden='true' />
                              )}
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {groupKey
                        ? groupedVisibleRows.flatMap(([groupLabel, groupRows]) => [
                            <tr className='reports-group-row' key={`group-${groupLabel}`}>
                              <td colSpan={visibleColumns.length}>
                                <span>{groupBy}</span>
                                <strong>{groupLabel}</strong>
                                <em>
                                  {groupRows.length} session{groupRows.length === 1 ? '' : 's'}
                                </em>
                              </td>
                            </tr>,
                            ...groupRows.map((row, rowIndex) => (
                              <tr key={`${groupLabel}-${row.date}-${rowIndex}`}>
                                {visibleColumns.map((column) => {
                                  const isMoney = column.key === 'profit';
                                  const isRate = column.key === 'bb100';
                                  const cellNumber = Number(row[column.key]);

                                  return (
                                    <td
                                      className={
                                        isMoney || isRate
                                          ? cellNumber >= 0
                                            ? 'reports-positive'
                                            : 'reports-negative'
                                          : undefined
                                      }
                                      key={column.key}
                                    >
                                      {formatCell(row[column.key], column.type, currency)}
                                    </td>
                                  );
                                })}
                              </tr>
                            )),
                          ])
                        : visibleRows.map((row, rowIndex) => (
                            <tr key={`${row.date}-${rowIndex}`}>
                              {visibleColumns.map((column) => {
                                const isMoney = column.key === 'profit';
                                const isRate = column.key === 'bb100';
                                const cellNumber = Number(row[column.key]);

                                return (
                                  <td
                                    className={
                                      isMoney || isRate
                                        ? cellNumber >= 0
                                          ? 'reports-positive'
                                          : 'reports-negative'
                                        : undefined
                                    }
                                    key={column.key}
                                  >
                                    {formatCell(row[column.key], column.type, currency)}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                      {hasRunReport && !isRunningReport && (
                        <tr className='reports-total-row'>
                          {visibleColumns.map((column, index) => {
                            if (index === 0) return <td key={column.key}>Totals ({sortedRows.length} sessions)</td>;
                            if (column.key === 'hands')
                              return <td key={column.key}>{summary.hands.toLocaleString()}</td>;
                            if (column.key === 'profit')
                              return (
                                <td
                                  className={summary.profit >= 0 ? 'reports-positive' : 'reports-negative'}
                                  key={column.key}
                                >
                                  {formatCurrency(summary.profit, currency)}
                                </td>
                              );
                            if (column.key === 'bb100')
                              return (
                                <td
                                  className={summary.bb100 >= 0 ? 'reports-positive' : 'reports-negative'}
                                  key={column.key}
                                >
                                  {summary.bb100.toFixed(2)}
                                </td>
                              );
                            if (column.key === 'threeBet')
                              return <td key={column.key}>{formatNumber(summary.threeBet)}</td>;
                            if (column.key === 'foldToThreeBet')
                              return <td key={column.key}>{formatNumber(summary.foldToThreeBet)}</td>;
                            if (column.key === 'fourBet')
                              return <td key={column.key}>{formatNumber(summary.fourBet)}</td>;
                            if (column.key === 'foldToFourBet')
                              return <td key={column.key}>{formatNumber(summary.foldToFourBet)}</td>;
                            if (column.key === 'wtsd') return <td key={column.key}>{formatNumber(summary.wtsd)}</td>;
                            if (column.key === 'wsd') return <td key={column.key}>{formatNumber(summary.wsd)}</td>;
                            return <td key={column.key} />;
                          })}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <footer className='reports-table-footer'>
              <span />
              <div>
                <span>Rows per page:</span>
                <select
                  value={rowsPerPage}
                  onChange={(event) => {
                    setRowsPerPage(Number(event.target.value));
                    setPage(1);
                  }}
                >
                  {[10, 25, 50, 100].map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </select>
                <span>
                  {sortedRows.length ? firstRowIndex + 1 : 0}-{Math.min(firstRowIndex + rowsPerPage, sortedRows.length)}{' '}
                  of {sortedRows.length}
                </span>
                <button
                  type='button'
                  aria-label='Previous page'
                  disabled={currentPage === 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft aria-hidden='true' />
                </button>
                <button
                  type='button'
                  aria-label='Next page'
                  disabled={currentPage === totalPages}
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                >
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

export default ReportsPage;
