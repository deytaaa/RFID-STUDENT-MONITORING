// Script to create a super admin user
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URL || 'mongodb://localhost:27017/rfid_gate_system';

async function createSuperAdmin() {
  await mongoose.connect(MONGO_URI);

  const email = 'superadmin@example.com';
  const password = 'SuperSecurePassword123';

  // Check if superadmin already exists
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Super admin already exists:', email);
    return process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const superAdmin = new User({
    name: 'Super Admin',
    email,
    password: hashedPassword,
    rfIdTag: 'SUPERADMIN001',
    accessLevel: 'superadmin',
    role: 'superadmin',
    isActive: true
  });

  await superAdmin.save();
  console.log('Super admin created:', email);
  process.exit(0);
}

createSuperAdmin().catch(err => {
  console.error('Error creating super admin:', err);
  process.exit(1);
});
