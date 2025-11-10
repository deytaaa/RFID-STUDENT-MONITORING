import { BrowserRouter as Router, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './views/pages/Dashboard';
import AccessLogs from './views/pages/AccessLogs';
import EnhancedStudentManagement from './views/pages/EnhancedStudentManagement';
import Settings from './views/pages/Settings';
import RealTimeRFID from './views/components/RealTimeRFID';
import Sidebar from './views/components/Sidebar';
import Header from './views/components/Header';
import DashboardPresenter from './presenters/DashboardPresenter';
import LoginPage from './views/pages/LoginPage';
import UserManagement from './views/pages/UserManagement';
import ExitLogs from './views/pages/ExitLogs';
import './App.css';

function App() {
  const [gateStatus, setGateStatus] = useState('closed');
  const [systemStatus] = useState('online');
  const [dashboardPresenter, setDashboardPresenter] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      fetch('http://localhost:3000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.user) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        })
        .catch(() => setUser(null));
    } else {
      setIsLoggedIn(false);
      setUser(null);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      if (dashboardPresenter) {
        dashboardPresenter.destroy();
        setDashboardPresenter(null);
      }
      return;
    }
    if (!dashboardPresenter) {
      const presenter = new DashboardPresenter();
      setDashboardPresenter(presenter);
      presenter.setView({
        updateView: (data) => {
          if (data.type === 'GATE_STATUS_CHANGED') {
            setGateStatus(data.status);
          }
        }
      });
      presenter.startRealTimeUpdates();
    }
    return () => {
      if (dashboardPresenter) dashboardPresenter.destroy();
    };
  }, [dashboardPresenter, isLoggedIn]);

  const handleLogin = (loginData) => {
    setIsLoggedIn(true);
    localStorage.setItem('token', loginData.token);
    fetch('http://localhost:3000/api/auth/me', {
      headers: { 'Authorization': `Bearer ${loginData.token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      })
      .catch(() => setUser(null));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
    if (dashboardPresenter) {
      dashboardPresenter.destroy();
      setDashboardPresenter(null);
    }
  };

  if (!isLoggedIn) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    );
  }

  // Move useLocation inside Router context
  return (
    <Router>
      <AppWithLocation
        gateStatus={gateStatus}
        systemStatus={systemStatus}
        user={user}
        onLogout={handleLogout}
        dashboardPresenter={dashboardPresenter}
      />
    </Router>
  );
}

function AppWithLocation({ gateStatus, systemStatus, user, onLogout, dashboardPresenter }) {
  const location = useLocation();

  const getCurrentPage = (pathname) => {
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname === '/access-logs') return 'access-logs';
    if (pathname === '/exit-logs') return 'exit-logs';
    if (pathname === '/student-management') return 'student-management';
    if (pathname === '/settings') return 'settings';
    if (pathname === '/realtime-rfid') return 'realtime-rfid';
    if (pathname === '/user-management') return 'user-management';
    return 'dashboard';
  };

  return (
    <div className="app">
      <Sidebar user={user} />
      <div className="main-content">
        <Header
          gateStatus={gateStatus}
          systemStatus={systemStatus}
          currentPage={getCurrentPage(location.pathname)}
          user={user}
          onLogout={onLogout}
        />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={dashboardPresenter ? <Dashboard gateStatus={gateStatus} presenter={dashboardPresenter} /> : null} />
            <Route path="/access-logs" element={<AccessLogs />} />
            <Route path="/student-management" element={user && (user.role === 'superadmin' || user.accessLevel === 'superadmin') ? <EnhancedStudentManagement user={user} /> : <div style={{ padding: '2rem', color: '#ef4444', fontWeight: 'bold' }}>Access Denied: Only super admins can manage students.</div>} />
            <Route path="/realtime-rfid" element={<RealTimeRFID />} />
            <Route path="/settings" element={user && (user.role === 'superadmin' || user.accessLevel === 'superadmin') ? <Settings /> : <div style={{ padding: '2rem', color: '#ef4444', fontWeight: 'bold' }}>Access Denied: Only super admins can access system settings.</div>} />
            <Route path="/user-management" element={user && (user.role === 'superadmin' || user.accessLevel === 'superadmin') ? <UserManagement user={user} /> : <div style={{ padding: '2rem', color: '#ef4444', fontWeight: 'bold' }}>Access Denied: Only super admins can manage users.</div>} />
            <Route path="/exit-logs" element={<ExitLogs />} />
            {/* Add more routes as needed */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
