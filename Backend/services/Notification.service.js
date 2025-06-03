import Notification from "../models/Notifications.js";
import Employee from "../models/Employee.js";

class NotificationService {
  async createNotification({
    recipientId,
    title,
    message,
    type = "SYSTEM",
    relatedId = null,
    relatedModel = null,
  }) {
    try {
      console.log(recipientId, "herere");
      const notification = await Notification.create({
        recipient: recipientId,
        title,
        message,
        type,
        ...(relatedId && { relatedId, relatedModel }),
      });
      return notification;
    } catch (error) {
      throw new Error("Error creating notification: " + error.message);
    }
  }

  async createNotificationForHRs({
    title,
    message,
    type = "SYSTEM",
    relatedId = null,
    relatedModel = null,
  }) {
    try {
      // Find all HR users
      const hrUsers = await Employee.find({ role: "hr" });

      // Create notifications for each HR user
      const notifications = await Promise.all(
        hrUsers.map((hr) =>
          Notification.create({
            recipient: hr._id,
            title,
            message,
            type,
            ...(relatedId && { relatedId, relatedModel }),
          })
        )
      );

      return notifications;
    } catch (error) {
      throw new Error("Error creating HR notifications: " + error.message);
    }
  }

  async createNotificationWithHR({
    employeeId,
    title,
    hrTitle,
    message,
    hrMessage,
    type = "SYSTEM",
    relatedId = null,
    relatedModel = null,
  }) {
    try {
      // Create notification for the employee
      const employeeNotification = await this.createNotification({
        recipientId: employeeId,
        title,
        message,
        type,
        relatedId,
        relatedModel,
      });

      // Create notifications for HR users
      const hrNotifications = await this.createNotificationForHRs({
        title: hrTitle,
        message: hrMessage,
        type,
        relatedId,
        relatedModel,
      });

      return {
        employeeNotification,
        hrNotifications,
      };
    } catch (error) {
      throw new Error("Error creating notifications: " + error.message);
    }
  }

  async getNotificationsForEmployee(employeeId) {
    try {
      const currentDate = new Date();
      return await Notification.find({
        recipient: employeeId,
        expiresAt: { $gt: currentDate },
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("relatedId");
    } catch (error) {
      throw new Error("Error fetching notifications: " + error.message);
    }
  }

  async markAsRead(notificationId) {
    try {
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true }
      );

      if (!notification) {
        throw new Error("Notification not found");
      }
      return notification;
    } catch (error) {
      throw new Error("Error marking notification as read: " + error.message);
    }
  }

  async markAllAsRead(employeeId) {
    try {
      await Notification.updateMany(
        { recipient: employeeId, isRead: false },
        { isRead: true }
      );
    } catch (error) {
      throw new Error(
        "Error marking all notifications as read: " + error.message
      );
    }
  }

  async deleteExpiredNotifications() {
    try {
      const result = await Notification.deleteMany({
        expiresAt: { $lt: new Date() },
      });
      return result.deletedCount;
    } catch (error) {
      throw new Error("Error deleting expired notifications: " + error.message);
    }
  }

  async getUnreadCount(employeeId) {
    try {
      const count = await Notification.countDocuments({
        recipient: employeeId,
        isRead: false,
      });
      return count;
    } catch (error) {
      throw new Error("Error getting unread count: " + error.message);
    }
  }
}

export default new NotificationService();
