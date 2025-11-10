const Notification = require('../models/Notification');

class NotificationController {
  // Get notifications for current user
  static async getUserNotifications(req, res) {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = req.query;
      const userId = req.user.id;

      const filter = { userId };
      if (unreadOnly === 'true') {
        filter.read = false;
      }

      const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await Notification.countDocuments(filter);
      const unreadCount = await Notification.countDocuments({ userId, read: false });

      res.json({
        success: true,
        data: {
          notifications,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          },
          unreadCount
        }
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notifications',
        error: error.message
      });
    }
  }

  // Mark notification as read
  static async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;

      const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { read: true, readAt: new Date() },
        { new: true }
      );

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.json({
        success: true,
        data: notification
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark notification as read',
        error: error.message
      });
    }
  }

  // Mark all notifications as read
  static async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      const result = await Notification.updateMany(
        { userId, read: false },
        { read: true, readAt: new Date() }
      );

      res.json({
        success: true,
        data: {
          modifiedCount: result.modifiedCount
        }
      });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read',
        error: error.message
      });
    }
  }

  // Delete notification
  static async deleteNotification(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;

      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        userId
      });

      if (!notification) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete notification',
        error: error.message
      });
    }
  }

  // Clear all notifications
  static async clearAll(req, res) {
    try {
      const userId = req.user.id;

      const result = await Notification.deleteMany({ userId });

      res.json({
        success: true,
        data: {
          deletedCount: result.deletedCount
        }
      });
    } catch (error) {
      console.error('Error clearing notifications:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear notifications',
        error: error.message
      });
    }
  }

  // Create new notification (internal use)
  static async createNotification({
    userId,
    type,
    title,
    message,
    data = {},
    priority = 'medium',
    category = 'access'
  }) {
    try {
      const notification = new Notification({
        userId,
        type,
        title,
        message,
        data,
        priority,
        category
      });

      await notification.save();
      
      // Emit real-time notification via WebSocket
      try {
        const { io } = require('../../server');
        if (io) {
          io.emit('new_notification', {
            userId,
            notification: notification.toObject()
          });
        }
      } catch (error) {
        console.log('WebSocket not available for notification broadcast');
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Get notification statistics
  static async getStats(req, res) {
    try {
      const userId = req.user.id;

      const stats = await Notification.aggregate([
        { $match: { userId: userId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            unread: { $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] } },
            byType: {
              $push: {
                type: '$type',
                priority: '$priority'
              }
            }
          }
        }
      ]);

      const typeStats = await Notification.aggregate([
        { $match: { userId: userId } },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            unread: { $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] } }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          overview: stats[0] || { total: 0, unread: 0 },
          byType: typeStats
        }
      });
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch notification statistics',
        error: error.message
      });
    }
  }
}

module.exports = NotificationController;
