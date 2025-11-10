import React, { useState, useEffect, useRef } from 'react'
import WebSocketService from '../../services/WebSocketService'
import { BsCpu, BsCheckCircle, BsSearch, BsBullseye, BsClipboardData, BsFileEarmarkText, BsRobot, BsXCircle } from "react-icons/bs";
import { Tooltip } from 'react-tooltip';
import './RealTimeRFID.css'
import RecentActivity from './RecentActivity';
import { useLocation } from 'react-router-dom';

const RealTimeRFID = () => {
  const [rfidStatus, setRfidStatus] = useState({
    systemReady: false,
    lastCardScanned: null,
    lastAccess: null,
    gateStatus: 'closed',
    isConnected: false
  })

  const [recentActivity, setRecentActivity] = useState([])
  const [systemLogs, setSystemLogs] = useState([])
  const [scannedStudent, setScannedStudent] = useState(null);
  const [accessStudent, setAccessStudent] = useState(null);
  const [systemMetrics, setSystemMetrics] = useState({ rfidReader: 'connected', database: 'connected', network: 'strong' });
  
  // Track last event times to prevent rapid duplicates
  const lastEventTimes = useRef(new Map())
  const location = useLocation();

  useEffect(() => {
    // Load persisted state from localStorage on mount
    const persisted = localStorage.getItem('rfidMonitorState');
    if (persisted) {
      const state = JSON.parse(persisted);
      setRfidStatus(state.rfidStatus || rfidStatus);
      setRecentActivity(state.recentActivity || []);
      // Re-fetch student info for last scanned and last access
      if (state.rfidStatus?.lastCardScanned?.cardID) {
        fetchStudentByCardID(state.rfidStatus.lastCardScanned.cardID).then(setScannedStudent);
      }
      if (state.rfidStatus?.lastAccess?.cardID) {
        fetchStudentByCardID(state.rfidStatus.lastAccess.cardID).then(setAccessStudent);
      }
      // Re-fetch student info for each activity
      if (Array.isArray(state.recentActivity)) {
        Promise.all(state.recentActivity.map(async activity => {
          if (activity.cardID) {
            const student = await fetchStudentByCardID(activity.cardID);
            return { ...activity, student };
          }
          return activity;
        })).then(setRecentActivity);
      }
    }
  }, []);

  useEffect(() => {
    // Persist state to localStorage whenever it changes
    localStorage.setItem('rfidMonitorState', JSON.stringify({
      rfidStatus,
      scannedStudent,
      accessStudent,
      recentActivity
    }));
  }, [rfidStatus, scannedStudent, accessStudent, recentActivity]);

  useEffect(() => {
    // Initial connection check
    if (WebSocketService.isConnected) {
      setRfidStatus(prev => ({
        ...prev,
        isConnected: true,
        systemReady: true // Assume ready if already connected
      }))
    }

    // Clear any existing custom event listeners first
    WebSocketService.clearListeners()
    
    // Connect to WebSocket (only if not already connected)
    if (!WebSocketService.isConnected) {
      WebSocketService.connect()
    }

    // Define event handlers (using arrow functions to maintain context)
    const handleSystemReady = (data) => {
      console.log('✅ Arduino System Ready:', JSON.stringify(data))
      if (data.status === 'ready') {
        setRfidStatus(prev => ({
          ...prev,
          systemReady: true,
          isConnected: true
        }))
      }
      const log = {
        id: `${Date.now()}-${Math.random()}`,
        message: '🟢 RFID System Online',
        type: 'success',
        timestamp: new Date()
      }
      setSystemLogs(prev => [log, ...prev.slice(0, 19)])
    }

    const handleCardScanned = async (data) => {
      console.log('🔍 Card Scanned:', JSON.stringify(data))
      setRfidStatus(prev => ({
        ...prev,
        lastCardScanned: {
          cardID: data.cardID,
          timestamp: new Date(data.receivedAt || new Date())
        }
      }))
      
      const log = {
        id: `${Date.now()}-${Math.random()}`,
        message: `🔍 Card Scanned: ${data.cardID}`,
        type: 'info',
        timestamp: new Date()
      }
      setSystemLogs(prev => [log, ...prev.slice(0, 19)])

      // Fetch student info by card ID
      const student = await fetchStudentByCardID(data.cardID);
      setScannedStudent(student);
    }

    const handleAccessGranted = async (data) => {
      console.log('✅ Access Granted:', JSON.stringify(data))
      
      // Prevent duplicate entries using ref to track timing
      const eventKey = `${data.cardID}-granted`
      const now = Date.now()
      const lastEventTime = lastEventTimes.current.get(eventKey) || 0
      
      // If the same event occurred less than 2 seconds ago, ignore it
      if (now - lastEventTime < 2000) {
        console.log('🚫 Duplicate ACCESS_GRANTED event ignored')
        return
      }
      
      lastEventTimes.current.set(eventKey, now)
      
      const student = await fetchStudentByCardID(data.cardID);
      setRecentActivity(prev => {
        const activity = {
          id: `${Date.now()}-${Math.random()}`,
          cardID: data.cardID,
          status: 'granted',
          timestamp: new Date(),
          message: 'Access Granted - Automatic gate opening authorized',
          student: student && student.name && student.name !== 'Card not registered' && student.name !== 'Unable to fetch card info' ? student : { name: 'Unknown User', profilePicture: '', cardID: data.cardID }
        }
        return [activity, ...prev.slice(0, 9)]
      })
      
      setRfidStatus(prev => ({
        ...prev,
        lastAccess: {
          cardID: data.cardID,
          status: 'granted',
          timestamp: new Date(data.receivedAt || new Date())
        },
        gateStatus: 'open'
      }))
      
      const log = {
        id: `${Date.now()}-${Math.random()}`,
        message: `✅ ACCESS GRANTED: ${data.cardID}`,
        type: 'success',
        timestamp: new Date()
      }
      setSystemLogs(prev => [log, ...prev.slice(0, 19)])

      setAccessStudent(student);
      await fetchRecentActivity();
    }

    const handleAccessDenied = async (data) => {
      console.log('🚫 Access Denied:', JSON.stringify(data))
      
      // Prevent duplicate entries using ref to track timing
      const eventKey = `${data.cardID}-denied`
      const now = Date.now()
      const lastEventTime = lastEventTimes.current.get(eventKey) || 0
      
      // If the same event occurred less than 2 seconds ago, ignore it
      if (now - lastEventTime < 2000) {
        console.log('🚫 Duplicate ACCESS_DENIED event ignored')
        return
      }
      
      lastEventTimes.current.set(eventKey, now)
      
      const student = await fetchStudentByCardID(data.cardID);
      setRecentActivity(prev => {
        const activity = {
          id: `${Date.now()}-${Math.random()}`,
          cardID: data.cardID,
          status: 'denied',
          timestamp: new Date(),
          message: 'Access Denied - Not Active',
          student: !student || student.name === 'Card not registered' || student.name === 'Unable to fetch card info' ? { name: 'Unknown User', profilePicture: '', cardID: data.cardID } : student
        }
        return [activity, ...prev.slice(0, 9)]
      })
      
      setRfidStatus(prev => ({
        ...prev,
        lastAccess: {
          cardID: data.cardID,
          status: 'denied',
          timestamp: new Date(data.receivedAt || new Date())
        }
      }))
      
      const log = {
        id: `${Date.now()}-${Math.random()}`,
        message: `🚫 ACCESS DENIED: ${data.cardID}`,
        type: 'error',
        timestamp: new Date()
      }
      setSystemLogs(prev => [log, ...prev.slice(0, 19)])

      setAccessStudent(student);
      await fetchRecentActivity();
    }

    const handleGateClosed = (data) => {
      console.log('🔒 Gate Closed:', JSON.stringify(data))
      setRfidStatus(prev => ({
        ...prev,
        gateStatus: 'closed'
      }))
      
      const log = {
        id: `${Date.now()}-${Math.random()}`,
        message: '🔒 Gate closed - System ready',
        type: 'info',
        timestamp: new Date()
      }
      setSystemLogs(prev => [log, ...prev.slice(0, 19)])
    }

    const handleArduinoLog = (data) => {
      const log = {
        id: `${Date.now()}-${Math.random()}`,
        message: `🤖 ${data.message}`,
        type: 'log',
        timestamp: new Date()
      }
      setSystemLogs(prev => [log, ...prev.slice(0, 19)])
    }

    const handleConnected = () => {
      console.log('🟢 handleConnected called, setting isConnected to true');
      setRfidStatus(prev => ({
        ...prev,
        isConnected: true
      }))
    }

    const handleDisconnected = () => {
      setRfidStatus(prev => ({ 
        ...prev, 
        isConnected: false,
        systemReady: false // Reset systemReady on disconnect
      }))
      const log = {
        id: `${Date.now()}-${Math.random()}`,
        message: '🔴 Disconnected from backend',
        type: 'error',
        timestamp: new Date()
      }
      setSystemLogs(prev => [log, ...prev.slice(0, 19)])
    }

    // Attach event listeners
    WebSocketService.on('system-status', handleSystemReady)
    WebSocketService.on('arduino-card-scanned', handleCardScanned)
    WebSocketService.on('arduino-access-granted', handleAccessGranted)
    WebSocketService.on('arduino-access-denied', handleAccessDenied)
    WebSocketService.on('arduino-gate-closed', handleGateClosed)
    WebSocketService.on('arduino-log', handleArduinoLog)
    WebSocketService.on('connected', handleConnected)
    WebSocketService.on('disconnected', handleDisconnected)

    // Cleanup on unmount
    return () => {
      // Remove event listeners to prevent duplicates
      WebSocketService.off('system-status', handleSystemReady)
      WebSocketService.off('arduino-card-scanned', handleCardScanned)
      WebSocketService.off('arduino-access-granted', handleAccessGranted)
      WebSocketService.off('arduino-access-denied', handleAccessDenied)
      WebSocketService.off('arduino-gate-closed', handleGateClosed)
      WebSocketService.off('arduino-log', handleArduinoLog)
      WebSocketService.off('connected', handleConnected)
      WebSocketService.off('disconnected', handleDisconnected)
    }
  }, [])

  // Move fetchRecentActivity outside useEffect so it can be called from anywhere
  const fetchRecentActivity = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return; // Skip if not authenticated
      
      const res = await fetch('http://localhost:3000/api/access-logs?limit=10', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const result = await res.json();
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          // Fetch student info for each activity
          const activities = await Promise.all(result.data.map(async log => {
            // Use rfidTag instead of cardID for database records
            const cardID = log.rfidTag || log.cardID;
            const student = cardID ? await fetchStudentByCardID(cardID) : null;
            
            // Handle unknown users properly
            let displayStudent = student;
            if (!student || student.name === 'Card not registered' || student.name === 'Unable to fetch card info') {
              displayStudent = { name: 'Unknown User', profilePicture: '', cardID: cardID };
            }
            
            return {
              id: log._id || `${Date.now()}-${Math.random()}`,
              cardID: cardID,
              status: log.accessGranted ? 'granted' : 'denied',
              timestamp: log.timestamp,
              message: log.accessGranted ? 'Access Granted' : 'Access Denied',
              student: displayStudent
            };
          }));
          setRecentActivity(activities);
        } else {
          setRecentActivity([]);
        }
      }
    } catch {
      // Error intentionally ignored
    }
  }, []);

  useEffect(() => {
    // Always fetch from backend on mount
    fetchRecentActivity();
  }, [fetchRecentActivity]);

  useEffect(() => {
    // Always fetch from backend when route changes (e.g., tab switch)
    fetchRecentActivity();
  }, [location.pathname, fetchRecentActivity]);

  // Remove localStorage.setItem for recentActivity

  // Fetch system status on mount and every 10 seconds
  useEffect(() => {
    const fetchSystemStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setSystemMetrics((prev) => ({ ...prev, rfidReader: 'disconnected' }));
        setRecentActivity([]);
        setSystemLogs([]);
        // Optionally, show a notification or redirect to login
        return;
      }
      try {
        const res = await fetch('http://localhost:3000/api/system/status', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success && json.data && json.data.metrics) {
          setSystemMetrics(json.data.metrics);
        }
      } catch (err) {
        console.log(err)
        setSystemMetrics((prev) => ({ ...prev, rfidReader: 'disconnected' }));
      }
    };
    fetchSystemStatus();
    const interval = setInterval(fetchSystemStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch recent activity with token check

  const fetchStudentByCardID = async (cardID) => {
    // Only use the part before the colon
    const pureCardID = cardID.split(':')[0];
    try {
      const res = await fetch(`http://localhost:3000/api/students/rfid/${pureCardID}`);
      if (res.ok) {
        const result = await res.json();
        return result.data;
      } else if (res.status === 404) {
        // Card not found, return a placeholder object
        return {
          name: 'Card not registered',
          profilePicture: '',
          cardID,
          status: 'unauthorized'
        };
      }
    } catch (err) {
      console.log('Error fetching student by card ID:', err);
      // Network or other error, return a placeholder object
      return {
        name: 'Unable to fetch card info',
        profilePicture: '',
        cardID,
        status: 'error'
      };
    }
    return null;
  }

  const formatTime = (date) => {
    if (!date) return '';
    let d = date;
    if (!(d instanceof Date)) {
      d = new Date(d);
    }
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // Helper to render log message with icons
  const renderLogMessage = (msg) => {
  const style = {
    fontFamily: 'Arial, sans-serif',
    fontSize: '1.1rem',
    verticalAlign: 'middle',
    display: 'inline-flex',
    alignItems: 'center',
  };
  if (msg.includes('🟢')) return <span style={style}><BsCheckCircle style={{color:'#10b981', marginRight:6}} /> {msg.replace('🟢','')}</span>;
  if (msg.includes('🤖')) return <span style={style}><BsRobot style={{marginRight:6}} /> {msg.replace('🤖','')}</span>;
  if (msg.includes('🔍')) return <span style={style}><BsSearch style={{marginRight:6}} /> {msg.replace('🔍','')}</span>;
  if (msg.includes('🚫') || msg.includes('❌')) return <span style={style}><BsXCircle style={{color:'#ef4444', marginRight:6}} /> {msg.replace('🚫','').replace('❌','')}</span>;
  if (msg.includes('📜')) return <span style={style}><BsFileEarmarkText style={{marginRight:6}} /> {msg.replace('📜','')}</span>;
  if (msg.includes('🎯')) return <span style={style}><BsBullseye style={{marginRight:6}} /> {msg.replace('🎯','')}</span>;
  return <span style={style}>{msg}</span>;
};

  // Helper to transform recentActivity data for RecentActivity component
  const recentActivityData = recentActivity.map(item => ({
    id: item.id,
    user: item.student?.name || 'Unknown',
    rfid: item.cardID || '',
    status: item.status || 'unknown',
    profilePicture: item.student?.profilePicture || '',
    // You can add more fields if needed, e.g. email, department, etc.
    // email: item.student?.email,
    // department: item.student?.department
  }));

  return (
    <div className="realtime-rfid">
      <Tooltip id="main-tooltip" effect="solid" />
      {/* System Status Header */}
      <div className="rfid-header">
        <div className="status-indicator">
          <div
            className={`status-dot ${systemMetrics.rfidReader === 'connected' ? 'online' : 'offline'}`}
            data-tooltip-id="main-tooltip"
            data-tooltip-content={systemMetrics.rfidReader === 'connected' ? 'System Online' : 'System Offline'}
          ></div>
          <h2 style={{fontSize: '2.2rem', fontWeight: 700, letterSpacing: '1px'}}>🔗 Real-Time RFID Monitor</h2>
        </div>
        <div className="connection-status">
          {systemMetrics.rfidReader === 'connected' ? (
            <span className="connected"
              data-tooltip-id="main-tooltip"
              data-tooltip-content="RFID Reader Connected">🟢 Connected</span>
          ) : (
            <span className="disconnected"
              data-tooltip-id="main-tooltip"
              data-tooltip-content="RFID Reader Disconnected">🔴 Disconnected</span>
          )}
        </div>
      </div>

      <div className="rfid-grid">
        {/* Current Status Cards */}
        <div className="status-cards">
          <div className="status-card system">
            <h3><BsCpu size={28} style={{marginRight: 12}} /> System Status</h3>
            <div className="status-content">
              <div className={`status-badge ${systemMetrics.rfidReader === 'connected' ? 'ready' : 'not-ready'}`}
                title={systemMetrics.rfidReader === 'connected' ? 'System is ready' : 'System is offline'}>
                {systemMetrics.rfidReader === 'connected' ? <><BsCheckCircle size={24} style={{color: '#10b981', marginRight: 8}} /> Ready</> : '🔴 Offline'}
              </div>
            </div>
          </div>

          <div className="status-card scan">
            <h3><BsSearch size={24} style={{marginRight: 12}} /> Last Card Scan</h3>
            <div className="status-content">
              {rfidStatus.lastCardScanned ? (
                scannedStudent ? (
                  <div className="student-scan-info">
                    <img
                      src={scannedStudent && (!scannedStudent.profilePicture || scannedStudent.name === 'Unknown Card' || scannedStudent.name === 'Unauthorized User')
                        ? 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
                        : scannedStudent.profilePicture?.startsWith('/uploads/profile-pictures/')
                          ? `http://localhost:3000${scannedStudent.profilePicture}`
                          : scannedStudent.profilePicture?.startsWith('http')
                            ? scannedStudent.profilePicture
                            : scannedStudent.profilePicture
                      }
                      alt="Profile"
                      className="profile-picture"
                      style={{ background: scannedStudent && (scannedStudent.name === 'Unknown Card' || scannedStudent.name === 'Unauthorized User') ? '#f3f4f6' : undefined }}
                    />
                    <span className="student-name" style={{fontSize: '1.2rem', fontWeight: 600}}>
                      {scannedStudent.name === 'Unknown Card' ? 'Card not registered' : scannedStudent.name === 'Unauthorized User' ? 'Unauthorized card tapped' : scannedStudent.name}
                    </span>
                  </div>
                ) : (
                  <div className="card-id">{rfidStatus.lastCardScanned.cardID}</div>
                )
              ) : (
                <div className="no-data">No cards scanned yet</div>
              )}
              {rfidStatus.lastCardScanned && (
                <div className="timestamp">{formatTime(rfidStatus.lastCardScanned.timestamp)}</div>
              )}
            </div>
          </div>

          <div className="status-card access">
            <h3><BsBullseye size={24} style={{marginRight: 12}} /> Last Access</h3>
            <div className="status-content">
              {rfidStatus.lastAccess ? (
                accessStudent ? (
                  <>
                    <div className="student-scan-info">
                      <img
                        src={accessStudent && (!accessStudent.profilePicture || accessStudent.name === 'Unknown Card' || accessStudent.name === 'Unauthorized User')
                          ? 'https://cdn-icons-png.flaticon.com/512/149/149071.png'
                          : accessStudent.profilePicture?.startsWith('/uploads/profile-pictures/')
                            ? `http://localhost:3000${accessStudent.profilePicture}`
                            : accessStudent.profilePicture?.startsWith('http')
                              ? accessStudent.profilePicture
                              : accessStudent.profilePicture
                      }
                      alt="Profile"
                      className="profile-picture"
                      style={{ background: accessStudent && (accessStudent.name === 'Unknown Card' || accessStudent.name === 'Unauthorized User') ? '#f3f4f6' : undefined }}
                    />
                    <span className="student-name" style={{fontSize: '1.2rem', fontWeight: 600}}>{accessStudent.name}</span>
                  </div>
                  <div className={`access-result ${rfidStatus.lastAccess.status}`}>
                    {rfidStatus.lastAccess.status === 'entered' && <><BsCheckCircle /> Entered</>}
                    {rfidStatus.lastAccess.status === 'denied' && <><BsXCircle /> Denied</>}
                    {rfidStatus.lastAccess.status === 'granted' && <><BsCheckCircle />     Granted</>}
                  </div>
                  <div className="timestamp">{formatTime(rfidStatus.lastAccess.timestamp)}</div>
                </>
                ) : (
                  <>
                    <div className="card-id">{rfidStatus.lastAccess.cardID}</div>
                    <div className={`access-result ${rfidStatus.lastAccess.status}`}>
                      {rfidStatus.lastAccess.status === 'entered' && <><BsCheckCircle /> Entered</>}
                      {rfidStatus.lastAccess.status === 'denied' && <><BsXCircle /> Denied</>}
                      {rfidStatus.lastAccess.status === 'granted' && <><BsCheckCircle /> Granted</>}
                    </div>
                    <div className="timestamp">{formatTime(rfidStatus.lastAccess.timestamp)}</div>
                  </>
                )
              ) : (
                <div className="no-data">No access attempts yet</div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="activity-section">
          <h3><BsClipboardData size={24} style={{marginRight: 12}} /> Recent Activity</h3>
          <RecentActivity data={recentActivityData} />
        </div>

        {/* System Logs */}
        <div className="logs-section">
          <h3><BsFileEarmarkText size={24} style={{marginRight: 12}} /> System Logs</h3>
          <div className="logs-list">
            {systemLogs.map((log) => (
              <div key={log.id} className={`log-item ${log.type}`}
                title={log.type.charAt(0).toUpperCase() + log.type.slice(1)}>
                <span className="log-time">{formatTime(log.timestamp)}</span>
                <span className="log-message">{renderLogMessage(log.message)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RealTimeRFID

// Example usage for public assets:
// <img src="/logo-ptc.png" alt="Logo" />
