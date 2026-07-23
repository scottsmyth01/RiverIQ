import { Outlet } from 'react-router';
import { useSessions } from '../../hooks/useSessions';
import LoadingScreen from '../LoadingScreen/LoadingScreen';
import Navbar from '../Navbar_dashboard/Navbar';
import Sidebar from '../Sidebar/Sidebar';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const { isLoading } = useSessions();

  return (
    <main className='main-container'>
      {isLoading && <LoadingScreen />}
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
