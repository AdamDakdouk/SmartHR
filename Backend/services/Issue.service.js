// services/IssueService.js
import Issue from "../models/IssueReport.js";
import NotificationService from "./Notification.service.js";
import Employee from "../models/Employee.js";

class IssueService {
  async reportIssue(reportedBy, title, description, priority, category) {
    try {
      const issue = await Issue.create({
        reportedBy,
        title,
        description,
        priority,
        category,
      });

      const employee = await Employee.findById(reportedBy);

      await NotificationService.createNotificationWithHR({
        employeeId: reportedBy,
        title: "Issue Reported Successfully",
        message: `Your issue "${title}" has been reported successfully`,
        hrTitle: "New Issue Reported",
        hrMessage: `${employee.firstName} ${employee.lastName} reported a ${priority} priority issue: ${title}`,
        type: "ISSUE_REPORTED",
        relatedId: issue._id,
        relatedModel: "Issue",
      });

      return await issue.populate("reportedBy");
    } catch (error) {
      throw new Error("Error reporting issue: " + error.message);
    }
  }

  async updateIssueStatus(issueId, status, assignedTo = null) {
    try {
      const issue = await Issue.findByIdAndUpdate(
        issueId,
        {
          status,
          ...(assignedTo && { assignedTo }),
        },
        { new: true }
      ).populate(["reportedBy", "assignedTo"]);

      if (!issue) {
        throw new Error("Issue not found");
      }

      const notificationData = {
        employeeId: issue.reportedBy._id,
        title: "Issue Status Updated",
        message: `Your reported issue "${issue.title}" has been ${status}`,
        hrTitle: "Issue Status Changed",
        hrMessage: `Issue "${issue.title}" reported by ${issue.reportedBy.firstName} ${issue.reportedBy.lastName} has been ${status}`,
        type: "ISSUE_STATUS_UPDATE",
        relatedId: issue._id,
        relatedModel: "Issue",
      };

      // If issue is assigned to someone, also notify them
      if (assignedTo) {
        await NotificationService.createNotification({
          recipientId: assignedTo,
          title: "Issue Assigned",
          message: `You have been assigned to issue: ${issue.title}`,
          type: "ISSUE_STATUS_UPDATE",
          relatedId: issue._id,
          relatedModel: "Issue",
        });
      }

      await NotificationService.createNotificationWithHR(notificationData);

      return issue;
    } catch (error) {
      throw new Error("Error updating issue status: " + error.message);
    }
  }

  async getAllIssues() {
    try {
      return await Issue.find()
        .populate(["reportedBy", "assignedTo"])
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error("Error fetching issues: " + error.message);
    }
  }
}

export default new IssueService();
