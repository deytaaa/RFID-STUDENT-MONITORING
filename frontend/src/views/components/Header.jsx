import { Bell, User, Shield, ShieldAlert, CheckCircle, XCircle, AlertTriangle, Clock } from "lucide-react";
import "./Header.css";
import { useState, useRef, useEffect } from "react";
import WebSocketService from "../../services/WebSocketService";
import NotificationService from "../../services/NotificationService";

const Header = ({ gateStatus, systemStatus, currentPage, user, onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const userBtnRef = useRef(null);
  const [backendOnline, setBackendOnline] = useState(true);
  const [currentDate, setCurrentDate] = useState("");
  const [currentTime, setCurrentTime] = useState("");

  // Notification state with database + localStorage hybrid
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const unreadCount = notifications.filter(n => !n.read).length;

  // Helper functions for notification display
  const getNotificationTitle = (type) => {
    switch (type) {
      case 'access_denied': return 'Access Denied';
      case 'access_granted': return 'Access Granted';
      case 'security': return 'Security Alert';
      case 'system': return 'System Notification';
      default: return 'Notification';
    }
  };

  const formatNotificationTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (userBtnRef.current && !userBtnRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      // Hide notifications dropdown if clicking outside
      if (
        !event.target.closest(".header-btn") &&
        !event.target.closest(".notification-dropdown")
      ) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Periodically ping backend to check status
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch("http://localhost:3000/api/system/ping");
        setBackendOnline(res.ok);
      } catch {
        setBackendOnline(false);
      }
    };
    checkBackend();
    const interval = setInterval(checkBackend, 10000); // every 10s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setCurrentDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
      setCurrentTime(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      );
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen for access events via WebSocket
  useEffect(() => {


    console.log('🔌 Header: Setting up WebSocket listeners...');
    
    WebSocketService.connect();
    
    // Handle new database notifications from server (PRIMARY notification source)
    const handleNewNotification = (data) => {
      console.log('🔔 Header: New database notification:', data);
      if (data.notification) {
        const formatted = NotificationService.formatNotification(data.notification);
        
        setNotifications(prev => {
          // Prevent duplicates by checking if notification already exists
          const exists = prev.find(n => n.id === formatted.id);
          if (exists) {
            console.log('🔔 Duplicate notification prevented:', formatted.id);
            return prev;
          }
          
          const updated = [formatted, ...prev.slice(0, 19)];
          
          // Save to localStorage immediately for persistence
          try {
            localStorage.setItem('header-notifications', JSON.stringify(updated));
            console.log('💾 Saved notification to localStorage');
          } catch (error) {
            console.warn('⚠️ Failed to save to localStorage:', error);
          }
          
          return updated;
        });
      }
    };
    
    console.log('🔔 Header: Setting up notification listeners...');
    WebSocketService.connect();
    
    // Only listen to database notifications - this is our single source of truth
    const socket = WebSocketService.socket;
    if (socket) {
      socket.on('new_notification', handleNewNotification);
      console.log('🔔 Header: Listening for database notifications only');
    }
    
    // Fallback: also listen via WebSocketService
    WebSocketService.on("new_notification", handleNewNotification);
    
    return () => {
      WebSocketService.off("new_notification", handleNewNotification);
      const socket = WebSocketService.socket;
      if (socket) {
        socket.off('new_notification', handleNewNotification);
      }
    };
  }, []);

  // Load notifications from localStorage AND database on component mount
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        console.log('🔄 Loading notifications...');
        setIsLoadingNotifications(true);
        
        // Always load localStorage first for immediate display
        const localNotifications = NotificationService.getLocalStorageNotifications();
        console.log('📱 Loaded from localStorage:', localNotifications.length, 'notifications');
        
        if (localNotifications.length > 0) {
          const formatted = localNotifications.map(NotificationService.formatNotification);
          setNotifications(formatted);
          console.log('✅ Displayed localStorage notifications');
        }
        
        // Try to load from database (this might fail if not authenticated yet)
        try {
          console.log('🗄️ Attempting to load from database...');
          const response = await NotificationService.getNotifications({ limit: 20 });
          console.log('📊 Database response:', response);
          
          if (response.success && response.data?.notifications) {
            console.log('✅ Loaded from database:', response.data.notifications.length, 'notifications');
            
            // Sync with localStorage (hybrid approach) 
            const synced = NotificationService.syncWithLocalStorage(response.data.notifications);
            const formatted = synced.map(NotificationService.formatNotification);
            setNotifications(formatted);
            console.log('🔄 Synced notifications:', formatted.length);
          } else {
            console.log('⚠️ No database notifications or API not ready');
          }
        } catch (dbError) {
          console.warn('⚠️ Database loading failed (might not be authenticated yet):', dbError.message);
          // Keep localStorage notifications if database fails
        }
        
      } catch (error) {
        console.error('❌ Error in loadNotifications:', error);
        
        // Fallback: try to load localStorage again
        try {
          const fallbackNotifications = NotificationService.getLocalStorageNotifications();
          if (fallbackNotifications.length > 0) {
            setNotifications(fallbackNotifications.map(NotificationService.formatNotification));
            console.log('🔄 Used fallback localStorage notifications');
          }
        } catch (fallbackError) {
          console.error('❌ Even localStorage fallback failed:', fallbackError);
        }
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    loadNotifications();
    
    // Clean up old localStorage notifications
    NotificationService.cleanupLocalStorage();
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (notifications.length > 0) {
      try {
        localStorage.setItem('header-notifications', JSON.stringify(notifications));
        console.log('💾 Auto-saved', notifications.length, 'notifications to localStorage');
      } catch (error) {
        console.warn('⚠️ Failed to auto-save notifications:', error);
      }
    }
  }, [notifications]);

  const getPageTitle = (page) => {
    const titles = {
      dashboard: "PTC Dashboard",
      "access-logs": "Logs",
      "exit-logs": "Logs",
      "user-management": "Admin Management",
      "student-management": "Student Management",
      settings: "System Settings",
      "device-management": "Device Management",
      "realtime-rfid": "Real Time Monitoring",
      "gate-monitoring": "Gate Monitoring",
      "gate-control": "Gate Control" // <-- Add this line
    };
    return titles[page] || "PTC Dashboard";
  };

  const getStatusColor = (status) => {
    const colors = {
      open: "#10b981",
      closed: "#ef4444",
      locked: "#f59e0b",
      online: "#10b981",
      offline: "#ef4444",
    };
    return colors[status] || "#6b7280";
  };

  // Notification management functions
  const markAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(prev => {
        const updated = prev.map(n => ({ ...n, read: true }));
        localStorage.setItem('header-notifications', JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      // Still update UI for better UX
      setNotifications(prev => {
        const updated = prev.map(n => ({ ...n, read: true }));
        localStorage.setItem('header-notifications', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const clearAllNotifications = async () => {
    try {
      await NotificationService.clearAll();
      setNotifications([]);
      localStorage.removeItem('header-notifications');
      setShowNotifications(false);
      console.log('🗑️ Cleared all notifications');
    } catch (error) {
      console.error('Error clearing notifications:', error);
      // Still clear UI for better UX
      setNotifications([]);
      localStorage.removeItem('header-notifications');
      setShowNotifications(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      // Don't call API for local notifications
      if (!notificationId.toString().startsWith('local_')) {
        await NotificationService.markAsRead(notificationId);
      }
      
      setNotifications(prev => {
        const updated = prev.map(n => n.id === notificationId ? { ...n, read: true } : n);
        localStorage.setItem('header-notifications', JSON.stringify(updated));
        return updated;
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Still update UI for better UX
      setNotifications(prev => {
        const updated = prev.map(n => n.id === notificationId ? { ...n, read: true } : n);
        localStorage.setItem('header-notifications', JSON.stringify(updated));
        return updated;
      });
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="page-title">{getPageTitle(currentPage)}</h1>
      </div>
      <div
        className="header-center"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flex: 1,
        }}
      >
        <span className="header-date" style={{ fontWeight: 500 }}>
          {currentDate}
        </span>
        <span className="header-time" style={{ fontWeight: 500 }}>
          {currentTime}
        </span>
      </div>

      <div className="header-right">
        <div className="status-badges">
          {/* Gate status removed as per user request */}
        </div>

        <div className="header-actions">
          <button
            className="header-btn"
            aria-label="Notifications"
            onClick={() => setShowNotifications((prev) => !prev)}
            style={{ position: "relative" }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
          {showNotifications && (
            <div className="notification-dropdown">
              <div className="dropdown-header">
                <span>Notifications</span>
                <div className="notification-actions">
                  <button className="mark-read-btn" onClick={markAllAsRead}>
                    Mark all read
                  </button>
                  <button className="clear-all-btn" onClick={clearAllNotifications}>
                    Clear all
                  </button>
                </div>
              </div>
              <ul>
                {isLoadingNotifications ? (
                  <li className="empty">Loading notifications...</li>
                ) : notifications.length === 0 ? (
                  <li className="empty">No notifications</li>
                ) : (
                  notifications.map((n) => (
                    <li 
                      key={n.id} 
                      className={`notification-item ${n.read ? "read" : "unread"} ${n.priority || 'normal'}`}
                      onClick={() => markAsRead(n.id)}
                    >
                      <div className="notification-icon">
                        {n.type === "access_denied" && <ShieldAlert size={18} />}
                        {n.type === "access_granted" && <CheckCircle size={18} />}
                        {n.type === "security" && <Shield size={18} />}
                        {n.type === "system" && <AlertTriangle size={18} />}
                        {!["access_denied", "access_granted", "security", "system"].includes(n.type) && <Bell size={18} />}
                      </div>
                      <div className="notification-content">
                        <div className="notification-title">
                          {n.title || getNotificationTitle(n.type)}
                        </div>
                        <div className="notification-message">
                          {n.message}
                        </div>
                        <div className="notification-meta">
                          <span className="notification-time">
                            <Clock size={12} />
                            {formatNotificationTime(n.timestamp || n.fullTimestamp)}
                          </span>
                          {n.data?.location && (
                            <span className="notification-location">
                              📍 {n.data.location}
                            </span>
                          )}
                          {n.category && (
                            <span className={`notification-category ${n.category}`}>
                              {n.category.toUpperCase()}
                            </span>
                          )}
                        </div>
                      </div>
                      {n.priority === 'high' && (
                        <div className="priority-indicator high"></div>
                      )}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
          <div
            className="user-btn"
            ref={userBtnRef}
            onClick={() => setDropdownOpen((open) => !open)}
            style={{ position: "relative", cursor: "pointer" }}
          >
            <User size={18} />
            <div
              className="user-dropdown"
              style={{ display: dropdownOpen ? "flex" : "none" }}
            >
              {user && (
                <>
                  <span className="admin-name">{user.name || user.email}</span>
                  <hr className="dropdown-divider" />
                  <button className="logout-btn" onClick={onLogout}>
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="icon-logout"
                      viewBox="0 0 24 24"
                    >
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;