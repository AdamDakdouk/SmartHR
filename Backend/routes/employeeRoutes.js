import express from "express";
import EmployeeController from "../controllers/Employee.controller.js";
import { authenticateJWT } from "../middlewares/authMiddleware.js";
import { checkRole } from "../middlewares/roleMiddleware.js";
import upload from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// IMPORTANT: Order matters in Express routes!
// More specific routes should come BEFORE routes with parameters

// ============ DASHBOARD ROUTES (MUST COME FIRST) =============
// HR dashboard specific routes
router.get(
  "/dashboard/stats",
  authenticateJWT,
  checkRole(["hr"]),
  EmployeeController.getHRDashboardStats
);

router.get(
  "/dashboard/attendance",
  authenticateJWT,
  checkRole(["hr"]),
  EmployeeController.getAttendanceStats
);

// ============ OTHER STATIC ROUTES =============
// General employee routes
router.get(
  "/",
  authenticateJWT,
  checkRole(["hr"]),
  EmployeeController.getEmployees
);

router.get("/team", authenticateJWT, EmployeeController.getNonHREmployees);

router.get(
  "/checked-in",
  authenticateJWT,
  checkRole(["hr"]),
  EmployeeController.getCheckedInEmployees
);

router.get(
  "/all",
  authenticateJWT,
  checkRole(["hr"]),
  EmployeeController.getAllEmployeesIncludingDeactivated
);

// Check-in/out operations
router.post("/check-in", authenticateJWT, EmployeeController.checkIn);
router.post("/check-out", authenticateJWT, EmployeeController.checkOut);
router.post(
  "/update-location",
  authenticateJWT,
  EmployeeController.updateEmployeeLocation
);

// ============ ROUTES WITH URL PARAMETERS (MUST COME LAST) =============
// Profile routes
router.get(
  "/profile/:id",
  authenticateJWT,
  EmployeeController.getEmployeeProfile
);

router.patch(
  "/profile/:id",
  authenticateJWT,
  checkRole(["hr"]),
  EmployeeController.updateEmployeeProfile
);

// Profile picture operations
router.put(
  "/profile-picture/:id",
  authenticateJWT,
  upload.single("image"),
  EmployeeController.updateProfilePicture
);

router.get("/profile-picture/:filename", EmployeeController.getProfilePicture);

// Employee activation/deactivation
router.post(
  "/:id/deactivate",
  authenticateJWT,
  checkRole(["hr"]),
  EmployeeController.deactivateEmployee
);

router.post(
  "/:id/reactivate",
  authenticateJWT,
  checkRole(["hr"]),
  EmployeeController.reactivateEmployee
);

// Employee stats and activities
router.get("/:id/stats", authenticateJWT, EmployeeController.getEmployeeStats);

router.get(
  "/:id/activities",
  authenticateJWT,
  EmployeeController.getRecentActivities
);

router.get(
  "/:id/attendance",
  authenticateJWT,
  EmployeeController.getAttendancePercentage
);

// Location tracking/status routes
router.get(
  "/track/:id",
  authenticateJWT,
  checkRole(["hr"]),
  EmployeeController.trackEmployee
);

router.patch(
  "/:id/status",
  authenticateJWT,
  EmployeeController.updateEmployeeStatus
);

router.patch(
  "/:id/location",
  authenticateJWT,
  EmployeeController.updateCheckInLocation
);

export default router;
