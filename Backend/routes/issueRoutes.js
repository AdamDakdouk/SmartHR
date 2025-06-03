import express from "express";
import IssueController from "../controllers/Issue.controller.js";
import { authenticateJWT } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Employee reports an issue
router.post("/", authenticateJWT, IssueController.reportIssue);

// HR views all issues
router.get("/", authenticateJWT, IssueController.getAllIssues);

// HR resolves an issue
router.patch("/resolve", authenticateJWT, IssueController.resolveIssue);

router.get("/status", authenticateJWT, IssueController.getIssuesByStatus);

// Get count of open issues
router.get("/open/count", authenticateJWT, IssueController.getOpenIssuesCount);

export default router;
