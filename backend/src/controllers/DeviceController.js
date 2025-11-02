const { Device } = require("../models");

const deviceController = {
  
  // GET /api/devices - Get all devices with filtering and pagination
  async getAllDevices(req, res) {
    try {
      // Extract query parameters
      const {
        deviceType, // 'gate', 'reader', 'controller', 'sensor'
        status, // 'online', 'offline', 'maintenance'
        location, // specific location
        page = 1,
        limit = 10,
      } = req.query;

      // Build dynamic filter
      const filter = {};
      if (deviceType) filter.deviceType = deviceType;
      if (status) filter.status = status;
      if (location) filter.location = location;

      const skip = (page - 1) * limit;

      // Query with filters, sorting, and pagination
      const devices = await Device.find(filter)
        .sort({ lastHeartbeat: -1 }) // Most recent activity first
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Device.countDocuments(filter);

      // Return formatted response
      res.status(200).json({
        success: true,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        data: devices,
      });
    } catch (error) {
      console.error("Error fetching devices:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // POST /api/devices - Create new device (gate/reader/controller/sensor)
  async createDevice(req, res) {
    try {
      // Extract device data from request body
      const { name, deviceType, location, serialNumber, configuration } = req.body;

      // Validate required fields
      if (!name || !deviceType || !location || !serialNumber) {
        return res.status(400).json({
          success: false,
          message: "Name, deviceType, location, and serialNumber are required",
        });
      }

      // Validate deviceType enum
      const validTypes = ['gate', 'reader', 'controller', 'sensor'];
      if (!validTypes.includes(deviceType)) {
        return res.status(400).json({
          success: false,
          message: `Device type must be one of: ${validTypes.join(', ')}`,
        });
      }

      // Check for existing device with same serial number
      const existingDevice = await Device.findOne({ serialNumber });
      if (existingDevice) {
        return res.status(409).json({
          success: false,
          message: "Device with this serial number already exists",
        });
      }

      // Create new device
      const newDevice = new Device({
        name,
        deviceType,
        location,
        serialNumber,
        status: 'offline', // New devices start as offline
        configuration: configuration || {},
        lastHeartbeat: new Date(),
      });

      await newDevice.save();

      // Return created device
      res.status(201).json({
        success: true,
        message: "Device created successfully",
        data: newDevice,
      });
    } catch (error) {
      console.error("Error creating device:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // PUT /api/devices/:id/status - Update device status (CRITICAL for RFID gates)
  async updateDeviceStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validate status value
      const validStatuses = ['online', 'offline', 'maintenance'];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Status must be one of: ${validStatuses.join(', ')}`,
        });
      }

      // Find device by ID
      const device = await Device.findById(id);
      if (!device) {
        return res.status(404).json({
          success: false,
          message: "Device not found",
        });
      }

      // Update device status and heartbeat
      device.status = status;
      device.lastHeartbeat = new Date();
      
      await device.save();

      // Log status change
      console.log(`📡 Device ${device.name} (${device.serialNumber}) status changed to: ${status}`);

      // Return updated device
      res.status(200).json({
        success: true,
        message: `Device status updated to ${status}`,
        data: {
          id: device._id,
          name: device.name,
          serialNumber: device.serialNumber,
          deviceType: device.deviceType,
          location: device.location,
          status: device.status,
          lastHeartbeat: device.lastHeartbeat,
        },
      });
    } catch (error) {
      console.error("Error updating device status:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // GET /api/devices/:id - Get specific device by ID
  async getDeviceById(req, res) {
    try {
      const { id } = req.params;

      // Find device by ID
      const device = await Device.findById(id);
      
      if (!device) {
        return res.status(404).json({
          success: false,
          message: "Device not found",
        });
      }

      // Get recent access logs for this device (last 10)
      const { AccessLog } = require('../models');
      const recentLogs = await AccessLog.find({ deviceId: id })
        .populate('userId', 'name email rfIdTag')
        .sort({ timestamp: -1 })
        .limit(10);

      // Calculate uptime status
      const now = new Date();
      const lastHeartbeat = new Date(device.lastHeartbeat);
      const timeDiff = now - lastHeartbeat;
      const isOnline = device.status === 'online' && timeDiff < 300000; // 5 minutes threshold

      // Return device with additional info
      res.status(200).json({
        success: true,
        data: {
          device: {
            ...device.toObject(),
            isOnline,
            timeSinceLastHeartbeat: Math.floor(timeDiff / 1000), // seconds
          },
          recentActivity: recentLogs,
          stats: {
            totalAccessAttempts: recentLogs.length,
            lastActivity: recentLogs.length > 0 ? recentLogs[0].timestamp : null,
          },
        },
      });
    } catch (error) {
      console.error("Error fetching device by ID:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // POST /api/devices/:id/heartbeat - Device heartbeat (connectivity monitoring)
  async deviceHeartbeat(req, res) {
    try {
      const { id } = req.params;
      const { status, configuration } = req.body;

      // Find device by ID
      const device = await Device.findById(id);
      if (!device) {
        return res.status(404).json({
          success: false,
          message: "Device not found",
        });
      }

      // Update heartbeat timestamp
      device.lastHeartbeat = new Date();

      // Auto-update status to online if device sends heartbeat
      const previousStatus = device.status;
      if (device.status === 'offline') {
        device.status = 'online';
        console.log(`📡 Device ${device.name} (${device.serialNumber}) came back online via heartbeat`);
      }

      // Update status if provided (optional)
      if (status) {
        const validStatuses = ['online', 'offline', 'maintenance'];
        if (validStatuses.includes(status)) {
          device.status = status;
        }
      }

      // Update configuration if provided (optional)
      if (configuration && typeof configuration === 'object') {
        device.configuration = { ...device.configuration, ...configuration };
      }

      await device.save();

      // Calculate time since last heartbeat
      const now = new Date();
      const heartbeatTime = new Date(device.lastHeartbeat);
      const isHealthy = (now - heartbeatTime) < 60000; // 1 minute for healthy status

      // Log heartbeat for monitoring
      console.log(`💓 Heartbeat received from ${device.name} (${device.serialNumber}) - Status: ${device.status}`);

      // Return heartbeat acknowledgment
      res.status(200).json({
        success: true,
        message: "Heartbeat received successfully",
        data: {
          deviceId: device._id,
          name: device.name,
          serialNumber: device.serialNumber,
          status: device.status,
          lastHeartbeat: device.lastHeartbeat,
          isHealthy,
          statusChanged: previousStatus !== device.status,
          instructions: {
            nextHeartbeatIn: "60 seconds",
            reportIssues: true,
          },
        },
      });
    } catch (error) {
      console.error("Error processing device heartbeat:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // PUT /api/devices/:id - Update device information
  async updateDevice(req, res) {
    try {
      const { id } = req.params;
      const { name, deviceType, location, serialNumber, configuration } = req.body;

      // Find device by ID
      const device = await Device.findById(id);
      if (!device) {
        return res.status(404).json({
          success: false,
          message: "Device not found",
        });
      }

      // Store original values for change tracking
      const originalValues = {
        name: device.name,
        location: device.location,
        serialNumber: device.serialNumber,
      };

      // Validate deviceType if provided
      if (deviceType) {
        const validTypes = ['gate', 'reader', 'controller', 'sensor'];
        if (!validTypes.includes(deviceType)) {
          return res.status(400).json({
            success: false,
            message: `Device type must be one of: ${validTypes.join(', ')}`,
          });
        }
      }

      // Check serial number uniqueness if it's being changed
      if (serialNumber && serialNumber !== device.serialNumber) {
        const existingDevice = await Device.findOne({ 
          serialNumber, 
          _id: { $ne: id } // Exclude current device
        });
        if (existingDevice) {
          return res.status(409).json({
            success: false,
            message: "Serial number already exists for another device",
          });
        }
      }

      // Update device fields (only if provided)
      if (name) device.name = name;
      if (deviceType) device.deviceType = deviceType;
      if (location) device.location = location;
      if (serialNumber) device.serialNumber = serialNumber;

      // Update configuration (merge with existing)
      if (configuration && typeof configuration === 'object') {
        device.configuration = { ...device.configuration, ...configuration };
      }

      // Update lastHeartbeat to reflect recent activity
      device.lastHeartbeat = new Date();

      await device.save();

      // Track what changed for logging
      const changes = [];
      if (name && name !== originalValues.name) changes.push(`name: ${originalValues.name} → ${name}`);
      if (location && location !== originalValues.location) changes.push(`location: ${originalValues.location} → ${location}`);
      if (serialNumber && serialNumber !== originalValues.serialNumber) changes.push(`serial: ${originalValues.serialNumber} → ${serialNumber}`);

      // Log the update
      if (changes.length > 0) {
        console.log(`🔧 Device ${device.name} updated: ${changes.join(', ')}`);
      }

      // Return updated device
      res.status(200).json({
        success: true,
        message: "Device updated successfully",
        data: device,
        changes: changes.length > 0 ? changes : ["Configuration updated"],
      });
    } catch (error) {
      console.error("Error updating device:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // DELETE /api/devices/:id - Delete device (with safety checks)
  async deleteDevice(req, res) {
    try {
      const { id } = req.params;
      const { force } = req.query; // Optional force delete parameter

      // Find device by ID
      const device = await Device.findById(id);
      if (!device) {
        return res.status(404).json({
          success: false,
          message: "Device not found",
        });
      }

      // Safety check: Look for recent access logs
      const { AccessLog } = require('../models');
      const recentLogs = await AccessLog.countDocuments({
        deviceId: id,
        timestamp: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
      });

      // Prevent deletion if device has recent activity (unless forced)
      if (recentLogs > 0 && force !== 'true') {
        return res.status(400).json({
          success: false,
          message: "Cannot delete device with recent activity",
          details: {
            recentAccessLogs: recentLogs,
            suggestion: "Use ?force=true to override this safety check",
            warning: "Forced deletion will preserve access logs but remove device reference"
          }
        });
      }

      // Store device info for logging before deletion
      const deviceInfo = {
        name: device.name,
        serialNumber: device.serialNumber,
        deviceType: device.deviceType,
        location: device.location,
        recentLogs
      };

      // Delete the device
      await Device.findByIdAndDelete(id);

      // Log the deletion
      console.log(`🗑️ Device deleted: ${deviceInfo.name} (${deviceInfo.serialNumber}) - Had ${deviceInfo.recentLogs} recent access logs`);

      // Return deletion confirmation
      res.status(200).json({
        success: true,
        message: "Device deleted successfully",
        data: {
          deletedDevice: {
            name: deviceInfo.name,
            serialNumber: deviceInfo.serialNumber,
            deviceType: deviceInfo.deviceType,
            location: deviceInfo.location,
          },
          impact: {
            preservedAccessLogs: recentLogs,
            note: "Access logs are preserved for audit purposes"
          }
        }
      });
    } catch (error) {
      console.error("Error deleting device:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // Arduino-specific endpoints
  
  // POST /api/devices/validate - Validate RFID tag for Arduino access
  async validateRFIDAccess(req, res) {
    try {
      const { rfidTag, location = 'Main Gate', deviceId } = req.body

      console.log(`Arduino validation request: RFID=${rfidTag}, Device=${deviceId}`)

      // Find student by RFID tag
      const User = require('../models/User')
      const AccessLog = require('../models/AccessLog')
      
      const student = await User.findOne({ 
        rfidTag: rfidTag.toUpperCase(),
        isActive: true 
      })

      if (!student) {
        console.log(`RFID validation failed: Tag ${rfidTag} not found or inactive`)
        
        // Log failed attempt
        await AccessLog.create({
          userId: null,
          rfidTag: rfidTag.toUpperCase(),
          status: 'denied',
          location,
          deviceId,
          timestamp: new Date(),
          details: 'RFID tag not registered or student inactive'
        })

        return res.json({
          success: false,
          message: 'Access denied - Invalid RFID tag',
          student: null
        })
      }

      // Log successful access
      const accessLog = await AccessLog.create({
        userId: student._id,
        rfidTag: rfidTag.toUpperCase(),
        status: 'granted',
        location,
        deviceId,
        timestamp: new Date(),
        details: `Access granted for ${student.name}`
      })

      console.log(`Access granted for student: ${student.name} (${student.studentId})`)

      // Emit real-time update
      if (req.io) {
        req.io.emit('message', {
          type: 'ACCESS_LOG_CREATED',
          payload: {
            log: accessLog,
            student: {
              name: student.name,
              studentId: student.studentId,
              course: student.course
            }
          }
        })
      }

      res.json({
        success: true,
        message: 'Access granted',
        student: {
          name: student.name,
          studentId: student.studentId,
          course: student.course,
          yearLevel: student.yearLevel
        },
        accessLog: accessLog
      })

    } catch (error) {
      console.error('RFID validation error:', error)
      res.status(500).json({
        success: false,
        message: 'Server error during RFID validation',
        error: error.message
      })
    }
  },

  // POST /api/devices/status - Update Arduino device status
  async updateArduinoStatus(req, res) {
    try {
      const { deviceId, status, gateState, lastSeen } = req.body

      console.log(`Device status update: ${deviceId} - ${status} - Gate: ${gateState}`)

      // Update or create device record
      const device = await Device.findOneAndUpdate(
        { deviceId },
        {
          deviceId,
          name: deviceId === 'ARDUINO_GATE_001' ? 'Main Gate Controller' : deviceId,
          deviceType: 'gate',
          status,
          location: 'Main Gate',
          lastHeartbeat: new Date(lastSeen || Date.now()),
          configuration: {
            gateState,
            firmware: 'Arduino_v1.0',
            connectivity: 'WiFi'
          }
        },
        { upsert: true, new: true }
      )

      // Emit real-time gate status update
      if (req.io) {
        req.io.emit('message', {
          type: 'GATE_STATUS_CHANGED',
          payload: {
            deviceId,
            status,
            gateState,
            timestamp: new Date()
          }
        })
      }

      res.json({
        success: true,
        message: 'Device status updated',
        data: device
      })

    } catch (error) {
      console.error('Device status update error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to update device status',
        error: error.message
      })
    }
  },

  // POST /api/devices/control/gate - Remote gate control
  async controlGate(req, res) {
    try {
      const { action, deviceId = 'ARDUINO_GATE_001' } = req.body

      if (!['open', 'close', 'toggle'].includes(action)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid gate action. Use: open, close, or toggle'
        })
      }

      console.log(`Remote gate control: ${action} on device ${deviceId}`)

      // Emit real-time update for web dashboard
      if (req.io) {
        req.io.emit('message', {
          type: 'GATE_CONTROL_COMMAND',
          payload: {
            deviceId,
            action,
            timestamp: new Date(),
            source: 'web_dashboard'
          }
        })
      }

      res.json({
        success: true,
        message: `Gate ${action} command sent to ${deviceId}`,
        data: {
          action,
          deviceId,
          timestamp: new Date()
        }
      })

    } catch (error) {
      console.error('Gate control error:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to control gate',
        error: error.message
      })
    }
  }

};
module.exports = deviceController;
