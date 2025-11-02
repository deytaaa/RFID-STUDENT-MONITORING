import { useState, useEffect } from 'react'
import { CreditCard, Play, Users, CheckCircle, XCircle } from 'lucide-react'
import IoTDeviceService from '../../services/IoTDeviceService'
import './RFIDTestPanel.css'

const RFIDTestPanel = () => {
  const [students, setStudents] = useState([])
  const [isVisible, setIsVisible] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastTapResult, setLastTapResult] = useState(null)
  const [loading, setLoading] = useState(true)

  // Load real students from database
  useEffect(() => {
    const loadRealStudents = async () => {
      setLoading(true)
      // Only fetch if token exists
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await fetch('http://localhost:3000/api/students', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await response.json()
        
        if (data.success && data.data) {
          // Transform database students to test panel format
          const realStudents = data.data.map(student => ({
            id: student._id,
            name: student.name,
            studentId: student.studentId || student._id,
            course: student.course || 'No Course Set',
            yearLevel: student.yearLevel || 'No Year Set',
            rfidTag: student.rfIdTag,
            email: student.email,
            status: student.isActive ? 'active' : 'inactive'
          }))
          setStudents(realStudents)
        } else {
          // Fallback to IoT service students if API fails
          setStudents(IoTDeviceService.getStudentList())
        }
      } catch (error) {
        console.error('Error loading real students:', error)
        // Fallback to IoT service students
        setStudents(IoTDeviceService.getStudentList())
      } finally {
        setLoading(false)
      }
    }

    loadRealStudents()
  }, [])

  const handleTestTap = async (studentId) => {
    const student = students.find(s => s.id === studentId)
    if (!student) return

    setIsProcessing(true)
    
    try {
      // Send real RFID tap to backend (this will trigger WebSocket updates)
      const response = await fetch('http://localhost:3000/api/access-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          rfidTag: student.rfidTag, // Use actual RFID tag from database
          deviceId: '68f35d01e9848e5bc7c64f02', // Use actual device ID from database
          location: 'Main Gate',
          method: 'rfid',
          // Additional fields for our WebSocket enhancement
          userId: student.id,
          studentName: student.name,
          course: student.course,
          status: Math.random() > 0.1 ? 'granted' : 'denied' // 90% success rate
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setLastTapResult({
          student: student.name,
          status: result.data.status || (result.data.accessGranted ? 'granted' : 'denied'),
          time: new Date().toLocaleTimeString()
        })
        
        // Also trigger IoT simulation for local display
        IoTDeviceService.simulateStudentTap(studentId)
      }
    } catch (error) {
      console.error('Error simulating tap:', error)
      setLastTapResult({
        student: student.name,
        status: 'error',
        time: new Date().toLocaleTimeString()
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRandomTap = () => {
    const randomStudent = students[Math.floor(Math.random() * students.length)]
    handleTestTap(randomStudent.id)
  }

  if (!isVisible) {
    return (
      <button 
        className="test-panel-toggle"
        onClick={() => setIsVisible(true)}
        title="Open RFID Test Panel"
      >
        <CreditCard size={20} />
        Test RFID
      </button>
    )
  }

  return (
    <div className="rfid-test-panel">
      <div className="test-panel-header">
        <h3>RFID Test Panel</h3>
        <button 
          className="close-button"
          onClick={() => setIsVisible(false)}
        >
          ×
        </button>
      </div>

      <div className="test-actions">
        <button 
          className={`btn btn-primary ${isProcessing ? 'processing' : ''}`}
          onClick={handleRandomTap}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <div className="loading-spinner"></div>
              Processing...
            </>
          ) : (
            <>
              <Play size={16} />
              Random Tap
            </>
          )}
        </button>
      </div>

      {lastTapResult && (
        <div className={`tap-result ${lastTapResult.status}`}>
          <div className="result-icon">
            {lastTapResult.status === 'granted' ? (
              <CheckCircle size={20} />
            ) : (
              <XCircle size={20} />
            )}
          </div>
          <div className="result-info">
            <div className="result-student">{lastTapResult.student}</div>
            <div className="result-status">
              Access {lastTapResult.status.toUpperCase()} at {lastTapResult.time}
            </div>
          </div>
        </div>
      )}

      <div className="student-list">
        <h4>
          <Users size={16} />
          Real Students from Database
        </h4>
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading students...</p>
          </div>
        ) : (
          <div className="student-grid">
            {students.slice(0, 8).map((student) => (
              <button
                key={student.id}
                className={`student-button ${student.status} ${isProcessing ? 'processing' : ''}`}
                onClick={() => handleTestTap(student.id)}
                disabled={student.status === 'inactive' || isProcessing}
              >
                <div className="student-info">
                  <span className="student-name">{student.name}</span>
                  <span className="student-id">{student.studentId}</span>
                  <span className="student-course">{student.course} - {student.yearLevel}</span>
                </div>
              </button>
            ))}
            {students.length === 0 && (
              <div className="no-students">
                <p>No students found in database</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default RFIDTestPanel
