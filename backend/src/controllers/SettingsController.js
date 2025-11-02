const Setting = require('../models/Settings');

const SettingsController = {
  // Get all settings
  async getAllSettings(req, res) {
    try {
      const settings = await Setting.find();
      res.status(200).json({ success: true, data: settings });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch settings', error: error.message });
    }
  },

  // Update a setting by key
  async updateSetting(req, res) {
    const { key, value } = req.body;
    const updatedBy = req.user ? req.user._id : null;
    try {
      const updated = await Setting.setSetting(key, value, updatedBy);
      res.status(200).json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update setting', error: error.message });
    }
  }
};

module.exports = SettingsController;
