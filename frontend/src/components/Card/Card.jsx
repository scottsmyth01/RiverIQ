import React from 'react';
import './Card.css';

const Card = ({ children, className = '' }) => {
  return <article className={`card-container${className ? ` ${className}` : ''}`}>{children}</article>;
};

export default Card;
