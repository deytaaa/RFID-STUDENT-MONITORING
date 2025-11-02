const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  name : {
    type: String,
    required: true,
    trim: true
  },
  deviceType: {
    type: String,
    enum: ['gate', 'reader', 'controller', 'sensor'],
    required: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['online', 'offline', 'maintenance'],
    default: 'offline'
  },
  lastHeartbeat: {
    type: Date,
    default: Date.now
  },
  configuration: {
    type: Object,
    default: {}
  },
  serialNumber: {
  type: String,
  unique: true,
  required: true,
  trim: true
},
}, {
  timestamps: true
});

deviceSchema.index({ status: 1 });
deviceSchema.index({ location: 1 });

module.exports = mongoose.model('Device', deviceSchema);