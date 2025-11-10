import ApiService from './ApiService';

class NotificationService {
  static async getNotifications(params = {}) {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.unreadOnly) queryParams.append('unreadOnly', params.unreadOnly);
    
    const url = `/notifications${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    return ApiService.get(url);
  }

  static async markAsRead(notificationId) {
    return ApiService.put(`/notifications/${notificationId}/read`);
  }

  static async markAllAsRead() {
    return ApiService.put('/notifications/read-all');
  }

  static async deleteNotification(notificationId) {
    return ApiService.delete(`/notifications/${notificationId}`);
  }

  static async clearAll() {
    return ApiService.delete('/notifications');
  }

  static async getStats() {
    return ApiService.get('/notifications/stats');
  }

  // Get unread notifications count
  static async getUnreadCount() {
    try {
      const response = await this.getNotifications({ limit: 1, unreadOnly: true });
      return response.data?.unreadCount || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  }

  // Sync notifications with localStorage (hybrid approach)
  static syncWithLocalStorage(notifications) {
    try {
      const localNotifications = this.getLocalStorageNotifications();
      
      // Merge server notifications with local ones (server takes priority)
      const serverIds = new Set(notifications.map(n => n._id));
      const localOnly = localNotifications.filter(n => !serverIds.has(n.id));
      
      // Combine and sort by timestamp
      const merged = [...notifications, ...localOnly].sort((a, b) => 
        new Date(b.createdAt || b.timestamp) - new Date(a.createdAt || a.timestamp)
      );
      
      // Save merged notifications to localStorage
      localStorage.setItem('header-notifications', JSON.stringify(merged));
      
      return merged;
    } catch (error) {
      console.error('Error syncing notifications:', error);
      return notifications;
    }
  }

  static getLocalStorageNotifications() {
    try {
      const stored = localStorage.getItem('header-notifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Error loading localStorage notifications:', error);
      return [];
    }
  }

  // Add temporary notification to localStorage (for immediate feedback)
  static addLocalNotification(notification) {
    try {
      const existing = this.getLocalStorageNotifications();
      const newNotification = {
        id: `local_${Date.now()}`,
        ...notification,
        timestamp: new Date().toISOString(),
        isLocal: true
      };
      
      const updated = [newNotification, ...existing.slice(0, 9)]; // Keep only 10
      localStorage.setItem('header-notifications', JSON.stringify(updated));
      
      return newNotification;
    } catch (error) {
      console.error('Error adding local notification:', error);
      return null;
    }
  }

  // Format notification for display
  static formatNotification(notification) {
    return {
      id: notification._id || notification.id,
      message: notification.message,
      title: notification.title,
      type: notification.type,
      read: notification.read,
      timestamp: new Date(notification.createdAt || notification.timestamp).toLocaleTimeString(),
      fullTimestamp: new Date(notification.createdAt || notification.timestamp).toLocaleString(),
      priority: notification.priority,
      category: notification.category,
      data: notification.data,
      isLocal: notification.isLocal || false
    };
  }

  // Clean up old local notifications
  static cleanupLocalStorage() {
    try {
      const notifications = this.getLocalStorageNotifications();
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      const filtered = notifications.filter(n => {
        const notificationDate = new Date(n.createdAt || n.timestamp);
        return notificationDate > oneDayAgo;
      });
      
      localStorage.setItem('header-notifications', JSON.stringify(filtered));
    } catch (error) {
      console.error('Error cleaning up localStorage:', error);
    }
  }
}

export default NotificationService;
