import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaBars, FaTimes, FaChevronDown, FaUser } from "react-icons/fa";
import { motion, AnimatePresence } from 'framer-motion';
import logo from '../../assets/logo.png'; // Import the logo
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleHomeRedirect = () => {
    navigate('/');
    setIsMenuOpen(false);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setShowDropdown(false);
  };

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="headerContent">
        <div className="logoSection" onClick={handleHomeRedirect}>
          <img src={logo} alt="EduVoyage Logo" className="logoImage" />
          <h1 className="logo">
            Edu<span>Voyage</span>
          </h1>
        </div>

        <div className="navLinksContainer">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            Home
          </Link>
          <Link to="/colleges" className={location.pathname === '/colleges' ? 'active' : ''}>
            Universities
          </Link>
          <Link to="/about" className={location.pathname === '/about' ? 'active' : ''}>
            About
          </Link>
          <Link to="/contact" className={location.pathname === '/contact' ? 'active' : ''}>
            Contact
          </Link>
        </div>

        <div className="authButtons">
          <Link to="/login" className="loginButton">
            <FaUser className="userIcon" />
            Login
          </Link>
          <Link to="/register-redirect" className="registerButton">
            Sign Up
          </Link>
        </div>

        <button 
          className="menuToggle" 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <div className={`mobileMenu ${isMenuOpen ? 'active' : ''}`}>
          <Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link>
          <Link to="/colleges" onClick={() => setIsMenuOpen(false)}>Universities</Link>
          <Link to="/about" onClick={() => setIsMenuOpen(false)}>About</Link>
          <Link to="/contact" onClick={() => setIsMenuOpen(false)}>Contact</Link>
          <div className="mobileAuthButtons">
            <Link to="/login" className="loginButton">Login</Link>
            <Link to="/register-redirect" className="registerButton">Sign Up</Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
