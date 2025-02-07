import { useState, useEffect } from 'react';
import { FaBell, FaCheck, FaTrash } from 'react-icons/fa';
import StudentSidebar from '../Dashboard/StudentSidebar';
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
      if (data.success) {
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load notifications',
        confirmButtonColor: '#3498db'
      });
    } finally {
      setLoading(false);
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

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      setNotifications(notifications.map(notification => 
        notification._id === notificationId 
          ? { ...notification, read: true }
          : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to mark notification as read',
        confirmButtonColor: '#3498db'
      });
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3498db',
        cancelButtonColor: '#e74c3c',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        const response = await fetch(`http://localhost:3000/api/student/notifications/${notificationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to delete notification');
        }

        setNotifications(notifications.filter(notification => notification._id !== notificationId));

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Notification has been deleted.',
          confirmButtonColor: '#3498db',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete notification',
        confirmButtonColor: '#3498db'
      });
    }
  };

  return (
    <div className="student-notifications-layout">
      <StudentSidebar />
      
      <div className="notifications-main">
        <div className="notifications-header">
          <h1>Notifications</h1>
          {notifications.length > 0 && (
            <p>{notifications.filter(n => !n.read).length} unread notifications</p>
          )}
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="no-notifications">
            <FaBell />
            <h2>No Notifications</h2>
            <p>You're all caught up!</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map(notification => (
              <div 
                key={notification._id} 
                className={`notification-card ${!notification.read ? 'unread' : ''}`}
              >
                <div className="notification-icon">
                  <FaBell />
                </div>
                <div className="notification-content">
                  <p>{notification.message}</p>
                  <span className="notification-time">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="notification-actions">
                  {!notification.read && (
                    <button 
                      onClick={() => markAsRead(notification._id)}
                      className="mark-read-btn"
                      title="Mark as read"
                    >
                      <FaCheck />
                    </button>
                  )}
                  <button 
                    onClick={() => deleteNotification(notification._id)}
                    className="delete-btn"
                    title="Delete notification"
                  >
                    <FaTrash />
                  </button>
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