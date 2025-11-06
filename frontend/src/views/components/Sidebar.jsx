import { 
  Home, 
  FileText, 
  Users, 
  Settings, 
  Shield,
  Activity,
  GraduationCap,
  Radio
} from 'lucide-react'
import './Sidebar.css'
import logo from '../../assets/logo-ptc.png';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ user }) => {
  const location = useLocation();
  const [backendOnline, setBackendOnline] = useState(true);

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

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home
    },
    {
      id: 'realtime-rfid',
      label: 'Real-Time RFID',
      icon: Radio
    },
    {
      id: 'access-logs',
      label: 'Entry Logs',
      icon: FileText
    },
    {
      id: 'exit-logs',
      label: 'Exit Logs',
      icon: FileText
    },
    // Only show student management for superadmin
    ...(user && (user.role === 'superadmin' || user.accessLevel === 'superadmin') ? [
      {
        id: 'student-management',
        label: 'Students',
        icon: GraduationCap
      },
      {
        id: 'user-management',
        label: 'User Management',
        icon: Users
      }
    ] : []),
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings
    }
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
