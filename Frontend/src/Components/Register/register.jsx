import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaUserGraduate, FaUniversity, FaEnvelope, FaLock, FaUser, FaPassport, FaCalendar, FaBuilding, FaGlobe, FaSearch, FaPlus, FaExclamationCircle, FaArrowRight, FaFile, FaFileUpload, FaImage, FaPhone } from 'react-icons/fa';
import { getCountries, getUniversitiesByCountry, countryNames } from '../../utils/universityData';
import './Register.css';
import Swal from 'sweetalert2';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

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

const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

const Register = ({ userType }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    ...(userType === 'student' ? {
      dateOfBirth: '',
      country: '',
      gender: ''
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
      phone: '',
      phoneNumber: ''
    }),
    customAccreditation: '',
    role: userType,
    description: '',
    facilities: [],
    documents: {
      registrationCertificate: null,
      accreditationCertificate: null,
      collegeLogo: null
    }
  });
  const [errors, setErrors] = useState({});
  const [countries, setCountries] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [showCustomUniversity, setShowCustomUniversity] = useState(false);
  const [showCustomAccreditation, setShowCustomAccreditation] = useState(false);
  const [verificationStep, setVerificationStep] = useState('form'); // 'form', 'verification'
  const [verificationCode, setVerificationCode] = useState('');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentFacility, setCurrentFacility] = useState('');

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Max dimensions
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          
          // Calculate new dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Get compressed image as base64 string
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7); // 0.7 is the quality (70%)
          resolve(compressedBase64);
        };
      };
    });
  };

  const handleFileChange = async (e) => {
    const { name, files } = e.target;
    const file = files[0];
    
    if (file) {
      try {
        // Show loading state
        setLoading(true);
        
        let fileData;
        if (file.type.startsWith('image/')) {
          // Compress image files
          fileData = await compressImage(file);
        } else {
          // For non-image files (like PDFs), use regular FileReader
          fileData = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(file);
          });
        }
        
        setFormData(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [name]: fileData
          }
        }));
      } catch (error) {
        console.error('Error processing file:', error);
        Swal.fire({
          icon: 'error',
          title: 'File Processing Error',
          text: 'There was an error processing your file. Please try again.'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddFacility = (e) => {
    e.preventDefault();
    if (currentFacility.trim()) {
      setFormData(prev => ({
        ...prev,
        facilities: [...prev.facilities, currentFacility.trim()]
      }));
      setCurrentFacility('');
    }
  };

  const handleRemoveFacility = (index) => {
    setFormData(prev => ({
      ...prev,
      facilities: prev.facilities.filter((_, i) => i !== index)
    }));
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
      if (!formData.gender) {
        newErrors.gender = 'Gender is required';
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
      if (!formData.phone) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^\+?[\d\s-]{8,}$/.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
  

    if (Object.keys(newErrors).length === 0) {
     
      try {
        Swal.fire({
          title: 'Sending...',
          text: 'Please wait while we send the verification code',
          allowOutsideClick: false,
          showConfirmButton: false,
          willOpen: () => {
            Swal.showLoading();
          }
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(`${API_BASE_URL}/api/auth/send-verification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            role: userType,
            ...formData
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const data = await response.json();

        if (data.success) {
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
        // Handle abort error separately
        if (error.name === 'AbortError') {
          Swal.fire({
            icon: 'error',
            title: 'Request Timeout',
            text: 'The request took too long. Please try again.',
            confirmButtonColor: '#3498db',
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Verification Failed',
            text: error.message || 'Failed to send verification code',
            confirmButtonColor: '#3498db',
          });
        }
      }
    } else {
      setErrors(newErrors);
    }
  };

  const handleVerifyAndRegister = async () => {
    console.log("DEEP")
    try {
      Swal.fire({
        title: 'Verifying...',
        text: 'Please wait while we verify your code',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
          Swal.showLoading();
        }
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const finalFormData = {
        email: formData.email,
        verificationCode,
        role: userType,
        ...formData,
        ...(userType === 'college' && {
          university: formData.university === 'other' ? formData.customUniversity : formData.university,
          accreditation: formData.accreditation === 'other' ? formData.customAccreditation : formData.accreditation
        })
      };

      const response = await fetch(`${API_BASE_URL}/api/auth/verify-and-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalFormData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Registration Successful!',
          text: 'You can now login to your account',
          confirmButtonColor: '#3498db',
        }).then(() => {
          navigate('/login');
        });
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch (error) {
      // Handle abort error separately
      if (error.name === 'AbortError') {
        Swal.fire({
          icon: 'error',
          title: 'Request Timeout',
          text: 'The request took too long. Please try again.',
          confirmButtonColor: '#3498db',
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Verification Failed',
          text: error.message || 'Failed to verify code',
          confirmButtonColor: '#3498db',
        });
      }
    }
  };


  return (
    <div className="registration-container">
      <div className="registration-glass">
        <div className="registration-header">
          <div className="registration-icon">
            {userType === 'student' ? <FaUserGraduate /> : <FaUniversity />}
          </div>
          <h1>{userType === 'student' ? 'Student Registration' : 'University Registration'}</h1>
          <p>Create your {userType} account in minutes</p>
        </div>

        <div className="registration-progress">
          <div className={`progress-step ${verificationStep === 'form' ? 'active' : ''}`}>
            <span>1</span>
            <p>Basic Information</p>
          </div>
          <div className={`progress-step ${verificationStep === 'code' ? 'active' : ''}`}>
            <span>2</span>
            <p>Email Verification</p>
          </div>
        </div>

        {verificationStep === 'form' ? (
          <form className="registration-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="input-group">
                <label htmlFor="name">
                  <FaUser className="input-icon" />
                  {userType === 'student' ? 'Full Name' : 'Institution Name'}
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe"
                />
                {errors.name && <span className="error-message"><FaExclamationCircle /> {errors.name}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="email">
                  <FaEnvelope className="input-icon" />
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="john@example.com"
                />
                {errors.email && <span className="error-message"><FaExclamationCircle /> {errors.email}</span>}
              </div>

              {userType === 'student' ? (
                <>
                  <div className="input-group">
                    <label htmlFor="dateOfBirth">
                      <FaCalendar className="input-icon" />
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      id="dateOfBirth"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                    />
                    {errors.dateOfBirth && <span className="error-message"><FaExclamationCircle /> {errors.dateOfBirth}</span>}
                  </div>

                  <div className="input-group">
                    <label htmlFor="gender">
                      <FaUser className="input-icon" />
                      Gender
                    </label>
                    <select
                      id="gender"
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.gender && <span className="error-message"><FaExclamationCircle /> {errors.gender}</span>}
                  </div>

                  <div className="input-group">
                    <label htmlFor="country">
                      <FaGlobe className="input-icon" />
                      Nationality
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Country</option>
                      {countries.map(code => (
                        <option key={code} value={code}>
                          {countryNames[code] || code}
                        </option>
                      ))}
                    </select>
                    {errors.country && <span className="error-message"><FaExclamationCircle /> {errors.country}</span>}
                  </div>
                </>
              ) : (
                <>
                  <div className="input-group">
                    <label htmlFor="country">
                      <FaGlobe className="input-icon" />
                      Institution Country
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Country</option>
                      {countries.map(code => (
                        <option key={code} value={code}>
                          {countryNames[code] || code}
                        </option>
                      ))}
                    </select>
                    {errors.country && <span className="error-message"><FaExclamationCircle /> {errors.country}</span>}
                  </div>

                  <div className="input-group">
                    <label htmlFor="university">
                      <FaUniversity className="input-icon" />
                      Institution Name
                    </label>
                    <select
                      id="university"
                      name="university"
                      value={formData.university}
                      onChange={handleInputChange}
                      disabled={!formData.country}
                    >
                      <option value="">Select Institution</option>
                      {universities.map((uni, index) => (
                        <option key={`${uni.name}-${index}`} value={uni.name}>
                          {uni.name}
                        </option>
                      ))}
                      <option value="other">Other Institution</option>
                    </select>
                    {errors.university && <span className="error-message"><FaExclamationCircle /> {errors.university}</span>}
                  </div>
                </>
              )}

              <div className="input-group">
                <label htmlFor="password">
                  <FaLock className="input-icon" />
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                />
                {errors.password && <span className="error-message"><FaExclamationCircle /> {errors.password}</span>}
              </div>

              <div className="input-group">
                <label htmlFor="confirmPassword">
                  <FaLock className="input-icon" />
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <span className="error-message"><FaExclamationCircle /> {errors.confirmPassword}</span>}
              </div>

              {userType === 'college' && (
                <div className="input-group">
                  <label htmlFor="phone">
                    <FaPhone className="input-icon" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 555-5555"
                    className={errors.phone ? 'error' : ''}
                  />
                  {errors.phone && <span className="error-message"><FaExclamationCircle /> {errors.phone}</span>}
                </div>
              )}

              {userType === 'college' && (
                <>
                  <div className="input-group">
                    <label htmlFor="registrationCertificate">
                      <FaFileUpload className="input-icon" />
                      Registration Certificate
                    </label>
                    <input
                      type="file"
                      id="registrationCertificate"
                      name="registrationCertificate"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="accreditationCertificate">
                      <FaFileUpload className="input-icon" />
                      Accreditation Certificate
                    </label>
                    <input
                      type="file"
                      id="accreditationCertificate"
                      name="accreditationCertificate"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                      required
                    />
                  </div>

                  <div className="input-group">
                    <label htmlFor="collegeLogo">
                      <FaImage className="input-icon" />
                      College Logo
                    </label>
                    <input
                      type="file"
                      id="collegeLogo"
                      name="collegeLogo"
                      onChange={handleFileChange}
                      accept="image/*"
                      required
                    />
                  </div>
                </>
              )}
            </div>

            <button type='submit' disabled={loading} className="registration-button" >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
        ) : (
          <div className="verification-container">
            <div className="verification-icon">
              <FaEnvelope />
            </div>
            <h2>Verify Your Email</h2>
            <p>We've sent a 6-digit code to <strong>{formData.email}</strong></p>

            <div className="code-input">
              <input
                type="text"
                placeholder="• • • • • •"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength="6"
              />
            </div>

            <div className="verification-actions">
              <button onClick={handleVerifyAndRegister} className="verify-button">
                Verify & Continue
              </button>
              <button onClick={handleSubmit} className="resend-button">
                Resend Code
              </button>
            </div>
          </div>
        )}

        <p className="login-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div >
  );
};

export default Register;
