const express = require('express');
const router = express.Router();
const accessLogController = require('../controllers/AccessLogController');
const { authenticateJWT, requireAdmin } = require('../middleware/authMiddleware');

// GET routes
router.get('/exit', authenticateJWT, requireAdmin, accessLogController.getExitLogs);
router.get('/', authenticateJWT, requireAdmin, accessLogController.getAllAccessLogs);
router.get('/recent', authenticateJWT, requireAdmin, accessLogController.getRecentAccessLogs);
router.get('/stats', authenticateJWT, requireAdmin, accessLogController.getAccessStats);
router.get('/user/:userId', authenticateJWT, requireAdmin, accessLogController.getUserAccessLogs);
router.get('/device/:deviceId', authenticateJWT, requireAdmin, accessLogController.getDeviceAccessLogs);
router.get('/:id', authenticateJWT, requireAdmin, accessLogController.getAccessLogById);

// POST routes
router.post('/', authenticateJWT, requireAdmin, accessLogController.createAccessLog);

module.exports = router;