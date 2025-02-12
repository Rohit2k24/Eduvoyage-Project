import { useState, useEffect } from 'react';
import { FaBell, FaSpinner, FaCheck } from 'react-icons/fa';
import StudentSidebar from '../Sidebar/StudentSidebar';
import Swal from 'sweetalert2';
import './StudentNotifications.css';

const StudentNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/student/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load notifications',
        confirmButtonColor: '#3498db'
      });
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch(`http://localhost:3000/api/student/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setNotifications(notifications.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true }
            : notification
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'application':
        return <FaCheck className="notification-icon application" />;
      case 'system':
        return <FaBell className="notification-icon system" />;
      default:
        return <FaBell className="notification-icon" />;
    }
  };

  return (
    <div className="notifications-layout">
      <StudentSidebar />
      
      <div className="notifications-main">
        <h1>Notifications</h1>

        {loading ? (
          <div className="loading">
            <FaSpinner className="spinner" />
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="no-notifications">
            <FaBell className="icon" />
            <h2>No Notifications</h2>
            <p>You're all caught up!</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map(notification => (
              <div 
                key={notification._id} 
                className={`notification-item ${!notification.read ? 'unread' : ''}`}
                onClick={() => !notification.read && markAsRead(notification._id)}
              >
                {getNotificationIcon(notification.type)}
                <div className="notification-content">
                  <p className="notification-message">{notification.message}</p>
                  <span className="notification-time">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentNotifications; 