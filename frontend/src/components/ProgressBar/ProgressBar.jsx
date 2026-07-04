import React from 'react';
import './ProgressBar.css';
import { useSelector } from 'react-redux';
import { selectSessions } from '../../store/sessionSlice';

const ProgressBar = ({ range }) => {
  const sessions = useSelector(selectSessions);
  const progressWidth = (sessions.length / range) * 100 + '%';
  console.log(progressWidth);

  return (
    <div className='progress-bar-container'>
      <div className='progress-bar' style={{ width: progressWidth }}></div>
    </div>
  );
};

export default ProgressBar;
