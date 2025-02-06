import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaUniversity, FaUserGraduate, FaChartBar } from 'react-icons/fa';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="admin-sidebar">
      <div className="sidebar-header">
        <h2>EduVoyage Admin</h2>
      </div>
      
      <nav className="sidebar-nav">
        <Link to="/admin-dashboard" className={`nav-item ${isActive('/admin-dashboard') ? 'active' : ''}`}>
          <FaHome className="nav-icon" />
          <span>Dashboard</span>
        </Link>

        <Link to="/admin/colleges" className={`nav-item ${isActive('/admin/colleges') ? 'active' : ''}`}>
          <FaUniversity className="nav-icon" />
          <span>College Management</span>
        </Link>

        <Link to="/admin/students" className={`nav-item ${isActive('/admin/students') ? 'active' : ''}`}>
          <FaUserGraduate className="nav-icon" />
          <span>Student Management</span>
        </Link>

        <Link to="/admin/analytics" className={`nav-item ${isActive('/admin/analytics') ? 'active' : ''}`}>
          <FaChartBar className="nav-icon" />
          <span>Analytics</span>
        </Link>
      </nav>
    </div>
  );
};

export default Sidebar; 