import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FcGoogle } from 'react-icons/fc';
import { FaGithub, FaArrowRight, FaExclamationCircle } from 'react-icons/fa';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

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
      navigate(role === 'student' ? '/student-dashboard' : '/college-dashboard');
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length === 0) {
      try {
        // Show loading state
        Swal.fire({
          title: 'Logging in...',
          text: 'Please wait',
          allowOutsideClick: false,
          showConfirmButton: false,
          willOpen: () => {
            Swal.showLoading();
          }
        });

        const response = await fetch('http://localhost:3000/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });

        const data = await response.json();

        // Close loading alert
        Swal.close();

        if (data.success) {
          // Store user data in localStorage
          localStorage.setItem('token', data.token);
          localStorage.setItem('userRole', data.role);
          localStorage.setItem('username', data.username);

          // Navigate based on role
          if (data.role === 'college') {
            if (data.paymentStatus === 'completed') {
              // If payment is completed, go directly to dashboard
              navigate('/college/dashboard');
            } else {
              // Check verification status only if payment is not completed
              const verificationResponse = await fetch('http://localhost:3000/api/college/verification-status', {
                headers: {
                  'Authorization': `Bearer ${data.token}`
                }
              });
              
              const verificationData = await verificationResponse.json();
              
              if (!verificationData.status || verificationData.status === 'pending') {
                navigate('/college/verification-form');
              } else if (verificationData.status === 'approved') {
                navigate('/college/payment'); // Redirect to payment if verification is approved
              } else {
                navigate('/college/verification-status');
              }
            }
          } else if (data.role === 'admin') {
            navigate('/admin-dashboard');
          } else {
            navigate('/student/dashboard');
          }
        } else {
          showErrorAlert(data.message || 'Invalid credentials');
        }
      } catch (error) {
        console.error('Login error:', error);
        showErrorAlert('Network error occurred. Please check your connection and try again.');
      }
    } else {
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: 'Please check the form for errors and try again.',
        confirmButtonColor: '#3498db',
      });
      setErrors(newErrors);
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

          <button type="submit" className="login-button">
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
