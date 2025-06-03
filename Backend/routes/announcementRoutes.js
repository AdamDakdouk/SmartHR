// Routes (announcementRoutes.js)
import express from "express";
import AnnouncementController from "../controllers/Announcement.controller.js";
import { authenticateJWT } from "../middlewares/authMiddleware.js";
import { checkRole } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// HR creates an announcement
router.post(
  "/",
  authenticateJWT,
  checkRole(["hr", "admin"]),
  AnnouncementController.createAnnouncement
);

// Get all announcements
router.get("/", authenticateJWT, AnnouncementController.getAllAnnouncements);

// Get active announcements (last 7 days)
router.get(
  "/active",
  authenticateJWT,
  AnnouncementController.getActiveAnnouncements
);

// Get count of active announcements
router.get(
  "/active/count",
  authenticateJWT,
  AnnouncementController.getActiveAnnouncementsCount
);

// Delete an announcement (HR only)
router.delete(
  "/:id",
  authenticateJWT,
  checkRole(["hr", "admin"]),
  AnnouncementController.deleteAnnouncement
);

// Update an announcement (HR only)
router.patch(
  "/:id",
  authenticateJWT,
  checkRole(["hr", "admin"]),
  AnnouncementController.updateAnnouncement
);

export default router;
