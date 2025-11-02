const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/SettingsController');

// Get all settings
router.get('/', SettingsController.getAllSettings);

// Update a setting by key
router.put('/', SettingsController.updateSetting);

module.exports = router;
