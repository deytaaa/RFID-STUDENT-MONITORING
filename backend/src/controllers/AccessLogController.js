const { AccessLog, User, Device } = require("../models");

const accessLogController = {
  // GET /api/access-logs - Get all access logs (with pagination & filtering)
  async getAllAccessLogs(req, res) {
    try {
      // Extract query parameters
      const {
        startDate,
        endDate,
        userId,
        deviceId,
        status,
        page = 1,
        limit = 500,
      } = req.query;
      const skip = (page - 1) * limit;

      // Build dynamic filter
      const filter = {};
    
      if (startDate || endDate) {
        filter.timestamp = {};
        if (startDate) filter.timestamp.$gte = new Date(startDate);
        if (endDate) filter.timestamp.$lte = new Date(endDate);
      }
      if (userId) filter.userId = userId;
      if (deviceId) filter.deviceId = deviceId;
      if (status) filter.accessGranted = status === 'entered';
      // Fetch logs with population
      const logs = await AccessLog.find(filter)
        .populate("userId", "name email rfIdTag isActive") // include isActive
        .populate("deviceId", "name location")
        .sort({ timestamp: -1 }) // newest first
        .skip(skip)
        .limit(parseInt(limit));
      const total = await AccessLog.countDocuments(filter);
      // Return paginated response
      const logsWithStatus = logs.map(log => ({
        ...log.toObject(),
        status: log.accessGranted ? (log.direction === 'exit' ? 'exited' : 'entered') : 'denied'
      }));
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json({
        success: true,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        data: logsWithStatus,
      });
    } catch (error) {
      console.error("Error fetching access logs:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // GET /api/access-logs/:id - Get specific access log
  async getAccessLogById(req, res) {
    try {
      const { id } = req.params;
      const log = await AccessLog.findById(id)
        .populate("userId", "name email rfIdTag accessLevel isActive") // include isActive
        .populate("deviceId", "name location deviceType status");

      if (!log) {
        return res.status(404).json({
          success: false,
          message: "Access log not found",
        });
      }

      res.status(200).json({
        success: true,
        data: log,
      });
    } catch (error) {
      console.error("Error fetching access log by ID:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // POST /api/access-logs - Create new access log (RFID scan)
  async createAccessLog(req, res) {
    try {
      const { rfidTag, deviceId, location, method = "rfid", userId, studentName, course, status, direction = "entry" } = req.body;

      // Validate required fields
      if (!rfidTag || !deviceId) {
        return res.status(400).json({
          success: false,
          message: "RFID tag and device ID are required",
        });
      }

      // Find user by RFID tag
      const user = await User.findOne({ rfIdTag: rfidTag });
      
      // Check if device exists
      const device = await Device.findById(deviceId);
      if (!device) {
        return res.status(404).json({
          success: false,
          message: "Device not found",
        });
      }

      // Determine access granted status and reason
      let accessGranted = false;
      let reason = "";

      if (!user) {
        reason = "Unknown RFID tag";
      } else if (!user.isActive) {
        reason = "User account inactive";
      } else if (device.status !== "online") {
        reason = "Device offline or maintenance";
      } else {
        accessGranted = true;
      }

      // Create access log
      const newLog = new AccessLog({
        userId: user ? user._id : null,
        deviceId,
        rfidTag,
        accessGranted,
        location: location || device.location,
        method,
        reason: accessGranted ? undefined : reason,
        direction,
      });

      await newLog.save();

      // Populate the response
      await newLog.populate("userId", "name email accessLevel course yearLevel");
      await newLog.populate("deviceId", "name location deviceType");

      // Emit real-time update via WebSocket
      const io = req.app.get('io');
      if (io) {
        const tapEvent = {
          id: newLog._id,
          timestamp: newLog.timestamp,
          user: studentName || (user ? user.name : 'Unknown Student'),
          rfid: rfidTag,
          status: status || (accessGranted ? (direction === 'exit' ? 'exited' : 'entered') : 'denied'),
          location: location || device.location || 'Unknown Location',
          course: course || (user ? user.course : 'Unknown Course')
        };
        // Emit to all connected clients
        io.emit('studentTap', tapEvent);
        console.log('📡 Student tap event emitted:', tapEvent);
      }

      res.status(201).json({
        success: true,
        message: `Access ${accessGranted ? (direction === 'exit' ? 'exited' : 'entered') : 'denied'}`,
        data: newLog,
        accessGranted, // Quick access for RFID reader
      });
    } catch (error) {
      console.error("Error creating access log:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // GET /api/access-logs/user/:userId - Get user's access history
  async getUserAccessLogs(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      const logs = await AccessLog.find({ userId })
        .populate("deviceId", "name location deviceType")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await AccessLog.countDocuments({ userId });

      res.status(200).json({
        success: true,
        user: { name: user.name, email: user.email },
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        data: logs,
      });
    } catch (error) {
      console.error("Error fetching user access logs:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // GET /api/access-logs/device/:deviceId - Get device access history
  async getDeviceAccessLogs(req, res) {
    try {
      const { deviceId } = req.params;
      const { page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;

      // Verify device exists
      const device = await Device.findById(deviceId);
      if (!device) {
        return res.status(404).json({
          success: false,
          message: "Device not found",
        });
      }

      const logs = await AccessLog.find({ deviceId })
        .populate("userId", "name email rfIdTag")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await AccessLog.countDocuments({ deviceId });

      res.status(200).json({
        success: true,
        device: { name: device.name, location: device.location },
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        data: logs,
      });
    } catch (error) {
      console.error("Error fetching device access logs:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // GET /api/access-logs/recent - Get recent access attempts
  async getRecentAccessLogs(req, res) {
    try {
      const { limit = 50 } = req.query;

      const logs = await AccessLog.find()
        .populate("userId", "name email rfIdTag")
        .populate("deviceId", "name location deviceType")
        .sort({ timestamp: -1 })
        .limit(parseInt(limit));

      res.status(200).json({
        success: true,
        count: logs.length,
        data: logs,
      });
    } catch (error) {
      console.error("Error fetching recent access logs:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // GET /api/access-logs/stats - Get access statistics
  async getAccessStats(req, res) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Today's stats
      const todayTotal = await AccessLog.countDocuments({
        timestamp: { $gte: today, $lt: tomorrow }
      });
      
      const todayEntered = await AccessLog.countDocuments({
        ...todayFilter,
        accessGranted: true
      });

      // Overall stats
      const totalLogs = await AccessLog.countDocuments();
      const totalEntered = await AccessLog.countDocuments({ accessGranted: true });

      res.status(200).json({
        success: true,
        data: {
          today: {
            total: todayTotal,
            entered: todayEntered,
            denied: todayTotal - todayEntered,
            successRate: todayTotal > 0 ? ((todayEntered / todayTotal) * 100).toFixed(1) : 0
          },
          overall: {
            total: totalLogs,
            entered: totalEntered,
            denied: totalLogs - totalEntered,
            successRate: totalLogs > 0 ? ((totalEntered / totalLogs) * 100).toFixed(1) : 0
          }
        }
      });
    } catch (error) {
      console.error("Error fetching access stats:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },

  // GET /api/access-logs/exit - Get all exit logs
  async getExitLogs(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const skip = (page - 1) * limit;
      const logs = await AccessLog.find({ direction: "exit" })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate("userId", "name email accessLevel course yearLevel")
        .populate("deviceId", "name location deviceType");
      res.json({ success: true, data: logs });
    } catch (error) {
      console.error("Error fetching exit logs:", error);
      res.status(500).json({ success: false, message: "Server Error" });
    }
  },
};

module.exports = accessLogController;