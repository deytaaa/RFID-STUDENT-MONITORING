import { BasePresenter } from './BasePresenter.js'
import SystemModel from '../models/SystemModel.js'
import AccessLogModel from '../models/AccessLogModel.js'
import UserModel from '../models/UserModel.js'
import ApiService from '../services/ApiService.js'
import WebSocketService from '../services/WebSocketService.js'

export class DashboardPresenter extends BasePresenter {
  constructor(user) {
    // Initialize system model first
    const systemModel = SystemModel.getInstance()
    super(systemModel)
    this.systemModel = systemModel
    this.accessLogModel = new AccessLogModel()
    this.userModel = new UserModel()
    this.user = user
    
    // Initialize data from backend
    this.initializeData()
    
    // Set up WebSocket listeners
    this.setupWebSocketListeners()
  }

  // Handle model updates (Observer pattern)
  update(data) {
    // Forward system model updates to the view
    if (data.type === 'GATE_STATUS_CHANGED' || data.type === 'EMERGENCY_LOCK') {
      super.update(data)
    }
  }

  async initializeData() {
    try {
      // Load real data from backend
      await this.loadAccessLogs()
      if (this.user && (this.user.role === 'superadmin' || this.user.accessLevel === 'superadmin')) {
        await this.loadUsers()
      }
      await this.loadSystemStatus()
    } catch (error) {
      console.warn('Failed to load data from backend, using fallback data:', error)
      this.initializeMockData()
    }
  }

  async loadAccessLogs() {
    try {
      const response = await ApiService.getAccessLogs({ limit: 10, sort: '-timestamp' })
      if (response.success && response.data) {
        this.accessLogModel.logs = response.data.map(log => ({
          id: log._id,
          timestamp: log.timestamp,
          user: log.userId?.name || log.userId?.email || 'Unknown User',
          rfid: log.userId?.rfidTag || 'Unknown',
          status: log.status,
          location: log.deviceId?.location || 'Unknown Location',
          course: log.userId?.course || 'Unknown',
          yearLevel: log.userId?.yearLevel || 'Unknown'
        }))
      }
    } catch (error) {
      console.error('Failed to load access logs:', error)
    }
  }

  async loadUsers() {
    try {
      const response = await ApiService.getUsers()
      if (response.success && response.data) {
        this.userModel.users = response.data
      }
    } catch (error) {
      console.error('Failed to load users:', error)
    }
  }

  async loadSystemStatus() {
    try {
      // Load real system status from backend
      const response = await ApiService.getSystemStatus()
      
      if (response.success && response.data) {
        // Update local model with backend state
        this.systemModel.gateStatus = response.data.gateStatus
        this.systemModel.systemStatus = response.data.systemStatus
        this.systemModel.systemMetrics = response.data.metrics
        
        // Notify observers of the status update
        this.systemModel.notifyObservers({ 
          type: 'GATE_STATUS_CHANGED', 
          status: response.data.gateStatus 
        })
        
        this.systemModel.notifyObservers({ 
          type: 'SYSTEM_STATUS_UPDATED', 
          data: response.data 
        })
      } else {
        // Fallback to default status
        this.systemModel.gateStatus = 'closed'
        this.systemModel.systemStatus = 'online'
      }
    } catch (error) {
      console.error('Failed to load system status:', error)
      // Fallback to default status on error
      this.systemModel.gateStatus = 'closed'
      this.systemModel.systemStatus = 'online'
    }
  }

  initializeMockData() {
    // Fallback mock data for students
    const mockLogs = [
      { id: 1, timestamp: new Date(Date.now() - 2 * 60000).toISOString(), user: 'John Doe', rfid: 'ST001234', status: 'granted', location: 'Main Gate', course: 'BSIT', yearLevel: '3rd Year' },
      { id: 2, timestamp: new Date(Date.now() - 5 * 60000).toISOString(), user: 'Jane Smith', rfid: 'ST005678', status: 'granted', location: 'Main Gate', course: 'CCS', yearLevel: '1st Year' },
      { id: 3, timestamp: new Date(Date.now() - 12 * 60000).toISOString(), user: 'Unknown Student', rfid: 'ST999999', status: 'denied', location: 'Main Gate', course: 'Unknown', yearLevel: 'Unknown' },
      { id: 4, timestamp: new Date(Date.now() - 18 * 60000).toISOString(), user: 'Mike Johnson', rfid: 'ST003456', status: 'granted', location: 'Main Gate', course: 'BSOA', yearLevel: '4th Year' },
      { id: 5, timestamp: new Date(Date.now() - 25 * 60000).toISOString(), user: 'Sarah Wilson', rfid: 'ST007890', status: 'granted', location: 'Main Gate', course: 'COA', yearLevel: '2nd Year' }
    ]
    
    this.accessLogModel.logs = mockLogs
  }

  setupWebSocketListeners() {
    // Listen for real-time gate status changes from backend
    WebSocketService.subscribeToGateStatus((data) => {
      // Update local model to match backend state
      this.systemModel.gateStatus = data.status
      
      // Notify UI components of the change
      this.systemModel.notifyObservers({ 
        type: 'GATE_STATUS_CHANGED', 
        status: data.status 
      })
    })

    // Listen for real-time access attempts
    WebSocketService.subscribeToAccessAttempts((data) => {
      // Add new access log
      this.accessLogModel.createLog({
        user: data.studentName || 'Unknown',
        rfid: data.rfidTag || 'Unknown',
        status: data.status,
        location: data.location || 'Main Gate',
        timestamp: data.timestamp || new Date().toISOString()
      })
      
      // Update statistics
      this.updateStats()
    })

    // Listen for system metrics updates
    WebSocketService.subscribeToSystemStatus((data) => {
      // Update system metrics
      this.systemModel.systemMetrics = data
      
      // Notify UI of system status change
      this.systemModel.notifyObservers({ 
        type: 'SYSTEM_STATUS_UPDATED', 
        data: data 
      })
    })
  }

  // Dashboard-specific methods
  async loadDashboardData() {
    return this.executeAsync(async () => {
      // Load real data from backend APIs
      await this.loadUsers()
      await this.loadAccessLogs()
      
      // Calculate real stats from backend data  
      const recentLogs = this.accessLogModel.logs.slice(0, 5)
      const todayLogs = this.accessLogModel.logs.filter(log => {
        const today = new Date().toDateString()
        const logDate = new Date(log.timestamp).toDateString()
        return logDate === today
      })
      
      // Update system stats with real data
      this.systemModel.stats = {
        totalAccess: this.accessLogModel.logs.length,
        authorizedToday: todayLogs.filter(log => log.status === 'granted').length,
        pendingRequests: 0, // Calculate from real data if needed
        systemUptime: '100%' // Could be calculated from system monitoring
      }

      return {
        systemStatus: this.systemModel.getSystemStatus(),
        recentActivity: recentLogs,
        stats: this.systemModel.stats,
        chartData: this.accessLogModel.getAccessByDay()
      }
    })
  }

  // Gate control methods
  async openGate() {
    return this.executeAsync(async () => {
      // Call backend API for gate control
      const response = await ApiService.controlGate('open')
      
      if (response.success) {
        // Update local model to match backend state
        this.systemModel.gateStatus = response.data.status
        this.systemModel.notifyObservers({ 
          type: 'GATE_STATUS_CHANGED', 
          status: response.data.status 
        })
        
        return {
          success: true,
          message: response.data.message || 'Gate opened successfully'
        }
      } else {
        throw new Error(response.message || 'Failed to open gate')
      }
    })
  }

  async closeGate() {
    return this.executeAsync(async () => {
      // Call backend API for gate control
      const response = await ApiService.controlGate('close')
      
      if (response.success) {
        // Update local model to match backend state
        this.systemModel.gateStatus = response.data.status
        this.systemModel.notifyObservers({ 
          type: 'GATE_STATUS_CHANGED', 
          status: response.data.status 
        })
        
        return {
          success: true,
          message: response.data.message || 'Gate closed successfully'
        }
      } else {
        throw new Error(response.message || 'Failed to close gate')
      }
    })
  }

  async emergencyLock() {
    return this.executeAsync(async () => {
      // Call backend API for gate control
      const response = await ApiService.controlGate('emergency-lock')
      
      if (response.success) {
        // Update local model to match backend state
        this.systemModel.gateStatus = response.data.status
        this.systemModel.notifyObservers({ 
          type: 'EMERGENCY_LOCK', 
          status: response.data.status 
        })
        
        return {
          success: true,
          message: response.data.message || 'Emergency lock activated'
        }
      } else {
        throw new Error(response.message || 'Failed to activate emergency lock')
      }
    })
  }

  // Data getters
  getSystemStatus() {
    return this.systemModel.getSystemStatus()
  }

  getRecentActivity() {
    return this.accessLogModel.getRecentActivity(5)
  }

  getAccessChartData() {
    return this.accessLogModel.getAccessByDay()
  }

  getStats() {
    return this.systemModel.stats
  }

  // Update methods
  updateStats() {
    const stats = this.accessLogModel.getAccessStats()
    this.systemModel.updateStats({
      authorizedToday: stats.granted,
      pendingRequests: Math.floor(Math.random() * 5) // Mock pending requests
    })
  }

  // Simulate real-time updates
  startRealTimeUpdates() {
    WebSocketService.connect()
    // Real-time updates will be handled by WebSocket events and user actions only
    // No automatic gate status simulation

    // Simulate new access attempts
    setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance every 10 seconds
        const users = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'Unknown']
        const rfids = ['RF001234', 'RF005678', 'RF003456', 'RF007890', 'RF999999']
        const statuses = ['granted', 'granted', 'granted', 'denied'] // 75% granted, 25% denied
        
        const randomUser = users[Math.floor(Math.random() * users.length)]
        const randomRfid = rfids[Math.floor(Math.random() * rfids.length)]
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
        
        this.accessLogModel.createLog({
          user: randomUser,
          rfid: randomRfid,
          status: randomStatus,
          location: 'Main Gate'
        })
        
        this.updateStats()
      }
    }, 10000)
  }

  // Cleanup
  destroy() {
    super.destroy()
    // Remove observer subscription
    this.systemModel.removeObserver(this)
    WebSocketService.unsubscribeFromGateStatus()
    WebSocketService.unsubscribeFromAccessAttempts()
    WebSocketService.unsubscribeFromSystemStatus()
  }
}

export default DashboardPresenter
