// routes/task.routes.js
import express from "express";
import TaskController from "../controllers/Task.controller.js";
import { authenticateJWT } from "../middlewares/authMiddleware.js";
import { checkRole } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// HR routes (require HR role)
router.post("/", authenticateJWT, checkRole(["hr"]), TaskController.createTask);
// Put the /deleted route BEFORE any routes with :id parameter
router.get(
  "/deleted",
  authenticateJWT,
  checkRole(["hr"]),
  TaskController.getDeletedTasks
);
router.get(
  "/all",
  authenticateJWT,
  checkRole(["hr"]),
  TaskController.getAllTasks
);
router.get(
  "/daily-summary",
  authenticateJWT,
  TaskController.getDailySummary
);

router.put(
  "/:id",
  authenticateJWT,
  checkRole(["hr"]),
  TaskController.updateTask
);
router.delete(
  "/:id",
  authenticateJWT,
  checkRole(["hr"]),
  TaskController.softDeleteTask
);
router.post(
  "/:id/restore",
  authenticateJWT,
  checkRole(["hr"]),
  TaskController.restoreTask
);

// Employee routes
router.get("/stats", authenticateJWT, TaskController.getTasksStats);
router.get("/my-tasks", authenticateJWT, TaskController.getMyTasks);
router.patch("/:id/status", authenticateJWT, TaskController.updateTaskStatus);
router.patch(
  "/:id/progress",
  authenticateJWT,
  TaskController.updateTaskProgress
);

export default router;
