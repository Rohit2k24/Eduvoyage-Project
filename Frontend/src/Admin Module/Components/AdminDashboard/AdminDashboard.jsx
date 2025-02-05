import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [adminData, setAdminData] = useState({
    totalStudents: 0,
    totalColleges: 0,
    pendingVerifications: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in and is admin
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');

    if (!token || userRole !== 'admin') {
      navigate('/login');
      return;
    }

    // Fetch admin dashboard data
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/admin/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setAdminData(data);
        } else {
          throw new Error('Failed to fetch dashboard data');
        }
      } catch (error) {
        console.error('Dashboard error:', error);
      }
    };

    fetchDashboardData();
  }, [navigate]);

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
      </div>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <h3>Total Students</h3>
          <p>{adminData.totalStudents}</p>
        </div>
        <div className="stat-card">
          <h3>Total Colleges</h3>
          <p>{adminData.totalColleges}</p>
        </div>
        <div className="stat-card">
          <h3>Pending Verifications</h3>
          <p>{adminData.pendingVerifications}</p>
        </div>
      </div>

      {/* Add more admin features here */}
    </div>
  );
};

export default AdminDashboard; 