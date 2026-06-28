import Card from '../Card/Card';
import { useSessions } from '../../context/SessionContext';
import { getStatCards } from './StatCardsData';
import './StatCards.css';
import { useState } from 'react';

const StatCards = () => {
  const { sessions, loading } = useSessions();
  const cards = getStatCards(sessions || []);

  function handleChange(e) {
    console.log(e.target.value);
  }

  return cards.map((card) => {
    return (
      <Card key={card.title}>
        <h3 className='stat-card-title'>{card.title}</h3>
        <h3 className='stat-card-value'>{card.value}</h3>
        <div className='icon-background' style={{ backgroundColor: card.iconBackground }}>
          <div className='icon' style={{ color: card.iconColor }}>
            {card.icon}
          </div>
        </div>
        <br />
        <select className='dropdown' name='' id='' onChange={handleChange}>
          <option value='all-time'>All Time</option>
          <option value='last-month'>Last Month</option>
          <option value='last-week'>Last Week</option>
        </select>
      </Card>
    );
  });
};

export default StatCards;
