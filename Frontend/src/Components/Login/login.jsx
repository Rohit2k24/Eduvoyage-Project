import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub, FaArrowRight, FaExclamationCircle } from 'react-icons/fa';
import './Login.css';
import axios from 'axios';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    return newErrors;
  };

  const showErrorAlert = (message) => {
    Swal.fire({
      icon: 'error',
      title: 'Login Failed',
      text: message,
      confirmButtonColor: '#3498db',
    });
  };

  const showSuccessAlert = (role) => {
    Swal.fire({
      icon: 'success',
      title: 'Login Successful!',
      text: 'Welcome back to EduVoyage!',
      confirmButtonColor: '#3498db',
      timer: 1500,
      showConfirmButton: false
    }).then(() => {
      // Navigate after the alert is closed
      navigate(role === 'student' ? '/student-dashboard' : '/college/dashboard');
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:3000/api/auth/login', {
        email: formData.email,
        password: formData.password
      });

      if (response.data.success) {
        // Store token and user info
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Login Successful!',
          text: 'Welcome back!',
          timer: 1500,
          showConfirmButton: false
        });

        // Redirect based on role
        switch (response.data.user.role) {
          case 'student':
            navigate('/student-dashboard');
            break;
          case 'college':
            navigate('/college/dashboard');
            break;
          case 'admin':
            navigate('/admin-dashboard');
            break;
          default:
            navigate('/');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: error.response?.data?.message || 'Invalid credentials'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-glass-card">
        <div className="login-header">
          <h1>Welcome Back! 👋</h1>
          <p className="login-subtitle">Continue your journey with EduVoyage</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-field">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@example.com"
              />
              {errors.email && <span className="error-message"><FaExclamationCircle /> {errors.email}</span>}
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="input-field">
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
              {errors.password && <span className="error-message"><FaExclamationCircle /> {errors.password}</span>}
            </div>
          </div>

          <div className="login-options">
            <div className="remember-me">
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Remember me</label>
            </div>
            <Link to="/forgot-password" className="forgot-password">Forgot Password?</Link>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            Sign In <FaArrowRight className="arrow-icon" />
          </button>
        </form>

        <div className="social-login">
          <p className="divider">Or continue with</p>
          <div className="social-buttons">
            <button type="button" className="social-button google">
              <FcGoogle className="social-icon" /> Google
            </button>
            <button type="button" className="social-button github">
              <FaGithub className="social-icon" /> GitHub
            </button>
          </div>
        </div>

        <p className="register-link">
          Don't have an account? <Link to="/register-redirect">Create account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
