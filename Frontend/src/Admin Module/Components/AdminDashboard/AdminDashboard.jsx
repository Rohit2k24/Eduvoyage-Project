import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaUniversity, FaClipboardCheck, FaSignOutAlt } from 'react-icons/fa';
import Sidebar from '../Sidebar/Sidebar';
import Swal from 'sweetalert2';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [adminData, setAdminData] = useState({
    totalStudents: 0,
    totalColleges: 0,
    pendingVerifications: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    
    Swal.fire({
      icon: 'success',
      title: 'Logged Out Successfully',
      text: 'Thank you for using EduVoyage!',
      confirmButtonColor: '#3498db',
      timer: 1500,
      showConfirmButton: false
    }).then(() => {
      navigate('/login');
    });
  };

  return (
    <div className="admin-layout">
      <Sidebar />
      
      <div className="admin-main">
        <div className="admin-header">
          <h1>Dashboard Overview</h1>
          <button onClick={handleLogout} className="logout-button">
            <FaSignOutAlt />
            Logout
          </button>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon students">
              <FaUsers />
            </div>
            <div className="stat-info">
              <h3>Total Students</h3>
              <p>{adminData.totalStudents}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon colleges">
              <FaUniversity />
            </div>
            <div className="stat-info">
              <h3>Total Colleges</h3>
              <p>{adminData.totalColleges}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon pending">
              <FaClipboardCheck />
            </div>
            <div className="stat-info">
              <h3>Pending Verifications</h3>
              <p>{adminData.pendingVerifications}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="quick-actions">
            <h2>Quick Actions</h2>
            <div className="action-buttons">
              <button onClick={() => navigate('/admin/colleges')} className="action-btn">
                <FaUniversity />
                Manage Colleges
              </button>
              <button onClick={() => navigate('/admin/students')} className="action-btn">
                <FaUsers />
                Manage Students
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 