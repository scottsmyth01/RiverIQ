import Card from '../Card/Card';
import { getStatCards } from './StatCardsData';
import { useAuth } from '../../hooks/useAuth';
import { getPreferredCurrency } from '../../utils/currency';
import './StatCards.css';

// PROPS
// sessions = filtered sessions for time period
// periods = time periods with availability
// selectedPeriod = currently selected period
// onPeriodChange =

const StatCards = ({ sessions = [], periods = [], selectedPeriod = 'all-time', setSelectedPeriod }) => {
  const { user } = useAuth();
  const currency = getPreferredCurrency(user);
  // This function will return the data needed to populate the cards
  const cards = getStatCards(sessions, currency);

  return (
    <section className='stat-cards'>
      <div className='stat-period-buttons'>
        {periods.map((period) => (
          <button
            type='button'
            className={selectedPeriod === period.id ? 'active' : ''}
            aria-pressed={selectedPeriod === period.id}
            disabled={!period.available}
            title={!period.available ? period.disabledReason || 'No sessions found for this period' : undefined}
            onClick={() => setSelectedPeriod?.(period.id)} //call setSelectedPeriod(period.id)
            key={period.id}
          >
            {/* period label is the title for the button */}
            {period.label}

            {/* if not available (< 2 sessions) then return N/A icon on button */}
            {!period.available && <span className='period-unavailable'>N/A</span>}
          </button>
        ))}
      </div>

      {/* iterate through the cards, which is just the array returned from line 13*/}
      <div className='stat-cards-grid'>
        {cards.map((card) => (
          <Card className={`stat-card stat-card--${card.id}`} key={card.id}>
            <div className='stat-card-copy'>
              <h3 className='stat-card-title'>{card.title}</h3>

              <h3 className='stat-card-value'>{card.formatValue(card.value)}</h3>
            </div>

            <div className='icon-background' style={{ '--stat-icon-color': card.iconColor }}>
              <div className='icon'>{card.icon}</div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default StatCards;
