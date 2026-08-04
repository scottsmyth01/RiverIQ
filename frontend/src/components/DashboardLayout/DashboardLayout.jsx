import { Outlet } from 'react-router';
import LoadingScreen from '../LoadingScreen/LoadingScreen';
import Navbar from '../Navbar_dashboard/Navbar';
import Sidebar from '../Sidebar/Sidebar';
import { useSessions } from '../../hooks/useSessions';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const { isPending: isSessionsPending } = useSessions();

  if (isSessionsPending) {
    return <LoadingScreen />;
  }

  return (
    <main className='main-container'>
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
