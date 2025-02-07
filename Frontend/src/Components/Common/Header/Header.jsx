import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaUserCircle } from 'react-icons/fa';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  return (
    <header className="main-header">
      <div className="header-content">
        <Link to="/" className="logo">
          <img src="/logo.png" alt="EduVoyage" />
          <span>EduVoyage</span>
        </Link>

        <nav className="nav-links">
          <Link to="/courses">Courses</Link>
          <Link to="/colleges">Colleges</Link>
          <Link to="/about">About</Link>
          <Link to="/contact">Contact</Link>
        </nav>

        <div className="header-actions">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input type="text" placeholder="Search courses..." />
          </div>

          {isLoggedIn ? (
            <div className="user-menu">
              <button 
                className="profile-btn"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <FaUserCircle />
              </button>
              {isMenuOpen && (
                <div className="dropdown-menu">
                  <Link to={`/${userRole}/dashboard`}>Dashboard</Link>
                  <Link to="/profile">Profile</Link>
                  <button onClick={handleLogout}>Logout</button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="login-btn">Login</Link>
              <Link to="/register-redirect" className="register-btn">Register</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header; 