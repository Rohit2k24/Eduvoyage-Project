import { NavLink } from 'react-router-dom';
import { 
  FaChartBar, 
  FaBook, 
  FaUserGraduate, 
  FaBell, 
  FaCog, 
  FaClipboardList,
  FaUniversity 
} from 'react-icons/fa';
import './CollegeSidebar.css';

const CollegeSidebar = () => {
  return (
    <div className="college-sidebar">
      <div className="sidebar-header">
        <FaUniversity className="college-icon" />
        <h2>College Portal</h2>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/college/dashboard" className="nav-link">
          <FaChartBar className="nav-icon" />
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/college/courses" className="nav-link">
          <FaBook className="nav-icon" />
          <span>Courses</span>
        </NavLink>

        <NavLink to="/college/applications" className="nav-link">
          <FaClipboardList className="nav-icon" />
          <span>Applications</span>
        </NavLink>

        <NavLink to="/college/students" className="nav-link">
          <FaUserGraduate className="nav-icon" />
          <span>Students</span>
        </NavLink>

        <NavLink to="/college/notifications" className="nav-link">
          <FaBell className="nav-icon" />
          <span>Notifications</span>
        </NavLink>

        <NavLink to="/college/settings" className="nav-link">
          <FaCog className="nav-icon" />
          <span>Settings</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default CollegeSidebar; 