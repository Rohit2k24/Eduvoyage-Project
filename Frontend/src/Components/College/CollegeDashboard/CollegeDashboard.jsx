import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FaGraduationCap, 
  FaUsers, 
  FaClipboardList, 
  FaChartLine, 
  FaPlus, 
  FaRedo, 
  FaBell, 
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle
} from 'react-icons/fa';
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

  useEffect(() => {
    checkCollegeStatus();
    fetchNotifications();

    // Set up auto-refresh interval
    const refreshInterval = setInterval(() => {
      fetchDashboardStats();
      fetchNotifications();
    }, 300000); // Refresh every 5 minutes

    return () => clearInterval(refreshInterval);
  }, []);

  const checkCollegeStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/college/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch college status');
      }

      const data = await response.json();
      
      if (data.success) {
        const { verificationStatus, paymentStatus } = data.status;

        if (verificationStatus === 'pending') {
          navigate('/college/verification-status');
          return;
        }

        if (verificationStatus === 'rejected') {
          Swal.fire({
            icon: 'error',
            title: 'Verification Rejected',
            text: data.status.rejectionReason || 'Your college verification was rejected. Please contact support.',
            confirmButtonText: 'View Details'
          }).then(() => {
            navigate('/college/verification-status');
          });
          return;
        }

        if (verificationStatus === 'approved' && paymentStatus === 'pending') {
          navigate('/college/verification-status');
          return;
        }

        if (verificationStatus === 'approved' && paymentStatus === 'completed') {
          fetchDashboardStats();
        }
      }
    } catch (error) {
      console.error('Error checking college status:', error);
      setError('Failed to verify college status');
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/college/dashboard-stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard statistics');
      }

      const result = await response.json();
      console.log('Dashboard stats response:', result); // Debug log

      if (result.success && result.data) {
        const data = result.data;
        setStats({
          totalCourses: parseInt(data.totalCourses) || 0,
          totalStudents: parseInt(data.totalStudents) || 0,
          pendingApplications: parseInt(data.pendingApplications) || 0,
          recentApplications: Array.isArray(data.recentApplications) ? data.recentApplications : [],
          monthlyGrowthRate: calculateGrowthRate(
            parseInt(data.currentMonthStudents) || 0,
            parseInt(data.lastMonthStudents) || 0
          )
        });
      } else {
        throw new Error(result.message || 'Failed to fetch statistics');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError(error.message);
      setStats({
        totalCourses: 0,
        totalStudents: 0,
        pendingApplications: 0,
        recentApplications: [],
        monthlyGrowthRate: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateGrowthRate = (currentMonth, lastMonth) => {
    currentMonth = parseInt(currentMonth) || 0;
    lastMonth = parseInt(lastMonth) || 0;

    if (lastMonth === 0) {
      return currentMonth > 0 ? 100 : 0;
    }
    return ((currentMonth - lastMonth) / lastMonth * 100).toFixed(1);
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/college/notifications`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      
      if (data.success) {
        // Ensure notifications exist and is an array before using slice
        const notificationsList = Array.isArray(data.notifications) ? data.notifications : [];
        const latestNotifications = notificationsList.slice(0, 5);
        setNotifications(latestNotifications);
        setUnreadCount(notificationsList.filter(n => !n.isRead).length);
      } else {
        throw new Error(data.message || 'Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Set empty arrays when there's an error
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <FaCheckCircle className="status-icon approved" />;
      case 'rejected':
        return <FaTimesCircle className="status-icon rejected" />;
      default:
        return <FaClipboardList className="status-icon pending" />;
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
          <button onClick={checkCollegeStatus} className="retry-btn">
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
          <div className="date-display">
            <FaCalendarAlt />
            <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
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
              <Link to="/college/courses" className="stat-link">View Courses</Link>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon students">
              <FaUsers />
            </div>
            <div className="stat-details">
              <h3>Total Students</h3>
              <p>{stats.totalStudents}</p>
              <Link to="/college/students" className="stat-link">View Students</Link>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon applications">
              <FaClipboardList />
            </div>
            <div className="stat-details">
              <h3>Pending Applications</h3>
              <p>{stats.pendingApplications}</p>
              <Link to="/college/applications" className="stat-link">View Applications</Link>
            </div>
          </div>

          <div className="stat-card">
            <div className={`stat-icon growth ${parseFloat(stats.monthlyGrowthRate) >= 0 ? 'positive' : 'negative'}`}>
              <FaChartLine />
            </div>
            <div className="stat-details">
              <h3>Monthly Growth</h3>
              <p className={parseFloat(stats.monthlyGrowthRate) >= 0 ? 'positive' : 'negative'}>
                {stats.monthlyGrowthRate}%
              </p>
              <span className="growth-label">From last month</span>
            </div>
          </div>
        </div>

        <div className="dashboard-sections">
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

          <div className="recent-applications">
            <h2>Recent Applications</h2>
            {stats.recentApplications.length > 0 ? (
              <div className="applications-list">
                {stats.recentApplications.map((app, index) => (
                  <div key={index} className="application-item">
                    <div className="applicant-info">
                      <div className="applicant-header">
                        {getStatusIcon(app.status)}
                        <h3>{app.student?.name}</h3>
                      </div>
                      <p>{app.course?.name}</p>
                      <span className="application-date">{formatDate(app.createdAt)}</span>
                    </div>
                    <span className={`status ${app.status.toLowerCase()}`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">
                <p>No recent applications</p>
              </div>
            )}
          </div>

          <div className="notifications-preview">
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
                notifications.map((notification, index) => (
                  <div 
                    key={index}
                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  >
                    <h4>{notification.title}</h4>
                    <p>{notification.message}</p>
                    <span className="time">{formatDate(notification.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollegeDashboard; 