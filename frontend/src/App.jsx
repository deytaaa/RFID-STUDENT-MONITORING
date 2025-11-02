import { useState, useEffect } from 'react'
import Dashboard from './views/pages/Dashboard'
import AccessLogs from './views/pages/AccessLogs'
import EnhancedStudentManagement from './views/pages/EnhancedStudentManagement'
import Settings from './views/pages/Settings'
import StudentAccessDashboard from './views/pages/StudentAccessDashboard'
import RealTimeRFID from './views/components/RealTimeRFID'
import Sidebar from './views/components/Sidebar'
import Header from './views/components/Header'
import DashboardPresenter from './presenters/DashboardPresenter'
import LoginPage from './views/pages/LoginPage'
import UserManagement from './views/pages/UserManagement'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [gateStatus, setGateStatus] = useState('closed')
  const [systemStatus] = useState('online')
  const [dashboardPresenter, setDashboardPresenter] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'))
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      // Fetch user info from backend
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
        dashboardPresenter.destroy()
        setDashboardPresenter(null)
      }
      return;
    }
    // Only initialize DashboardPresenter after login
    if (!dashboardPresenter) {
      const presenter = new DashboardPresenter()
      setDashboardPresenter(presenter)
      presenter.setView({
        updateView: (data) => {
          if (data.type === 'GATE_STATUS_CHANGED') {
            setGateStatus(data.status)
          }
        }
      })
      presenter.startRealTimeUpdates()
    }
    return () => {
      if (dashboardPresenter) dashboardPresenter.destroy()
    }
  }, [dashboardPresenter, isLoggedIn])

  const handleLogin = (loginData) => {
    setIsLoggedIn(true);
    localStorage.setItem('token', loginData.token);
    // Always fetch full user info after login
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
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    setUser(null)
    if (dashboardPresenter) {
      dashboardPresenter.destroy()
      setDashboardPresenter(null)
    }
  }

  // Only render protected pages if logged in
  if (!isLoggedIn) {
    // Prevent any protected API calls before login
    return <LoginPage onLogin={handleLogin} />
  }

  return (
    <div className="app">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} user={user} />
      <div className="main-content">
        <Header 
          gateStatus={gateStatus} 
          systemStatus={systemStatus}
          currentPage={currentPage}
          user={user}
          onLogout={handleLogout}
        />
        <div className="page-content">
          {/* Only render dashboard and other pages if logged in */}
          {isLoggedIn && currentPage === 'dashboard' && dashboardPresenter && <Dashboard gateStatus={gateStatus} presenter={dashboardPresenter} />}
          {isLoggedIn && currentPage === 'student-access' && <StudentAccessDashboard />}
          {isLoggedIn && currentPage === 'access-logs' && <AccessLogs />}
          {isLoggedIn && currentPage === 'student-management' && (
            (user && (user.role === 'superadmin' || user.accessLevel === 'superadmin'))
              ? <EnhancedStudentManagement user={user} />
              : <div style={{ padding: '2rem', color: '#ef4444', fontWeight: 'bold' }}>Access Denied: Only super admins can manage students.</div>
          )}
          {isLoggedIn && currentPage === 'realtime-rfid' && <RealTimeRFID />}
          {isLoggedIn && currentPage === 'settings' && <Settings />}

          {/* Device Management Page (example: currentPage === 'device-management') */}
          {isLoggedIn && currentPage === 'device-management' && (
            (user && (user.role === 'superadmin' || user.accessLevel === 'superadmin'))
              ? <DeviceManagement />
              : <div style={{ padding: '2rem', color: '#ef4444', fontWeight: 'bold' }}>Access Denied: Only super admins can manage devices.</div>
          )}

          {/* User Management Page (example: currentPage === 'user-management') */}
          {isLoggedIn && currentPage === 'user-management' && (
            (user && (user.role === 'superadmin' || user.accessLevel === 'superadmin'))
              ? <UserManagement user={user} />
              : <div style={{ padding: '2rem', color: '#ef4444', fontWeight: 'bold' }}>Access Denied: Only super admins can manage users.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
