import { useState, useEffect } from 'react';
import { FaUser, FaEnvelope, FaPhone, FaGlobe, FaMapMarkerAlt, FaUniversity, FaSave } from 'react-icons/fa';
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
    notifications: {
      email: true,
      application: true,
      payment: true
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/college/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        console.log('Fetched settings:', data.data);
        setSettings(data.data);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/college/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Settings updated successfully'
        });
      } else {
        throw new Error(data.message);
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