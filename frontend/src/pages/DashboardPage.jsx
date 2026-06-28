import Sidebar from '../components/Sidebar/Sidebar';
import './DashboardPage.css';
import Navbar from '../components/Navbar_dashboard/Navbar';

const DashboardPage = () => {
  return (
    <main className='main-container'>
      <Navbar />
      <div className='dashboard-layout'>
        <Sidebar />
        <section className='dashboard-content'>
          <div className='stat-cards'>
            <div>STAT_CARD 1</div>
            <div>STAT_CARD 2</div>
            <div>STAT_CARD 3</div>
            <div>STAT_CARD 4</div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default DashboardPage;
