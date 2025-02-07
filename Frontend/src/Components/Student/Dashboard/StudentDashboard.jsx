import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGraduationCap, FaClipboardList, FaBell, FaSignOutAlt } from 'react-icons/fa';
import StudentSidebar from './StudentSidebar';
import Swal from 'sweetalert2';
import './StudentDashboard.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    applicationStats: {},
    recentApplications: [],
    unreadNotifications: 0,
    recommendedCourses: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching dashboard data...'); // Debug log
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Using token:', token); // Debug log

      const response = await fetch(`${API_URL}/api/student/dashboard`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Response status:', response.status); // Debug log

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData); // Debug log
        throw new Error(errorData.message || 'Failed to fetch dashboard data');
      }

      const data = await response.json();
      console.log('Dashboard data received:', data); // Debug log

      if (data.success) {
        setDashboardData(data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to load dashboard data. Please try again later.',
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

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'orange';
      case 'approved': return 'green';
      case 'rejected': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="student-dashboard-layout">
      <StudentSidebar />
      
      <div className="student-dashboard-main">
        <div className="dashboard-header">
          <h1>Student Dashboard</h1>
          <button onClick={handleLogout} className="logout-button">
            <FaSignOutAlt />
            Logout
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading dashboard...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="dashboard-stats">
              <div className="stat-card">
                <FaClipboardList className="stat-icon" />
                <div className="stat-info">
                  <h3>Total Applications</h3>
                  <p>{Object.values(dashboardData.applicationStats).reduce((a, b) => a + b, 0)}</p>
                </div>
              </div>
              <div className="stat-card">
                <FaGraduationCap className="stat-icon" />
                <div className="stat-info">
                  <h3>Approved Applications</h3>
                  <p>{dashboardData.applicationStats.approved || 0}</p>
                </div>
              </div>
              <div className="stat-card">
                <FaBell className="stat-icon" />
                <div className="stat-info">
                  <h3>Unread Notifications</h3>
                  <p>{dashboardData.unreadNotifications}</p>
                </div>
              </div>
            </div>

            <section className="recent-applications">
              <h2>Recent Applications</h2>
              {dashboardData.recentApplications.length === 0 ? (
                <p>No recent applications</p>
              ) : (
                <div className="applications-grid">
                  {dashboardData.recentApplications.map(app => (
                    <div key={app._id} className="application-card">
                      <h3>{app.course.name}</h3>
                      <p>{app.course.college.name}</p>
                      <span className={`status ${app.status}`}>{app.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="recommended-courses">
              <h2>Recommended Courses</h2>
              {dashboardData.recommendedCourses.length === 0 ? (
                <p>No recommendations available</p>
              ) : (
                <div className="courses-grid">
                  {dashboardData.recommendedCourses.map(course => (
                    <div key={course._id} className="course-card">
                      <h3>{course.name}</h3>
                      <p>{course.college.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard; 