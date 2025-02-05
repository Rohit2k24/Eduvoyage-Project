import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserGraduate, FaUniversity, FaEnvelope, FaLock, FaUser, FaPassport, FaCalendar, FaBuilding, FaGlobe, FaSearch, FaPlus } from 'react-icons/fa';
import { getCountries, getUniversitiesByCountry, countryNames } from '../../utils/universityData';
import './Register.css';
import Swal from 'sweetalert2';

const ACCREDITATIONS = [
  'NAAC A++',
  'NAAC A+',
  'NAAC A',
  'NAAC B++',
  'NAAC B+',
  'NAAC B',
  'NBA',
  'AACSB',
  'ABET',
  'ACICS',
  'EQUIS',
  'CEPH',
  'AMBA',
  'WASC',
  'SACS',
  'HLC',
  'MSCHE',
  'NEASC',
  'NWCCU',
  'ISO 9001:2015',
  'UGC Recognition',
  'QS 5 Stars'
];

const Register = ({ userType }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    ...(userType === 'student' ? {
      dateOfBirth: '',
      country: ''
    } : {
      name: '',
      country: '',
      university: '',
      customUniversity: '',
      accreditation: '',
      establishmentYear: '',
      website: '',
      address: '',
      contactPerson: '',
      phoneNumber: ''
    }),
    customAccreditation: ''
  });
  const [errors, setErrors] = useState({});
  const [countries, setCountries] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [showCustomUniversity, setShowCustomUniversity] = useState(false);
  const [showCustomAccreditation, setShowCustomAccreditation] = useState(false);
  const [verificationStep, setVerificationStep] = useState('form'); // 'form', 'verification'
  const [verificationCode, setVerificationCode] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setCountries(getCountries());
  }, []);

  useEffect(() => {
    if (formData.country) {
      const unis = getUniversitiesByCountry(formData.country);
      setUniversities(unis);
      setFormData(prev => ({ ...prev, university: '' }));
    }
  }, [formData.country]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'university' && value === 'other') {
      setShowCustomUniversity(true);
    }
    
    if (name === 'accreditation' && value === 'other') {
      setShowCustomAccreditation(true);
    } else if (name === 'accreditation') {
      setShowCustomAccreditation(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Basic validations for all users
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }
    
    if (!formData.password || formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Role specific validations
    if (userType === 'student') {
      if (!formData.name) {
        newErrors.name = 'Name is required';
      }
      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = 'Date of birth is required';
      }
      if (!formData.country) {
        newErrors.country = 'Country is required';
      }
    } else {
      // College validations
      if (!formData.name) {
        newErrors.name = 'College name is required';
      }
      if (!formData.country) {
        newErrors.country = 'Country is required';
      }
      if (!formData.university) {
        newErrors.university = 'University is required';
      }
      if (formData.university === 'other' && !formData.customUniversity) {
        newErrors.customUniversity = 'University name is required';
      }
      if (!formData.accreditation) {
        newErrors.accreditation = 'Accreditation is required';
      } else if (formData.accreditation === 'other' && !formData.customAccreditation) {
        newErrors.customAccreditation = 'Please specify the accreditation';
      }
      if (!formData.establishmentYear) {
        newErrors.establishmentYear = 'Establishment year is required';
      } else {
        const year = parseInt(formData.establishmentYear);
        const currentYear = new Date().getFullYear();
        if (year < 1800 || year > currentYear) {
          newErrors.establishmentYear = 'Please enter a valid establishment year';
        }
      }
    }

    return newErrors;
  };

  const showErrorAlert = (message) => {
    Swal.fire({
      icon: 'error',
      title: 'Registration Failed',
      text: message,
      confirmButtonColor: '#3498db',
    });
  };

  const showSuccessAlert = () => {
    Swal.fire({
      icon: 'success',
      title: 'Registration Successful!',
      text: `Welcome to EduVoyage! You've successfully registered as a ${userType}.`,
      confirmButtonColor: '#3498db',
      timer: 2000,
      showConfirmButton: false
    }).then(() => {
      navigate(userType === 'student' ? '/student-dashboard' : '/college-dashboard');
    });
  };

  const handleSendVerification = async () => {
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length === 0) {
      try {
        Swal.fire({
          title: 'Sending verification code...',
          text: 'Please wait',
          allowOutsideClick: false,
          showConfirmButton: false,
          willOpen: () => {
            Swal.showLoading();
          }
        });

        // Add timeout to the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch('http://localhost:3000/api/auth/send-verification', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: formData.email }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const data = await response.json();
        console.log('Server response:', data);

        if (response.ok && data.success) {
          Swal.close();
          setVerificationStep('verification');
          Swal.fire({
            icon: 'success',
            title: 'Verification Code Sent!',
            text: 'Please check your email for the verification code',
            confirmButtonColor: '#3498db',
          });
        } else {
          throw new Error(data.message || 'Failed to send verification code');
        }
      } catch (error) {
        console.error('Verification error:', error);
        let errorMessage = 'Failed to send verification code. Please try again.';
        
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        } else if (!navigator.onLine) {
          errorMessage = 'No internet connection. Please check your network.';
        }

        Swal.fire({
          icon: 'error',
          title: 'Error Sending Code',
          text: error.message || errorMessage,
          confirmButtonColor: '#3498db',
        });
      }
    } else {
      setErrors(newErrors);
      Swal.fire({
        icon: 'warning',
        title: 'Validation Error',
        text: Object.values(newErrors)[0],
        confirmButtonColor: '#3498db',
      });
    }
  };

  const handleVerifyAndRegister = async () => {
    if (!verificationCode) {
      showErrorAlert('Please enter the verification code');
      return;
    }

    try {
      Swal.fire({
        title: 'Verifying...',
        text: 'Please wait',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        }
      });

      const finalFormData = {
        ...formData,
        role: userType,
        verificationCode,
        ...(userType === 'college' && {
          name: formData.name,
          university: formData.university === 'other' ? formData.customUniversity : formData.university,
          accreditation: formData.accreditation === 'other' ? formData.customAccreditation : formData.accreditation
        })
      };

      const response = await fetch('http://localhost:3000/api/auth/verify-and-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalFormData)
      });

      const data = await response.json();
      Swal.close();

      if (data.success) {
        localStorage.setItem('token', data.token);
        showSuccessAlert();
      } else {
        showErrorAlert(data.message);
      }
    } catch (error) {
      showErrorAlert('Registration failed. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <div className="auth-header">
          {userType === 'student' ? (
            <FaUserGraduate className="auth-icon" />
          ) : (
            <FaUniversity className="auth-icon" />
          )}
          <h2>{verificationStep === 'form' ? 'Register' : 'Verify Email'}</h2>
        </div>

        {verificationStep === 'form' ? (
          <form onSubmit={(e) => {
            e.preventDefault();
            handleSendVerification();
          }}>
            <div className="form-group">
              <div className="input-icon-wrapper">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  name="name"
                  placeholder={userType === 'student' ? "Student Name" : "Institution Name"}
                  value={formData.name}
                  onChange={handleChange}
                  className={errors.name ? 'form-control error' : 'form-control'}
                />
              </div>
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-group">
              <div className="input-icon-wrapper">
                <FaEnvelope className="input-icon" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'form-control error' : 'form-control'}
                />
              </div>
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            {userType === 'student' ? (
              <>
                <div className="form-group">
                  <div className="input-icon-wrapper">
                    <FaCalendar className="input-icon" />
                    <input
                      type="date"
                      name="dateOfBirth"
                      placeholder="Date of Birth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className={errors.dateOfBirth ? 'form-control error' : 'form-control'}
                    />
                  </div>
                  {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
                </div>

                <div className="form-group">
                  <div className="input-icon-wrapper">
                    <FaGlobe className="input-icon" />
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className={errors.country ? 'form-control error' : 'form-control'}
                    >
                      <option value="">Select Country</option>
                      {countries.map(code => (
                        <option key={code} value={code}>
                          {countryNames[code] || code}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.country && <span className="error-message">{errors.country}</span>}
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <div className="input-icon-wrapper">
                    <FaGlobe className="input-icon" />
                    <select
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      className={errors.country ? 'form-control error' : 'form-control'}
                    >
                      <option value="">Select Country</option>
                      {countries.map(code => (
                        <option key={code} value={code}>
                          {countryNames[code] || code}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.country && <span className="error-message">{errors.country}</span>}
                </div>

                <div className="form-group">
                  <div className="input-icon-wrapper">
                    <FaUniversity className="input-icon" />
                    <select
                      name="university"
                      value={formData.university}
                      onChange={handleChange}
                      className={errors.university ? 'form-control error' : 'form-control'}
                      disabled={!formData.country}
                    >
                      <option value="">Select University</option>
                      {universities.map((uni, index) => (
                        <option key={`${uni.name}-${index}`} value={uni.name}>
                          {uni.name}
                        </option>
                      ))}
                      <option value="other">Other (Add Manually)</option>
                    </select>
                  </div>
                  {errors.university && <span className="error-message">{errors.university}</span>}
                </div>

                {showCustomUniversity && (
                  <div className="form-group">
                    <div className="input-icon-wrapper">
                      <FaPlus className="input-icon" />
                      <input
                        type="text"
                        name="customUniversity"
                        placeholder="Enter University Name"
                        value={formData.customUniversity}
                        onChange={handleChange}
                        className={errors.customUniversity ? 'form-control error' : 'form-control'}
                      />
                    </div>
                    {errors.customUniversity && <span className="error-message">{errors.customUniversity}</span>}
                  </div>
                )}

                <div className="form-group">
                  <div className="input-icon-wrapper">
                    <FaBuilding className="input-icon" />
                    <select
                      name="accreditation"
                      value={formData.accreditation}
                      onChange={handleChange}
                      className={errors.accreditation ? 'form-control error' : 'form-control'}
                    >
                      <option value="">Select Accreditation</option>
                      {ACCREDITATIONS.map(accr => (
                        <option key={accr} value={accr}>
                          {accr}
                        </option>
                      ))}
                      <option value="other">Other</option>
                    </select>
                  </div>
                  {errors.accreditation && <span className="error-message">{errors.accreditation}</span>}
                </div>

                {showCustomAccreditation && (
                  <div className="form-group">
                    <div className="input-icon-wrapper">
                      <FaPlus className="input-icon" />
                      <input
                        type="text"
                        name="customAccreditation"
                        placeholder="Enter Accreditation"
                        value={formData.customAccreditation}
                        onChange={handleChange}
                        className={errors.customAccreditation ? 'form-control error' : 'form-control'}
                      />
                    </div>
                    {errors.customAccreditation && (
                      <span className="error-message">{errors.customAccreditation}</span>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <div className="input-icon-wrapper">
                    <FaCalendar className="input-icon" />
                    <input
                      type="number"
                      name="establishmentYear"
                      placeholder="Establishment Year"
                      value={formData.establishmentYear}
                      onChange={handleChange}
                      className={errors.establishmentYear ? 'form-control error' : 'form-control'}
                    />
                  </div>
                  {errors.establishmentYear && <span className="error-message">{errors.establishmentYear}</span>}
                </div>
              </>
            )}

            <div className="form-group">
              <div className="input-icon-wrapper">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'form-control error' : 'form-control'}
                />
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="form-group">
              <div className="input-icon-wrapper">
                <FaLock className="input-icon" />
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'form-control error' : 'form-control'}
                />
              </div>
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>

            <button type="submit" className="auth-button">
              Continue
            </button>
          </form>
        ) : (
          <div className="verification-container">
            <p>Please enter the verification code sent to {formData.email}</p>
            <div className="form-group">
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength="6"
                className="form-control"
              />
            </div>
            <button onClick={handleVerifyAndRegister} className="auth-button">
              Verify & Register
            </button>
            <button
              onClick={() => handleSendVerification()}
              className="auth-button secondary"
            >
              Resend Code
            </button>
          </div>
        )}

        <div className="auth-links">
          <Link to="/login">Already have an account? Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
