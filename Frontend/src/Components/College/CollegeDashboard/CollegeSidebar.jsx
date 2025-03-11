import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [collegeInfo, setCollegeInfo] = useState({
    name: '',
    logo: ''
  });

  useEffect(() => {
    fetchCollegeInfo();
  }, []);

  const fetchCollegeInfo = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/college/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setCollegeInfo({
          name: data.data.name || 'College Name',
          logo: data.data.documents?.collegeLogo || ''
        });
      }
    } catch (error) {
      console.error('Error fetching college info:', error);
    }
  };

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
        // Clear all storage items
        localStorage.clear();
        // Show success message
        Swal.fire({
          title: 'Logged Out!',
          text: 'You have been successfully logged out.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        }).then(() => {
          // Navigate to login page
          navigate('/login');
        });
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
        {collegeInfo.logo ? (
          <img 
            src={collegeInfo.logo} 
            alt={collegeInfo.name} 
            className="college-logo"
          />
        ) : (
          <FaUniversity className="college-icon" />
        )}
        <div className="header-text">
          <h2>{collegeInfo.name}</h2>
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