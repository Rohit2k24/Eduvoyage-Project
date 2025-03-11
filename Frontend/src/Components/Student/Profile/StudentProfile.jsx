import { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaGraduationCap, FaPassport, FaSpinner, FaFileUpload, FaCamera, FaSave, FaPlus, FaTrash, FaMapMarkerAlt, FaCheckCircle, FaEdit, FaCalendarAlt, FaExternalLinkAlt, FaUniversity } from 'react-icons/fa';
import StudentSidebar from '../Sidebar/StudentSidebar';
import Swal from 'sweetalert2';
import axios from 'axios';
import './StudentProfile.css';
import { toast } from 'react-hot-toast';

// Configure axios
const axiosInstance = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
axiosInstance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

const StudentProfile = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    education: {
      qualifications: [{
        level: '',
        qualification: '',
        institute: '',
        board: '',
        yearOfCompletion: '',
        percentage: ''
      }],
      highestQualification: ''
    },
    passport: {
      number: '',
      expiryDate: '',
      document: null
    },
    bankStatement: {
      document: null,
      uploadDate: null,
      verified: false
    },
    address: '',
    profilePic: '',
    gender: '',
    dateOfBirth: ''
  });

  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ ...profile });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/student/profile');
      
      if (response.data.success) {
        const profileData = response.data.profile;
        setProfile({
          ...profileData,
          email: profileData.user.email || profileData.email
        });
        setFormData({
          ...formData,
          name: profileData.name || '',
          email: profileData.user.email || profileData.email || '',
          phone: profileData.phone || '',
          education: profileData.education || {
            qualifications: [{
              level: '',
              qualification: '',
              institute: '',
              board: '',
              yearOfCompletion: '',
              percentage: ''
            }],
            highestQualification: ''
          },
          passport: profileData.passport || {
            number: '',
            expiryDate: '',
            document: null
          },
          bankStatement: profileData.bankStatement || {
            document: null,
            uploadDate: null,
            verified: false
          },
          address: profileData.address || '',
          profilePic: profileData.profilePic || '',
          gender: profileData.gender || '',
          dateOfBirth: profileData.dateOfBirth || ''
        });

        if (profileData.profilePic) {
          setPreview(profileData.profilePic);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to load profile'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested fields
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Add separate handler for passport fields
  const handlePassportChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      passport: {
        ...prev.passport,
        [field]: value
      }
    }));
  };

  const handleProfilePicChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid file type',
          text: 'Please select an image file'
        });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File too large',
          text: 'Please select an image under 5MB'
        });
        return;
      }

      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const validatePassportNumber = (number) => {
    const passportRegex = /^[A-Z][0-9]{7}$/;
    return passportRegex.test(number);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      const data = { ...profile };
      
      // Handle file uploads
      if (selectedFile) {
        formData.append('profilePic', selectedFile);
      }
      if (formData.passport.document instanceof File) {
        formData.append('passportDocument', formData.passport.document);
      }
      if (formData.bankStatement?.document instanceof File) {
        formData.append('bankStatement', formData.bankStatement.document);
      }
      if (formData.education?.qualifications?.length > 0) {
        formData.education.qualifications.forEach((qual, index) => {
          if (qual.documents instanceof File) {
            formData.append(`educationDocuments[${index}]`, qual.documents);
          }
        });
      }
      
      // Append other profile data as JSON
      formData.append('data', JSON.stringify(data));
      
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/student/profile`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setProfile(response.data.profile);
        setEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Error updating profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update the passport document input handler
  const handlePassportDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File too large',
          text: 'Please select a document under 5MB'
        });
        return;
      }

      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid file type',
          text: 'Please select a PDF or image file'
        });
        return;
      }

      handlePassportChange('document', file);
    }
  };

  const addQualification = () => {
    setFormData(prev => ({
      ...prev,
      education: {
        ...prev.education,
        qualifications: [
          ...(prev.education?.qualifications || []),
          {
            level: '',
            qualification: '',
            institute: '',
            board: '',
            yearOfCompletion: '',
            percentage: '',
            documents: null
          }
        ]
      }
    }));
  };

  const removeQualification = (index) => {
    if (formData.education?.qualifications?.length > 1) {
      setFormData(prev => ({
        ...prev,
        education: {
          ...prev.education,
          qualifications: prev.education.qualifications.filter((_, i) => i !== index)
        }
      }));
    }
  };

  const handleEducationChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      education: {
        ...prev.education,
        qualifications: (prev.education?.qualifications || []).map((qual, i) => {
          if (i === index) {
            return { ...qual, [field]: value };
          }
          return qual;
        })
      }
    }));
  };

  const handleEducationDocumentChange = (index, file) => {
    handleEducationChange(index, 'documents', file);
  };

  const isPassportValid = (expiryDate) => {
    if (!expiryDate) return false;
    const today = new Date();
    const expiry = new Date(expiryDate);
    return expiry > today;
  };

  // Add bank statement document handler
  const handleBankStatementChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File too large',
          text: 'Please select a document under 5MB'
        });
        return;
      }

      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid file type',
          text: 'Please select a PDF or image file'
        });
        return;
      }

      setFormData(prev => ({
        ...prev,
        bankStatement: {
          ...prev.bankStatement,
          document: file,
          uploadDate: new Date().toISOString()
        }
      }));
    }
  };

  return (
    <div className="profile-layout">
      <StudentSidebar />
      
      <div className="profile-main">
        <h1>My Profile</h1>

        {loading ? (
          <div className="loading">
            <FaSpinner className="spinner" />
            <p>Loading profile...</p>
          </div>
        ) : (
          <div className="profile-content">
            <div className="avatar-upload-section">
              <div className="avatar-preview">
                <img 
                  src={preview || profile.profilePic || '/default-avatar.png'} 
                  alt="Profile" 
                />
                {editing && (
                  <label className="upload-overlay" title="Change profile picture">
                    <FaCamera />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePicChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
              {editing && selectedFile && (
                <div className="file-info">
                  <span>{selectedFile.name}</span>
                  <button 
                    type="button" 
                    className="remove-file"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreview(profile.profilePic || '/default-avatar.png');
                    }}
                  >
                    <FaTrash />
                  </button>
                </div>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-group">
                  <label><FaUser /> Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label><FaEnvelope /> Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label><FaPhone /> Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="education-section">
                  <h3>
                    <FaGraduationCap /> Education Details
                    <button 
                      type="button" 
                      onClick={addQualification}
                      className="add-qualification-btn"
                    >
                      <FaPlus /> Add Qualification
                    </button>
                  </h3>

                  {formData.education?.qualifications?.map((qualification, index) => (
                    <div key={index} className="qualification-card">
                      <div className="qualification-header">
                        <h4>Qualification {index + 1}</h4>
                        {index > 0 && (
                          <button 
                            type="button" 
                            onClick={() => removeQualification(index)}
                            className="remove-qualification-btn"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Level</label>
                          <select
                            value={qualification.level}
                            onChange={(e) => handleEducationChange(index, 'level', e.target.value)}
                            required
                          >
                            <option value="">Select Level</option>
                            <option value="10th">10th</option>
                            <option value="12th">12th</option>
                            <option value="diploma">Diploma</option>
                            <option value="bachelor">Bachelor's Degree</option>
                            <option value="master">Master's Degree</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Qualification Name</label>
                          <input
                            type="text"
                            value={qualification.qualification}
                            onChange={(e) => handleEducationChange(index, 'qualification', e.target.value)}
                            placeholder="e.g., SSLC, HSC, B.Tech"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Institute Name</label>
                        <input
                          type="text"
                          value={qualification.institute}
                          onChange={(e) => handleEducationChange(index, 'institute', e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Board/University</label>
                        <input
                          type="text"
                          value={qualification.board}
                          onChange={(e) => handleEducationChange(index, 'board', e.target.value)}
                          required
                        />
                      </div>

                      <div className="form-row">
                        <div className="form-group">
                          <label>Year of Completion</label>
                          <input
                            type="number"
                            value={qualification.yearOfCompletion}
                            onChange={(e) => handleEducationChange(index, 'yearOfCompletion', e.target.value)}
                            min="1900"
                            max={new Date().getFullYear()}
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Percentage/CGPA</label>
                          <input
                            type="text"
                            value={qualification.percentage}
                            onChange={(e) => handleEducationChange(index, 'percentage', e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Documents</label>
                        <div className="document-upload">
                          <label className="file-upload-label">
                            <FaFileUpload className="icon" />
                            Upload Certificate
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => handleEducationDocumentChange(index, e.target.files[0])}
                              style={{ display: 'none' }}
                            />
                          </label>
                          {qualification.documents && (
                            <span className="file-name">
                              {qualification.documents instanceof File 
                                ? qualification.documents.name 
                                : 'Document uploaded'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <section className="profile-section">
                  <h3><FaPassport /> Passport Details</h3>
                  <div className="form-group">
                    <label>Passport Number</label>
                    <input
                      type="text"
                      value={formData.passport.number || ''}
                      onChange={(e) => handlePassportChange('number', e.target.value)}
                      pattern="[A-Z][0-9]{7}"
                      title="Please enter a valid passport number (e.g., A1234567)"
                    />
                    {formData.passport.verified && (
                      <span className="verification-badge">
                        <FaCheckCircle /> Verified
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Passport Expiry Date</label>
                    <div className="date-input-container">
                      <input
                        type="date"
                        value={formData.passport.expiryDate || ''}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => handlePassportChange('expiryDate', e.target.value)}
                      />
                      {formData.passport.expiryDate && (
                        <span className={`passport-status ${isPassportValid(formData.passport.expiryDate) ? 'valid' : 'expired'}`}>
                          {isPassportValid(formData.passport.expiryDate) ? 'Valid' : 'Expired'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="document-upload">
                    <label className="file-upload-label">
                      <FaFileUpload className="icon" />
                      Upload Passport Document
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handlePassportDocumentChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {formData.passport.document && (
                      <div className="document-info">
                        <span className="file-name">
                          {formData.passport.document instanceof File 
                            ? formData.passport.document.name 
                            : 'Document uploaded'}
                        </span>
                        {!(formData.passport.document instanceof File) && (
                          <a 
                            href={formData.passport.document}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="document-link"
                          >
                            View Current Document <FaExternalLinkAlt />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </section>

                <section className="profile-section">
                  <h3><FaUniversity /> Bank Statement</h3>
                  <div className="document-upload">
                    <label className="file-upload-label">
                      <FaFileUpload className="icon" />
                      Upload Bank Statement
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleBankStatementChange}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {formData.bankStatement?.document && (
                      <div className="document-info">
                        <span className="file-name">
                          {formData.bankStatement.document instanceof File 
                            ? formData.bankStatement.document.name 
                            : 'Document uploaded'}
                        </span>
                        {!(formData.bankStatement.document instanceof File) && (
                          <a 
                            href={formData.bankStatement.document}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="document-link"
                          >
                            View Current Statement <FaExternalLinkAlt />
                          </a>
                        )}
                      </div>
                    )}
                    {formData.bankStatement?.verified && (
                      <span className="verification-badge">
                        <FaCheckCircle /> Verified
                      </span>
                    )}
                    {formData.bankStatement?.uploadDate && (
                      <div className="upload-date">
                        Uploaded on: {new Date(formData.bankStatement.uploadDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </section>

                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label>Gender</label>
                  <select
                    name="gender"
                    value={formData.gender || ''}
                    onChange={handleInputChange}
                    required
                    className="form-control"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button type="submit" className="save-btn" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : <><FaSave /> Save Changes</>}
                  </button>
                  <button type="button" className="cancel-btn" onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="profile-details">
                <div className="profile-section">
                  <h3>Personal Information</h3>
                  <div className="info-item">
                    <FaUser className="icon" />
                    <div>
                      <label>Full Name</label>
                      <p>{profile?.name}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <FaEnvelope className="icon" />
                    <div>
                      <label>Email</label>
                      <p>{profile?.email}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <FaPhone className="icon" />
                    <div>
                      <label>Phone</label>
                      <p>{profile?.phone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="info-item">
                    <span className="label">Gender:</span>
                    <span className="value">
                      {profile?.gender ? 
                        profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) 
                        : 'Not specified'}
                    </span>
                  </div>
                </div>

                <div className="profile-section">
                  <h3>Education Details</h3>
                  {profile?.education?.qualifications?.length > 0 ? (
                    profile.education.qualifications.map((qual, index) => (
                      <div key={index} className="qualification-display">
                        <h4>{qual.level} - {qual.qualification}</h4>
                        <div className="qualification-details">
                          <div className="info-item">
                            <label>Institute</label>
                            <p>{qual.institute}</p>
                          </div>
                          <div className="info-item">
                            <label>Board/University</label>
                            <p>{qual.board}</p>
                          </div>
                          <div className="info-row">
                            <div className="info-item">
                              <label>Year of Completion</label>
                              <p>{qual.yearOfCompletion}</p>
                            </div>
                            <div className="info-item">
                              <label>Percentage/CGPA</label>
                              <p>{qual.percentage}</p>
                            </div>
                          </div>
                          {qual.documents && (
                            <div className="info-item">
                              <label>Documents</label>
                              <a href={qual.documents} target="_blank" rel="noopener noreferrer">
                                View Certificate
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="no-data">No education details provided</p>
                  )}
                </div>

                <div className="profile-section">
                  <h3><FaPassport /> Passport Details</h3>
                  <div className="info-item">
                    <FaPassport className="icon" />
                    <div>
                      <label>Passport Number</label>
                      <p>{profile?.passport?.number || 'Not provided'}</p>
                      {profile?.passport?.verified && (
                        <span className="verification-badge">
                          <FaCheckCircle /> Verified
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="info-item">
                    <FaCalendarAlt className="icon" />
                    <div>
                      <label>Expiry Date</label>
                      <p>
                        {profile?.passport?.expiryDate ? (
                          <>
                            {new Date(profile.passport.expiryDate).toLocaleDateString()}
                            <span className={`passport-status ${isPassportValid(profile.passport.expiryDate) ? 'valid' : 'expired'}`}>
                              {isPassportValid(profile.passport.expiryDate) ? 'Valid' : 'Expired'}
                            </span>
                          </>
                        ) : (
                          'Not provided'
                        )}
                      </p>
                    </div>
                  </div>

                  {profile?.passport?.document && (
                    <div className="info-item">
                      <FaFileUpload className="icon" />
                      <div>
                        <label>Passport Document</label>
                        <a 
                          href={profile.passport.document}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="document-link"
                        >
                          View Document <FaExternalLinkAlt />
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="profile-section">
                  <h3><FaUniversity /> Bank Statement</h3>
                  {profile?.bankStatement?.document ? (
                    <div className="info-item">
                      <FaFileUpload className="icon" />
                      <div>
                        <label>Bank Statement</label>
                        <a 
                          href={profile.bankStatement.document}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="document-link"
                        >
                          View Statement <FaExternalLinkAlt />
                        </a>
                        {profile.bankStatement.verified && (
                          <span className="verification-badge">
                            <FaCheckCircle /> Verified
                          </span>
                        )}
                        {profile.bankStatement.uploadDate && (
                          <div className="upload-date">
                            Uploaded on: {new Date(profile.bankStatement.uploadDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="no-data">No bank statement uploaded</p>
                  )}
                </div>

                <button className="edit-btn" onClick={() => setEditing(true)}>
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile; 