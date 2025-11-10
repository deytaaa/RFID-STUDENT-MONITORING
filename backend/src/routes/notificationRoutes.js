const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/NotificationController');
const { authenticateJWT } = require('../middleware/authMiddleware');

// All notification routes require authentication
router.use(authenticateJWT);

// GET /api/notifications - Get user notifications
router.get('/', NotificationController.getUserNotifications);

// GET /api/notifications/stats - Get notification statistics
router.get('/stats', NotificationController.getStats);

// PUT /api/notifications/:notificationId/read - Mark specific notification as read
router.put('/:notificationId/read', NotificationController.markAsRead);

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', NotificationController.markAllAsRead);

// DELETE /api/notifications/:notificationId - Delete specific notification
router.delete('/:notificationId', NotificationController.deleteNotification);

// DELETE /api/notifications - Clear all notifications
router.delete('/', NotificationController.clearAll);

module.exports = router;
