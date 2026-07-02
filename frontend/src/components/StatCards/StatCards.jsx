import Card from '../Card/Card';
import { getStatCards } from './StatCardsData';
import './StatCards.css';
import { useState } from 'react';

const StatCards = ({ sessions }) => {
  const cards = getStatCards(sessions);
  const [selectedPeriods, setSelectedPeriods] = useState({});

  return cards.map((card) => {
    const selectedPeriodId = selectedPeriods[card.title] || card.periods[0].id;
    const selectedPeriod = card.periods.find((period) => period.id === selectedPeriodId) || card.periods[0];

    return (
      <Card key={card.title}>
        <h3 className='stat-card-title'>{card.title}</h3>
        <h3 className='stat-card-value' key={`${card.title}-${selectedPeriodId}`}>
          {card.formatValue(selectedPeriod.value)}
        </h3>
        <div className='icon-background' style={{ backgroundColor: card.iconBackground }}>
          <div className='icon' style={{ color: card.iconColor }}>
            {card.icon}
          </div>
        </div>
        <div className='stat-period-buttons' aria-label={`${card.title} period`}>
          {card.periods.map((period) => (
            <button
              className={selectedPeriodId === period.id ? 'active' : ''}
              type='button'
              aria-pressed={selectedPeriodId === period.id}
              onClick={() =>
                setSelectedPeriods((currentPeriods) => ({
                  ...currentPeriods,
                  [card.title]: period.id,
                }))
              }
              key={period.id}
            >
              {period.label}
            </button>
          ))}
        </div>
      </Card>
    );
  });
};

export default StatCards;
