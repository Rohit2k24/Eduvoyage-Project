import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
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
    <div className="auth-container">
      <div className="auth-box">
        <h2>Login to EduVoyage</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className={errors.email ? 'form-control error' : 'form-control'}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              className={errors.password ? 'form-control error' : 'form-control'}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <button type="submit" className="auth-button">Login</button>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password">Forgot Password?</Link>
          <Link to="/register-redirect">Don't have an account? Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
