import { Link, useLocation } from 'react-router-dom';
import { 
  FaChartBar, 
  FaBook, 
  FaUserGraduate, 
  FaBell, 
  FaCog, 
  FaClipboardList,
  FaUniversity,
  FaSignOutAlt 
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import './CollegeSidebar.css';

const CollegeSidebar = () => {
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of your account",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout'
    }).then((result) => {
      if (result.isConfirmed) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    });
  };

  const navigationItems = [
    {
      path: '/college/dashboard',
      icon: <FaChartBar />,
      label: 'Dashboard'
    },
    {
      path: '/college/courses',
      icon: <FaBook />,
      label: 'Courses'
    },
    {
      path: '/college/applications',
      icon: <FaClipboardList />,
      label: 'Applications'
    },
    {
      path: '/college/students',
      icon: <FaUserGraduate />,
      label: 'Students'
    },
    {
      path: '/college/notifications',
      icon: <FaBell />,
      label: 'Notifications'
    },
    {
      path: '/college/settings',
      icon: <FaCog />,
      label: 'Settings'
    }
  ];

  return (
    <div className="college-sidebar">
      <div className="sidebar-header">
        <FaUniversity className="college-icon" />
        <div className="header-text">
          <h2>College Portal</h2>
          <p>{user?.name || 'College Admin'}</p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navigationItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      <button onClick={handleLogout} className="logout-button">
        <FaSignOutAlt className="nav-icon" />
        <span>Logout</span>
      </button>
    </div>
  );
};

export default CollegeSidebar; 