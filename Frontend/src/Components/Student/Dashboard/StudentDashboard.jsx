import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaGraduationCap, 
  FaUniversity, 
  FaBell, 
  FaUser, 
  FaCog,
  FaChartLine,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaArrowRight,
  FaBookOpen,
  FaAward,
  FaTimesCircle,
  FaSpinner
} from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import StudentSidebar from '../Sidebar/StudentSidebar';
import Swal from 'sweetalert2';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      paid: 0
    },
    recentApplications: [],
    deadlines: [],
    recommendedColleges: [],
    unreadNotifications: 0,
    studentName: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Student';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/student/dashboard`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const result = await response.json();
      setDashboardData({
        ...result.data,
        studentName: result.data.studentName || localStorage.getItem('name') || 'Student'
      });
      setError(null);
    } catch (error) {
      console.error('Dashboard error:', error);
      setError('Failed to load dashboard data');
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load dashboard data',
        confirmButtonColor: '#3498db'
      });
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Explore Colleges',
      icon: <FaUniversity />,
      path: '/student/colleges',
      color: 'var(--gradient-blue)'
    },
    {
      title: 'My Applications',
      icon: <FaGraduationCap />,
      path: '/student/applications',
      color: 'var(--gradient-green)'
    },
    {
      title: `Notifications ${dashboardData.unreadNotifications > 0 ? `(${dashboardData.unreadNotifications})` : ''}`,
      icon: <FaBell />,
      path: '/student/notifications',
      color: 'var(--gradient-purple)'
    }
  ];

  const chartData = [
    { name: 'Total', value: dashboardData.stats.total },
    { name: 'Approved', value: dashboardData.stats.approved },
    { name: 'Pending', value: dashboardData.stats.pending },
    { name: 'Rejected', value: dashboardData.stats.rejected },
    { name: 'Paid', value: dashboardData.stats.paid }
  ];

  if (loading) {
    return (
      <div className="student-dashboard-container">
        <StudentSidebar />
        <main className="dashboard-main">
          <div className="loading-container">
            <FaSpinner className="spinner" />
            <p>Loading dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-dashboard-container">
        <StudentSidebar />
        <main className="dashboard-main">
          <div className="error-container">
            <FaTimesCircle className="error-icon" />
            <p>{error}</p>
            <button onClick={fetchDashboardData} className="retry-button">
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="student-dashboard-container">
      <StudentSidebar />
      
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div className="welcome-section">
            <h1>Welcome back, {dashboardData.studentName}! 👋</h1>
            <p className="dashboard-subtitle">Track your academic journey and manage your applications</p>
          </div>
          
          <div className="quick-actions">
            {quickActions.map((action, index) => (
              <button 
                key={index}
                className="action-button"
                style={{ background: action.color }}
                onClick={() => navigate(action.path)}
              >
                {action.icon}
                <span>{action.title}</span>
                <FaArrowRight className="arrow-icon" />
              </button>
            ))}
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="stats-section">
            <h2>Application Overview</h2>
            <div className="stats-cards">
              <div className="stat-card" style={{ background: 'var(--gradient-blue)' }}>
                <div className="stat-icon">
                  <FaBookOpen />
                </div>
                <div className="stat-content">
                  <h3>{dashboardData.stats.total}</h3>
                  <p>Total Applications</p>
                </div>
              </div>
              
              <div className="stat-card" style={{ background: 'var(--gradient-green)' }}>
                <div className="stat-icon">
                  <FaCheckCircle />
                </div>
                <div className="stat-content">
                  <h3>{dashboardData.stats.approved}</h3>
                  <p>Approved</p>
                </div>
              </div>
              
              <div className="stat-card" style={{ background: 'var(--gradient-purple)' }}>
                <div className="stat-icon">
                  <FaClock />
                </div>
                <div className="stat-content">
                  <h3>{dashboardData.stats.pending}</h3>
                  <p>Pending</p>
                </div>
              </div>
            </div>
          </div>

          <div className="chart-section glass-card">
            <h2>Application Progress</h2>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="deadlines-section glass-card">
            <div className="section-header">
              <h2>Upcoming Deadlines</h2>
              <button className="view-all" onClick={() => navigate('/student/colleges')}>
                View All
              </button>
            </div>
            <div className="deadlines-list">
              {dashboardData.deadlines.length > 0 ? (
                dashboardData.deadlines.map((deadline, index) => (
                  <div key={index} className="deadline-card">
                    <div className="deadline-icon">
                      <FaCalendarAlt />
                    </div>
                    <div className="deadline-info">
                      <h3>{deadline.courseName}</h3>
                      <p>{deadline.collegeName}</p>
                      <p>{new Date(deadline.deadline).toLocaleDateString()}</p>
                    </div>
                    <span className="days-left">
                      {deadline.daysLeft} days left
                    </span>
                  </div>
                ))
              ) : (
                <p className="no-data">No upcoming deadlines</p>
              )}
            </div>
          </div>

          <div className="recommendations-section glass-card">
            <div className="section-header">
              <h2>Recommended Colleges</h2>
              <button className="view-all" onClick={() => navigate('/student/colleges')}>
                Explore More
              </button>
            </div>
            <div className="recommendations-grid">
              {dashboardData.recommendedColleges.length > 0 ? (
                dashboardData.recommendedColleges.map((college, index) => (
                  <div key={index} className="college-card">
                    <div className="college-icon">
                      <FaUniversity />
                    </div>
                    <div className="college-info">
                      <h3>{college.name}</h3>
                      <p>{college.location}</p>
                      <p className="college-details">
                        <span>{college.totalCourses} Courses</span>
                        <span>{college.university}</span>
                      </p>
                      <button 
                        className="view-details"
                        onClick={() => navigate(`/student/colleges/${college._id}/courses`)}
                      >
                        View College
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="no-data">No recommended colleges available</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard; 