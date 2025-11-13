/**
 * Activate User Account
 * This script will activate Makki Eddai's account so he can access the system
 */

const mongoose = require('mongoose');
const { User } = require('../src/models');

async function activateUser() {
  try {
    // Connect to MongoDB Atlas
    require('dotenv').config();
    const mongoUri = process.env.MONGO_URL || process.env.MONGODB_URI || 'mongodb://localhost:27017/IOT';
    await mongoose.connect(mongoUri);
    console.log('📚 Connected to MongoDB Atlas');

    // Find Makki Eddai's user account
    const user = await User.findOne({ 
      $or: [
        { name: 'Makki Eddai' },
        { rfIdTag: '6493C0E6' }
      ]
    });

    if (!user) {
      console.log('❌ User "Makki Eddai" not found');
      return;
    }

    console.log('👤 Found user:');
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   RFID: ${user.rfIdTag}`);
    console.log(`   Status: ${user.isActive ? 'ACTIVE' : 'INACTIVE'}`);
    console.log(`   Course: ${user.course}`);

    if (user.isActive) {
      console.log('✅ User is already active!');
    } else {
      // Activate the user
      await User.updateOne(
        { _id: user._id },
        { $set: { isActive: true } }
      );
      
      console.log('✅ User account activated successfully!');
      
      // Verify the update
      const updatedUser = await User.findById(user._id);
      console.log(`✅ Verification: User is now ${updatedUser.isActive ? 'ACTIVE' : 'INACTIVE'}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n📚 Disconnected from MongoDB');
  }
}

activateUser();
