import { useState, useEffect } from 'react';
import { FaBell, FaLock, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import StudentSidebar from '../Dashboard/StudentSidebar';
import Swal from 'sweetalert2';
import './StudentSettings.css';

const StudentSettings = () => {
  const [settings, setSettings] = useState({
    notifications: {
      emailAlerts: true,
      applicationUpdates: true,
      courseRecommendations: true,
      deadlineReminders: true
    },
    privacy: {
      showProfile: true,
      showEducation: true
    }
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/student/settings', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      if (data.success) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load settings',
        confirmButtonColor: '#3498db'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingToggle = async (category, setting) => {
    try {
      const newSettings = {
        ...settings,
        [category]: {
          ...settings[category],
          [setting]: !settings[category][setting]
        }
      };

      const response = await fetch('http://localhost:3000/api/student/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings: newSettings })
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const data = await response.json();
      if (data.success) {
        setSettings(newSettings);
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Settings updated successfully',
          confirmButtonColor: '#3498db',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update settings',
        confirmButtonColor: '#3498db'
      });
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'New passwords do not match',
        confirmButtonColor: '#3498db'
      });
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/api/student/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(passwordData)
      });

      if (!response.ok) {
        throw new Error('Failed to change password');
      }

      const data = await response.json();
      if (data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Password changed successfully',
          confirmButtonColor: '#3498db'
        });
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to change password',
        confirmButtonColor: '#3498db'
      });
    }
  };

  const ToggleSwitch = ({ checked, onChange }) => (
    <button 
      className={`toggle-switch ${checked ? 'active' : ''}`}
      onClick={onChange}
      type="button"
    >
      {checked ? <FaToggleOn /> : <FaToggleOff />}
    </button>
  );

  return (
    <div className="student-settings-layout">
      <StudentSidebar />
      
      <div className="settings-main">
        <h1>Settings</h1>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading settings...</p>
          </div>
        ) : (
          <div className="settings-sections">
            <section className="settings-section">
              <h2><FaBell /> Notification Preferences</h2>
              <div className="settings-grid">
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Email Alerts</h3>
                    <p>Receive important updates via email</p>
                  </div>
                  <ToggleSwitch
                    checked={settings.notifications.emailAlerts}
                    onChange={() => handleSettingToggle('notifications', 'emailAlerts')}
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Application Updates</h3>
                    <p>Get notified about your application status</p>
                  </div>
                  <ToggleSwitch
                    checked={settings.notifications.applicationUpdates}
                    onChange={() => handleSettingToggle('notifications', 'applicationUpdates')}
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Course Recommendations</h3>
                    <p>Receive personalized course suggestions</p>
                  </div>
                  <ToggleSwitch
                    checked={settings.notifications.courseRecommendations}
                    onChange={() => handleSettingToggle('notifications', 'courseRecommendations')}
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Deadline Reminders</h3>
                    <p>Get reminded about important deadlines</p>
                  </div>
                  <ToggleSwitch
                    checked={settings.notifications.deadlineReminders}
                    onChange={() => handleSettingToggle('notifications', 'deadlineReminders')}
                  />
                </div>
              </div>
            </section>

            <section className="settings-section">
              <h2><FaLock /> Privacy Settings</h2>
              <div className="settings-grid">
                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Profile Visibility</h3>
                    <p>Allow colleges to view your profile</p>
                  </div>
                  <ToggleSwitch
                    checked={settings.privacy.showProfile}
                    onChange={() => handleSettingToggle('privacy', 'showProfile')}
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <h3>Education Details</h3>
                    <p>Show your educational background</p>
                  </div>
                  <ToggleSwitch
                    checked={settings.privacy.showEducation}
                    onChange={() => handleSettingToggle('privacy', 'showEducation')}
                  />
                </div>
              </div>
            </section>

            <section className="settings-section">
              <h2><FaLock /> Change Password</h2>
              <form onSubmit={handlePasswordChange} className="password-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value
                    })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value
                    })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value
                    })}
                    required
                  />
                </div>

                <button type="submit" className="change-password-btn">
                  Change Password
                </button>
              </form>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSettings; 