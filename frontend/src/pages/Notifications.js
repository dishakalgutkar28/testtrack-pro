import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Notifications.css';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all' or 'unread'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchNotifications();
  }, [token, navigate, filter, fetchNotifications]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const url = filter === 'unread'
        ? `${API_BASE_URL}/notifications?unread_only=true`
        : `${API_BASE_URL}/notifications`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(response.data.notifications || []);
      setError('');
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/notifications/${notificationId}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setError('Failed to mark notification as read');
    }
  };

  const handleMarkAsUnread = async (notificationId) => {
    try {
      await axios.put(
        `${API_BASE_URL}/notifications/${notificationId}/unread`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      setError('Failed to mark notification as unread');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.put(
        `${API_BASE_URL}/notifications/mark-all-read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
      setError('Failed to mark all notifications as read');
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await axios.delete(`${API_BASE_URL}/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Failed to delete notification');
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      bug_assigned: '🐛',
      bug_status_changed: '🔄',
      testcase_assigned: '📝',
      comment_added: '💬',
      execution_completed: '✅',
      mention: '@',
      system: '📢'
    };
    return icons[type] || '🔔';
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="notifications-container">
      <div className="notifications-header">
        <h1>Notifications</h1>
        <div className="header-actions">
          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              All ({notifications.length})
            </button>
            <button
              className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Unread ({unreadCount})
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              className="btn btn-primary"
              onClick={handleMarkAllAsRead}
            >
              Mark All as Read
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading-spinner">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔔</div>
          <p>No notifications to display</p>
        </div>
      ) : (
        <div className="notifications-list">
          {notifications.map(notification => (
            <div
              key={notification.id}
              className={`notification-card ${!notification.is_read ? 'unread' : ''}`}
            >
              <div className="notification-icon-large">
                {getNotificationIcon(notification.type)}
              </div>
              
              <div
                className="notification-body"
                onClick={() => handleNotificationClick(notification)}
              >
                <h3>{notification.title}</h3>
                <p>{notification.message}</p>
                <div className="notification-meta">
                  <span className="notification-time">
                    {formatTimestamp(notification.created_at)}
                  </span>
                  {notification.sender_email && (
                    <span className="notification-sender">
                      From: {notification.sender_email}
                    </span>
                  )}
                </div>
              </div>

              <div className="notification-actions">
                {notification.is_read ? (
                  <button
                    className="btn-action"
                    onClick={() => handleMarkAsUnread(notification.id)}
                    title="Mark as unread"
                  >
                    📭
                  </button>
                ) : (
                  <button
                    className="btn-action"
                    onClick={() => handleMarkAsRead(notification.id)}
                    title="Mark as read"
                  >
                    ✓
                  </button>
                )}
                <button
                  className="btn-action btn-danger"
                  onClick={() => handleDelete(notification.id)}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
