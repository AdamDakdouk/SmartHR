// controllers/NotificationController.js
import NotificationService from "../services/Notification.service.js";

class NotificationController {
  async getNotifications(req, res) {
    try {
      const notifications =
        await NotificationService.getNotificationsForEmployee(req.user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async markAsRead(req, res) {
    try {
      const notification = await NotificationService.markAsRead(req.params.id);
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async markAllAsRead(req, res) {
    try {
      await NotificationService.markAllAsRead(req.user.id);
      res.json({ message: "All notifications marked as read" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUnreadCount(req, res) {
    try {
      const count = await NotificationService.getUnreadCount(req.user.id);
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new NotificationController();
