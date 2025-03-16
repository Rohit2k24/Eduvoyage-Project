import { useState, useEffect } from 'react';
import { FaBell, FaCheck, FaTrash } from 'react-icons/fa';
import CollegeSidebar from '../CollegeDashboard/CollegeSidebar';
import Swal from 'sweetalert2';
import './Notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/college/notifications`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/college/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setNotifications(prev => 
          prev.map(notif => 
            notif._id === id ? { ...notif, isRead: true } : notif
          )
        );
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/college/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, isRead: true }))
        );
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!'
      });

      if (result.isConfirmed) {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/college/notifications/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        
        if (data.success) {
          setNotifications(prev => prev.filter(notif => notif._id !== id));
          Swal.fire('Deleted!', 'Notification has been deleted.', 'success');
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      Swal.fire('Error!', 'Failed to delete notification.', 'error');
    }
  };

  return (
    <div className="college-dashboard-layout">
      <CollegeSidebar />
      <div className="notifications-main">
        <div className="notifications-container">
          <div className="notifications-header">
            <h2>
              <FaBell className="bell-icon" />
              Notifications
            </h2>
            {notifications.some(n => !n.isRead) && (
              <button onClick={markAllAsRead} className="mark-all-read-btn">
                Mark All as Read
              </button>
            )}
          </div>

          {loading ? (
            <div className="loading">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="no-notifications">No notifications</div>
          ) : (
            <div className="notifications-list">
              {notifications.map(notification => (
                <div 
                  key={notification._id} 
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                >
                  <div className="notification-content">
                    <h3>{notification.title}</h3>
                    <p>{notification.message}</p>
                    <span className="notification-time">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="notification-actions">
                    {!notification.isRead && (
                      <button 
                        onClick={() => markAsRead(notification._id)}
                        className="mark-read-btn"
                      >
                        <FaCheck />
                      </button>
                    )}
                    <button 
                      onClick={() => deleteNotification(notification._id)}
                      className="delete-btn"
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
    </div>
  );
};

export default Notifications; 