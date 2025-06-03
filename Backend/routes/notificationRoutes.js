// routes/notificationRoutes.js
import express from "express";
import NotificationController from "../controllers/Notification.controller.js";
import { authenticateJWT } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authenticateJWT);

router.get("/", NotificationController.getNotifications);
router.get("/unread-count", NotificationController.getUnreadCount);
router.patch("/:id/mark-read", NotificationController.markAsRead);
router.patch("/mark-all-read", NotificationController.markAllAsRead);

export default router;
