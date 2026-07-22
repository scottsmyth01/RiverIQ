import { useIsMutating } from '@tanstack/react-query';
import { Outlet } from 'react-router';
import { useSessions, sessionsQueryKey } from '../../hooks/useSessions';
import LoadingScreen from '../LoadingScreen/LoadingScreen';
import Navbar from '../Navbar_dashboard/Navbar';
import Sidebar from '../Sidebar/Sidebar';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const { isLoading } = useSessions();
  const sessionsMutating = useIsMutating({ mutationKey: sessionsQueryKey }) > 0;

  return (
    <main className='main-container'>
      {(isLoading || sessionsMutating) && <LoadingScreen />}
      <Navbar />
      <div className='dashboard-layout'>
        <Sidebar />
        <div className='dashboard-layout__content'>
          <Outlet />
        </div>
      </div>
    </main>
  );
};

export default DashboardLayout;
