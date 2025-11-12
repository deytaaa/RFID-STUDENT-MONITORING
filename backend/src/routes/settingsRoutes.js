const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/SettingsController');
const { authenticateJWT, requireAdmin } = require('../middleware/authMiddleware');

// Get all settings (admin access required)
router.get('/', authenticateJWT, requireAdmin, SettingsController.getAllSettings);

// Update a setting by key (admin access required)
router.put('/', authenticateJWT, requireAdmin, SettingsController.updateSetting);

module.exports = router;
