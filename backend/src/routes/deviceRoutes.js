const express = require('express');
const router = express.Router();
const deviceController = require('../controllers/DeviceController');
const { authenticateJWT, requireAdmin, requireSuperAdmin } = require('../middleware/authMiddleware');

// Standard CRUD
router.get('/', authenticateJWT, requireAdmin, deviceController.getAllDevices);
router.get('/:id', authenticateJWT, requireAdmin, deviceController.getDeviceById);

// Sensitive operations: super admin only
router.post('/', authenticateJWT, requireSuperAdmin, deviceController.createDevice);
router.put('/:id', authenticateJWT, requireSuperAdmin, deviceController.updateDevice);
router.delete('/:id', authenticateJWT, requireSuperAdmin, deviceController.deleteDevice);

// RFID-specific operations
router.put('/:id/status', authenticateJWT, requireSuperAdmin, deviceController.updateDeviceStatus);
router.post('/:id/heartbeat', authenticateJWT, requireSuperAdmin, deviceController.deviceHeartbeat);

// Arduino-specific endpoints
router.post('/validate', authenticateJWT, requireSuperAdmin, deviceController.validateRFIDAccess);
router.post('/status', authenticateJWT, requireSuperAdmin, deviceController.updateArduinoStatus);
router.post('/control/gate', authenticateJWT, requireSuperAdmin, deviceController.controlGate);

module.exports = router;