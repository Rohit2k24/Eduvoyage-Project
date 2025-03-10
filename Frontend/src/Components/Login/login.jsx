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
    
    // Validate form before submission
    const newErrors = validateForm();
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      return; // Stop if there are validation errors
    }

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

        // Handle different roles and verification statuses
        switch (response.data.user.role) {
          case 'student':
            Swal.fire({
              icon: 'success',
              title: 'Welcome Back!',
              text: 'Successfully logged in to your student account',
              timer: 1500,
              showConfirmButton: false
            }).then(() => {
              navigate('/student-dashboard');
            });
            break;

          case 'college':
            try {
              const collegeResponse = await axios.get('http://localhost:3000/api/college/details', {
                headers: { 
                  Authorization: `Bearer ${response.data.token}`,
                  'Content-Type': 'application/json'
                }
              });

              if (collegeResponse.data.success) {
                const { verificationStatus, rejectionReason } = collegeResponse.data.college;

                if (verificationStatus === 'pending') {
                  Swal.fire({
                    icon: 'info',
                    title: 'Access Restricted',
                    html: `
                      <div style="text-align: left; padding: 10px;">
                        <p style="font-size: 1.1em; margin-bottom: 15px; color: #3498db;">Your college registration is under review.</p>
                        <p style="color: #666;">Our verification team is currently reviewing your submitted documents and credentials.</p>
                        <p style="color: #666; margin-top: 10px;">Estimated review time: 2-3 business days</p>
                        <hr style="margin: 15px 0; border-color: #eee;">
                        <p style="color: #666;">You'll receive full access to your dashboard once your college is verified.</p>
                        <p style="color: #666; margin-top: 10px;">We'll notify you via email when the verification is complete.</p>
                      </div>
                    `,
                    confirmButtonText: 'Understood',
                    confirmButtonColor: '#3085d6',
                    allowOutsideClick: false
                  }).then(() => {
                    // Clear stored data and redirect to login
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login');
                  });
                } else if (verificationStatus === 'rejected') {
                  Swal.fire({
                    icon: 'error',
                    title: 'Access Denied',
                    html: `
                      <div style="text-align: left; padding: 10px;">
                        <p style="font-size: 1.1em; color: #dc3545; margin-bottom: 15px;">Your college registration was not approved.</p>
                        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                          <p style="color: #666; font-weight: bold;">Reason for Rejection:</p>
                          <p style="color: #dc3545;">${rejectionReason || 'Documentation requirements not met.'}</p>
                        </div>
                        <p style="color: #666; margin-top: 10px;">Please address the issues mentioned above and submit a new application.</p>
                        <hr style="margin: 15px 0; border-color: #eee;">
                        <p style="color: #666;">Need assistance? Contact our support team:</p>
                        <p style="color: #3498db; margin-top: 5px;">support@eduvoyage.com</p>
                      </div>
                    `,
                    confirmButtonText: 'Contact Support',
                    showCancelButton: true,
                    cancelButtonText: 'Close',
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    allowOutsideClick: false
                  }).then((result) => {
                    if (result.isConfirmed) {
                      // You can add support contact functionality here
                      window.location.href = 'mailto:support@eduvoyage.com';
                    }
                    // Clear stored data and redirect to login
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    navigate('/login');
                  });
                } else if (verificationStatus === 'approved') {
                  // Only approved colleges can access the dashboard
                  Swal.fire({
                    icon: 'success',
                    title: 'Welcome Back!',
                    text: 'Successfully logged in to your verified college account',
                    timer: 1500,
                    showConfirmButton: false
                  }).then(() => {
                    navigate('/college/dashboard');
                  });
                }
              }
            } catch (collegeError) {
              console.error('Error fetching college details:', collegeError);
              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch college details. Please try again.',
                confirmButtonColor: '#3085d6'
              }).then(() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
              });
            }
            break;

          case 'admin':
            Swal.fire({
              icon: 'success',
              title: 'Welcome Back, Admin!',
              text: 'Successfully logged in to admin dashboard',
              timer: 1500,
              showConfirmButton: false
            }).then(() => {
              navigate('/admin-dashboard');
            });
            break;

          default:
            navigate('/');
        }
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: error.response?.data?.message || 'Invalid credentials',
        confirmButtonColor: '#3085d6'
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
                className={errors.email ? 'error' : ''}
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
                className={errors.password ? 'error' : ''}
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

          <button 
            type="submit" 
            className="login-button" 
            disabled={loading}
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>Sign In <FaArrowRight className="arrow-icon" /></>
            )}
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
