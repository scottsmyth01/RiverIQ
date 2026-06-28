import Sidebar from '../components/Sidebar/Sidebar';
import './DashboardPage.css';
import Navbar from '../components/Navbar_dashboard/Navbar';
import StatCards from '../components/StatCards/StatCards';

const DashboardPage = () => {
  return (
    <main className='main-container'>
      <Navbar />
      <div className='dashboard-layout'>
        <Sidebar />
        <section className='dashboard-content'>
          <div className='stat-cards'>
            <StatCards />
          </div>
        </section>
      </div>
    </main>
  );
};

export default DashboardPage;
