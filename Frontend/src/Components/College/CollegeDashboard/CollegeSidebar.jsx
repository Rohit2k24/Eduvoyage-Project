import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaBook, FaUsers, FaCog } from 'react-icons/fa';
import './CollegeSidebar.css';

const CollegeSidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="college-sidebar">
      <div className="sidebar-header">
        <h2>College Portal</h2>
      </div>
      
      <nav className="sidebar-nav">
        <Link to="/college/dashboard" className={`nav-item ${isActive('/college/dashboard') ? 'active' : ''}`}>
          <FaHome className="nav-icon" />
          <span>Dashboard</span>
        </Link>

        <Link to="/college/courses" className={`nav-item ${isActive('/college/courses') ? 'active' : ''}`}>
          <FaBook className="nav-icon" />
          <span>Manage Courses</span>
        </Link>

        <Link to="/college/students" className={`nav-item ${isActive('/college/students') ? 'active' : ''}`}>
          <FaUsers className="nav-icon" />
          <span>Manage Students</span>
        </Link>

        <Link to="/college/settings" className={`nav-item ${isActive('/college/settings') ? 'active' : ''}`}>
          <FaCog className="nav-icon" />
          <span>Settings</span>
        </Link>
      </nav>
    </div>
  );
};

export default CollegeSidebar; 