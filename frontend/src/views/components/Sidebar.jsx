import { 
  Home, 
  FileText, 
  Users, 
  Settings, 
  Shield,
  Activity,
  GraduationCap,
  Radio,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import './Sidebar.css'
import logo from '../../assets/logo-ptc.png';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ user }) => {
  const location = useLocation();
  const [backendOnline, setBackendOnline] = useState(true);
  const [logsOpen, setLogsOpen] = useState(true);

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
    const interval = setInterval(checkBackend, 10000);
    return () => clearInterval(interval);
  }, []);

  // Only show Real-Time RFID tab for admin (security guard)
  const isSecurityGuard = user && user.role === 'admin';
  const isSuperAdmin = user && user.role === 'superadmin';
  const menuItems = isSecurityGuard
    ? [
        {
          id: 'realtime-rfid',
          label: 'Real-Time RFID',
          icon: Radio
        },
        {
          id: 'gate-control',
          label: 'Gate Control',
          icon: Shield
        }
      ]
    : [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: Home
        },
        {
          id: 'logs',
          label: 'Logs',
          icon: FileText
        },
        // Only show student/user management and settings for superadmin
        ...(isSuperAdmin ? [
          {
            id: 'student-management',
            label: 'Students',
            icon: GraduationCap
          },
          {
            id: 'user-management',
            label: 'User Management',
            icon: Users
          },
          {
            id: 'settings',
            label: 'Settings',
            icon: Settings
          }
        ] : [])
      ]

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <img src={logo} alt="Sidebar Logo" className="sidebar-logo" style={{ height: '40px', marginRight: '12px' }} />
          <span className="logo-text">Student Monitoring</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          if (item.group && item.children) {
            const isOpen = logsOpen;
            return (
              <div key={item.id} className="nav-group">
                <div
                  className={`nav-item nav-group-header${isOpen ? ' open' : ''}`}
                  onClick={() => setLogsOpen(!logsOpen)}
                  style={{ cursor: 'pointer' }}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                  {isOpen ? <ChevronDown size={16} style={{ marginLeft: 'auto' }} /> : <ChevronRight size={16} style={{ marginLeft: 'auto' }} />}
                </div>
                {isOpen && (
                  <div className="nav-group-children">
                    {item.children.map((child) => {
                      const ChildIcon = child.icon;
                      return (
                        <Link
                          key={child.id}
                          to={`/${child.id}`}
                          className={`nav-item nav-sub-item${location.pathname === `/${child.id}` ? ' active' : ''}`}
                          style={{ textDecoration: 'none' }}
                        >
                          <ChildIcon size={18} />
                          <span>{child.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={`/${item.id}`}
              className={`nav-item${location.pathname === `/${item.id}` ? ' active' : ''}`}
              style={{ textDecoration: 'none' }}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-footer">
        <div className={`system-status ${backendOnline ? 'online' : 'offline'}`}>
          <Activity size={16} />
          <span>{backendOnline ? 'System Online' : 'System Offline'}</span>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
