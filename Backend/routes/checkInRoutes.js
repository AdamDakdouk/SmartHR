// routes/checkInRoutes.js
import express from "express";
import CheckInController from "../controllers/CheckIn.controller.js";
import { authenticateJWT } from "../middlewares/authMiddleware.js";
import { checkRole } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Employee check-in/out routes
router.post("/check-in", authenticateJWT, CheckInController.checkIn);
router.post("/check-out", authenticateJWT, CheckInController.checkOut);

// Location tracking routes
router.post(
  "/update-location",
  authenticateJWT,
  CheckInController.updateLocation
);
router.post(
  "/monitor-location",
  authenticateJWT,
  CheckInController.monitorLocation
);

// Status and history routes
router.get("/status", authenticateJWT, CheckInController.getStatus);
router.get("/history", authenticateJWT, CheckInController.getHistory);
router.get("/today", authenticateJWT, CheckInController.getTodayDetails);

// HR-only routes
router.post(
  "/default-location/:employeeId",
  authenticateJWT,
  checkRole(["hr"]),
  CheckInController.setDefaultCheckInLocation
);

export default router;
