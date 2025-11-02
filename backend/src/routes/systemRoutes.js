const express = require('express');
const systemController = require('../controllers/SystemController');
const { authenticateJWT, requireAdmin, requireSuperAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

// GET /api/system/status - Get current system status
router.get('/status', authenticateJWT, requireAdmin, systemController.getSystemStatus.bind(systemController));

// POST /api/system/gate - Control gate operations (admin and superadmin)
router.post('/gate', authenticateJWT, requireAdmin, systemController.controlGate.bind(systemController));

// PUT /api/system/metrics - Update system metrics (super admin only)
router.put('/metrics', authenticateJWT, requireSuperAdmin, systemController.updateSystemMetrics.bind(systemController));

// Simple ping endpoint for backend status check
router.get('/ping', (req, res) => {
  res.set('Cache-Control', 'no-store'); // Prevent caching for instant status
  res.status(200).json({ success: true, message: 'Backend is online' });
});

module.exports = router;
