/**
 * Arduino Serial Communication Service
 * Handles USB Serial connection between Arduino Uno and Backend
 * Emits 'studentTap' events for React Dashboard
 * by Manuel Data Jr 💪
 */

const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const { AccessLog, User, Device } = require('../models');
const Setting = require('../models/Settings'); // Add this import
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

    if (now - lastTime < this.cooldownMs) return;
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
      } else {
        // Send ACCESS_GRANTED with delay
        this.sendCommand(`ACCESS_GRANTED:${formattedID}:${autoLockDelay}`);
        status = 'entered';
        console.log(`✅ Access granted for ${user.name}`);
      }

      // Emit event to React dashboard
      this.io.emit('studentTap', {
        id: formattedID,
        user: (user && user.name) ? user.name : 'Unknown User',
        rfid: `****${formattedID.slice(-3)}`,
        timestamp: new Date().toISOString(),
        status,
        location: device?.location || 'Main Gate'
      });

      // Optional: Log to MongoDB (needs auth token if backend requires)
      await this.logAccess(device, formattedID, status, status === 'granted' ? 'Valid' : 'Denied', user);
    } catch (err) {
      console.error('❌ Error handling card scan:', err.message);
    }
  }

  // ----------------------------
  // Access Control Event Handlers
  // ----------------------------
  async handleAccessGranted(data) { console.log(`✅ Access granted event: ${data.cardID}`); }
  async handleAccessDenied(data) { console.log(`🚫 Access denied event: ${data.cardID}`); }

  handleGateClosed(data) {
    console.log('🔒 Gate closed - ready');
    this.io.emit('gate_status', {
      status: 'closed',
      message: 'Gate closed, ready for next card',
      timestamp: new Date().toISOString()
    });
  }

  handleGateOpen(data) {
    console.log('🚪 Gate opened event received:', data);
    this.io.emit('gate_status', {
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
      const accessLog = new AccessLog({
        userId: user?._id || null,
        deviceId: device?._id || null,
        rfidTag: cardID,
        accessGranted: status === 'entered', // <-- Fix: match new status
        location: device?.location || 'Main Gate',
        method: 'rfid',
        reason,
        timestamp: new Date()
      });
      await accessLog.save();
      console.log('📝 Access log saved:', accessLog);
    } catch (err) {
      console.error('❌ Error saving access log:', err.message);
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
