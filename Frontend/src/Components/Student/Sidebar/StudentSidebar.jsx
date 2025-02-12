import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaGraduationCap, FaClipboardList, FaBell, FaUser, FaCog, FaBook, FaSignOutAlt } from 'react-icons/fa';
import './StudentSidebar.css';

const StudentSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    // Clear authentication tokens
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    // Redirect to login page
    navigate('/login');
  };

  return (
    <div className="student-sidebar">
      <div className="sidebar-header">
        <h2>Student Portal</h2>
      </div>
      
      <nav className="sidebar-nav">
        <Link to="/student/dashboard" className={`nav-item ${isActive('/student/dashboard') ? 'active' : ''}`}>
          <FaHome className="nav-icon" />
          <span>Dashboard</span>
        </Link>

        <Link to="/student/courses" className={`nav-item ${isActive('/student/courses') ? 'active' : ''}`}>
          <FaGraduationCap className="nav-icon" />
          <span>Browse Courses</span>
        </Link>

        <Link to="/student/applications" className={`nav-item ${isActive('/student/applications') ? 'active' : ''}`}>
          <FaClipboardList className="nav-icon" />
          <span>My Applications</span>
        </Link>

        <Link to="/student/notifications" className={`nav-item ${isActive('/student/notifications') ? 'active' : ''}`}>
          <FaBell className="nav-icon" />
          <span>Notifications</span>
        </Link>

        <Link to="/student/profile" className={`nav-item ${isActive('/student/profile') ? 'active' : ''}`}>
          <FaUser className="nav-icon" />
          <span>Profile</span>
        </Link>

        <Link to="/student/settings" className={`nav-item ${isActive('/student/settings') ? 'active' : ''}`}>
          <FaCog className="nav-icon" />
          <span>Settings</span>
        </Link>

        {/* Logout Button */}
        <div className="nav-item logout-button" onClick={handleLogout}>
          <FaSignOutAlt className="nav-icon" />
          <span>Logout</span>
        </div>
      </nav>
    </div>
  );
};

export default StudentSidebar; 