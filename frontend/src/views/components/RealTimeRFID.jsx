import React, { useState, useEffect, useRef } from 'react'
import WebSocketService from '../../services/WebSocketService'
import ApiService from '../../services/ApiService.js'
import { BsCpu, BsCheckCircle, BsSearch, BsBullseye, BsClipboardData, BsFileEarmarkText, BsRobot, BsXCircle } from "react-icons/bs";
import { Tooltip } from 'react-tooltip';
import './RealTimeRFID.css'

const RealTimeRFID = () => {
  const [rfidStatus, setRfidStatus] = useState({
    systemReady: false,
    lastCardScanned: null,
    lastAccess: null,
    gateStatus: 'closed',
    isConnected: false
  })

  const [scannedStudent, setScannedStudent] = useState(null);
  const [accessStudent, setAccessStudent] = useState(null);
  const [systemMetrics, setSystemMetrics] = useState({ rfidReader: 'connected', database: 'connected', network: 'strong' });
  
  // Track last event times to prevent rapid duplicates

  useEffect(() => {
    // Load persisted state from localStorage on mount
    const persisted = localStorage.getItem('rfidMonitorState');
    if (persisted) {
      const state = JSON.parse(persisted);
      setRfidStatus(state.rfidStatus || rfidStatus);
      // Re-fetch student info for last scanned and last access
      if (state.rfidStatus?.lastCardScanned?.cardID) {
        fetchStudentByCardID(state.rfidStatus.lastCardScanned.cardID).then(setScannedStudent);
      }
      if (state.rfidStatus?.lastAccess?.cardID) {
        fetchStudentByCardID(state.rfidStatus.lastAccess.cardID).then(setAccessStudent);
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Persist state to localStorage whenever it changes
    localStorage.setItem('rfidMonitorState', JSON.stringify({
      rfidStatus,
      scannedStudent,
      accessStudent
    }));
  }, [rfidStatus, scannedStudent, accessStudent]);

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
      
      // Fetch student info by card ID
      const student = await fetchStudentByCardID(data.cardID);
      setScannedStudent(student);
      
      // Immediately update Last Access section with provisional status
      const provisionalStatus = student?.status === 'inactive' ? 'denied' : 
                               (student?.name === 'Card not registered' || student?.status === 'unauthorized' ? 'denied' : 'granted');
      
      setRfidStatus(prev => ({
        ...prev,
        lastAccess: {
          cardID: data.cardID,
          status: provisionalStatus,
          timestamp: new Date(data.receivedAt || new Date()),
          provisional: true
        },
        gateStatus: provisionalStatus === 'granted' ? 'open' : 'closed'
      }));
      
      // Set the access student immediately
      setAccessStudent(student);
      
      // Don't add to Recent Activity immediately - wait for the definitive access granted/denied event
      // This prevents duplicate entries
      console.log('🔍 Card scanned - waiting for access decision...');
    }

    const handleAccessGranted = async (data) => {
      console.log('✅ Access Granted:', JSON.stringify(data))
      // Always fetch the latest student info from backend
      const student = await fetchStudentByCardID(data.cardID);
      setAccessStudent({ ...student }); // Force new object reference
      setRfidStatus(prev => ({
        ...prev,
        lastAccess: {
          cardID: data.cardID,
          status: 'granted',
          timestamp: new Date(data.receivedAt || data.timestamp || new Date()),
          provisional: false // Mark as confirmed
        },
        gateStatus: 'open'
      }))
      // Do NOT update recentActivity here; let handleStudentTap fetch from backend
    }

    const handleAccessDenied = async (data) => {
      console.log('🚫 Access Denied:', JSON.stringify(data))
      const student = await fetchStudentByCardID(data.cardID);
      setRfidStatus(prev => ({
        ...prev,
        lastAccess: {
          cardID: data.cardID,
          status: 'denied',
          timestamp: new Date(data.receivedAt || new Date()),
          provisional: false // Mark as confirmed
        }
      }))
      setAccessStudent(student);
      // Do NOT update recentActivity here; let handleStudentTap fetch from backend
    }

    const handleGateClosed = (data) => {
      console.log('🔒 Gate Closed:', JSON.stringify(data))
      setRfidStatus(prev => ({
        ...prev,
        gateStatus: 'closed'
      }))
    }

    const handleGateOpen = (data) => {
      console.log('🚪 Gate Opened:', JSON.stringify(data))
      setRfidStatus(prev => ({
        ...prev,
        gateStatus: 'open'
      }))
    }

    const handleArduinoLog = () => {
      // Arduino log handling removed since System Logs section was removed
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

    }

    // Attach event listeners
    WebSocketService.on('system-status', handleSystemReady)
    WebSocketService.on('arduino-card-scanned', handleCardScanned)
    WebSocketService.on('arduino-access-granted', handleAccessGranted)
    WebSocketService.on('arduino-access-denied', handleAccessDenied)
    WebSocketService.on('arduino-gate-closed', handleGateClosed)
    WebSocketService.on('arduino-gate-open', handleGateOpen)
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
      WebSocketService.off('arduino-gate-open', handleGateOpen)
      WebSocketService.off('arduino-log', handleArduinoLog)
      WebSocketService.off('connected', handleConnected)
      WebSocketService.off('disconnected', handleDisconnected)
    }
  }, [])

  // Fetch system status on mount and every 10 seconds
  useEffect(() => {
    const fetchSystemStatus = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setSystemMetrics((prev) => ({ ...prev, rfidReader: 'disconnected' }));
        // Optionally, show a notification or redirect to login
        return;
      }
      try {
        const json = await ApiService.get('/system/status');
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

  // Add caching for student data to prevent repeated API calls
  const studentCache = useRef(new Map());
  
  const fetchStudentByCardID = async (cardID) => {
    // Only use the part before the colon
    const pureCardID = cardID.split(':')[0];
    
    // Check cache first
    if (studentCache.current.has(pureCardID)) {
      console.log('🚀 Using cached student data for:', pureCardID);
      return studentCache.current.get(pureCardID);
    }
    
    try {
      const result = await ApiService.get(`/students/rfid/${pureCardID}`);
      if (result.success && result.data) {
        // Cache the result
        studentCache.current.set(pureCardID, result.data);
        return result.data;
      } else {
        const fallback = {
          name: 'Card not registered',
          profilePicture: '',
          cardID,
          status: 'unauthorized'
        };
        studentCache.current.set(pureCardID, fallback);
        return fallback;
      }
    } catch (err) {
      console.log('Error fetching student by card ID:', err);
      console.log('Error response status:', err.response?.status);
      console.log('Error response data:', err.response?.data);
      console.log('Full error object:', err);
      
      let studentData;
      // Check the response status to distinguish between different error types
      if (err.response?.status === 404) {
        studentData = {
          name: 'Card not registered',
          profilePicture: '',
          cardID,
          status: 'unauthorized'
        };
      } else if (err.response?.status === 403) {
        // Card is registered but inactive (CARD_INACTIVE)
        const responseData = err.response?.data?.data;
        studentData = {
          name: responseData?.name || 'Inactive User',
          profilePicture: responseData?.profilePicture || '',
          email: responseData?.email,
          studentId: responseData?.studentId,
          course: responseData?.course,
          yearLevel: responseData?.yearLevel,
          cardID,
          status: 'inactive',
          isActive: false
        };
      } else {
        studentData = {
          name: 'Unable to fetch card info',
          profilePicture: '',
          cardID,
          status: 'error'
        };
      }
      
      // Cache the error result to prevent repeated failed requests
      studentCache.current.set(pureCardID, studentData);
      return studentData;
    }
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
          <div className="status-card access" style={{ 
            gridColumn: '1 / -1', 
            width: '100%',
            background: 'linear-gradient(145deg, #ffffff 0%, #f9fafb 100%)',
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(229, 231, 235, 0.8)',
            transition: 'all 0.3s ease',
            padding: '32px'
          }}>
            <h3 style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              color: '#374151',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              letterSpacing: '0.5px'
            }}><BsBullseye size={28} style={{marginRight: 16, color: '#059669'}} /> Recent Access</h3>
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
                      style={{ 
                        background: accessStudent && (accessStudent.name === 'Unknown Card' || accessStudent.name === 'Unauthorized User') ? '#f3f4f6' : undefined,
                        width: '350px',
                        height: '350px',
                        borderRadius: '16px',
                        objectFit: 'cover',
                        border: '4px solid #ffffff',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15), 0 4px 16px rgba(0, 0, 0, 0.1)',
                        transition: 'all 0.3s ease'
                      }}
                    />
                    <span className="student-name" style={{
                      fontSize: '1.5rem', 
                      fontWeight: 700, 
                      color: '#1f2937',
                      textAlign: 'center',
                      display: 'block',
                      marginTop: '16px',
                      letterSpacing: '0.5px'
                    }}>{accessStudent.name}</span>
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
                    <div className="card-id">{rfidStatus.lastAccess.cardID}</div>                  <div className={`access-result ${rfidStatus.lastAccess.status}`} style={{
                    background: rfidStatus.lastAccess.status === 'granted' 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
                      : rfidStatus.lastAccess.status === 'denied'
                      ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                      : 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginTop: '16px',
                    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.15)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    {rfidStatus.lastAccess.status === 'entered' && <><BsCheckCircle size={20} /> Entered</>}
                    {rfidStatus.lastAccess.status === 'denied' && <><BsXCircle size={20} /> Denied</>}
                    {rfidStatus.lastAccess.status === 'granted' && <><BsCheckCircle size={20} /> Access Granted</>}
                  </div>
                  <div className="timestamp" style={{
                    fontSize: '0.95rem',
                    color: '#6b7280',
                    textAlign: 'right',
                    marginTop: '12px',
                    fontWeight: 500,
                    letterSpacing: '0.5px'
                  }}>{formatTime(rfidStatus.lastAccess.timestamp)}</div>
                  </>
                )
              ) : (
                <div className="no-data">No access attempts yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RealTimeRFID

// Example usage for public assets:
// <img src="/logo-ptc.png" alt="Logo" />
