/**
 * Arduino Serial Communication Service
 * Handles USB Serial connection between Arduino Uno and Backend
 * Emits 'studentTap' events for React Dashboard
 * by Manuel Data Jr 💪
 */

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { AccessLog, User, Device } = require('../models');
const Setting = require('../models/Settings');
const NotificationController = require('../controllers/NotificationController');
const axios = require('axios');

class ArduinoSerialService {
  constructor(io) {
    this.io = io;
    this.port = null;
    this.parser = null;
    this.isConnected = false;
    this.reconnectInterval = null;
    this.lastScanTime = new Map();
    this.cooldownMs = 3000; // 3 seconds cooldown
  }

  // ----------------------------
  // Find and connect to Arduino
  // ----------------------------
  async findAndConnect() {
    try {
      console.log('🔍 Searching for Arduino...');
      const ports = await SerialPort.list();
      console.log('📡 Available ports:', ports.map(p => `${p.path} (${p.manufacturer})`));

      const arduinoPort = ports.find(port =>
        port.manufacturer?.toLowerCase().includes('arduino') ||
        port.manufacturer?.toLowerCase().includes('ch340') ||
        port.manufacturer?.toLowerCase().includes('ftdi') ||
        port.path.includes('ttyACM') ||
        port.path.includes('COM')
      );

      if (!arduinoPort) {
        console.log('❌ Arduino not found.');
        return false;
      }

      console.log(`✅ Found Arduino at: ${arduinoPort.path}`);
      return await this.connect(arduinoPort.path);
    } catch (error) {
      console.error('❌ Error finding Arduino:', error.message);
      return false;
    }
  }

  // ----------------------------
  // Connect to Arduino
  // ----------------------------
  async connect(portPath) {
    try {
      this.port = new SerialPort({ path: portPath, baudRate: 9600, autoOpen: false });
      this.parser = this.port.pipe(new ReadlineParser({ delimiter: '\n' }));
      this.setupEventHandlers();

      await new Promise((resolve, reject) => this.port.open(err => (err ? reject(err) : resolve())));

      console.log(`🔗 Connected to Arduino at ${portPath}`);
      this.isConnected = true;

      if (this.reconnectInterval) {
        clearInterval(this.reconnectInterval);
        this.reconnectInterval = null;
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to connect:', error.message);
      this.isConnected = false;
      this.scheduleReconnect();
      return false;
    }
  }

  // ----------------------------
  // Event Handlers
  // ----------------------------
  setupEventHandlers() {
    this.parser.on('data', (data) => {
      const line = data.toString().trim();

      if (line.startsWith('BACKEND_DATA:')) {
        this.handleBackendData(line.substring(13));
      } else {
        console.log(`🤖 Arduino: ${line}`);
        this.io.emit('arduino_log', { message: line, timestamp: new Date().toISOString() });
      }
    });

    this.port.on('error', (err) => {
      console.error('❌ Arduino error:', err.message);
      this.isConnected = false;
      this.scheduleReconnect();
    });

    this.port.on('close', () => {
      console.log('🔌 Arduino disconnected');
      this.isConnected = false;
      this.scheduleReconnect();
    });
  }

  
  handleBackendData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      console.log(`📡 Arduino Event: ${data.event}`, data);

      switch (data.event) {
        case 'SYSTEM_READY': this.handleSystemReady(data); break;
        case 'CARD_SCANNED': this.handleCardScanned(data); break;
        case 'ENTRY_SCANNED': this.handleEntryScanned(data); break; // NEW
        case 'EXIT_SCANNED': this.handleExitScanned(data); break;   // NEW
        case 'ACCESS_GRANTED': this.handleAccessGranted(data); break;
        case 'ACCESS_DENIED': this.handleAccessDenied(data); break;
        case 'GATE_OPEN': this.handleGateOpen(data); break;
        case 'GATE_CLOSED': this.handleGateClosed(data); break;
        default: console.log(`❓ Unknown event: ${data.event}`);
      }

      this.io.emit('arduino_event', { ...data, receivedAt: new Date().toISOString() });
    } catch (error) {
      console.error('❌ Error parsing data:', error.message);
      console.error('📄 Raw data:', jsonString);
    }
  }

  handleSystemReady(data) {
    console.log('✅ Arduino system ready');
    this.io.emit('system_status', {
      status: 'ready',
      message: 'Arduino RFID system is ready',
      timestamp: new Date().toISOString()
    });
  }

  // ----------------------------
  // Handle Card Scan
  // ----------------------------
  async handleCardScanned(data) {
    const formattedID = data.cardID.trim().toUpperCase();
    const now = Date.now();
    const lastTime = this.lastScanTime.get(formattedID) || 0;

    // Increased cooldown to prevent duplicates
    if (now - lastTime < this.cooldownMs) {
      console.log(`⏱️ Card ${formattedID} still in cooldown, ignoring...`);
      return;
    }
    this.lastScanTime.set(formattedID, now);

    let status = 'denied';
    let user = null;

    try {
      user = await User.findOne({ rfIdTag: formattedID });
      const device = await Device.findOne({ name: 'Main Gate Arduino' });

      // Fetch autoLockDelay from settings
      let autoLockDelay = 10; // Default to 10 seconds
      try {
        const delaySetting = await Setting.getSetting('autoLockDelay');
        if (typeof delaySetting === 'number' && delaySetting > 0) {
          autoLockDelay = delaySetting;
        }
      } catch (err) {
        console.error('Could not fetch autoLockDelay setting:', err.message);
      }

      if (!user || !user.isActive) {
        this.sendCommand(`ACCESS_DENIED:${formattedID}`);
        console.log(`🚫 Access denied for ${formattedID}`);
        status = 'denied';
        
        // Create notification for all active admins
        await this.createNotificationForAllAdmins({
          type: 'access_denied',
          title: 'Access Denied',
          message: `Unauthorized access attempt with card ${formattedID}`,
          data: {
            cardID: formattedID,
            deviceId: device?._id?.toString(),
            location: device?.location || 'Main Gate'
          },
          priority: 'high',
          category: 'security'
        });
      } else {
        // Send ACCESS_GRANTED with delay
        this.sendCommand(`ACCESS_GRANTED:${formattedID}:${autoLockDelay}`);
        status = 'entered';
        console.log(`✅ Access granted for ${user.name}`);
        
        // Create notification for successful access (optional, lower priority)
        await this.createNotificationForAllAdmins({
          type: 'access_granted',
          title: 'Access Granted',
          message: `${user.name} entered via card ${formattedID}`,
          data: {
            cardID: formattedID,
            studentId: user._id?.toString(),
            studentName: user.name,
            deviceId: device?._id?.toString(),
            location: device?.location || 'Main Gate'
          },
          priority: 'low',
          category: 'access'
        });
      }

      // Note: Removed studentTap event emission to prevent duplicate entries in Recent Activity
      // The specific arduino-access-granted/denied events handle the Recent Activity updates

      // Log to MongoDB - this is the definitive access log
      await this.logAccess(device, formattedID, status, status === 'entered' ? 'Valid' : 'Denied', user);
    } catch (err) {
      console.error('❌ Error handling card scan:', err.message);
    }
  }

  // ----------------------------
  // Handle Entry RFID Scan
  // ----------------------------
  async handleEntryScanned(data) {
    // Same as handleCardScanned, but for ENTRY
    const formattedID = data.cardID.trim().toUpperCase();
    const now = Date.now();
    const lastTime = this.lastScanTime.get('entry_' + formattedID) || 0;
    if (now - lastTime < this.cooldownMs) {
      console.log(`⏱️ Entry card ${formattedID} still in cooldown, ignoring...`);
      return;
    }
    this.lastScanTime.set('entry_' + formattedID, now);
    let status = 'denied';
    let user = null;
    try {
      user = await User.findOne({ rfIdTag: formattedID });
      // Use deviceSerial from Arduino data
      const device = await Device.findOne({ serialNumber: data.deviceSerial });
      let autoLockDelay = 10;
      try {
        const delaySetting = await Setting.getSetting('autoLockDelay');
        if (typeof delaySetting === 'number' && delaySetting > 0) {
          autoLockDelay = delaySetting;
        }
      } catch (err) {
        console.error('Could not fetch autoLockDelay setting:', err.message);
      }
      if (!user || !user.isActive) {
        this.sendCommand(`ACCESS_DENIED:${formattedID}`);
        console.log(`🚫 Entry access denied for ${formattedID}`);
        status = 'denied';
        await this.createNotificationForAllAdmins({
          type: 'access_denied',
          title: 'Entry Access Denied',
          message: `Unauthorized entry attempt with card ${formattedID}`,
          data: { cardID: formattedID, deviceId: device?._id?.toString(), location: device?.location || 'Unknown Location' },
          priority: 'high',
          category: 'security'
        });
      } else {
        this.sendCommand(`ACCESS_GRANTED:${formattedID}:${autoLockDelay}`);
        status = 'entered';
        console.log(`✅ Entry access granted for ${user.name}`);
        await this.createNotificationForAllAdmins({
          type: 'access_granted',
          title: 'Entry Access Granted',
          message: `${user.name} entered via card ${formattedID}`,
          data: { cardID: formattedID, studentId: user._id?.toString(), studentName: user.name, deviceId: device?._id?.toString(), location: device?.location || 'Unknown Location' },
          priority: 'low',
          category: 'access'
        });
      }
      await this.logAccess(device, formattedID, status, status === 'entered' ? 'Entry' : 'Denied', user);
    } catch (err) {
      console.error('❌ Error handling entry scan:', err.message);
    }
  }

  // ----------------------------
  // Handle Exit RFID Scan
  // ----------------------------
  async handleExitScanned(data) {
    // Only log exit, do not send servo/LED commands
    const formattedID = data.cardID.trim().toUpperCase();
    const now = Date.now();
    const lastTime = this.lastScanTime.get('exit_' + formattedID) || 0;
    if (now - lastTime < this.cooldownMs) {
      console.log(`⏱️ Exit card ${formattedID} still in cooldown, ignoring...`);
      return;
    }
    this.lastScanTime.set('exit_' + formattedID, now);
    let status = 'exited';
    let user = null;
    try {
      user = await User.findOne({ rfIdTag: formattedID });
      // Use deviceSerial from Arduino data
      const device = await Device.findOne({ serialNumber: data.deviceSerial });
      if (!user || !user.isActive) {
        console.log(`🚫 Exit scan: unknown or inactive card ${formattedID}`);
        status = 'denied';
        await this.createNotificationForAllAdmins({
          type: 'access_denied',
          title: 'Exit Scan Denied',
          message: `Unauthorized exit attempt with card ${formattedID}`,
          data: { cardID: formattedID, deviceId: device?._id?.toString(), location: device?.location || 'Unknown Location' },
          priority: 'medium',
          category: 'access'
        });
      } else {
        console.log(`🚪 Exit scan: ${user.name} exited`);
        await this.createNotificationForAllAdmins({
          type: 'access_granted',
          title: 'Exit Recorded',
          message: `${user.name} exited via card ${formattedID}`,
          data: { cardID: formattedID, studentId: user._id?.toString(), studentName: user.name, deviceId: device?._id?.toString(), location: device?.location || 'Unknown Location' },
          priority: 'low',
          category: 'access'
        });
      }
      // Always use reason 'Exit' so direction is always 'exit' for exit scans
      await this.logAccess(device, formattedID, status, 'Exit', user);
      // Notify frontend
      this.io.emit('arduino-exit-scan', {
        message: status === 'exited' ? `Exit recorded for card ${formattedID}` : `Exit denied for card ${formattedID}`,
        cardID: formattedID,
        status,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('❌ Error handling exit scan:', err.message);
    }
  }

  // ----------------------------
  // Access Control Event Handlers
  // ----------------------------
  async handleAccessGranted(data) { 
    console.log(`✅ Access granted event: ${data.cardID}`);
    // Fetch user info
    const user = await User.findOne({ rfIdTag: data.cardID.trim().toUpperCase() });
    this.io.emit('arduino-access-granted', {
      message: `Access granted for card ${data.cardID}`,
      cardID: data.cardID,
      user: user ? { name: user.name, profilePicture: user.profilePicture } : null,
      timestamp: new Date().toISOString()
    });
  }
  
  async handleAccessDenied(data) { 
    console.log(`🚫 Access denied event: ${data.cardID}`);
    
    // Check cooldown to prevent duplicate events
    const formattedID = data.cardID.trim().toUpperCase();
    const now = Date.now();
    const lastTime = this.lastScanTime.get(`denied_${formattedID}`) || 0;
    
    if (now - lastTime < this.cooldownMs) {
      console.log(`⏱️ Access denied event for ${formattedID} still in cooldown, ignoring...`);
      return;
    }
    this.lastScanTime.set(`denied_${formattedID}`, now);
    
    // Emit WebSocket event for frontend notifications
    const notificationData = {
      message: `Access denied for card ${data.cardID}`,
      cardID: data.cardID,
      timestamp: new Date().toISOString()
    };
    
    console.log('📡 Emitting access-denied WebSocket event:', notificationData);
    this.io.emit('arduino-access-denied', notificationData);
    console.log('✅ WebSocket event emitted successfully');
  }

  handleGateClosed(data) {
    console.log('🔒 Gate closed - ready');
    this.io.emit('arduino-gate-closed', {
      status: 'closed',
      message: 'Gate closed, ready for next card',
      timestamp: new Date().toISOString()
    });
  }

  handleGateOpen(data) {
    console.log('🚪 Gate opened event received:', data);
    this.io.emit('arduino-gate-open', {
      status: 'open',
      message: 'Gate opened by backend or RFID',
      timestamp: new Date().toISOString()
    });
  }

  // ----------------------------
  // Reconnect Logic
  // ----------------------------
  scheduleReconnect() {
    if (this.reconnectInterval) return;
    console.log('🔄 Scheduling Arduino reconnection in 5 seconds...');
    this.reconnectInterval = setInterval(async () => {
      console.log('🔄 Attempting to reconnect...');
      const connected = await this.findAndConnect();
      if (connected) {
        clearInterval(this.reconnectInterval);
        this.reconnectInterval = null;
      }
    }, 5000);
  }

  // ----------------------------
  // Send command to Arduino
  // ----------------------------
  sendCommand(command) {
    if (!this.isConnected || !this.port) {
      console.error('❌ Arduino not connected');
      return;
    }
    try {
      this.port.write(command + '\n');
      console.log(`📤 Sent to Arduino: ${command}`);
    } catch (error) {
      console.error('❌ Send error:', error.message);
    }
  }

  // Save access log to MongoDB
  async logAccess(device, cardID, status, reason, user) {
    try {
      // Check for recent duplicate logs (within last 5 seconds)
      const fiveSecondsAgo = new Date(Date.now() - 5000);
      const existingLog = await AccessLog.findOne({
        rfidTag: cardID,
        deviceId: device?._id,
        timestamp: { $gte: fiveSecondsAgo }
      });

      if (existingLog) {
        console.log(`⚠️ Duplicate log detected for ${cardID}, skipping...`);
        return;
      }

      // Determine direction based on status/reason
      let direction = 'entry';
      if (status === 'exited' || (reason && reason.toLowerCase().includes('exit'))) {
        direction = 'exit';
      }

      const accessLog = new AccessLog({
        userId: user?._id || null,
        deviceId: device?._id || null,
        rfidTag: cardID,
        accessGranted: status === 'entered' || status === 'exited', // Fix: grant access for both entry and exit
        location: device?.location || 'Main Gate',
        method: 'rfid',
        reason,
        direction, // Explicitly set direction
        timestamp: new Date()
      });
      await accessLog.save();
      console.log('📝 Access log saved:', accessLog);
      // Emit real-time event for dashboard sync
      if (this.io) {
        this.io.emit('studentTap', {
          id: accessLog._id,
          timestamp: accessLog.timestamp,
          user: user ? user.name : 'Unknown Student',
          rfid: cardID,
          status: accessLog.accessGranted ? (direction === 'exit' ? 'exited' : 'entered') : 'denied',
          location: accessLog.location,
          course: user ? user.course : undefined
        });
        console.log('📡 studentTap event emitted from logAccess:', {
          id: accessLog._id,
          timestamp: accessLog.timestamp,
          user: user ? user.name : 'Unknown Student',
          rfid: cardID,
          status: accessLog.accessGranted ? (direction === 'exit' ? 'exited' : 'entered') : 'denied',
          location: accessLog.location,
          course: user ? user.course : undefined
        });
      }
    } catch (err) {
      console.error('❌ Error saving access log:', err.message);
    }
  }

  // ----------------------------
  // Notification Helper Methods
  // ----------------------------
  async createNotificationForAllAdmins(notificationData) {
    try {
      // Find the first active admin (to avoid duplicates)
      const firstAdmin = await User.findOne({
        isActive: true,
        $or: [
          { role: 'admin' },
          { role: 'superadmin' },
          { accessLevel: 'admin' },
          { accessLevel: 'superadmin' }
        ]
      });

      if (firstAdmin) {
        // Create notification for the first admin (will be broadcast to all via WebSocket)
        const notification = await NotificationController.createNotification({
          userId: firstAdmin._id,
          ...notificationData
        });
        
        console.log(`📧 Created notification for admin system`);
        return notification;
      } else {
        console.warn('No active admin users found for notification');
      }
    } catch (error) {
      console.error('❌ Error creating admin notifications:', error);
    }
  }

  disconnect() {
    if (this.reconnectInterval) clearInterval(this.reconnectInterval);
    if (this.port && this.port.isOpen) this.port.close();
    this.isConnected = false;
    console.log('🔌 Disconnected from Arduino');
  }
}

module.exports = ArduinoSerialService;
