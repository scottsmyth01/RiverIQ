import React from 'react';
import { ClipboardCheck, Flag, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './NewUserPage.css';
import ProgressBar from '../components/ProgressBar/ProgressBar';
import { useSelector } from 'react-redux';
import { selectSessions } from '../store/sessionSlice';
import { useNavigate } from 'react-router-dom';

export const NewUserPage = () => {
  const { user } = useAuth();
  const sessions = useSelector(selectSessions);
  const navigate = useNavigate();

  let message;
  if (sessions.length < 2) {
    message = 'Upload your first session!';
  }
  if (sessions.length === 2 || sessions.length === 3) {
    message = 'Keep going!';
  }
  if (sessions.length === 4) {
    message = 'Almost there!';
  }

  return (
    <section className='prompt-container'>
      <h2>Dashboard</h2>
      <p>Welcome back {user.username}! Let's get you some data to work with. </p>
      <div className='main-content'>
        <div className='dashboard-onboarding-visual'>
          <img src='../../public/clipboard-graph.png' alt='' />
        </div>
        <div className='prompt'>
          <h3>{message}</h3>
          <p>Add at least 5 sessions to unlock your graphs and insights.</p>
          <p>{sessions.length}/5 sessions added</p>
          <ProgressBar range='5' />
          <button className='new-user-add-session' type='button' onClick={() => navigate('/dashboard/sessions/new')}>
            Add New Session
          </button>
        </div>
      </div>
    </section>
  );
};
