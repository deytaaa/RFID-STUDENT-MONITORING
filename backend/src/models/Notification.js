const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['access_denied', 'access_granted', 'system_alert', 'device_status'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    cardID: String,
    deviceId: String,
    studentId: String,
    additionalInfo: mongoose.Schema.Types.Mixed
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['security', 'access', 'system', 'maintenance'],
    default: 'access'
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Indexes for better query performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ read: 1 });
notificationSchema.index({ type: 1 });

// Virtual for formatted timestamp
notificationSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleString();
});

// Auto-cleanup: Remove notifications older than 30 days
notificationSchema.statics.cleanup = async function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return this.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
};

module.exports = mongoose.model('Notification', notificationSchema);
