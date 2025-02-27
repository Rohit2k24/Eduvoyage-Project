import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaGraduationCap, FaUsers, FaClipboardList, FaChartLine, FaPlus, FaRedo, FaBell } from 'react-icons/fa';
import CollegeSidebar from './CollegeSidebar';
import Swal from 'sweetalert2';
import './CollegeDashboard.css';

const CollegeDashboard = () => {
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    pendingApplications: 0,
    recentApplications: [],
    monthlyGrowthRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:3000/api/college/dashboard-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard statistics');
      }

      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      } else {
        throw new Error(data.message || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(error.message);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load dashboard statistics'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/college/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        // Get only the latest 5 notifications
        const latestNotifications = data.data.slice(0, 5);
        setNotifications(latestNotifications);
        // Count unread notifications
        setUnreadCount(data.data.filter(n => !n.isRead).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  if (loading) {
    return (
      <div className="college-dashboard-layout">
        <CollegeSidebar />
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Loading dashboard statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="college-dashboard-layout">
        <CollegeSidebar />
        <div className="dashboard-error">
          <h2>Error loading dashboard</h2>
          <p>{error}</p>
          <button onClick={fetchDashboardStats} className="retry-btn">
            <FaRedo /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="college-dashboard-layout">
      <CollegeSidebar />
      <div className="college-dashboard-main">
        <div className="dashboard-header">
          <div className="welcome-section">
            <h1>Welcome Back!</h1>
            <p>Here's what's happening with your college today.</p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon courses">
              <FaGraduationCap />
            </div>
            <div className="stat-details">
              <h3>Total Courses</h3>
              <p>{stats.totalCourses}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon students">
              <FaUsers />
            </div>
            <div className="stat-details">
              <h3>Total Students</h3>
              <p>{stats.totalStudents}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon applications">
              <FaClipboardList />
            </div>
            <div className="stat-details">
              <h3>Pending Applications</h3>
              <p>{stats.pendingApplications}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon growth">
              <FaChartLine />
            </div>
            <div className="stat-details">
              <h3>Monthly Growth</h3>
              <p>{stats.monthlyGrowthRate}%</p>
            </div>
          </div>
        </div>

        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button onClick={() => navigate('/college/courses/add')} className="action-btn">
              <FaPlus /> Add New Course
            </button>
            <button onClick={() => navigate('/college/applications')} className="action-btn">
              <FaClipboardList /> View Applications
            </button>
          </div>
        </div>

        {stats.recentApplications.length > 0 && (
          <div className="recent-applications">
            <h2>Recent Applications</h2>
            <div className="applications-list">
              {stats.recentApplications.map((app, index) => (
                <div key={index} className="application-item">
                  <div className="applicant-info">
                    <h3>{app.student.name}</h3>
                    <p>{app.course.name}</p>
                  </div>
                  <span className={`status ${app.status}`}>{app.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="dashboard-section notifications-preview">
          <div className="section-header">
            <h2>
              <FaBell className="icon" />
              Recent Notifications
              {unreadCount > 0 && <span className="unread-count">{unreadCount}</span>}
            </h2>
            <Link to="/college/notifications" className="view-all">View All</Link>
          </div>
          <div className="notifications-list">
            {notifications.length === 0 ? (
              <p className="no-data">No new notifications</p>
            ) : (
              notifications.map(notification => (
                <div 
                  key={notification._id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                >
                  <h4>{notification.title}</h4>
                  <p>{notification.message}</p>
                  <span className="time">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeDashboard; 