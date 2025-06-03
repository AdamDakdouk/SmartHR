// services/Search.service.js
import Employee from "../models/Employee.js";
import Task from "../models/Task.js";
import Request from "../models/Request.js";
import Issue from "../models/IssueReport.js";
import Announcement from "../models/Announcement.js";

class SearchService {
  /**
   * Search across multiple entities
   * @param {string} query - Search query string
   * @param {string} userId - ID of the user making the search
   * @returns {Promise<Object>} - Search results categorized by entity type
   */
  // Fix for Search.service.js

  async searchAll(query, userId) {
    if (!query || query.trim().length < 3) {
      throw new Error("Search query must be at least 3 characters long");
    }

    try {
      // Create the search pattern for MongoDB
      const searchPattern = new RegExp(query, "i");

      // Execute searches in parallel for better performance
      const [employees, tasks, requests, issues, announcements] = // Changed from 'Requests' to 'requests'
        await Promise.all([
          this.searchEmployees(searchPattern, userId),
          this.searchTasks(searchPattern, userId),
          this.searchRequests(searchPattern, userId), // Changed from searchLeaveRequests to searchRequests
          this.searchIssues(searchPattern, userId),
          this.searchAnnouncements(searchPattern, userId),
        ]);

      return {
        employees,
        tasks,
        requests, // Changed from 'Requests' to 'requests' for consistency
        issues,
        announcements,
      };
    } catch (error) {
      throw new Error(`Search error: ${error.message}`);
    }
  }

  /**
   * Search for requests (formerly leave requests)
   * @param {RegExp} searchPattern - Regex pattern for search
   * @param {string} userId - ID of the requesting user
   * @returns {Promise<Array>} - List of matching requests
   */
  async searchRequests(searchPattern, userId) {
    // Changed from searchLeaveRequests to searchRequests
    const requests = await Request.find({
      reason: searchPattern,
      employee: userId, // Only user's own requests
    }).select("startDate endDate reason status type"); // Added 'type' to select

    return requests.map((request) => ({
      id: request._id,
      startDate: request.startDate,
      endDate: request.endDate,
      reason: request.reason,
      status: request.status,
      type: request.type || "leave", // Include request type, default to "leave" for backward compatibility
      requestType: "request", // Changed from "leaveRequest" to "request"
    }));
  }

  /**
   * Search for employees
   * @param {RegExp} searchPattern - Regex pattern for search
   * @param {string} userId - ID of the requesting user
   * @returns {Promise<Array>} - List of matching employees
   */
  async searchEmployees(searchPattern, userId) {
    const employees = await Employee.find({
      $or: [
        { firstName: searchPattern },
        { lastName: searchPattern },
        { email: searchPattern },
        { job: searchPattern },
      ],
      _id: { $ne: userId }, // Exclude the searching user
    }).select("firstName lastName email job profilePicture");

    return employees.map((emp) => ({
      id: emp._id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      job: emp.job || "",
      profilePicture: emp.profilePicture,
      type: "employee",
    }));
  }

  /**
   * Search for tasks
   * @param {RegExp} searchPattern - Regex pattern for search
   * @param {string} userId - ID of the requesting user
   * @returns {Promise<Array>} - List of matching tasks
   */
  async searchTasks(searchPattern, userId) {
    const tasks = await Task.find({
      $or: [{ title: searchPattern }, { description: searchPattern }],
      $or: [
        { assignedTo: userId }, // Tasks assigned to the user
        { createdBy: userId }, // Tasks created by the user
      ],
      isDeleted: false,
    })
      .populate("assignedTo", "firstName lastName")
      .select("title description status priority dueDate assignedTo");

    return tasks.map((task) => ({
      id: task._id,
      title: task.title,
      description: task.description ? task.description.substring(0, 100) : "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      assignedTo: task.assignedTo
        ? `${task.assignedTo.firstName} ${task.assignedTo.lastName}`
        : "Unassigned",
      type: "task",
    }));
  }

  /**
   * Search for issues
   * @param {RegExp} searchPattern - Regex pattern for search
   * @param {string} userId - ID of the requesting user
   * @returns {Promise<Array>} - List of matching issues
   */
  async searchIssues(searchPattern, userId) {
    const issues = await Issue.find({
      $or: [{ title: searchPattern }, { description: searchPattern }],
      $or: [
        { reportedBy: userId }, // Issues reported by the user
        { assignedTo: userId }, // Issues assigned to the user
      ],
    })
      .populate("reportedBy", "firstName lastName")
      .select("title description status priority createdAt");

    return issues.map((issue) => ({
      id: issue._id,
      title: issue.title,
      description: issue.description ? issue.description.substring(0, 100) : "",
      status: issue.status,
      priority: issue.priority,
      reportedBy: issue.reportedBy
        ? `${issue.reportedBy.firstName} ${issue.reportedBy.lastName}`
        : "Unknown",
      createdAt: issue.createdAt,
      type: "issue",
    }));
  }

  /**
   * Search for announcements
   * @param {RegExp} searchPattern - Regex pattern for search
   * @returns {Promise<Array>} - List of matching announcements
   */
  async searchAnnouncements(searchPattern) {
    const announcements = await Announcement.find({
      $or: [{ title: searchPattern }, { description: searchPattern }],
    })
      .populate("createdBy", "firstName lastName")
      .select("title description createdBy createdAt");

    return announcements.map((announcement) => ({
      id: announcement._id,
      title: announcement.title,
      description: announcement.description
        ? announcement.description.substring(0, 100)
        : "",
      createdBy: announcement.createdBy
        ? `${announcement.createdBy.firstName} ${announcement.createdBy.lastName}`
        : "HR Team",
      createdAt: announcement.createdAt,
      type: "announcement",
    }));
  }
}

export default new SearchService();
