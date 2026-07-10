import { useState } from 'react';
import Card from '../Card/Card';
import { getStatCards } from './StatCardsData';
import { filterSessions } from '../../utils/filterSessions';
import './StatCards.css';

const StatCards = ({ sessions = [] }) => {
  const [period, setPeriod] = useState('all-time');

  const filteredSessions = filterSessions(sessions, period);

  const cards = getStatCards(filteredSessions);

  return (
    <section className='stat-cards'>
      <div className='stat-period-buttons'>
        <button type='button' className={period === 'all-time' ? 'active' : ''} onClick={() => setPeriod('all-time')}>
          All Time
        </button>

        <button type='button' className={period === 'monthly' ? 'active' : ''} onClick={() => setPeriod('monthly')}>
          Monthly
        </button>

        <button type='button' className={period === 'weekly' ? 'active' : ''} onClick={() => setPeriod('weekly')}>
          Weekly
        </button>
      </div>

      <div className='stat-cards-grid'>
        {cards.map((card) => (
          <Card key={card.title}>
            <div className='stat-card-copy'>
              <h3 className='stat-card-title'>{card.title}</h3>

              <h3 className='stat-card-value'>{card.formatValue(card.value)}</h3>
            </div>

            <div className='icon-background' style={{ backgroundColor: card.iconBackground }}>
              <div className='icon' style={{ color: card.iconColor }}>
                {card.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default StatCards;
