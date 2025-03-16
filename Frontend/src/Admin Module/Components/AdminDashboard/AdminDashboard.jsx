import { useState, useEffect } from 'react';
import { 
  FaUniversity, 
  FaUserGraduate, 
  FaCheckCircle,
  FaClock
} from 'react-icons/fa';
import Sidebar from '../Sidebar/Sidebar';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalColleges: 0,
    totalStudents: 0,
    pendingVerifications: 0,
    verifiedColleges: 0,
    recentActivities: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/dashboard-stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setStats({
          totalColleges: data.totalColleges || 0,
          totalStudents: data.totalStudents || 0,
          pendingVerifications: data.pendingVerifications || 0,
          verifiedColleges: data.verifiedColleges || 0,
          recentActivities: data.recentActivities || []
        });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setLoading(false);
    }
  };

  return (
    <div className="admin-dashboard-layout">
      <Sidebar />
      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1>Admin Dashboard</h1>
          <p>Welcome back, {JSON.parse(localStorage.getItem('user'))?.name || 'Admin'}</p>
        </div>

        {loading ? (
          <div className="loading">Loading dashboard data...</div>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card total-colleges">
                <div className="stat-icon">
                  <FaUniversity />
                </div>
                <div className="stat-details">
                  <h3>Total Colleges</h3>
                  <p>{stats.totalColleges}</p>
                </div>
              </div>

              <div className="stat-card total-students">
                <div className="stat-icon">
                  <FaUserGraduate />
                </div>
                <div className="stat-details">
                  <h3>Total Students</h3>
                  <p>{stats.totalStudents}</p>
                </div>
              </div>

              <div className="stat-card verified-colleges">
                <div className="stat-icon">
                  <FaCheckCircle />
                </div>
                <div className="stat-details">
                  <h3>Verified Colleges</h3>
                  <p>{stats.verifiedColleges}</p>
                </div>
              </div>

              <div className="stat-card pending-verifications">
                <div className="stat-icon">
                  <FaClock />
                </div>
                <div className="stat-details">
                  <h3>Pending Verifications</h3>
                  <p>{stats.pendingVerifications}</p>
                </div>
              </div>
            </div>

            <div className="dashboard-sections">
              <div className="section recent-activities">
                <h2>Recent Activities</h2>
                {stats.recentActivities.length > 0 ? (
                  <div className="activities-list">
                    {stats.recentActivities.map((activity, index) => (
                      <div key={index} className="activity-item">
                        <div className="activity-icon">
                          {activity.type === 'college' ? <FaUniversity /> : <FaUserGraduate />}
                        </div>
                        <div className="activity-details">
                          <h4>{activity.title}</h4>
                          <p>{activity.description}</p>
                          <span className="activity-time">
                            {new Date(activity.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-activities">No recent activities</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard; 