import React from 'react';
import './ProgressBar.css';

const ProgressBar = ({ range, value }) => {
  const progressWidth = `${Math.min((value / range) * 100, 100)}%`;

  return (
    <div className='progress-bar-container'>
      <div className='progress-bar' style={{ width: progressWidth }}></div>
    </div>
  );
};

export default ProgressBar;
