// controllers/Search.controller.js
import SearchService from "../services/Search.service.js";

/**
 * Search Controller
 * Handles HTTP requests related to searching
 */
class SearchController {
  /**
   * Global search across multiple entities
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async search(req, res) {
    try {
      const { query } = req.query;

      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      const userId = req.user.id;
      const results = await SearchService.searchAll(query, userId);

      return res.status(200).json(results);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Search by specific entity type
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async searchByType(req, res) {
    try {
      const { query } = req.query;
      const { type } = req.params;

      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }

      if (
        ![
          "employees",
          "tasks",
          "requests", // Changed from "Requests" to lowercase "requests"
          "issues",
          "announcements",
        ].includes(type)
      ) {
        return res.status(400).json({ message: "Invalid search type" });
      }

      const userId = req.user.id;
      const searchPattern = new RegExp(query, "i");

      let results;
      switch (type) {
        case "employees":
          results = await SearchService.searchEmployees(searchPattern, userId);
          break;
        case "tasks":
          results = await SearchService.searchTasks(searchPattern, userId);
          break;
        case "requests": // Changed from "Requests" to lowercase "requests"
          results = await SearchService.searchRequests(searchPattern, userId); // Changed from searchLeaveRequests to searchRequests
          break;
        case "issues":
          results = await SearchService.searchIssues(searchPattern, userId);
          break;
        case "announcements":
          results = await SearchService.searchAnnouncements(
            searchPattern,
            userId
          );
          break;
      }

      return res.status(200).json(results);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default new SearchController();
