import { useState, useEffect } from 'react'
import { 
  User, 
  Clock, 
  CheckCircle, 
  XCircle, 
  GraduationCap,
  CreditCard,
  MapPin,
  Activity
} from 'lucide-react'
import IoTDeviceService from '../../services/IoTDeviceService'
import WebSocketService from '../../services/WebSocketService'
import './StudentAccessTracker.css'

const StudentAccessTracker = () => {
  const [currentStudent, setCurrentStudent] = useState(null)
  const [recentAccess, setRecentAccess] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(null)

  // Real-time IoT device connection
  useEffect(() => {
    // Connect to IoT device
    IoTDeviceService.connect().then(() => {
      const status = IoTDeviceService.getConnectionStatus()
      setIsConnected(status.connected)
    })

    // Listen for real-time RFID tap events
    const unsubscribe = IoTDeviceService.addListener((event) => {
      if (event.type === 'RFID_TAP') {
        const tapData = {
          studentId: event.student.studentId,
          name: event.student.name,
          course: event.student.course,
          yearLevel: event.student.yearLevel,
          photo: event.student.photo,
          tapTime: event.tapTime,
          status: event.status,
          gateLocation: event.gateLocation
        }

        setCurrentStudent(tapData)
        setRecentAccess(prev => [tapData, ...prev.slice(0, 9)])
        setLastUpdate(new Date())
      } else if (event.type === 'CONNECTION_STATUS') {
        setIsConnected(event.connected)
        setLastUpdate(new Date())
      }
    })

    // Load real data from database
    const loadRealStudentData = async () => {
      // Only fetch if token exists
      const token = localStorage.getItem('token');
      if (!token) {
        return;
      }
      try {
        // Load recent access logs
        const accessResponse = await fetch('http://localhost:3000/api/access-logs?limit=10', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const accessData = await accessResponse.json()
        
        if (accessData.success && accessData.data.length > 0) {
          // Transform access logs to tracker format
          const recentAccessData = accessData.data.map(log => ({
            studentId: log.userId?.studentId || 'Unknown',
            name: log.userId?.name || 'Unknown Student',
            course: log.userId?.course || 'Unknown Course',
            yearLevel: log.userId?.yearLevel || 'Unknown Year',
            photo: null,
            tapTime: log.timestamp,
            status: log.accessGranted ? 'granted' : 'denied',
            gateLocation: log.location || 'Main Entrance'
          }))
          
          setRecentAccess(recentAccessData)
          if (recentAccessData.length > 0) {
            setCurrentStudent(recentAccessData[0])
          }
        } else {
          // Fallback: Load a random student as current
          const studentsResponse = await fetch('http://localhost:3001/api/students?limit=1')
          const studentsData = await studentsResponse.json()
          
          if (studentsData.success && studentsData.data.length > 0) {
            const student = studentsData.data[0]
            const fallbackStudent = {
              studentId: student.studentId || student._id,
              name: student.name,
              course: student.course || 'No Course Set',
              yearLevel: student.yearLevel || 'No Year Set',
              photo: null,
              tapTime: new Date().toISOString(),
              status: 'waiting',
              gateLocation: 'Main Entrance'
            }
            setCurrentStudent(fallbackStudent)
            setRecentAccess([fallbackStudent])
          }
        }
      } catch (error) {
        console.error('Error loading real student data:', error)
        // Keep existing mock data as fallback
        const fallbackData = [{
          studentId: 'DEMO001',
          name: 'Demo Student',
          course: 'Demo Course',
          yearLevel: 'Demo Year',
          photo: null,
          tapTime: new Date().toISOString(),
          status: 'demo',
          gateLocation: 'Demo Gate'
        }]
        setRecentAccess(fallbackData)
        setCurrentStudent(fallbackData[0])
      }
    }

    loadRealStudentData()
    setLastUpdate(new Date())

    // Set up WebSocket listener for real-time backend updates
    const handleStudentTap = (tapEvent) => {
      console.log('🎓 Real-time student tap in tracker:', tapEvent)
      
      const realTapData = {
        studentId: tapEvent.id,
        name: tapEvent.user,
        course: tapEvent.course || 'Unknown Course',
        yearLevel: 'Unknown Year',
        photo: null,
        tapTime: tapEvent.timestamp,
        status: tapEvent.status,
        gateLocation: tapEvent.location
      }

      setCurrentStudent(realTapData)
      setRecentAccess(prev => [realTapData, ...prev.slice(0, 9)])
      setLastUpdate(new Date())
    }

    // Connect WebSocket and listen for student taps
    WebSocketService.connect()
    WebSocketService.on('studentTap', handleStudentTap)

    // Cleanup on unmount
    return () => {
      unsubscribe()
      IoTDeviceService.disconnect()
      WebSocketService.off('studentTap', handleStudentTap)
    }
  }, [])

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  const getStatusIcon = (status) => {
    return status === 'granted' ? 
      <CheckCircle className="status-icon granted" size={20} /> : 
      <XCircle className="status-icon denied" size={20} />
  }

  return (
    <div className="student-access-tracker">
      {/* Connection Status */}
      <div className="connection-status">
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          <Activity size={16} />
          <span>{isConnected ? 'IoT Device Connected' : 'IoT Device Disconnected'}</span>
        </div>
        {lastUpdate && (
          <div className="last-update">
            Last update: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Current Student Display */}
      {currentStudent && (
        <div className="current-student-display">
          <div className="current-student-header">
            <h2>Latest Student Access</h2>
            <div className={`access-status ${currentStudent.status}`}>
              {getStatusIcon(currentStudent.status)}
              <span>{currentStudent.status === 'granted' ? 'ACCESS GRANTED' : 'ACCESS DENIED'}</span>
            </div>
          </div>

          <div className="student-card-large">
            <div className="student-photo">
              {currentStudent.photo ? (
                <img src={currentStudent.photo} alt={currentStudent.name} />
              ) : (
                <div className="photo-placeholder">
                  <GraduationCap size={48} />
                </div>
              )}
            </div>
            
            <div className="student-info-large">
              <h3 className="student-name">{currentStudent.name}</h3>
              <div className="student-details">
                <div className="detail-item">
                  <CreditCard size={16} />
                  <span>ID: {currentStudent.studentId}</span>
                </div>
                <div className="detail-item">
                  <GraduationCap size={16} />
                  <span>Course: {currentStudent.course} - {currentStudent.yearLevel}</span>
                </div>
                <div className="detail-item">
                  <MapPin size={16} />
                  <span>Gate: {currentStudent.gateLocation}</span>
                </div>
                <div className="detail-item">
                  <Clock size={16} />
                  <span>Time: {new Date(currentStudent.tapTime).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Access Log */}
      <div className="recent-access-log">
        <h3>Recent Student Access</h3>
        <div className="access-list">
          {recentAccess.map((access) => (
            <div key={`${access.studentId}-${access.tapTime}`} className={`access-item ${access.status}`}>
              <div className="access-avatar">
                {access.photo ? (
                  <img src={access.photo} alt={access.name} />
                ) : (
                  <div className="avatar-placeholder">
                    <User size={20} />
                  </div>
                )}
              </div>

              <div className="access-info">
                <div className="access-name">{access.name}</div>
                <div className="access-details">
                  <span className="student-id">{access.studentId}</span>
                  <span className="student-course">{access.course} - {access.yearLevel}</span>
                </div>
              </div>

              <div className="access-meta">
                <div className="access-time">{formatTime(access.tapTime)}</div>
                <div className="access-location">{access.gateLocation}</div>
              </div>

              <div className="access-status-indicator">
                {getStatusIcon(access.status)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default StudentAccessTracker
