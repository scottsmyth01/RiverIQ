import { Search, SlidersHorizontal } from 'lucide-react';

const SessionToolbar = ({ filter, setFilter }) => {
  return (
    <div className='sessions-toolbar' aria-label='Session table controls'>
      <div className='sessions-filter-group'>
        <label>
          <span>Sort</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value='newest'>Newest first</option>
            <option value='oldest'>Oldest first</option>
            <option value='profit-high'>Profit high to low</option>
            <option value='profit-low'>Profit low to high</option>
            <option value='duration'>Longest duration</option>
          </select>
        </label>

        <label>
          <span>Date</span>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value='all-dates'>All dates</option>
            <option value='week'>This week</option>
            <option value='month'>This month</option>
            <option value='year'>This year</option>
          </select>
        </label>

        <label>
          <span>Game</span>
          <select defaultValue='all'>
            <option value='all'>All games</option>
            <option value='cash'>Cash</option>
            <option value='tournament'>Tournament</option>
            <option value='sit-go'>Sit & Go</option>
          </select>
        </label>

        <label>
          <span>Result</span>
          <select defaultValue='all'>
            <option value='all'>All results</option>
            <option value='winning'>Winning sessions</option>
            <option value='losing'>Losing sessions</option>
            <option value='breakeven'>Breakeven</option>
          </select>
        </label>
      </div>
    </div>
  );
};

export default SessionToolbar;
