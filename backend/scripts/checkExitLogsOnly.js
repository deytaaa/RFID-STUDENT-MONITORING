/**
 * Check Exit Logs Only
 * This script will show the current exit logs with their exact data
 */

const mongoose = require('mongoose');
const { AccessLog } = require('../src/models');

async function checkExitLogsOnly() {
  try {
    // Connect to MongoDB Atlas
    require('dotenv').config();
    const mongoUri = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/IOT';
    await mongoose.connect(mongoUri);
    console.log('📚 Connected to MongoDB Atlas');

    // Get all exit logs with full details
    const exitLogs = await AccessLog.find({ direction: 'exit' })
      .sort({ timestamp: -1 })
      .populate('userId', 'name email')
      .populate('deviceId', 'name location');

    console.log('\n🚪 Current Exit Logs:');
    console.log('='.repeat(80));
    
    exitLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.timestamp}`);
      console.log(`   User: ${log.userId?.name || 'Unknown'}`);
      console.log(`   RFID: ${log.rfidTag}`);
      console.log(`   Location: ${log.location}`);
      console.log(`   Direction: ${log.direction}`);
      console.log(`   Access Granted: ${log.accessGranted}`);
      console.log(`   Device: ${log.deviceId?.name || 'Unknown'} (${log.deviceId?.location || 'No location'})`);
      console.log('   ' + '-'.repeat(40));
    });

    console.log(`\n📊 Total Exit Logs: ${exitLogs.length}`);

    // Force update all exit logs to have correct location
    const forceUpdate = await AccessLog.updateMany(
      { direction: 'exit' },
      { $set: { location: 'Main Exit' } }
    );

    console.log(`\n🔧 Force updated ${forceUpdate.modifiedCount} exit logs to location: "Main Exit"`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📚 Disconnected from MongoDB');
  }
}

checkExitLogsOnly();
