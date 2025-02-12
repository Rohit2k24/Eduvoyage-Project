import { Link, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaGraduationCap, 
  FaClipboardList, 
  FaBell, 
  FaUser,
  FaCog,
  FaComments
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import './StudentSidebar.css';

const StudentSidebar = () => {
  const location = useLocation();

  const menuItems = [
    { path: '/student/dashboard', icon: <FaHome />, label: 'Dashboard' },
    { path: '/student/courses', icon: <FaGraduationCap />, label: 'Browse Courses' },
    { path: '/student/applications', icon: <FaClipboardList />, label: 'My Applications' },
    { path: '/student/notifications', icon: <FaBell />, label: 'Notifications' },
    { path: '/student/profile', icon: <FaUser />, label: 'Profile' },
    { path: '/student/settings', icon: <FaCog />, label: 'Settings' }
  ];

  return (
    <motion.div 
      className="student-sidebar"
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 100 }}
    >
      <div className="sidebar-header">
        <div className="student-avatar">
          <img src="/default-avatar.png" alt="Student" />
          <div className="online-status"></div>
        </div>
        <div className="student-info">
          <h3>{localStorage.getItem('username') || 'Student'}</h3>
          <p>International Student</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            {location.pathname === item.path && <div className="active-indicator"></div>}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <Link to="/student/support" className="support-card">
          <FaComments className="support-icon" />
          <div>
            <h4>Need Help?</h4>
            <p>Chat with our support team</p>
          </div>
        </Link>
      </div>
    </motion.div>
  );
};

export default StudentSidebar; 