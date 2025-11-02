const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
  key : {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value : {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  category: {
    type: String,
    enum: ['system', 'network', 'security', 'notification' , 'rfid', 'database'],
    required: true
  },
  dataType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    required: true
  },
  isEditable: {
    type: Boolean,
    default: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

settingSchema.index({ category: 1 }); // For category filtering

settingSchema.statics.getSetting = async function(key) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : null;
};

settingSchema.statics.setSetting = async function(key, value, updatedBy) {
  return await this.findOneAndUpdate(
    { key },
    { value, updatedBy, updatedAt: new Date() },
    { new: true, upsert: true }
  );
};

settingSchema.methods.validateValue = function() {
  // Validate value matches dataType
  const { value, dataType } = this;
  switch(dataType) {
    case 'number': return !isNaN(value);
    case 'boolean': return typeof value === 'boolean';
    case 'object': return typeof value === 'object';
    case 'array': return Array.isArray(value);
    default: return true;
  }
};

module.exports = mongoose.model('Setting', settingSchema);
