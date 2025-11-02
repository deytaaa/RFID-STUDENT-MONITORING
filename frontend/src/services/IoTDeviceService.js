// IoT RFID Device Service - Simulates real-time RFID tap communication
class IoTDeviceService {
  constructor() {
    this.isConnected = false
    this.listeners = new Set()
    this.mockStudents = [
      { id: 'ST001234', name: 'John Doe', course: 'BSIT', yearLevel: '3rd Year', status: 'active' },
      { id: 'ST005678', name: 'Jane Smith', course: 'CCS', yearLevel: '1st Year', status: 'active' },
      { id: 'ST003456', name: 'Mike Johnson', course: 'BSOA', yearLevel: '4th Year', status: 'active' },
      { id: 'ST007890', name: 'Sarah Wilson', course: 'COA', yearLevel: '2nd Year', status: 'active' },
      { id: 'ST002345', name: 'David Brown', course: 'ABA', yearLevel: '2nd Year', status: 'active' },
      { id: 'ST006789', name: 'Emily Davis', course: 'AAIS', yearLevel: '1st Year', status: 'active' },
      { id: 'ST004567', name: 'Alex Rodriguez', course: 'AHRD', yearLevel: '2nd Year', status: 'active' },
      { id: 'ST008901', name: 'Maria Garcia', course: 'AHRT', yearLevel: '1st Year', status: 'active' },
      { id: 'ST009012', name: 'Tom Wilson', course: 'BSIT', yearLevel: '2nd Year', status: 'active' },
      { id: 'ST010123', name: 'Lisa Chen', course: 'CCS', yearLevel: '1st Year', status: 'active' },
      { id: 'ST001111', name: 'Unknown Student', course: 'Unknown', yearLevel: 'Unknown', status: 'denied' }
    ]
    this.simulationInterval = null
  }

  // Connect to IoT device (simulated)
  connect() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isConnected = true
        this.notifyListeners({
          type: 'CONNECTION_STATUS',
          connected: true,
          timestamp: new Date().toISOString()
        })
        
        // Start simulating RFID taps
        this.startSimulation()
        resolve(true)
      }, 1000)
    })
  }

  // Disconnect from IoT device
  disconnect() {
    this.isConnected = false
    this.stopSimulation()
    this.notifyListeners({
      type: 'CONNECTION_STATUS',
      connected: false,
      timestamp: new Date().toISOString()
    })
  }

  // Add listener for real-time updates
  addListener(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  // Remove all listeners
  removeAllListeners() {
    this.listeners.clear()
  }

  // Notify all listeners of events
  notifyListeners(event) {
    this.listeners.forEach(callback => {
      try {
        callback(event)
      } catch (error) {
        console.error('Error in IoT event listener:', error)
      }
    })
  }

  // Start simulation of RFID taps
  startSimulation() {
    if (this.simulationInterval) return

    this.simulationInterval = setInterval(() => {
      this.simulateRFIDTap()
    }, 8000 + Math.random() * 7000) // Random interval between 8-15 seconds
  }

  // Stop simulation
  stopSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval)
      this.simulationInterval = null
    }
  }

  // Simulate an RFID tap event
  simulateRFIDTap() {
    if (!this.isConnected) return

    // Randomly select a student (90% chance of known student, 10% unknown)
    const isKnownStudent = Math.random() > 0.1
    let student

    if (isKnownStudent) {
      const activeStudents = this.mockStudents.filter(s => s.status === 'active')
      student = activeStudents[Math.floor(Math.random() * activeStudents.length)]
    } else {
      // Simulate unknown/denied access
      student = {
        id: `ST${Math.floor(Math.random() * 10000).toString().padStart(6, '0')}`,
        name: 'Unknown Student',
        course: 'Unknown',
        yearLevel: 'Unknown',
        status: 'denied'
      }
    }

    const tapEvent = {
      type: 'RFID_TAP',
      student: {
        studentId: student.id,
        name: student.name,
        course: student.course,
        yearLevel: student.yearLevel,
        photo: null
      },
      tapTime: new Date().toISOString(),
      status: student.status === 'active' ? 'granted' : 'denied',
      gateLocation: 'Main Entrance',
      deviceId: 'GATE-001',
      rfidSignalStrength: Math.floor(Math.random() * 100) + 1
    }

    // Notify all listeners
    this.notifyListeners(tapEvent)

    console.log('RFID Tap Simulated:', tapEvent)
  }

  // Manually trigger a specific student tap (for testing)
  simulateStudentTap(studentId) {
    const student = this.mockStudents.find(s => s.id === studentId)
    if (!student) return false

    const tapEvent = {
      type: 'RFID_TAP',
      student: {
        studentId: student.id,
        name: student.name,
        course: student.course,
        yearLevel: student.yearLevel,
        photo: null
      },
      tapTime: new Date().toISOString(),
      status: student.status === 'active' ? 'granted' : 'denied',
      gateLocation: 'Main Entrance',
      deviceId: 'GATE-001',
      rfidSignalStrength: Math.floor(Math.random() * 100) + 1
    }

    this.notifyListeners(tapEvent)
    return true
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      lastUpdate: new Date().toISOString(),
      deviceInfo: {
        id: 'GATE-001',
        location: 'Main Entrance',
        model: 'RFID-Reader-v2.1',
        firmware: '1.0.3'
      }
    }
  }

  // Get mock student list (for testing purposes)
  getStudentList() {
    return [...this.mockStudents]
  }
}

// Export singleton instance
export default new IoTDeviceService()
