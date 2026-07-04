import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet } from 'react-router';
import Navbar from '../Navbar_dashboard/Navbar';
import Sidebar from '../Sidebar/Sidebar';
import { fetchSessions, selectSessionsStatus } from '../../store/sessionSlice';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const dispatch = useDispatch();
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
        <Outlet />
      </div>
    </main>
  );
};

export default DashboardLayout;
