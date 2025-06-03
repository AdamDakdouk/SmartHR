import AnnouncementService from "../services/Announcement.service.js";
import Announcement from "../models/Announcement.js";

class AnnouncementController {
  async createAnnouncement(req, res) {
    const { title, description, createdBy } = req.body;

    if (!title || !description || !createdBy) {
      return res.status(400).json({ message: "All fields are required" });
    }

    try {
      const announcement = await AnnouncementService.createAnnouncement({
        title,
        description,
        createdBy,
      });
      return res.status(201).json(announcement);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getAllAnnouncements(req, res) {
    try {
      const announcements = await AnnouncementService.getAllAnnouncements();
      return res.status(200).json(announcements);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getActiveAnnouncements(req, res) {
    try {
      // Calculate date 7 days ago
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const announcements = await Announcement.find({
        createdAt: { $gte: sevenDaysAgo },
      })
        .sort({ createdAt: -1 })
        .populate("createdBy", "firstName lastName");

      return res.status(200).json(announcements);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getActiveAnnouncementsCount(req, res) {
    try {
      // Calculate date 7 days ago
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const count = await Announcement.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
      });

      return res.status(200).json({ count });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async deleteAnnouncement(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Announcement ID is required" });
      }

      const announcement = await AnnouncementService.deleteAnnouncement(id);

      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }

      return res.status(200).json({
        message: "Announcement deleted successfully",
        announcement,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async updateAnnouncement(req, res) {
    try {
      const { id } = req.params;
      const { title, description } = req.body;

      if (!id) {
        return res.status(400).json({ message: "Announcement ID is required" });
      }

      if (!title && !description) {
        return res.status(400).json({ message: "No fields to update" });
      }

      const updateData = {};
      if (title) updateData.title = title;
      if (description) updateData.description = description;

      const announcement = await AnnouncementService.updateAnnouncement(
        id,
        updateData
      );

      if (!announcement) {
        return res.status(404).json({ message: "Announcement not found" });
      }

      return res.status(200).json(announcement);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default new AnnouncementController();
