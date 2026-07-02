import Sidebar from '../components/Sidebar/Sidebar';
import './DashboardPage.css';
import Navbar from '../components/Navbar_dashboard/Navbar';
import StatCards from '../components/StatCards/StatCards';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSessions, selectSessions, selectSessionsStatus } from '../store/sessionSlice';
import { useEffect } from 'react';
import ProfitChart from '../components/ProfitChart/ProfitChart';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const sessions = useSelector(selectSessions);
  const sessionsStatus = useSelector(selectSessionsStatus);

  useEffect(() => {
    if (sessionsStatus === 'idle') {
      dispatch(fetchSessions());
    }
  }, [dispatch, sessionsStatus]);

  return (
    <main className='main-container'>
      <Navbar />
      <div className='dashboard-layout'>
        <Sidebar />
        <section className='dashboard-content'>
          <div className='stat-cards'>
            <StatCards sessions={sessions} />
          </div>
          <ProfitChart sessions={sessions} />
        </section>
      </div>
    </main>
  );
};

export default DashboardPage;
