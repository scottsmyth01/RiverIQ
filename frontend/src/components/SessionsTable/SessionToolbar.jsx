const SessionToolbar = ({ dateRange, setDateRange, sortBy, setSortBy, numTables, setNumTables, finish, setFinish }) => {
  return (
    <div className='sessions-toolbar' aria-label='Session table controls'>
      <div className='sessions-filter-group'>
        <label>
          <span>Date</span>
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)}>
            <option value='all'>All dates</option>
            <option value='week'>This week</option>
            <option value='month'>This month</option>
            <option value='year'>This year</option>
          </select>
        </label>
        <label>
          <span>Sort</span>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value='newest'>Newest first</option>
            <option value='oldest'>Oldest first</option>
            <option value='profit-high'>Profit high to low</option>
            <option value='profit-low'>Profit low to high</option>
            <option value='duration'>Longest Duration</option>
          </select>
        </label>

        <label>
          <span># Tables</span>
          <select value={numTables} onChange={(e) => setNumTables(e.target.value)}>
            <option value='all'>All</option>
            <option value='one'>1</option>
            <option value='two'>2</option>
            <option value='three'>3</option>
            <option value='four'>4</option>
            <option value='five-or-more'>5+</option>
          </select>
        </label>

        <label>
          <span>Result</span>
          <select value={finish} onChange={(e) => setFinish(e.target.value)}>
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
