const { AccessLog } = require('../models');

class SystemController {
  constructor() {
    this.gateStatus = 'closed'; // In-memory gate status
    this.systemMetrics = {
      rfidReader: 'connected',
      database: 'connected', 
      gateMotor: 'operational',
      network: 'strong'
    };
  }

  // Get current system status
  async getSystemStatus(req, res) {
    try {
      const io = req.app.get('io');
      const arduinoService = req.app.get('arduinoService');
      // Dynamically set RFID reader status
      this.systemMetrics.rfidReader = arduinoService && arduinoService.isConnected ? 'connected' : 'disconnected';

      const status = {
        gateStatus: this.gateStatus,
        systemStatus: 'online',
        metrics: this.systemMetrics,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      };

      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error getting system status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get system status',
        error: error.message
      });
    }
  }

  // Control gate operations
  async controlGate(req, res) {
    try {
      const { action } = req.body;
      const io = req.app.get('io');
      let result;

      switch (action) {
        case 'open':
          result = await this.openGate(req, res);
          break;
        case 'close':
          result = await this.closeGate(req, res);
          break;
        case 'lock':
        case 'emergency-lock':
          result = await this.lockGate();
          break;
        case 'unlock':
          result = await this.unlockGate();
          break;
        default:
          return res.status(400).json({
            success: false,
            message: `Unknown gate action: ${action}`
          });
      }

      // Broadcast gate status change via WebSocket
      io.emit('message', {
        type: 'GATE_STATUS_CHANGED',
        payload: {
          status: this.gateStatus,
          timestamp: new Date().toISOString(),
          action: action
        }
      });

      res.status(200).json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error controlling gate:', error);
      res.status(500).json({
        success: false,
        message: `Failed to ${req.body.action} gate`,
        error: error.message
      });
    }
  }

  // Gate operation methods
  async openGate(req, res) {
    if (this.gateStatus === 'locked') {
      throw new Error('Gate is locked. Unlock first before opening.');
    }
    this.gateStatus = 'open';
    // Send command to Arduino
    const arduinoService = req.app.get('arduinoService');
    arduinoService.sendCommand('OPEN_GATE');
    return {
      status: this.gateStatus,
      message: 'Gate opened successfully'
    };
  }

  async closeGate(req, res) {
    this.gateStatus = 'closed';
    // Send command to Arduino
    const arduinoService = req.app.get('arduinoService');
    arduinoService.sendCommand('CLOSE_GATE');
    return {
      status: this.gateStatus,
      message: 'Gate closed successfully'
    };
  }

  async lockGate() {
    this.gateStatus = 'locked';
    return {
      status: this.gateStatus,
      message: 'Gate locked for security'
    };
  }

  async unlockGate() {
    this.gateStatus = 'closed';
    return {
      status: this.gateStatus,
      message: 'Gate unlocked successfully'
    };
  }

  // Update system metrics (for monitoring)
  async updateSystemMetrics(req, res) {
    try {
      const { metrics } = req.body;
      
      this.systemMetrics = {
        ...this.systemMetrics,
        ...metrics
      };

      const io = req.app.get('io');
      io.emit('message', {
        type: 'SYSTEM_METRICS_UPDATED',
        payload: this.systemMetrics
      });

      res.status(200).json({
        success: true,
        data: this.systemMetrics
      });

    } catch (error) {
      console.error('Error updating system metrics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update system metrics',
        error: error.message
      });
    }
  }
}

module.exports = new SystemController();
