import { BrowserRouter as Router, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Dashboard from './views/pages/Dashboard';
import EnhancedStudentManagement from './views/pages/EnhancedStudentManagement';
import Settings from './views/pages/Settings';
import RealTimeRFID from './views/components/RealTimeRFID';
import Sidebar from './views/components/Sidebar';
import Header from './views/components/Header';
import DashboardPresenter from './presenters/DashboardPresenter';
import LoginPage from './views/pages/LoginPage';
import UserManagement from './views/pages/UserManagement';
import Logs from './views/components/Logs';
import GateControl from './views/components/GateControl';
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

  // Helper to determine current page for Header component
  const getCurrentPage = (pathname) => {
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname === '/logs') return 'access-logs'; // Entry Logs
    if (pathname === '/exit-logs') return 'exit-logs'; // Exit Logs
    if (pathname === '/student-management') return 'student-management';
    if (pathname === '/settings') return 'settings';
    if (pathname === '/realtime-rfid') return 'realtime-rfid';
    if (pathname === '/user-management') return 'user-management';
    return 'dashboard';
  };

  // Role checks
  const isSecurityGuard = user && user.role === 'admin';
  const isSuperAdmin = user && user.role === 'superadmin';

  // Render main app layout with Sidebar, Header, and Routes
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
            <Route path="/" element={<Navigate to={isSecurityGuard ? "/realtime-rfid" : "/dashboard"} />} />
            <Route path="/dashboard" element={isSuperAdmin ? (dashboardPresenter ? <Dashboard gateStatus={gateStatus} presenter={dashboardPresenter} user={user} /> : null) : <Navigate to="/realtime-rfid" />} />
            <Route path="/logs" element={isSuperAdmin ? <Logs user={user} /> : <Navigate to="/realtime-rfid" />} />
            <Route path="/exit-logs" element={isSuperAdmin ? <Logs user={user} type="exit" /> : <Navigate to="/realtime-rfid" />} />
            <Route path="/student-management" element={isSuperAdmin ? <EnhancedStudentManagement user={user} /> : <Navigate to="/realtime-rfid" />} />
            <Route path="/realtime-rfid" element={isSecurityGuard ? <RealTimeRFID /> : <Navigate to="/dashboard" />} />
            <Route path="/settings" element={isSuperAdmin ? <Settings /> : <Navigate to="/realtime-rfid" />} />
            <Route path="/user-management" element={isSuperAdmin ? <UserManagement user={user} /> : <Navigate to="/realtime-rfid" />} />
            <Route path="/gate-control" element={isSecurityGuard ? <GateControl /> : <Navigate to="/dashboard" />} />
            {/* Add more routes as needed */}
            <Route path="*" element={<Navigate to={isSecurityGuard ? "/realtime-rfid" : "/dashboard"} />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
