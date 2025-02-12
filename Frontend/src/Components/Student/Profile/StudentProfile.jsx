import { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaGraduationCap, FaPassport, FaSpinner, FaFileUpload, FaCamera, FaSave } from 'react-icons/fa';
import StudentSidebar from '../Sidebar/StudentSidebar';
import Swal from 'sweetalert2';
import axios from 'axios';
import './StudentProfile.css';

const StudentProfile = () => {
  const [profile, setProfile] = useState({
    name: 'Loading...',
    email: 'Loading...',
    phone: '',
    education: {},
    passport: {},
    address: '',
    profilePic: ''
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    education: {
      highestQualification: '',
      institute: '',
      yearOfCompletion: '',
      percentage: ''
    },
    passport: {
      number: '',
      document: null,
      expiryDate: ''
    },
    address: '',
    profilePic: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/student/profile', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setProfile(response.data.profile);
      setFormData({
        name: response.data.profile.name,
        email: response.data.profile.email,
        phone: response.data.profile.phone || '',
        education: response.data.profile.education || {
          highestQualification: '',
          institute: '',
          yearOfCompletion: '',
          percentage: ''
        },
        passport: response.data.profile.passport || {
          number: '',
          document: null,
          expiryDate: ''
        },
        address: response.data.profile.address || '',
        profilePic: response.data.profile.profilePic || ''
      });
      if (response.data.profile.profilePic) setPreview(response.data.profile.profilePic);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setLoading(false);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load profile',
        confirmButtonColor: '#3498db'
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('education.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        education: {
          ...prev.education,
          [field]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const validatePassportNumber = (number) => {
    const passportRegex = /^[A-Z][0-9]{7}$/;
    return passportRegex.test(number);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('education', JSON.stringify(formData.education));
      formDataToSend.append('passportNumber', formData.passport.number);
      formDataToSend.append('passportExpiryDate', formData.passport.expiryDate);
      if (formData.passport.document) {
        formDataToSend.append('passportDocument', formData.passport.document);
      }
      if (selectedFile) formDataToSend.append('profilePic', selectedFile);
      formDataToSend.append('address', formData.address);

      const response = await axios.put('/api/student/profile', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      setProfile(response.data.profile);
      setFormData({
        name: response.data.profile.name,
        email: response.data.profile.email,
        phone: response.data.profile.phone || '',
        education: response.data.profile.education || {
          highestQualification: '',
          institute: '',
          yearOfCompletion: '',
          percentage: ''
        },
        passport: response.data.profile.passport || {
          number: '',
          document: null,
          expiryDate: ''
        },
        address: response.data.profile.address || '',
        profilePic: response.data.profile.profilePic || ''
      });
      setSelectedFile(null);
      setPreview('');
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Profile updated successfully',
        confirmButtonColor: '#3498db'
      });
      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Update profile error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to update profile',
        confirmButtonColor: '#3498db'
      });
    } finally {
      setLoading(false);
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
                  <h3><FaGraduationCap /> Education Details</h3>
                  <div className="form-group">
                    <label>Highest Qualification</label>
                    <input
                      type="text"
                      name="education.highestQualification"
                      value={formData.education.highestQualification}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Institute</label>
                    <input
                      type="text"
                      name="education.institute"
                      value={formData.education.institute}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Year of Completion</label>
                      <input
                        type="number"
                        name="education.yearOfCompletion"
                        value={formData.education.yearOfCompletion}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="form-group">
                      <label>Percentage/CGPA</label>
                      <input
                        type="text"
                        name="education.percentage"
                        value={formData.education.percentage}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>

                <section className="profile-section">
                  <h3><FaPassport /> Passport Details</h3>
                  <div className="form-group">
                    <label>Passport Number</label>
                    <input
                      type="text"
                      value={formData.passport.number}
                      onChange={(e) => {
                        const value = e.target.value.toUpperCase();
                        if (value === '' || /^[A-Z][0-9]*$/.test(value)) {
                          setFormData({
                            ...formData,
                            passport: {
                              ...formData.passport,
                              number: value
                            }
                          });
                        }
                      }}
                      placeholder="Format: A1234567"
                      maxLength={8}
                    />
                    {formData.passport.number && !validatePassportNumber(formData.passport.number) && (
                      <span className="validation-error">
                        Invalid passport number format. Should be 1 letter followed by 7 digits.
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Passport Expiry Date</label>
                    <input
                      type="date"
                      value={formData.passport.expiryDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setFormData({
                        ...formData,
                        passport: {
                          ...formData.passport,
                          expiryDate: e.target.value
                        }
                      })}
                    />
                  </div>

                  <div className="document-upload">
                    <label className="file-upload-label">
                      <FaFileUpload className="icon" />
                      Upload Passport Document
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            setFormData({
                              ...formData,
                              passport: {
                                ...formData.passport,
                                document: file
                              }
                            });
                          }
                        }}
                        style={{ display: 'none' }}
                      />
                    </label>
                    {formData.passport.document && (
                      <span className="file-name">{formData.passport.document.name}</span>
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

                <div className="avatar-upload-section">
                  <div className="avatar-preview">
                    {preview ? (
                      <img src={preview} alt="Profile preview" />
                    ) : (
                      <FaUser className="default-avatar" />
                    )}
                    <label className="upload-overlay">
                      <FaCamera />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        hidden
                      />
                    </label>
                  </div>
                  {selectedFile && (
                    <p className="file-info">Selected file: {selectedFile.name}</p>
                  )}
                </div>

                <div className="form-actions">
                  <button type="submit" className="save-btn" disabled={loading}>
                    {loading ? 'Saving...' : (
                      <>
                        <FaSave /> Save Changes
                      </>
                    )}
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
                </div>

                <div className="profile-section">
                  <h3>Education Details</h3>
                  {profile?.education ? (
                    <>
                      <div className="info-item">
                        <FaGraduationCap className="icon" />
                        <div>
                          <label>Highest Qualification</label>
                          <p>{profile.education.highestQualification}</p>
                        </div>
                      </div>
                      <div className="info-item">
                        <div>
                          <label>Institute</label>
                          <p>{profile.education.institute}</p>
                        </div>
                      </div>
                      <div className="info-row">
                        <div className="info-item">
                          <div>
                            <label>Year of Completion</label>
                            <p>{profile.education.yearOfCompletion}</p>
                          </div>
                        </div>
                        <div className="info-item">
                          <div>
                            <label>Percentage/CGPA</label>
                            <p>{profile.education.percentage}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="no-data">No education details provided</p>
                  )}
                </div>

                <section className="profile-section">
                  <h3><FaPassport /> Passport Details</h3>
                  <div className="info-row">
                    <div className="info-item">
                      <FaPassport className="icon" />
                      <div>
                        <label>Passport Number</label>
                        <p>{profile?.passport?.number || 'Not provided'}</p>
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
                            View Document
                          </a>
                        </div>
                      </div>
                    )}
                    {profile?.passport?.digilockerVerified && (
                      <div className="verification-badge">
                        <span className="verified">Verified via DigiLocker</span>
                      </div>
                    )}
                  </div>
                </section>

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