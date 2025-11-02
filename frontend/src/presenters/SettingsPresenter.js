import { BasePresenter } from './BasePresenter.js'
import SystemModel from '../models/SystemModel.js'
import ApiService from '../services/ApiService.js'

export class SettingsPresenter extends BasePresenter {
  constructor() {
    super()
    this.systemModel = new SystemModel()
    this.activeTab = 'system'
    this.hasUnsavedChanges = false
    this.originalSettings = {}
  }

  // Settings retrieval
  async loadSettings() {
    return this.executeAsync(async () => {
      // In a real app, call API
      // const settings = await ApiService.getSettings()
      const settings = this.systemModel.getSettings()
      
      // Store original settings for comparison
      this.originalSettings = { ...settings }
      
      return settings
    })
  }

  getCurrentSettings() {
    return this.systemModel.getSettings()
  }

  getSetting(key) {
    return this.systemModel.getSetting(key)
  }

  // Settings modification
  async updateSetting(key, value) {
    try {
      // Validate the setting
      const validation = this.systemModel.validateSetting(key, value)
      if (!validation.isValid) {
        throw new Error(validation.error)
      }

      // Update in model
      const result = await this.systemModel.updateSetting(key, value)
      
      // Mark as having unsaved changes
      this.hasUnsavedChanges = true
      
      // Notify view
      this.notifyView({ 
        type: 'SETTING_CHANGED', 
        key, 
        value, 
        hasUnsavedChanges: this.hasUnsavedChanges 
      })
      
      return result
    } catch (error) {
      this.setError(error.message)
      throw error
    }
  }

  async updateMultipleSettings(settings) {
    return this.executeAsync(async () => {
      // In a real app, call API
      // const result = await ApiService.updateSettings(settings)
      const result = await this.systemModel.updateSettings(settings)
      
      // Update original settings
      this.originalSettings = { ...this.systemModel.getSettings() }
      this.hasUnsavedChanges = false
      
      this.notifyView({ 
        type: 'SETTINGS_SAVED', 
        settings: this.systemModel.getSettings(),
        hasUnsavedChanges: false 
      })
      
      return result
    })
  }

  async saveAllSettings() {
    return this.executeAsync(async () => {
      const currentSettings = this.systemModel.getSettings()
      
      // In a real app, call API
      // await ApiService.updateSettings(currentSettings)
      
      // Update original settings
      this.originalSettings = { ...currentSettings }
      this.hasUnsavedChanges = false
      
      this.notifyView({ 
        type: 'SETTINGS_SAVED', 
        settings: currentSettings,
        hasUnsavedChanges: false 
      })
      
      return { success: true, message: 'Settings saved successfully' }
    })
  }

  async resetSettings() {
    return this.executeAsync(async () => {
      // Reset to original settings
      await this.systemModel.updateSettings(this.originalSettings)
      this.hasUnsavedChanges = false
      
      this.notifyView({ 
        type: 'SETTINGS_RESET', 
        settings: this.originalSettings,
        hasUnsavedChanges: false 
      })
      
      return { success: true, message: 'Settings reset successfully' }
    })
  }

  // Tab management
  setActiveTab(tabId) {
    this.activeTab = tabId
    this.notifyView({ type: 'ACTIVE_TAB_CHANGED', activeTab: tabId })
  }

  getActiveTab() {
    return this.activeTab
  }

  // Validation
  validateSetting(key, value) {
    return this.systemModel.validateSetting(key, value)
  }

  validateAllSettings() {
    const settings = this.systemModel.getSettings()
    const errors = []

    Object.entries(settings).forEach(([key, value]) => {
      const validation = this.validateSetting(key, value)
      if (!validation.isValid) {
        errors.push(`${key}: ${validation.error}`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // System actions
  async performSystemAction(action) {
    return this.executeAsync(async () => {
      let result

      switch (action) {
        case 'backup':
          result = await this.systemModel.backupDatabase()
          break
        case 'cleanup':
          result = await this.systemModel.cleanOldData()
          break
        case 'health-check':
          result = this.systemModel.performHealthCheck()
          break
        case 'restart':
          // In a real app, this would restart the system
          result = { success: true, message: 'System restart requested' }
          break
        default:
          throw new Error(`Unknown system action: ${action}`)
      }

      this.notifyView({ type: 'SYSTEM_ACTION_COMPLETED', action, result })
      return result
    })
  }

  // Settings categories/tabs
  getSettingsByCategory(category) {
    const allSettings = this.systemModel.getSettings()
    const categories = {
      system: ['systemName', 'autoLockDelay', 'maxAccessAttempts', 'sessionTimeout'],
      network: ['serverHost', 'serverPort', 'mqttBroker'],
      security: ['enableTwoFactor', 'requireStrongPasswords', 'sessionExpiry', 'auditLogging'],
      notifications: ['emailNotifications', 'smsNotifications', 'slackIntegration', 'notifyOnFailedAccess', 'notifyOnSystemStatus'],
      rfid: ['rfidReaderPort', 'rfidReadDistance', 'allowDuplicateCards', 'cardValidityPeriod'],
      database: ['backupInterval', 'retentionPeriod', 'autoCleanup']
    }

    const categorySettings = {}
    if (categories[category]) {
      categories[category].forEach(key => {
        if (key in allSettings) {
          categorySettings[key] = allSettings[key]
        }
      })
    }

    return categorySettings
  }

  // Import/Export settings
  async exportSettings() {
    return this.executeAsync(async () => {
      const settings = this.systemModel.getSettings()
      const exportData = {
        settings,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rfid-system-settings-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      return { success: true, message: 'Settings exported successfully' }
    })
  }

  async importSettings(file) {
    return this.executeAsync(async () => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = async (e) => {
          try {
            const importData = JSON.parse(e.target.result)
            
            if (!importData.settings) {
              throw new Error('Invalid settings file format')
            }

            // Validate all imported settings
            const validation = this.validateImportedSettings(importData.settings)
            if (!validation.isValid) {
              throw new Error(`Invalid settings: ${validation.errors.join(', ')}`)
            }

            // Update settings
            await this.systemModel.updateSettings(importData.settings)
            this.originalSettings = { ...importData.settings }
            this.hasUnsavedChanges = false

            this.notifyView({ 
              type: 'SETTINGS_IMPORTED', 
              settings: importData.settings,
              hasUnsavedChanges: false 
            })

            resolve({ success: true, message: 'Settings imported successfully' })
          } catch (error) {
            reject(error)
          }
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsText(file)
      })
    })
  }

  validateImportedSettings(settings) {
    const errors = []
    
    Object.entries(settings).forEach(([key, value]) => {
      const validation = this.validateSetting(key, value)
      if (!validation.isValid) {
        errors.push(`${key}: ${validation.error}`)
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Change tracking
  hasUnsavedChanges() {
    return this.hasUnsavedChanges
  }

  getChangedSettings() {
    const current = this.systemModel.getSettings()
    const original = this.originalSettings
    const changes = {}

    Object.keys(current).forEach(key => {
      if (current[key] !== original[key]) {
        changes[key] = {
          original: original[key],
          current: current[key]
        }
      }
    })

    return changes
  }

  // Helper method to notify view
  notifyView(data) {
    if (this.view && this.view.updateView) {
      this.view.updateView(data)
    }
  }

  // System status
  getSystemStatus() {
    return this.systemModel.getSystemStatus()
  }

  // Testing connections
  async testConnection(type) {
    return this.executeAsync(async () => {
      // In a real app, these would test actual connections
      const tests = {
        database: () => ({ success: true, message: 'Database connection successful' }),
        rfid: () => ({ success: true, message: 'RFID reader connection successful' }),
        mqtt: () => ({ success: true, message: 'MQTT broker connection successful' }),
        email: () => ({ success: true, message: 'Email service connection successful' }),
        sms: () => ({ success: true, message: 'SMS service connection successful' })
      }

      if (tests[type]) {
        return tests[type]()
      } else {
        throw new Error(`Unknown connection type: ${type}`)
      }
    })
  }
}

export default SettingsPresenter
