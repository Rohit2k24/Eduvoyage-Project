import { useState, useEffect } from 'react';
import { FaBell, FaLock, FaPalette, FaGlobe, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import StudentSidebar from '../Sidebar/StudentSidebar';
import Swal from 'sweetalert2';
import './StudentSettings.css';

const defaultSettings = {
  notifications: {
    emailAlerts: true,
    applicationUpdates: true,
    courseRecommendations: true,
    deadlineReminders: true
  },
  privacy: {
    showProfile: true,
    showEducation: true
  },
  appearance: {
    darkMode: false,
    fontSize: 'medium'
  }
};

const StudentSettings = () => {
  const [settings, setSettings] = useState(defaultSettings);

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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/student/settings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      if (data.success) {
        setSettings({
          notifications: { ...defaultSettings.notifications, ...data.settings.notifications },
          privacy: { ...defaultSettings.privacy, ...data.settings.privacy },
          appearance: { ...defaultSettings.appearance, ...data.settings.appearance }
        });
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

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/student/settings`, {
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
        title: 'Password Mismatch',
        text: 'New password and confirm password do not match',
        confirmButtonColor: '#3498db'
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/student/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (!response.ok) {
        throw new Error('Failed to change password');
      }

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      Swal.fire({
        icon: 'success',
        title: 'Password Updated',
        text: 'Your password has been changed successfully',
        confirmButtonColor: '#3498db'
      });
    } catch (error) {
      console.error('Password change error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to change password. Please try again.',
        confirmButtonColor: '#3498db'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationChange = async (e) => {
    const { name, checked } = e.target;
    const newNotifications = {
      ...settings.notifications,
      [name]: checked
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/student/notification-preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...newNotifications
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update notification preferences');
      }

      // Show a small success toast
      const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      });

      Toast.fire({
        icon: 'success',
        title: 'Preferences updated successfully'
      });

      setSettings(prev => ({
        ...prev,
        notifications: newNotifications
      }));
    } catch (error) {
      console.error('Notification preferences error:', error);
      // Revert the change in UI
      setSettings(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [name]: !checked
        }
      }));
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update notification preferences',
        confirmButtonColor: '#3498db'
      });
    }
  };

  const handleAppearanceToggle = (setting) => {
    const currentAppearance = settings.appearance || {};
    const newSettings = {
      ...settings,
      appearance: {
        ...currentAppearance,
        [setting]: !currentAppearance[setting]
      }
    };
    setSettings(newSettings);
    // Update API call here too if needed
  };

  const setFontSize = async (size) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/student/font-size-preferences`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings: { appearance: { fontSize: size } } })
      });

      if (!response.ok) {
        throw new Error('Failed to update font size preferences');
      }

      const data = await response.json();
      if (data.success) {
        setSettings(prev => ({
          ...prev,
          appearance: {
            ...prev.appearance,
            fontSize: size
          }
        }));
        Swal.fire({
          icon: 'success',
          title: 'Font Size Updated',
          text: `Text size set to ${size.charAt(0).toUpperCase() + size.slice(1)}`,
          confirmButtonColor: '#3498db'
        });
      }
    } catch (error) {
      console.error('Error updating font size preferences:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update font size preferences',
        confirmButtonColor: '#3498db'
      });
    }
  };

  const ToggleSwitch = ({ checked, onChange, label, description }) => (
    <div className="setting-card">
      <div className="setting-content">
        <h3>{label}</h3>
        <p>{description}</p>
      </div>
      <button 
        className={`toggle-switch ${checked ? 'active' : ''}`}
        onClick={onChange}
      >
        <div className="toggle-knob"></div>
      </button>
    </div>
  );

  return (
    <div className="student-settings-layout">
      <StudentSidebar />
      
      <main className="settings-main">
        <header className="settings-header">
          <h1>Account Settings</h1>
          <p>Manage your preferences and security settings</p>
        </header>

        <div className="settings-grid">
          <section className="settings-section">
            <div className="section-header">
              <FaBell className="section-icon" />
              <h2>Notifications</h2>
            </div>
            
            <ToggleSwitch
              checked={settings.notifications.emailAlerts}
              onChange={() => handleSettingToggle('notifications', 'emailAlerts')}
              label="Email Alerts"
              description="Receive important updates via email"
            />

            <ToggleSwitch
              checked={settings.notifications.applicationUpdates}
              onChange={() => handleSettingToggle('notifications', 'applicationUpdates')}
              label="Application Updates"
              description="Get notified about application status changes"
            />

            <ToggleSwitch
              checked={settings.notifications.courseRecommendations}
              onChange={() => handleSettingToggle('notifications', 'courseRecommendations')}
              label="Course Recommendations"
              description="Personalized course suggestions"
            />

            <ToggleSwitch
              checked={settings.notifications.deadlineReminders}
              onChange={() => handleSettingToggle('notifications', 'deadlineReminders')}
              label="Deadline Reminders"
              description="Important deadline notifications"
            />
          </section>

          <section className="settings-section">
            <div className="section-header">
              <FaLock className="section-icon" />
              <h2>Security & Privacy</h2>
            </div>

            <ToggleSwitch
              checked={settings.privacy.showProfile}
              onChange={() => handleSettingToggle('privacy', 'showProfile')}
              label="Profile Visibility"
              description="Allow universities to view your profile"
            />

            <ToggleSwitch
              checked={settings.privacy.showEducation}
              onChange={() => handleSettingToggle('privacy', 'showEducation')}
              label="Education Details"
              description="Show your educational background"
            />

            <div className="security-card">
              <h3>Password Management</h3>
              <form onSubmit={handlePasswordChange} className="password-form">
                <div className="form-group">
                  <label>Current Password</label>
                  <div className="input-wrapper">
                    <input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value
                      })}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>New Password</label>
                  <div className="input-wrapper">
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value
                      })}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <button type="submit" className="save-button">
                  Update Password
                </button>
              </form>
            </div>
          </section>

          <section className="settings-section">
            <div className="section-header">
              <FaPalette className="section-icon" />
              <h2>Appearance</h2>
            </div>

            <div className="theme-card">
              <h3>Dark Mode</h3>
              <button 
                className={`theme-toggle ${settings.appearance?.darkMode ? 'active' : ''}`}
                onClick={() => handleAppearanceToggle('darkMode')}
              >
                <span className="toggle-label">
                  {settings.appearance?.darkMode ? 'On' : 'Off'}
                </span>
                <div className="toggle-track">
                  <div className="toggle-thumb"></div>
                </div>
              </button>
            </div>

            <div className="font-size-card">
              <h3>Text Size</h3>
              <div className="size-options">
                {['small', 'medium', 'large'].map(size => (
                  <button
                    key={size}
                    className={`size-option ${settings.appearance?.fontSize === size ? 'active' : ''}`}
                    onClick={() => setFontSize(size)}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default StudentSettings; 