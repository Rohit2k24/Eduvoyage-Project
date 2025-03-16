import { useState, useEffect } from 'react';
import { 
  FaUser, FaEnvelope, FaPhone, FaGlobe, FaMapMarkerAlt, 
  FaUniversity, FaSave, FaCalendarAlt, FaCertificate, 
  FaImage, FaBuilding, FaUpload, FaPlus, FaTrash
} from 'react-icons/fa';
import CollegeSidebar from '../CollegeDashboard/CollegeSidebar';
import Swal from 'sweetalert2';
import './Settings.css';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    name: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    description: '',
    location: '',
    university: '',
    establishmentYear: '',
    accreditation: '',
    facilities: [],
    notifications: {
      email: true,
      application: true,
      payment: true
    },
    documents: {}
  });

  const [files, setFiles] = useState({
    collegeLogo: null,
    collegeImages: [],
    registrationCertificate: null,
    accreditationCertificate: null
  });

  const [previews, setPreviews] = useState({
    collegeLogo: '',
    collegeImages: [],
    registrationCertificate: '',
    accreditationCertificate: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/college/settings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        console.log('Fetched settings:', data.data);
        
        // Parse facilities if it's a string
        let parsedFacilities = [];
        try {
          if (typeof data.data.facilities === 'string') {
            parsedFacilities = JSON.parse(data.data.facilities);
          } else if (Array.isArray(data.data.facilities)) {
            parsedFacilities = data.data.facilities;
          }
        } catch (error) {
          console.error('Error parsing facilities:', error);
        }
        
        // Set settings with all fields
        setSettings({
          name: data.data.name || '',
          email: data.data.email || '',
          phone: data.data.phone || '',
          website: data.data.website || '',
          address: data.data.address || '',
          description: data.data.description || '',
          location: data.data.location || '',
          university: data.data.university || '',
          establishmentYear: data.data.establishmentYear || '',
          accreditation: data.data.accreditation || '',
          facilities: parsedFacilities,
          notifications: data.data.notifications || {
            email: true,
            application: true,
            payment: true
          },
          documents: data.data.documents || {}
        });

        // Set document previews
        if (data.data.documents) {
          setPreviews({
            collegeLogo: data.data.documents.collegeLogo || '',
            collegeImages: Array.isArray(data.data.documents.collegeImages) 
              ? data.data.documents.collegeImages 
              : [],
            registrationCertificate: data.data.documents.registrationCertificate || '',
            accreditationCertificate: data.data.documents.accreditationCertificate || ''
          });
        }
      } else {
        throw new Error(data.message || 'Failed to fetch settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to load settings'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('notifications.')) {
      const notificationType = name.split('.')[1];
      setSettings(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [notificationType]: checked
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileUpload = async (file, folder) => {
    try {
      // Get upload signature from backend
      const signatureRes = await fetch(`${import.meta.env.VITE_API_URL}/api/college/upload-signature?folder=${folder}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const signatureData = await signatureRes.json();

      if (!signatureData.success) {
        throw new Error('Failed to get upload signature');
      }

      // Prepare form data for Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', signatureData.data.apiKey);
      formData.append('timestamp', signatureData.data.timestamp);
      formData.append('signature', signatureData.data.signature);
      formData.append('folder', signatureData.data.folder);

      // Upload to Cloudinary
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signatureData.data.cloudName}/auto/upload`, {
        method: 'POST',
        body: formData
      });
      const uploadData = await uploadRes.json();

      return uploadData.secure_url;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleFileChange = async (e) => {
    const { name, files: uploadedFiles } = e.target;
    
    try {
      if (name === 'collegeImages') {
        // Show loading indicator
        Swal.fire({
          title: 'Uploading Images',
          text: 'Please wait while we upload your images...',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const uploadPromises = Array.from(uploadedFiles).map(file => 
          handleFileUpload(file, 'college_images')
        );
        const uploadedUrls = await Promise.all(uploadPromises);
        
        setFiles(prev => ({
          ...prev,
          [name]: uploadedFiles
        }));
        
        // Append new URLs to existing ones
        setPreviews(prev => ({
          ...prev,
          [name]: [...(prev.collegeImages || []), ...uploadedUrls]
        }));

        // Update settings with new URLs
        setSettings(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            collegeImages: [...(prev.documents?.collegeImages || []), ...uploadedUrls]
          }
        }));

        // Close loading indicator and show success message
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Images uploaded successfully'
        });
      } else {
        const uploadedUrl = await handleFileUpload(uploadedFiles[0], name);
        
        setFiles(prev => ({
          ...prev,
          [name]: uploadedFiles[0]
        }));
        
        setPreviews(prev => ({
          ...prev,
          [name]: uploadedUrl
        }));

        // Update settings with new URL
        setSettings(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            [name]: uploadedUrl
          }
        }));
      }
    } catch (error) {
      console.error('File upload error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: 'Failed to upload file. Please try again.'
      });
    }
  };

  const handleRemoveImage = (index) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        setPreviews(prev => ({
          ...prev,
          collegeImages: prev.collegeImages.filter((_, i) => i !== index)
        }));

        setSettings(prev => ({
          ...prev,
          documents: {
            ...prev.documents,
            collegeImages: prev.documents.collegeImages.filter((_, i) => i !== index)
          }
        }));

        Swal.fire(
          'Deleted!',
          'The image has been removed.',
          'success'
        );
      }
    });
  };

  const handleFacilityAdd = () => {
    setSettings(prev => ({
      ...prev,
      facilities: [...(prev.facilities || []), '']
    }));
  };

  const handleFacilityChange = (index, value) => {
    setSettings(prev => {
      const updatedFacilities = [...(prev.facilities || [])];
      updatedFacilities[index] = value;
      return {
        ...prev,
        facilities: updatedFacilities
      };
    });
  };

  const handleFacilityRemove = (index) => {
    setSettings(prev => ({
      ...prev,
      facilities: prev.facilities.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare the settings data
      const settingsData = {
        name: settings.name,
        email: settings.email,
        phone: settings.phone,
        website: settings.website,
        address: settings.address,
        description: settings.description,
        location: settings.location,
        university: settings.university,
        establishmentYear: settings.establishmentYear,
        accreditation: settings.accreditation,
        facilities: settings.facilities,
        notifications: settings.notifications,
        documents: {
          collegeLogo: previews.collegeLogo,
          collegeImages: previews.collegeImages,
          registrationCertificate: previews.registrationCertificate,
          accreditationCertificate: previews.accreditationCertificate
        }
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/college/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settingsData)
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Settings updated successfully'
        });
        await fetchSettings(); // Refresh settings
      } else {
        throw new Error(data.message || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'Failed to update settings'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="college-dashboard-layout">
      <CollegeSidebar />
      <div className="settings-main">
        <div className="settings-container">
          <h2>College Settings</h2>

          {loading ? (
            <div className="loading">Loading settings...</div>
          ) : (
            <form onSubmit={handleSubmit} className="settings-form">
              <div className="form-section">
                <h3>Basic Information</h3>
                
                <div className="form-group">
                  <label>
                    <FaUser className="icon" />
                    College Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={settings.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    <FaUniversity className="icon" />
                    University
                  </label>
                  <input
                    type="text"
                    name="university"
                    value={settings.university}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    <FaCalendarAlt className="icon" />
                    Establishment Year
                  </label>
                  <input
                    type="number"
                    name="establishmentYear"
                    value={settings.establishmentYear}
                    onChange={handleInputChange}
                    min="1800"
                    max={new Date().getFullYear()}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    <FaCertificate className="icon" />
                    Accreditation
                  </label>
                  <input
                    type="text"
                    name="accreditation"
                    value={settings.accreditation}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Contact Information</h3>

                <div className="form-group">
                  <label>
                    <FaEnvelope className="icon" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={settings.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    <FaPhone className="icon" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={settings.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    <FaGlobe className="icon" />
                    Website
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={settings.website}
                    onChange={handleInputChange}
                    placeholder="https://"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <FaMapMarkerAlt className="icon" />
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={settings.location}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    <FaMapMarkerAlt className="icon" />
                    Full Address
                  </label>
                  <textarea
                    name="address"
                    value={settings.address}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>College Details</h3>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={settings.description}
                    onChange={handleInputChange}
                    rows="4"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="facilities-label">
                    <FaBuilding className="icon" />
                    Facilities
                    <button 
                      type="button" 
                      className="add-facility-btn"
                      onClick={handleFacilityAdd}
                    >
                      <FaPlus /> Add Facility
                    </button>
                  </label>
                  
                  <div className="facilities-list">
                    {Array.isArray(settings.facilities) && settings.facilities.map((facility, index) => (
                      <div key={index} className="facility-item">
                        <div className="facility-inputs">
                          <input
                            type="text"
                            placeholder="Enter Facility Name"
                            value={facility || ''}
                            onChange={(e) => handleFacilityChange(index, e.target.value)}
                            required
                          />
                          <button 
                            type="button"
                            className="remove-facility-btn"
                            onClick={() => handleFacilityRemove(index)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    ))}
                    {(!settings.facilities || settings.facilities.length === 0) && (
                      <div className="no-facilities">
                        No facilities added. Click "Add Facility" to add one.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3>Documents & Images</h3>

                <div className="form-group file-upload">
                  <label>
                    <FaImage className="icon" />
                    College Logo
                  </label>
                  <input
                    type="file"
                    name="collegeLogo"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                  {previews.collegeLogo && (
                    <div className="image-preview">
                      <img src={previews.collegeLogo} alt="College Logo" />
                    </div>
                  )}
                </div>

                <div className="form-group file-upload">
                  <label>
                    <FaImage className="icon" />
                    College Images
                  </label>
                  <div className="upload-instructions">
                    You can upload multiple images of your college (classrooms, labs, campus, etc.)
                  </div>
                  <input
                    type="file"
                    name="collegeImages"
                    onChange={handleFileChange}
                    accept="image/*"
                    multiple
                    className="file-input"
                  />
                  <div className="image-preview-grid">
                    {previews.collegeImages && previews.collegeImages.map((url, index) => (
                      <div key={index} className="image-preview-item">
                        <img src={url} alt={`College Image ${index + 1}`} />
                        <button
                          type="button"
                          className="remove-image-btn"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-group file-upload">
                  <label>
                    <FaUpload className="icon" />
                    Registration Certificate
                  </label>
                  <input
                    type="file"
                    name="registrationCertificate"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {previews.registrationCertificate && (
                    <div className="file-preview">
                      <a href={previews.registrationCertificate} target="_blank" rel="noopener noreferrer">
                        View Current Certificate
                      </a>
                    </div>
                  )}
                </div>

                <div className="form-group file-upload">
                  <label>
                    <FaUpload className="icon" />
                    Accreditation Certificate
                  </label>
                  <input
                    type="file"
                    name="accreditationCertificate"
                    onChange={handleFileChange}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  {previews.accreditationCertificate && (
                    <div className="file-preview">
                      <a href={previews.accreditationCertificate} target="_blank" rel="noopener noreferrer">
                        View Current Certificate
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-section">
                <h3>Notification Preferences</h3>
                
                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="notifications.email"
                      checked={settings.notifications.email}
                      onChange={handleInputChange}
                    />
                    Email Notifications
                  </label>
                </div>

                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="notifications.application"
                      checked={settings.notifications.application}
                      onChange={handleInputChange}
                    />
                    Application Updates
                  </label>
                </div>

                <div className="checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      name="notifications.payment"
                      checked={settings.notifications.payment}
                      onChange={handleInputChange}
                    />
                    Payment Notifications
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="save-btn" disabled={loading}>
                  <FaSave className="icon" />
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings; 