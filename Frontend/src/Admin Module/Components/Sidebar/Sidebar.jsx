import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaChartLine, FaUniversity, FaUserGraduate, FaCog, FaSignOutAlt, FaUserShield } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

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
        localStorage.clear();
        Swal.fire({
          title: 'Logged Out!',
          text: 'You have been successfully logged out.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          navigate('/login');
        });
      }
    });
  };

  const navigationItems = [
    {
      path: '/admin-dashboard',
      icon: <FaChartLine />,
      label: 'Dashboard'
    },
    {
      path: '/admin/colleges',
      icon: <FaUniversity />,
      label: 'Colleges'
    },
    {
      path: '/admin/students',
      icon: <FaUserGraduate />,
      label: 'Students'
    },
    {
      path: '/admin/settings',
      icon: <FaCog />,
      label: 'Settings'
    }
  ];

  return (
    <div className="admin-sidebar">
      <div className="sidebar-header">
        <FaUserShield className="admin-icon" />
        <div className="header-text">
          <h2>Admin Portal</h2>
          <p>{JSON.parse(localStorage.getItem('user'))?.name || 'Administrator'}</p>
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

export default Sidebar; 