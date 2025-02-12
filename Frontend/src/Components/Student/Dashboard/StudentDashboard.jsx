import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaGraduationCap, 
  FaClipboardList, 
  FaCalendarAlt,
  FaUniversity,
  FaChartLine,
  FaRegClock,
  FaRegCheckCircle
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

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const data = await response.json();
      setDashboardData({
        applications: data.data.applications || 0,
        accepted: data.data.accepted || 0,
        pending: data.data.pending || 0,
        deadlines: data.data.deadlines || [],
        recommendations: data.data.recommendations || []
      });
      setLoading(false);
    } catch (error) {
      console.error('Dashboard error:', error);
      setLoading(false);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load dashboard data',
        confirmButtonColor: '#3498db'
      });
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
          <h1>Welcome Back, {localStorage.getItem('username') || 'Student'}! 👋</h1>
          <p className="dashboard-subtitle">Your application journey at a glance</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card gradient-blue">
            <div className="stat-icon">
              <FaUniversity />
            </div>
            <div className="stat-content">
              <h3>{dashboardData.applications}</h3>
              <p>Total Applications</p>
              <span className="stat-trend">↑ 12% from last month</span>
            </div>
          </div>

          <div className="stat-card gradient-green">
            <div className="stat-icon">
              <FaRegCheckCircle />
            </div>
            <div className="stat-content">
              <h3>{dashboardData.accepted}</h3>
              <p>Accepted Offers</p>
              <span className="stat-trend">3 pending responses</span>
            </div>
          </div>

          <div className="stat-card gradient-purple">
            <div className="stat-icon">
              <FaRegClock />
            </div>
            <div className="stat-content">
              <h3>{dashboardData.deadlines?.length || 0}</h3>
              <p>Upcoming Deadlines</p>
              <span className="stat-trend">Nearest in 5 days</span>
            </div>
          </div>
        </div>

        <div className="content-grid">
          <div className="chart-card glass-card">
            <div className="chart-header">
              <h2>Application Progress</h2>
              <div className="chart-legend">
                <div className="legend-item applied">
                  <span></span> Applied
                </div>
                <div className="legend-item accepted">
                  <span></span> Accepted
                </div>
              </div>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <XAxis 
                    dataKey="name" 
                    tick={{ fill: '#64748b' }}
                  />
                  <YAxis 
                    tick={{ fill: '#64748b' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      background: 'rgba(255, 255, 255, 0.95)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Bar 
                    dataKey="value" 
                    radius={[6, 6, 0, 0]}
                    animationBegin={100}
                  >
                    {chartData.map((entry, index) => (
                      <stop 
                        key={index}
                        offset="0%" 
                        stopColor={index === 0 ? '#4f46e5' : '#10b981'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="deadlines-card glass-card">
            <div className="card-header">
              <h2>⏳ Upcoming Deadlines</h2>
              <button className="view-all">View All →</button>
            </div>
            <div className="deadlines-list">
              {dashboardData.deadlines?.map((deadline, index) => (
                <div key={index} className="deadline-item">
                  <div className="deadline-meta">
                    <div className="university-badge">
                      <FaUniversity />
                    </div>
                    <div className="deadline-info">
                      <h4>{deadline.university}</h4>
                      <p className="deadline-date">
                        {new Date(deadline.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="days-remaining">
                    {Math.ceil((new Date(deadline.date) - new Date()) / (1000 * 3600 * 24))} days left
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="recommendations-section">
          <div className="section-header">
            <h2>🌟 Recommended Universities</h2>
            <p>Based on your profile and preferences</p>
          </div>
          <div className="recommendations-grid">
            {dashboardData.recommendations?.map((uni, index) => (
              <div key={index} className="university-card">
                <div className="university-header">
                  <div className="uni-avatar">
                    <FaUniversity />
                  </div>
                  <h3>{uni.name}</h3>
                  <span className="uni-location">{uni.location}</span>
                </div>
                <div className="university-details">
                  <div className="detail-item">
                    <span>Application Deadline</span>
                    <p>{new Date(uni.deadline).toLocaleDateString()}</p>
                  </div>
                  <div className="detail-item">
                    <span>Acceptance Rate</span>
                    <p>22%</p>
                  </div>
                </div>
                <div className="card-actions">
                  <button className="primary-action">
                    Apply Now
                  </button>
                  <button className="secondary-action">
                    Learn More
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard; 