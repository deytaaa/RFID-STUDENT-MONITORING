/**
 * Fix Exit Logs Direction Field
 * This script will set direction field for logs that are missing it
 */

const mongoose = require('mongoose');
const { AccessLog } = require('../src/models');

async function fixExitLogs() {
  try {
    // Connect to MongoDB Atlas (same as main server)
    require('dotenv').config();
    const mongoUri = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/IOT';
    await mongoose.connect(mongoUri);
    console.log('📚 Connected to MongoDB Atlas');

    // Find logs that don't have direction field set
    const logsWithoutDirection = await AccessLog.find({ 
      $or: [
        { direction: { $exists: false } },
        { direction: null },
        { direction: "" }
      ]
    });

    console.log(`📊 Found ${logsWithoutDirection.length} logs without direction field`);

    if (logsWithoutDirection.length > 0) {
      // Set all logs without direction to 'entry' by default
      // You can manually change specific ones to 'exit' later
      const result = await AccessLog.updateMany(
        { 
          $or: [
            { direction: { $exists: false } },
            { direction: null },
            { direction: "" }
          ]
        },
        { $set: { direction: 'entry' } }
      );

      console.log(`✅ Updated ${result.modifiedCount} logs to have direction: 'entry'`);
    }

    // Now manually set some recent logs to 'exit' for testing
    // This will set the last 5 access granted logs to be exit logs
    const recentGrantedLogs = await AccessLog.find({ 
      accessGranted: true,
      direction: 'entry'
    })
    .sort({ timestamp: -1 })
    .limit(5);

    if (recentGrantedLogs.length > 0) {
      const exitResult = await AccessLog.updateMany(
        { _id: { $in: recentGrantedLogs.map(log => log._id) } },
        { $set: { direction: 'exit' } }
      );
      
      console.log(`🚪 Converted ${exitResult.modifiedCount} recent entry logs to exit logs for testing`);
    }

    // Check final counts
    const entryCount = await AccessLog.countDocuments({ direction: 'entry' });
    const exitCount = await AccessLog.countDocuments({ direction: 'exit' });
    
    console.log('\n📈 Final Direction Statistics:');
    console.log('='.repeat(40));
    console.log(`Entry logs: ${entryCount}`);
    console.log(`Exit logs: ${exitCount}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📚 Disconnected from MongoDB');
  }
}

fixExitLogs();
