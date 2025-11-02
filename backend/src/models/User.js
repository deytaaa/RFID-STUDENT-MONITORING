const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true 
  },
  password: {
    type: String,
    required: true
  },
  studentId: {
    type: String,
    required: function() { return this.accessLevel === 'student'; },
    unique: true,
    sparse: true, // Allow null for non-students
    uppercase: true
  },
  course: {
    type: String,
    required: function() { return this.accessLevel === 'student'; },
    trim: true
  },
  yearLevel: {
    type: String,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Graduate'],
    required: function() { return this.accessLevel === 'student'; }
  },
  rfIdTag: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true 
  },
  accessLevel: { 
    type: String, 
    enum: ['student', 'admin', 'superadmin'],
    default: 'student' 
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'superadmin'],
    default: 'student'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  profilePicture: {
    type: String,
    default: ''
  }
}, {
  timestamps: true  
});

// Add compound indexes for better performance (unique fields already have individual indexes)
userSchema.index({ accessLevel: 1, isActive: 1 });
userSchema.index({ course: 1, yearLevel: 1 }); // Useful for student queries

module.exports = mongoose.model('User', userSchema);