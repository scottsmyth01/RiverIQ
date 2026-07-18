import Card from '../Card/Card';
import { getStatCards } from './StatCardsData';
import './StatCards.css';

const StatCards = ({ sessions = [], periods = [], selectedPeriod = 'all-time', onPeriodChange }) => {
  const cards = getStatCards(sessions);

  return (
    <section className='stat-cards'>
      <div className='stat-period-buttons'>
        {periods.map((period) => (
          <button
            type='button'
            className={selectedPeriod === period.id ? 'active' : ''}
            aria-pressed={selectedPeriod === period.id}
            disabled={!period.available}
            title={!period.available ? 'No sessions found for this period' : undefined}
            onClick={() => onPeriodChange?.(period.id)}
            key={period.id}
          >
            {period.label}
            {!period.available && <span className='period-unavailable'>N/A</span>}
          </button>
        ))}
      </div>

      <div className='stat-cards-grid'>
        {cards.map((card) => (
          <Card key={card.title}>
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
