/**
 * Check Exit Logs in Database
 * This script will check the direction field in access logs
 */

const mongoose = require('mongoose');
const { AccessLog } = require('../src/models');

async function checkExitLogs() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/rfid-gate-system');
    console.log('📚 Connected to MongoDB');

    // Get all logs and check their direction field
    const allLogs = await AccessLog.find().sort({ timestamp: -1 }).limit(20);
    console.log('\n📊 Last 20 Access Logs:');
    console.log('='.repeat(80));
    
    allLogs.forEach((log, index) => {
      console.log(`${index + 1}. ${log.timestamp.toISOString()} | ${log.rfidTag} | Direction: ${log.direction || 'NOT SET'} | Access: ${log.accessGranted ? 'GRANTED' : 'DENIED'}`);
    });

    // Count by direction
    const entryCount = await AccessLog.countDocuments({ direction: 'entry' });
    const exitCount = await AccessLog.countDocuments({ direction: 'exit' });
    const undefinedCount = await AccessLog.countDocuments({ direction: { $exists: false } });
    const nullCount = await AccessLog.countDocuments({ direction: null });

    console.log('\n📈 Direction Statistics:');
    console.log('='.repeat(40));
    console.log(`Entry logs: ${entryCount}`);
    console.log(`Exit logs: ${exitCount}`);
    console.log(`Undefined direction: ${undefinedCount}`);
    console.log(`Null direction: ${nullCount}`);

    // Get specific exit logs
    const exitLogs = await AccessLog.find({ direction: 'exit' }).sort({ timestamp: -1 }).limit(10);
    console.log('\n🚪 Exit Logs:');
    console.log('='.repeat(40));
    if (exitLogs.length === 0) {
      console.log('❌ No exit logs found!');
    } else {
      exitLogs.forEach((log, index) => {
        console.log(`${index + 1}. ${log.timestamp.toISOString()} | ${log.rfidTag} | Access: ${log.accessGranted ? 'GRANTED' : 'DENIED'}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📚 Disconnected from MongoDB');
  }
}

checkExitLogs();
