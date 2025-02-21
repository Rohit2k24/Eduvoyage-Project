import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FaHome, 
  FaUniversity, 
  FaClipboardList, 
  FaBell, 
  FaUser, 
  FaCog, 
  FaSignOutAlt 
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import './StudentSidebar.css';

const StudentSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Logout',
      text: 'Are you sure you want to logout?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        navigate('/login');
      }
    });
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

        <Link to="/student/colleges" className={`nav-item ${isActive('/student/colleges') ? 'active' : ''}`}>
          <FaUniversity className="nav-icon" />
          <span>Explore Colleges</span>
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

        <button className="nav-item logout-button" onClick={handleLogout}>
          <FaSignOutAlt className="nav-icon" />
          <span>Logout</span>
        </button>
      </nav>
    </div>
  );
};

export default StudentSidebar; 