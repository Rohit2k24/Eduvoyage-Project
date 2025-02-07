import { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaGraduationCap, FaEdit, FaCamera } from 'react-icons/fa';
import StudentSidebar from '../Dashboard/StudentSidebar';
import Swal from 'sweetalert2';
import './StudentProfile.css';

const StudentProfile = () => {
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    education: {
      highestQualification: '',
      institute: '',
      yearOfCompletion: '',
      percentage: ''
    },
    profileImage: null
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/student/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      const data = await response.json();
      if (data.success) {
        setProfile(data.profile);
        setImagePreview(data.profile.profileImage);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load profile',
        confirmButtonColor: '#3498db'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setProfile(prev => ({ ...prev, profileImage: file }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.keys(profile).forEach(key => {
        if (key === 'education') {
          Object.keys(profile.education).forEach(eduKey => {
            formData.append(`education[${eduKey}]`, profile.education[eduKey]);
          });
        } else if (key === 'profileImage' && profile[key] instanceof File) {
          formData.append('profileImage', profile[key]);
        } else {
          formData.append(key, profile[key]);
        }
      });

      const response = await fetch('http://localhost:3000/api/student/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Profile updated successfully',
          confirmButtonColor: '#3498db'
        });
        setEditing(false);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update profile',
        confirmButtonColor: '#3498db'
      });
    }
  };

  return (
    <div className="student-profile-layout">
      <StudentSidebar />
      
      <div className="profile-main">
        <div className="profile-header">
          <h1>My Profile</h1>
          <button 
            className={`edit-button ${editing ? 'active' : ''}`}
            onClick={() => setEditing(!editing)}
          >
            <FaEdit /> {editing ? 'Cancel Editing' : 'Edit Profile'}
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading profile...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="profile-image-section">
              <div className="profile-image-container">
                <img 
                  src={imagePreview || '/default-avatar.png'} 
                  alt={profile.name} 
                  className="profile-image"
                />
                {editing && (
                  <label className="image-upload-label">
                    <FaCamera />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
            </div>

            <div className="profile-sections">
              <section className="profile-section">
                <h2>Personal Information</h2>
                <div className="form-group">
                  <label>
                    <FaUser /> Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    disabled={!editing}
                  />
                </div>

                <div className="form-group">
                  <label>
                    <FaEnvelope /> Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label>
                    <FaPhone /> Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                    disabled={!editing}
                  />
                </div>
              </section>

              <section className="profile-section">
                <h2>Educational Background</h2>
                <div className="form-group">
                  <label>
                    <FaGraduationCap /> Highest Qualification
                  </label>
                  <input
                    type="text"
                    value={profile.education.highestQualification}
                    onChange={(e) => setProfile({
                      ...profile,
                      education: {
                        ...profile.education,
                        highestQualification: e.target.value
                      }
                    })}
                    disabled={!editing}
                  />
                </div>

                <div className="form-group">
                  <label>Institute</label>
                  <input
                    type="text"
                    value={profile.education.institute}
                    onChange={(e) => setProfile({
                      ...profile,
                      education: {
                        ...profile.education,
                        institute: e.target.value
                      }
                    })}
                    disabled={!editing}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Year of Completion</label>
                    <input
                      type="number"
                      value={profile.education.yearOfCompletion}
                      onChange={(e) => setProfile({
                        ...profile,
                        education: {
                          ...profile.education,
                          yearOfCompletion: e.target.value
                        }
                      })}
                      disabled={!editing}
                    />
                  </div>

                  <div className="form-group">
                    <label>Percentage/CGPA</label>
                    <input
                      type="text"
                      value={profile.education.percentage}
                      onChange={(e) => setProfile({
                        ...profile,
                        education: {
                          ...profile.education,
                          percentage: e.target.value
                        }
                      })}
                      disabled={!editing}
                    />
                  </div>
                </div>
              </section>
            </div>

            {editing && (
              <div className="form-actions">
                <button type="submit" className="save-button">
                  Save Changes
                </button>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default StudentProfile; 