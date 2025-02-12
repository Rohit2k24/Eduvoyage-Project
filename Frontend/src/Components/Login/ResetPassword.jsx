import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaLock, FaCheck, FaExclamationCircle, FaArrowRight } from 'react-icons/fa';
import Swal from 'sweetalert2';
import './Login.css';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const { token } = useParams();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      try {
        Swal.fire({
          title: 'Processing...',
          text: 'Please wait while we update your password',
          allowOutsideClick: false,
          showConfirmButton: false,
          willOpen: () => {
            Swal.showLoading();
          }
        });

        const response = await fetch(`/api/auth/reset-password/${token}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ password: formData.password })
        });

        const data = await response.json();

        if (data.success) {
          Swal.fire({
            icon: 'success',
            title: 'Password Reset Successful!',
            text: 'You can now login with your new password',
            confirmButtonColor: '#3498db',
          }).then(() => {
            navigate('/login');
          });
        } else {
          throw new Error(data.message || 'Failed to reset password');
        }
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error.message || 'Something went wrong. Please try again.',
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
          <div className="icon-success">
            <FaCheck />
          </div>
          <h1>New Password 🎉</h1>
          <p>Create a new password for your account</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="password">New Password</label>
            <div className="input-field">
              <FaLock className="input-icon" />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
              />
            </div>
            {errors.password && (
              <span className="error-message">
                <FaExclamationCircle /> {errors.password}
              </span>
            )}
          </div>

          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-field">
              <FaLock className="input-icon" />
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
              />
            </div>
            {errors.confirmPassword && (
              <span className="error-message">
                <FaExclamationCircle /> {errors.confirmPassword}
              </span>
            )}
          </div>

          <button type="submit" className="auth-button">
            Reset Password <FaArrowRight className="arrow-icon" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword; 