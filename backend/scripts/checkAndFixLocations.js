/**
 * Check and Fix Location Issues
 * This script will check the current location assignments and fix them
 */

const mongoose = require('mongoose');
const { AccessLog, Device } = require('../src/models');

async function checkAndFixLocations() {
  try {
    // Connect to MongoDB Atlas (same as main server)
    require('dotenv').config();
    const mongoUri = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/IOT';
    await mongoose.connect(mongoUri);
    console.log('📚 Connected to MongoDB Atlas');

    // Check current devices and their locations
    const devices = await Device.find({});
    console.log('\n🏢 Current Devices:');
    console.log('='.repeat(50));
    devices.forEach(device => {
      console.log(`Device: ${device.name} | Location: ${device.location} | Type: ${device.deviceType}`);
    });

    // Check access logs by direction and location
    console.log('\n📊 Access Logs by Direction and Location:');
    console.log('='.repeat(50));
    
    const entryLogs = await AccessLog.aggregate([
      { $match: { direction: 'entry' } },
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const exitLogs = await AccessLog.aggregate([
      { $match: { direction: 'exit' } },
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\nEntry logs by location:');
    entryLogs.forEach(log => {
      console.log(`  ${log._id}: ${log.count} entries`);
    });

    console.log('\nExit logs by location:');
    exitLogs.forEach(log => {
      console.log(`  ${log._id}: ${log.count} exits`);
    });

    // Fix the location issue
    // Entry logs should have "Main Entrance" location
    // Exit logs should have "Main Exit" location
    console.log('\n🔧 Fixing location assignments...');

    // Update entry logs to have "Main Entrance"
    const entryUpdate = await AccessLog.updateMany(
      { direction: 'entry' },
      { $set: { location: 'Main Entrance' } }
    );

    // Update exit logs to have "Main Exit"  
    const exitUpdate = await AccessLog.updateMany(
      { direction: 'exit' },
      { $set: { location: 'Main Exit' } }
    );

    console.log(`✅ Updated ${entryUpdate.modifiedCount} entry logs to location: "Main Entrance"`);
    console.log(`✅ Updated ${exitUpdate.modifiedCount} exit logs to location: "Main Exit"`);

    // Verify the fix
    console.log('\n✅ Verification - Updated Access Logs:');
    console.log('='.repeat(50));
    
    const verifyEntryLogs = await AccessLog.aggregate([
      { $match: { direction: 'entry' } },
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const verifyExitLogs = await AccessLog.aggregate([
      { $match: { direction: 'exit' } },
      { $group: { _id: '$location', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\nEntry logs by location (after fix):');
    verifyEntryLogs.forEach(log => {
      console.log(`  ${log._id}: ${log.count} entries`);
    });

    console.log('\nExit logs by location (after fix):');
    verifyExitLogs.forEach(log => {
      console.log(`  ${log._id}: ${log.count} exits`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📚 Disconnected from MongoDB');
  }
}

checkAndFixLocations();
