import { Link, useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaGraduationCap, 
  FaClipboardList, 
  FaBell, 
  FaUser, 
  FaCog 
} from 'react-icons/fa';
import './StudentSidebar.css';

const StudentSidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    {
      path: '/student/dashboard',
      icon: <FaHome />,
      label: 'Dashboard'
    },
    {
      path: '/student/courses',
      icon: <FaGraduationCap />,
      label: 'Browse Courses'
    },
    {
      path: '/student/applications',
      icon: <FaClipboardList />,
      label: 'My Applications'
    },
    {
      path: '/student/notifications',
      icon: <FaBell />,
      label: 'Notifications'
    },
    {
      path: '/student/profile',
      icon: <FaUser />,
      label: 'Profile'
    },
    {
      path: '/student/settings',
      icon: <FaCog />,
      label: 'Settings'
    }
  ];

  return (
    <div className="student-sidebar">
      <div className="sidebar-header">
        <div className="student-avatar">
          <img src="/default-avatar.png" alt="Student" />
        </div>
        <div className="student-info">
          <h3>{localStorage.getItem('username') || 'Student'}</h3>
          <p>Student</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="help-section">
          <h4>Need Help?</h4>
          <Link to="/student/support" className="support-link">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentSidebar; 