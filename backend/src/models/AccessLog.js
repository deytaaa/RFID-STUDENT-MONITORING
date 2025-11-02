const mongoose = require("mongoose");

const accessLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    deviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Device",
      required: true,
    },
    rfidTag: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    accessGranted: {
      type: Boolean,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    location: {
      type: String,
      default: "Main Gate",
    },
    method: {
      type: String,
      enum: ["rfid", "manual"],
      default: "rfid",
    },
    reason: {
      type: String,
      required: function () {
        return !this.accessGranted; // Required only if access denied
      },
    },
  },

  {
    timestamps: true,
  },
);

accessLogSchema.index({ timestamp: -1 }); // For recent logs
accessLogSchema.index({ rfidTag: 1 }); // For RFID lookups
accessLogSchema.index({ userId: 1 }); // For user activity

module.exports = mongoose.model("AccessLog", accessLogSchema);
