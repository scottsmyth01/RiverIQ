import React from 'react';
import { useAuth } from '../hooks/useAuth';
import './NewUserPage.css';
import ProgressBar from '../components/ProgressBar/ProgressBar';
import { Link, useNavigate } from 'react-router';

export const NewUserPage = ({ sessions }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <section className='prompt-container'>
      <h2>Dashboard</h2>
      <p>Welcome back {user.username}! Let's get you some data to work with. </p>
      <div className='main-content'>
        <div className='dashboard-onboarding-visual'>
          <img src='../../public/clipboard-graph.png' alt='' />
        </div>
        {sessions.length === 0 && (
          <div className='prompt'>
            <Link className='import-help-button' to='/dashboard/help#hand-history-uploads'>
              Need help with importing your hands?
            </Link>
            <h3>Upload your first session!</h3>
            <p>Add 1 session to unlock the sessions page.</p>
            <p>{sessions.length}/1 sessions added</p>
            <ProgressBar range={1} value={sessions.length} />
            <button className='new-user-add-session' type='button' onClick={() => navigate('/dashboard/sessions/new')}>
              Add New Session
            </button>
          </div>
        )}
        {sessions.length > 0 && (
          <div className='prompt'>
            <h3>Upload your next session!</h3>
            <p>Add at least 3 sessions to unlock your dashboard!</p>
            <p>{sessions.length}/3 sessions added</p>
            <ProgressBar range={3} value={sessions.length} />
            <button className='new-user-add-session' type='button' onClick={() => navigate('/dashboard/sessions/new')}>
              Add New Session
            </button>
          </div>
        )}
      </div>
    </section>
  );
};
