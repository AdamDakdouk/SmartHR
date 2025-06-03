// services/RequestService.js
import Request from "../models/Request.js";
import NotificationService from "./Notification.service.js";
import Employee from "../models/Employee.js";

class RequestService {
  async createRequest(employeeId, requestData) {
    try {
      // Validate required fields based on request type
      this.validateRequestData(requestData);

      const requestObj = {
        employee: employeeId,
        ...requestData,
      };

      const request = await Request.create(requestObj);
      const employee = await Employee.findById(employeeId);

      // Create notification based on request type
      let notificationTitle = "Request Submitted";
      let notificationMessage = `Your ${requestData.type} request has been submitted`;
      let hrTitle = `New ${this.capitalizeFirstLetter(
        requestData.type
      )} Request`;
      let hrMessage = `${employee.firstName} ${employee.lastName} has submitted a ${requestData.type} request`;

      if (requestData.type === "leave" || requestData.type === "vacation") {
        notificationMessage = `Your ${requestData.type} request from ${new Date(
          requestData.startDate
        ).toLocaleDateString()} to ${new Date(
          requestData.endDate
        ).toLocaleDateString()} has been submitted`;
        hrMessage = `${employee.firstName} ${employee.lastName} has requested ${
          requestData.type
        } from ${new Date(
          requestData.startDate
        ).toLocaleDateString()} to ${new Date(
          requestData.endDate
        ).toLocaleDateString()}`;
      } else if (requestData.type === "salary") {
        notificationMessage = `Your salary review request for $${requestData.requestedSalary} has been submitted`;
        hrMessage = `${employee.firstName} ${employee.lastName} has requested a salary review from $${requestData.currentSalary} to $${requestData.requestedSalary}`;
      }

      await NotificationService.createNotificationWithHR({
        employeeId,
        title: notificationTitle,
        message: notificationMessage,
        hrTitle: hrTitle,
        hrMessage: hrMessage,
        type: `${requestData.type.toUpperCase()}_REQUEST_SUBMITTED`,
        relatedId: request._id,
        relatedModel: "Request",
      });

      return await request.populate("employee");
    } catch (error) {
      throw new Error(
        `Error creating ${requestData.type} request: ${error.message}`
      );
    }
  }

  validateRequestData(data) {
    // Validate based on request type
    switch (data.type) {
      case "leave":
        if (
          !data.startDate ||
          !data.endDate ||
          !data.reason ||
          !data.leaveType
        ) {
          throw new Error(
            "Leave request requires startDate, endDate, reason, and leaveType"
          );
        }
        break;
      case "vacation":
        if (!data.startDate || !data.endDate || !data.vacationType) {
          throw new Error(
            "Vacation request requires startDate, endDate, and vacationType"
          );
        }
        break;
      case "salary":
        if (!data.currentSalary || !data.requestedSalary) {
          throw new Error(
            "Salary request requires currentSalary and requestedSalary"
          );
        }
        break;
      default:
        if (!data.reason) {
          throw new Error("Request requires at least a reason field");
        }
    }
  }

  async updateRequestStatus(requestId, status, reviewerId, comments) {
    try {
      const request = await Request.findByIdAndUpdate(
        requestId,
        {
          status,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          comments: comments || "",
        },
        { new: true }
      ).populate("employee");

      if (!request) {
        throw new Error("Request not found");
      }

      const requestType = this.capitalizeFirstLetter(request.type);

      await NotificationService.createNotificationWithHR({
        employeeId: request.employee._id,
        title: `${requestType} Request Updated`,
        message: `Your ${request.type} request has been ${status}`,
        hrTitle: `${requestType} Request Status Updated`,
        hrMessage: `${request.employee.firstName} ${request.employee.lastName}'s ${request.type} request has been ${status}`,
        type: `${request.type.toUpperCase()}_REQUEST_STATUS_UPDATE`,
        relatedId: request._id,
        relatedModel: "Request",
      });

      return request;
    } catch (error) {
      throw new Error(`Error updating request status: ${error.message}`);
    }
  }

  async getAllRequests() {
    try {
      return await Request.find().populate("employee").sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Error fetching all requests: ${error.message}`);
    }
  }

  async getRequestsByType(type) {
    try {
      return await Request.find({ type })
        .populate("employee")
        .sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(`Error fetching ${type} requests: ${error.message}`);
    }
  }

  async getEmployeeRequests(employeeId) {
    try {
      return await Request.find({ employee: employeeId }).sort({
        createdAt: -1,
      });
    } catch (error) {
      throw new Error(`Error fetching employee requests: ${error.message}`);
    }
  }

  async getEmployeeRequestsByType(employeeId, type) {
    try {
      return await Request.find({
        employee: employeeId,
        type: type,
      }).sort({ createdAt: -1 });
    } catch (error) {
      throw new Error(
        `Error fetching employee ${type} requests: ${error.message}`
      );
    }
  }

  async getRequestById(requestId) {
    try {
      return await Request.findById(requestId).populate("employee");
    } catch (error) {
      throw new Error(`Error fetching request: ${error.message}`);
    }
  }

  async getPendingRequestsCount() {
    try {
      return await Request.countDocuments({ status: "pending" });
    } catch (error) {
      throw new Error(`Error counting pending requests: ${error.message}`);
    }
  }

  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}

export default new RequestService();
