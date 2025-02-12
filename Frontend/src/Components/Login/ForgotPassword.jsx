import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaArrowRight, FaExclamationCircle } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './Login.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      try {
        Swal.fire({
          title: 'Processing...',
          text: 'Please wait while we verify your email',
          allowOutsideClick: false,
          showConfirmButton: false,
          willOpen: () => {
            Swal.showLoading();
          }
        });

        const response = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email })
        });

        const data = await response.json();
        console.log('Server response:', data);

        if (response.ok && data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Reset Link Sent!',
            text: 'Please check your email for the password reset link',
            confirmButtonColor: '#3498db',
          });
        } else {
          throw new Error(data.message || 'Failed to send reset link');
        }
      } catch (error) {
        console.error('Forgot password error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Failed to send reset link. Please try again.',
          confirmButtonColor: '#3498db',
        });
      }
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-glass-card">
        <div className="auth-header">
          <h1>Reset Your Password 🔒</h1>
          <p>Enter your email to receive a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-field">
              <FaEnvelope className="input-icon" />
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
              />
            </div>
            {errors.email && (
              <span className="error-message">
                <FaExclamationCircle /> {errors.email}
              </span>
            )}
          </div>

          <button type="submit" className="auth-button">
            Send Reset Link <FaArrowRight className="arrow-icon" />
          </button>
        </form>

        <div className="auth-footer">
          <Link to="/login" className="back-to-login">
            Remember your password? Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword; 