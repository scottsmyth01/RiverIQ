import { ChevronDown } from 'lucide-react';

const SessionToolbar = ({ dateRange, setDateRange, sortBy, setSortBy, tableSize, setTableSize, finish, setFinish }) => {
  return (
    <div className='sessions-toolbar' aria-label='Session table controls'>
      <div className='sessions-filter-group'>
        <label>
          <span>Date</span>
          <span className='sessions-select-shell'>
            <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
              <option value='all-time'>All Time</option>
              <option value='past-7'>Past 7 Days</option>
              <option value='past-30'>Past 30 Days</option>
              <option value='past-90'>Past 90 Days</option>
            </select>
            <ChevronDown aria-hidden='true' />
          </span>
        </label>
        <label>
          <span>Sort</span>
          <span className='sessions-select-shell'>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value='newest'>Newest first</option>
              <option value='oldest'>Oldest first</option>
              <option value='profit-high'>Profit high to low</option>
              <option value='profit-low'>Profit low to high</option>
              <option value='duration'>Longest Duration</option>
            </select>
            <ChevronDown aria-hidden='true' />
          </span>
        </label>

        <label>
          <span>Table Size</span>
          <span className='sessions-select-shell'>
            <select value={tableSize} onChange={(e) => setTableSize(e.target.value)}>
              <option value='all'>All Table Sizes</option>
              <option value='6-Max'>6-Max</option>
              <option value='7-Max'>7-Max</option>
              <option value='8-Max'>8-Max</option>
              <option value='9-Max'>9-Max</option>
            </select>
            <ChevronDown aria-hidden='true' />
          </span>
        </label>

        <label>
          <span>Result</span>
          <span className='sessions-select-shell'>
            <select value={finish} onChange={(e) => setFinish(e.target.value)}>
              <option value='all'>All results</option>
              <option value='winning'>Winning sessions</option>
              <option value='losing'>Losing sessions</option>
              <option value='breakeven'>Breakeven</option>
            </select>
            <ChevronDown aria-hidden='true' />
          </span>
        </label>
      </div>
    </div>
  );
};

export default SessionToolbar;
