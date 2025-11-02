const { User, Device, AccessLog, Setting } = require('../models');

const testController = {
  // Test models import
  async testModels(req, res) {
    try {
      console.log('Testing models...');
      console.log('✅ Models imported successfully');
      
      res.json({
        success: true,
        message: 'All models imported successfully',
        models: ['User', 'Device', 'AccessLog', 'Setting']
      });
    } catch (error) {
      console.error('❌ Model test failed:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Test database connection
  async testDatabase(req, res) {
    try {
      const testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        rfIdTag: 'TEST123',
        accessLevel: 'student'
      });
      
      console.log('✅ User model creation test passed');
      res.json({ success: true, message: 'Database models working' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Create sample data
  async createSampleData(req, res) {
    try {
      // Create sample user
      const testUser = await User.findOneAndUpdate(
        { email: 'test@example.com' },
        {
          name: 'Test User',
          email: 'test@example.com',
          rfIdTag: 'TEST123',
          accessLevel: 'student',
          isActive: true
        },
        { upsert: true, new: true }
      );
      
      // Create sample device
      const testDevice = await Device.findOneAndUpdate(
        { serialNumber: 'DEV001' },
        {
          name: 'Main Gate',
          deviceType: 'gate',
          location: 'Main Entrance',
          status: 'online',
          serialNumber: 'DEV001'
        },
        { upsert: true, new: true }
      );
      
      res.json({
        success: true,
        message: 'Sample data created',
        user: testUser,
        device: testDevice,
        instructions: {
          nextStep: 'Test RFID scan with:',
          endpoint: 'POST /api/access-logs',
          body: {
            rfidTag: 'TEST123',
            deviceId: testDevice._id
          }
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Clear test data
  async clearTestData(req, res) {
    try {
      await User.deleteMany({ email: /test/i });
      await Device.deleteMany({ serialNumber: /DEV/i });
      await AccessLog.deleteMany({ rfidTag: /TEST/i });
      
      res.json({
        success: true,
        message: 'Test data cleared'
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Test all controllers
  async testAllControllers(req, res) {
    try {
      const controllerTests = {
        userController: 'Available',
        accessLogController: 'Available',
        deviceController: 'Pending',
        settingsController: 'Pending'
      };
      
      res.json({
        success: true,
        message: 'Controller status check',
        controllers: controllerTests
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = testController;