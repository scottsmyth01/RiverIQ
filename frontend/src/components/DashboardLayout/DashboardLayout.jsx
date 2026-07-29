import { Outlet } from 'react-router';
import Navbar from '../Navbar_dashboard/Navbar';
import Sidebar from '../Sidebar/Sidebar';
import './DashboardLayout.css';

const DashboardLayout = () => {
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
