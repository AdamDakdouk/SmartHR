import Announcement from "../models/Announcement.js";
import Employee from "../models/Employee.js";
import NotificationService from "./Notification.service.js";

class AnnouncementService {
  async createAnnouncement(announcementData) {
    try {
      const announcement = await Announcement.create(announcementData);

      // First, get all employees separated by role
      const [regularEmployees, hrEmployees] = await Promise.all([
        Employee.find({ role: "employee" }),
        Employee.find({ role: "hr" }),
      ]);

      // Create notifications for regular employees
      const employeeNotificationPromises = regularEmployees.map((employee) =>
        NotificationService.createNotification({
          recipientId: employee._id,
          title: "New Announcement",
          message: this.formatAnnouncementMessage(announcement),
          type: "ANNOUNCEMENT",
          relatedId: announcement._id,
          relatedModel: "Announcement",
        })
      );

      // Create notifications for HR employees with additional context
      const hrNotificationPromises = hrEmployees.map((hr) =>
        NotificationService.createNotification({
          recipientId: hr._id,
          title: "New Announcement Published",
          message: this.formatHRAnnouncementMessage(announcement),
          type: "ANNOUNCEMENT",
          relatedId: announcement._id,
          relatedModel: "Announcement",
        })
      );

      // Wait for all notifications to be created
      await Promise.all([
        ...employeeNotificationPromises,
        ...hrNotificationPromises,
      ]);

      return announcement;
    } catch (error) {
      throw new Error("Error creating announcement: " + error.message);
    }
  }

  formatAnnouncementMessage(announcement) {
    return `${announcement.title}: ${announcement.description.substring(
      0,
      100
    )}${announcement.description.length > 100 ? "..." : ""}`;
  }

  formatHRAnnouncementMessage(announcement) {
    return `New announcement published\nTitle: ${
      announcement.title
    }\nDescription: ${announcement.description.substring(0, 100)}${
      announcement.description.length > 100 ? "..." : ""
    }`;
  }

  async getAllAnnouncements() {
    try {
      return await Announcement.find()
        .sort({ createdAt: -1 })
        .populate("createdBy", "firstName lastName");
    } catch (error) {
      throw new Error("Error fetching announcements: " + error.message);
    }
  }

  async updateAnnouncement(announcementId, updateData) {
    try {
      const announcement = await Announcement.findByIdAndUpdate(
        announcementId,
        updateData,
        { new: true }
      );

      if (!announcement) {
        throw new Error("Announcement not found");
      }

      // Notify all employees about the update
      const [regularEmployees, hrEmployees] = await Promise.all([
        Employee.find({ role: "employee" }),
        Employee.find({ role: "hr" }),
      ]);

      const employeeNotificationPromises = regularEmployees.map((employee) =>
        NotificationService.createNotification({
          recipientId: employee._id,
          title: "Announcement Updated",
          message: `An announcement has been updated: ${this.formatAnnouncementMessage(
            announcement
          )}`,
          type: "ANNOUNCEMENT",
          relatedId: announcement._id,
          relatedModel: "Announcement",
        })
      );

      const hrNotificationPromises = hrEmployees.map((hr) =>
        NotificationService.createNotification({
          recipientId: hr._id,
          title: "Announcement Updated",
          message: `Announcement update published: ${this.formatHRAnnouncementMessage(
            announcement
          )}`,
          type: "ANNOUNCEMENT",
          relatedId: announcement._id,
          relatedModel: "Announcement",
        })
      );

      await Promise.all([
        ...employeeNotificationPromises,
        ...hrNotificationPromises,
      ]);

      return announcement;
    } catch (error) {
      throw new Error("Error updating announcement: " + error.message);
    }
  }

  async deleteAnnouncement(announcementId) {
    try {
      const announcement = await Announcement.findByIdAndDelete(announcementId);

      if (!announcement) {
        throw new Error("Announcement not found");
      }

      // Notify HR users about the deletion
      const hrEmployees = await Employee.find({ role: "hr" });

      await Promise.all(
        hrEmployees.map((hr) =>
          NotificationService.createNotification({
            recipientId: hr._id,
            title: "Announcement Deleted",
            message: `An announcement has been deleted:\nTitle: ${announcement.title}`,
            type: "ANNOUNCEMENT",
            relatedId: announcement._id,
            relatedModel: "Announcement",
          })
        )
      );

      return announcement;
    } catch (error) {
      throw new Error("Error deleting announcement: " + error.message);
    }
  }
}

export default new AnnouncementService();
