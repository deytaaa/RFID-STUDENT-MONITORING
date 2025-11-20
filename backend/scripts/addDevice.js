const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const Device = require('../src/models/Device');

const addDevice = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if device already exists
    const existingDevice = await Device.findOne({ name: 'Main Gate Arduino' });
    
    if (existingDevice) {
      console.log('📱 Device already exists:', existingDevice.name);
      console.log('🆔 Device ID:', existingDevice._id);
      process.exit(0);
    }

    // Create the main gate device
    const device = new Device({
      name: 'Main Gate Arduino',
      deviceType: 'gate',
      location: 'Main Entrance',
      status: 'online',
      lastHeartbeat: new Date(),
      configuration: {
        rfidModule: 'MFRC522',
        arduinoBoard: 'Arduino Uno',
        serialPort: 'COM3',
        baudRate: 9600,
        ledPins: {
          green: 7,
          red: 8
        },
        buzzerPin: 5,
        servoPin: 6,
        readerPins: {
          ss: 10,
          rst: 9
        }
      }
    });

    const savedDevice = await device.save();
    console.log('✅ Device created successfully!');
    console.log('📱 Device Name:', savedDevice.name);
    console.log('🆔 Device ID:', savedDevice._id);
    console.log('📍 Location:', savedDevice.location);

  } catch (error) {
    console.error('❌ Error creating device:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

addDevice();
