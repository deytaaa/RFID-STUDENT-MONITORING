import { BaseModel } from './BaseModel.js'

export class SystemModel extends BaseModel {
  constructor() {
    // Singleton pattern - return existing instance if it exists
    if (SystemModel.instance) {
      return SystemModel.instance
    }
    
    super()
    this.gateStatus = 'closed'
    this.systemStatus = 'online'
    this.settings = {
      // System Settings
      systemName: 'RFID Gate System',
      autoLockDelay: 5,
      maxAccessAttempts: 3,
      sessionTimeout: 30,
      
      // Network Settings
      serverHost: 'localhost',
      serverPort: 3001,
      mqttBroker: 'mqtt://localhost:1883',
      
      // Security Settings
      enableTwoFactor: false,
      requireStrongPasswords: true,
      sessionExpiry: 24,
      auditLogging: true,
      
      // Notification Settings
      emailNotifications: true,
      smsNotifications: false,
      slackIntegration: false,
      notifyOnFailedAccess: true,
      notifyOnSystemStatus: true,
      
      // RFID Settings
      rfidReaderPort: 'COM3',
      rfidReadDistance: 'medium',
      allowDuplicateCards: false,
      cardValidityPeriod: 365,
      
      // Database Settings
      backupInterval: 24,
      retentionPeriod: 90,
      autoCleanup: true
    }
    this.systemMetrics = {
      rfidReader: 'connected',
      database: 'connected',
      gateMotor: 'operational',
      network: 'strong'
    }
    this.stats = {
      totalAccess: 0,
      authorizedToday: 0,
      pendingRequests: 0,
      systemUptime: '100%'
    }
    
    // Store singleton instance
    SystemModel.instance = this
  }

  // Gate Control
  async openGate() {
    if (this.gateStatus === 'locked') {
      // Auto-unlock and then open for convenience
      await this.unlockGate()
    }
    
    this.gateStatus = 'open'
    this.notifyObservers({ type: 'GATE_STATUS_CHANGED', status: 'open' })
    
    // Auto-close after delay
    setTimeout(() => {
      if (this.gateStatus === 'open') {
        this.closeGate()
      }
    }, this.settings.autoLockDelay * 1000)
    
    return { success: true, message: 'Gate opened successfully' }
  }

  async closeGate() {
    this.gateStatus = 'closed'
    this.notifyObservers({ type: 'GATE_STATUS_CHANGED', status: 'closed' })
    return { success: true, message: 'Gate closed successfully' }
  }

  async unlockGate() {
    this.gateStatus = 'closed'
    this.notifyObservers({ type: 'GATE_STATUS_CHANGED', status: 'closed' })
    return { success: true, message: 'Gate unlocked successfully' }
  }

  async lockGate() {
    this.gateStatus = 'locked'
    this.notifyObservers({ type: 'GATE_STATUS_CHANGED', status: 'locked' })
    return { success: true, message: 'Gate locked for security' }
  }

  async emergencyLock() {
    this.gateStatus = 'locked'
    this.notifyObservers({ type: 'EMERGENCY_LOCK', status: 'locked' })
    // Log emergency action
    console.warn('EMERGENCY LOCK ACTIVATED')
    return { success: true, message: 'Emergency lock activated' }
  }

  // Settings Management
  getSetting(key) {
    return this.settings[key]
  }

  getSettings() {
    return { ...this.settings }
  }

  async updateSetting(key, value) {
    if (!(key in this.settings)) {
      throw new Error(`Setting '${key}' does not exist`)
    }

    // Validate setting based on type
    const validation = this.validateSetting(key, value)
    if (!validation.isValid) {
      throw new Error(validation.error)
    }

    this.settings[key] = value
    this.notifyObservers({ type: 'SETTING_UPDATED', key, value })
    return { success: true, message: `Setting '${key}' updated successfully` }
  }

  async updateSettings(newSettings) {
    const errors = []

    // Validate all settings
    for (const [key, value] of Object.entries(newSettings)) {
      if (key in this.settings) {
        const validation = this.validateSetting(key, value)
        if (!validation.isValid) {
          errors.push(`${key}: ${validation.error}`)
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '))
    }

    // Update all valid settings
    this.settings = { ...this.settings, ...newSettings }
    this.notifyObservers({ type: 'SETTINGS_UPDATED', settings: this.settings })
    return { success: true, message: 'Settings updated successfully' }
  }

  validateSetting(key, value) {
    switch (key) {
      case 'autoLockDelay':
      case 'maxAccessAttempts':
      case 'sessionTimeout':
      case 'serverPort':
      case 'sessionExpiry':
      case 'cardValidityPeriod':
      case 'backupInterval':
      case 'retentionPeriod':
        if (!Number.isInteger(value) || value < 1) {
          return { isValid: false, error: 'Must be a positive integer' }
        }
        break
      
      case 'systemName':
      case 'serverHost':
      case 'mqttBroker':
      case 'rfidReaderPort':
        if (!value || typeof value !== 'string' || value.trim() === '') {
          return { isValid: false, error: 'Must be a non-empty string' }
        }
        break
      
      case 'rfidReadDistance':
        if (!['short', 'medium', 'long'].includes(value)) {
          return { isValid: false, error: 'Must be short, medium, or long' }
        }
        break
      
      case 'enableTwoFactor':
      case 'requireStrongPasswords':
      case 'auditLogging':
      case 'emailNotifications':
      case 'smsNotifications':
      case 'slackIntegration':
      case 'notifyOnFailedAccess':
      case 'notifyOnSystemStatus':
      case 'allowDuplicateCards':
      case 'autoCleanup':
        if (typeof value !== 'boolean') {
          return { isValid: false, error: 'Must be true or false' }
        }
        break
    }

    return { isValid: true }
  }

  // System Status
  getSystemStatus() {
    return {
      gateStatus: this.gateStatus,
      systemStatus: this.systemStatus,
      metrics: this.systemMetrics,
      stats: this.stats
    }
  }

  updateSystemMetric(metric, status) {
    if (metric in this.systemMetrics) {
      this.systemMetrics[metric] = status
      this.notifyObservers({ type: 'SYSTEM_METRIC_UPDATED', metric, status })
    }
  }

  updateStats(newStats) {
    this.stats = { ...this.stats, ...newStats }
    this.notifyObservers({ type: 'STATS_UPDATED', stats: this.stats })
  }

  // System Actions
  async backupDatabase() {
    // Simulate backup process
    console.log('Starting database backup...')
    return new Promise((resolve) => {
      setTimeout(() => {
        this.notifyObservers({ type: 'BACKUP_COMPLETED' })
        resolve({ success: true, message: 'Database backup completed' })
      }, 2000)
    })
  }

  async cleanOldData() {
    // Simulate cleanup process
    console.log('Cleaning old data...')
    return new Promise((resolve) => {
      setTimeout(() => {
        this.notifyObservers({ type: 'CLEANUP_COMPLETED' })
        resolve({ success: true, message: 'Old data cleanup completed' })
      }, 1500)
    })
  }

  // Health Check
  performHealthCheck() {
    const issues = []
    
    // Check system metrics
    Object.entries(this.systemMetrics).forEach(([metric, status]) => {
      if (status !== 'connected' && status !== 'operational' && status !== 'strong') {
        issues.push(`${metric}: ${status}`)
      }
    })

    return {
      healthy: issues.length === 0,
      issues,
      timestamp: new Date().toISOString()
    }
  }
  
  // Singleton pattern methods
  static getInstance() {
    if (!SystemModel.instance) {
      SystemModel.instance = new SystemModel()
    }
    return SystemModel.instance
  }
  
  static resetInstance() {
    SystemModel.instance = null
  }
}

// Initialize static property
SystemModel.instance = null

export default SystemModel
