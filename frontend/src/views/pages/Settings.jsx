import { useState } from 'react'
import { Save, Wifi, Shield, Bell, Database, Clock, CheckCircle } from 'lucide-react'  
import ApiService from '../../services/ApiService.js'
import './Settings.css'

const Settings = () => {
  const [settings, setSettings] = useState({
    // System Settings
    systemName: 'RFID Gate System',
    autoLockDelay: 5,
    maxAccessAttempts: 3,
    
    // Network Settings
    serverHost: 'localhost',
    serverPort: 3000,
    mqttBroker: 'mqtt://localhost:1883',
    
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
  })

  const [activeTab, setActiveTab] = useState('system')
  const [saveSuccess, setSaveSuccess] = useState(false)

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = async () => {
    // Only fetch if token exists
    const token = localStorage.getItem('token');
    if (!token) {
      setSaveSuccess(false);
      setTimeout(() => setSaveSuccess(false), 3000);
      alert('Not authenticated. Please log in.');
      return;
    }
    try {
      console.log('Saving settings:', settings)
      // Send settings to backend API using ApiService
      await ApiService.put('/settings', settings);
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.log('Error saving settings:', err)
      setSaveSuccess(false)
      alert('Failed to save settings.');
    }
  }

  const tabs = [
    { id: 'system', label: 'System', icon: Shield },
    { id: 'network', label: 'Network', icon: Wifi },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'rfid', label: 'RFID', icon: Wifi },
    { id: 'database', label: 'Database', icon: Database }
  ]

  return (
    <div className="settings">
      <div className="settings-header">
        <div className="settings-title">
        </div>
        <div className="settings-actions">
          {saveSuccess && (
            <div className="alert alert-success" style={{ marginRight: '16px', padding: '8px 12px', display: 'inline-flex', alignItems: 'center' }}>
              <CheckCircle size={16} />
              <span style={{ marginLeft: '8px' }}>Settings saved successfully!</span>
            </div>
          )}
          <button className="btn btn-primary" onClick={handleSave}>
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>

      <div className="settings-container">
        <div className="settings-tabs">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div className="settings-content">
          {activeTab === 'system' && (
            <div className="settings-section">
              <h3>System Configuration</h3>
              
              <div className="setting-group">
                <label>System Name</label>
                <input
                  type="text"
                  value={settings.systemName}
                  onChange={(e) => handleSettingChange('systemName', e.target.value)}
                />
              </div>

              <div className="setting-group">
                <label>Auto Lock Delay (seconds)</label>
                <input
                  type="number"
                  value={settings.autoLockDelay}
                  onChange={(e) => handleSettingChange('autoLockDelay', parseInt(e.target.value))}
                />
              </div>

              <div className="setting-group">
                <label>Max Access Attempts</label>
                <input
                  type="number"
                  value={settings.maxAccessAttempts}
                  onChange={(e) => handleSettingChange('maxAccessAttempts', parseInt(e.target.value))}
                />
              </div>
            </div>
          )}

          {activeTab === 'network' && (
            <div className="settings-section">
              <h3>Network Configuration</h3>
              
              <div className="setting-group">
                <label>Server Host</label>
                <input
                  type="text"
                  value={settings.serverHost}
                  onChange={(e) => handleSettingChange('serverHost', e.target.value)}
                />
              </div>

              <div className="setting-group">
                <label>Server Port</label>
                <input
                  type="number"
                  value={settings.serverPort}
                  onChange={(e) => handleSettingChange('serverPort', parseInt(e.target.value))}
                />
              </div>

              <div className="setting-group">
                <label>MQTT Broker URL</label>
                <input
                  type="text"
                  value={settings.mqttBroker}
                  onChange={(e) => handleSettingChange('mqttBroker', e.target.value)}
                />
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section">
              <h3>Notification Settings</h3>


              <div className="setting-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnFailedAccess}
                    onChange={(e) => handleSettingChange('notifyOnFailedAccess', e.target.checked)}
                  />
                  Notify on Failed Access Attempts
                </label>
              </div>

                           <div className="setting-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.notifyOnFailedAccess}
                    onChange={(e) => handleSettingChange('notifyOnFailedAccess', e.target.checked)}
                  />
                  Notify on Granted Access Attempts
                </label>
              </div>

              

            </div>
          )}

          {activeTab === 'rfid' && (
            <div className="settings-section">
              <h3>RFID Configuration</h3>
              
              <div className="setting-group">
                <label>RFID Reader Port</label>
                <select
                  value={settings.rfidReaderPort}
                  onChange={(e) => handleSettingChange('rfidReaderPort', e.target.value)}
                >
                  <option value="COM1">COM1</option>
                  <option value="COM2">COM2</option>
                  <option value="COM3">COM3</option>
                  <option value="COM4">COM4</option>
                  <option value="/dev/ttyUSB0">/dev/ttyUSB0</option>
                  <option value="/dev/ttyUSB1">/dev/ttyUSB1</option>
                </select>
              </div>

              <div className="setting-group">
                <label>Card Validity Period (days)</label>
                <input
                  type="number"
                  value={settings.cardValidityPeriod}
                  onChange={(e) => handleSettingChange('cardValidityPeriod', parseInt(e.target.value))}
                />
              </div>
            </div>
          )}

          {activeTab === 'database' && (
            <div className="settings-section">
              <h3>Database Settings</h3>
              
              <div className="setting-group">
                <label>Backup Interval (hours)</label>
                <input
                  type="number"
                  value={settings.backupInterval}
                  onChange={(e) => handleSettingChange('backupInterval', parseInt(e.target.value))}
                />
              </div>

              <div className="setting-group">
                <label>Data Retention Period (days)</label>
                <input
                  type="number"
                  value={settings.retentionPeriod}
                  onChange={(e) => handleSettingChange('retentionPeriod', parseInt(e.target.value))}
                />
              </div>

              <div className="setting-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={settings.autoCleanup}
                    onChange={(e) => handleSettingChange('autoCleanup', e.target.checked)}
                  />
                  Enable Auto Cleanup
                </label>
              </div>

              <div className="setting-actions">
                <button className="btn btn-secondary">
                  <Database size={16} />
                  Backup Now
                </button>
                <button className="btn btn-secondary">
                  <Clock size={16} />
                  Clean Old Data
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Settings
