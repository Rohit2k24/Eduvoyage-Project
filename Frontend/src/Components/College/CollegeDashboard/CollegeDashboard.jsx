import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGraduationCap, FaBook, FaUsers, FaSignOutAlt } from 'react-icons/fa';
import CollegeSidebar from './CollegeSidebar';
import Swal from 'sweetalert2';
import './CollegeDashboard.css';

const CollegeDashboard = () => {
  const [dashboardStats, setDashboardStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    recentApplications: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3000/api/college/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }

      const data = await response.json();
      if (data.success) {
        setDashboardStats(data.stats);
      } else {
        throw new Error(data.message || 'Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError(error.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load dashboard statistics',
        confirmButtonColor: '#3498db'
      });
    } finally {
      setLoading(false);
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
    <div className="college-dashboard-layout">
      <CollegeSidebar />
      
      <div className="college-dashboard-main">
        <div className="dashboard-header">
          <h1>College Dashboard</h1>
          <button onClick={handleLogout} className="logout-button">
            <FaSignOutAlt />
            Logout
          </button>
        </div>

        {loading ? (
          <div className="dashboard-loading">
            <div className="spinner"></div>
            <p>Loading dashboard stats...</p>
          </div>
        ) : error ? (
          <div className="dashboard-error">
            <p>{error}</p>
            <button onClick={fetchDashboardStats} className="retry-btn">
              Retry
            </button>
          </div>
        ) : (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon courses">
                <FaBook />
              </div>
              <div className="stat-info">
                <h3>Total Courses</h3>
                <p>{dashboardStats.totalCourses}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon students">
                <FaUsers />
              </div>
              <div className="stat-info">
                <h3>Active Students</h3>
                <p>{dashboardStats.totalStudents}</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon applications">
                <FaGraduationCap />
              </div>
              <div className="stat-info">
                <h3>Recent Applications</h3>
                <p>{dashboardStats.recentApplications}</p>
              </div>
            </div>
          </div>
        )}

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button onClick={() => navigate('/college/courses/add')} className="action-btn">
              <FaBook /> Add New Course
            </button>
            <button onClick={() => navigate('/college/students')} className="action-btn">
              <FaUsers /> View Students
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeDashboard; 