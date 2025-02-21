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
  FaAward
} from 'react-icons/fa';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import StudentSidebar from '../Sidebar/StudentSidebar';
import './StudentDashboard.css';

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    applications: 0,
    accepted: 0,
    pending: 0,
    deadlines: [],
    recommendations: []
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const username = localStorage.getItem('username') || 'Student';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/student/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setDashboardData(data.data);
      setLoading(false);
    } catch (error) {
      console.error('Dashboard error:', error);
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
      title: 'Notifications',
      icon: <FaBell />,
      path: '/student/notifications',
      color: 'var(--gradient-purple)'
    }
  ];

  const chartData = [
    { name: 'Applied', value: dashboardData.applications },
    { name: 'Accepted', value: dashboardData.accepted },
    { name: 'Pending', value: dashboardData.pending }
  ];

  return (
    <div className="student-dashboard-container">
      <StudentSidebar />
      
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div className="welcome-section">
            <h1>Welcome back, {username}! 👋</h1>
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
                  <h3>{dashboardData.applications}</h3>
                  <p>Total Applications</p>
                </div>
              </div>
              
              <div className="stat-card" style={{ background: 'var(--gradient-green)' }}>
                <div className="stat-icon">
                  <FaCheckCircle />
                </div>
                <div className="stat-content">
                  <h3>{dashboardData.accepted}</h3>
                  <p>Accepted</p>
                </div>
              </div>
              
              <div className="stat-card" style={{ background: 'var(--gradient-purple)' }}>
                <div className="stat-icon">
                  <FaClock />
                </div>
                <div className="stat-content">
                  <h3>{dashboardData.pending}</h3>
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
              <button className="view-all">View All</button>
            </div>
            <div className="deadlines-list">
              {dashboardData.deadlines?.map((deadline, index) => (
                <div key={index} className="deadline-card">
                  <div className="deadline-icon">
                    <FaCalendarAlt />
                  </div>
                  <div className="deadline-info">
                    <h3>{deadline.university}</h3>
                    <p>{new Date(deadline.date).toLocaleDateString()}</p>
                  </div>
                  <span className="days-left">
                    {Math.ceil((new Date(deadline.date) - new Date()) / (1000 * 3600 * 24))} days left
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="recommendations-section glass-card">
            <div className="section-header">
              <h2>Recommended Colleges</h2>
              <button className="view-all">Explore More</button>
            </div>
            <div className="recommendations-grid">
              {dashboardData.recommendations?.slice(0, 3).map((college, index) => (
                <div key={index} className="college-card">
                  <div className="college-icon">
                    <FaAward />
                  </div>
                  <div className="college-info">
                    <h3>{college.name}</h3>
                    <p>{college.location}</p>
                    <button 
                      className="view-details"
                      onClick={() => navigate(`/student/colleges/${college._id}`)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard; 