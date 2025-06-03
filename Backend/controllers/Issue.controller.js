// Issue Controller (issueController.js)
import IssueService from "../services/Issue.service.js";
import Issue from "../models/IssueReport.js";

class IssueController {
  async reportIssue(req, res) {
    // Get user ID from auth middleware
    const reportedBy = req.user.id;

    // Extract all necessary fields from the request body
    const { title, description, priority = "medium", category } = req.body;

    // Validate required fields
    if (!title || !description) {
      return res
        .status(400)
        .json({ message: "Title and description are required" });
    }

    try {
      // Pass all parameters to the service
      const issue = await IssueService.reportIssue(
        reportedBy,
        title,
        description,
        priority,
        category
      );

      return res.status(201).json(issue);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getAllIssues(req, res) {
    try {
      const issues = await IssueService.getAllIssues();
      return res.status(200).json(issues);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async resolveIssue(req, res) {
    const { issueId } = req.body;

    if (!issueId) {
      return res.status(400).json({ message: "Issue ID is required" });
    }

    try {
      const issue = await IssueService.resolveIssue(issueId);
      return res.status(200).json(issue);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get issues by status
   */
  async getIssuesByStatus(req, res) {
    try {
      const statusArray = Array.isArray(req.query.status)
        ? req.query.status
        : [req.query.status];

      const issues = await Issue.find({ status: { $in: statusArray } }).sort({
        createdAt: -1,
      });

      return res.status(200).json(issues);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get count of open issues
   */
  async getOpenIssuesCount(req, res) {
    try {
      const count = await Issue.countDocuments({
        status: { $in: ["open", "inProgress"] },
      });

      return res.status(200).json({ count });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default new IssueController();
