// routes/requestRoutes.js
import express from "express";
import RequestController from "../controllers/Request.controller.js";
import { authenticateJWT } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Create a new request (any type)
router.post("/", authenticateJWT, RequestController.createRequest);

// Get all requests (HR only)
router.get("/", authenticateJWT, RequestController.getAllRequests);

// Get requests by type (HR only)
router.get(
  "/type/:type",
  authenticateJWT,
  RequestController.getRequestsByType
);

// Get requests for a specific employee
router.get(
  "/employee/:employeeId",
  authenticateJWT,
  RequestController.getEmployeeRequests
);

// Get requests of a specific type for a specific employee
router.get(
  "/employee/:employeeId/type/:type",
  authenticateJWT,
  RequestController.getEmployeeRequestsByType
);

// Get a specific request by ID
router.get(
  "/:requestId",
  authenticateJWT,
  RequestController.getRequestById
);

// Update request status (HR only)
router.patch(
  "/status",
  authenticateJWT,
  RequestController.updateRequestStatus
);

// Get count of pending requests (dashboard stats)
router.get(
  "/pending/count",
  authenticateJWT,
  RequestController.getPendingRequestsCount
);

export default router;
