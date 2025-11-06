import { Bell, User } from 'lucide-react'
import './Header.css'
import { useState, useRef, useEffect } from 'react'

const Header = ({ gateStatus, systemStatus, currentPage, user, onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const userBtnRef = useRef(null);
  const [backendOnline, setBackendOnline] = useState(true);
  const [currentDate, setCurrentDate] = useState('');
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    function handleClickOutside(event) {
      if (userBtnRef.current && !userBtnRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Periodically ping backend to check status
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/system/ping');
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
      setCurrentDate(now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }));
      setCurrentTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true // Use AM/PM format
      }));
    };
    updateDateTime();
    const interval = setInterval(updateDateTime, 1000); // update every second
    return () => clearInterval(interval);
  }, []);

  const getPageTitle = (page) => {
    const titles = {
      'dashboard': 'School Dashboard',
      'access-logs': 'Entry Logs',
      'exit-logs': 'Exit Logs',
      'user-management': 'Admin Management',
      'student-management': 'Student Management',
      'settings': 'System Settings',
      'device-management': 'Device Management',
      'student-access': 'Student Access Dashboard',
      'realtime-rfid': 'Real Time Monitoring' // Update title for realtime monitoring
    }
    return titles[page] || 'School Dashboard'
  }

  const getStatusColor = (status) => {
    const colors = {
      'open': '#10b981',
      'closed': '#ef4444',
      'locked': '#f59e0b',
      'online': '#10b981',
      'offline': '#ef4444'
    }
    return colors[status] || '#6b7280'
  }

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="page-title">{getPageTitle(currentPage)}</h1>
      </div>
      <div className="header-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
        <span className="header-date" style={{ fontWeight: 500 }}>
          {currentDate}
        </span>
        <span className="header-time" style={{ fontWeight: 500 }}>
          {currentTime}
        </span>
      </div>
      
      <div className="header-right">
        <div className="status-badges">
          <div className="status-badge">
            <span className="status-label">Gate:</span>
            <span 
              className="status-value"
              style={{ color: getStatusColor(gateStatus) }}
            >
              {gateStatus.toUpperCase()}
            </span>
          </div>
          <div className="status-badge">
            <span className="status-label">System:</span>
            <span 
              className="status-value"
              style={{ color: getStatusColor(backendOnline ? systemStatus : 'offline') }}
            >
              {backendOnline ? systemStatus.toUpperCase() : 'OFFLINE'}
            </span>
          </div>
        </div>
        
        <div className="header-actions">
          <div 
            className="user-btn" 
            ref={userBtnRef}
            onClick={() => setDropdownOpen((open) => !open)}
            style={{ position: 'relative', cursor: 'pointer' }}
          >
            <User size={18} />
            <div className="user-dropdown" style={{ display: dropdownOpen ? 'flex' : 'none' }}>
              {user && (
                <>
                  <span className="admin-name">{user.name || user.email}</span>
                  <hr className="dropdown-divider" />
                  <button className="logout-btn" onClick={onLogout}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-logout" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
          <button className="header-btn">
            <Bell size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
