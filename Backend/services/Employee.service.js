import Employee from "../models/Employee.js";
import CheckIn from "../models/CheckingSchema.js";
import Task from "../models/Task.js";
import Request from "../models/Request.js";
import IssueReport from "../models/IssueReport.js";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import admin from "../config/firebaseConfig.js";

/**
 * Configure multer for file uploads
 */
const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "./uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage: diskStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error("Invalid file type. Only JPEG, PNG and GIF are allowed."));
      return;
    }
    cb(null, true);
  },
}).single("image");

/**
 * Employee Service Class
 * Handles all business logic related to employees
 */
class EmployeeService {
  /**
   * Deactivate employee
   * @param {string} employeeId - ID of the employee to deactivate
   * @returns {Promise<Object>} - Deactivated employee info
   */
  async deactivateEmployee(employeeId) {
    try {
      // Check if the employee exists and is active
      const employee = await Employee.findOne({
        _id: employeeId,
        active: true,
      });

      if (!employee) {
        throw new Error("Employee not found or already deactivated");
      }

      // Prevent deactivation of the last HR user to avoid locking out everyone
      if (employee.role === "hr") {
        const hrCount = await Employee.countDocuments({
          role: "hr",
          active: true,
          _id: { $ne: employeeId },
        });

        if (hrCount === 0) {
          throw new Error("Cannot deactivate the last HR user");
        }
      }

      // Deactivate the employee
      const deactivatedEmployee = await Employee.findByIdAndUpdate(
        employeeId,
        {
          active: false,
          deactivatedAt: new Date(),
          // Force logout by invalidating tokens
          refreshToken: null,
          tokenVersion: employee.tokenVersion + 1,
        },
        { new: true }
      ).select("-password -refreshToken -tokenVersion -otp -otpGeneratedAt");

      if (!deactivatedEmployee) {
        throw new Error("Failed to deactivate employee");
      }

      return {
        id: deactivatedEmployee._id,
        firstName: deactivatedEmployee.firstName,
        lastName: deactivatedEmployee.lastName,
        email: deactivatedEmployee.email,
        role: deactivatedEmployee.role,
        deactivatedAt: deactivatedEmployee.deactivatedAt,
      };
    } catch (error) {
      throw new Error(`Error deactivating employee: ${error.message}`);
    }
  }

  /**
   * Reactivate employee
   * @param {string} employeeId - ID of the employee to reactivate
   * @returns {Promise<Object>} - Reactivated employee info
   */
  async reactivateEmployee(employeeId) {
    try {
      // Find the inactive employee
      const employee = await Employee.findOne({
        _id: employeeId,
        active: false,
      });

      if (!employee) {
        throw new Error("Inactive employee not found");
      }

      // Reactivate the employee
      const reactivatedEmployee = await Employee.findByIdAndUpdate(
        employeeId,
        {
          active: true,
          deactivatedAt: null,
        },
        { new: true }
      ).select("-password -refreshToken -tokenVersion -otp -otpGeneratedAt");

      if (!reactivatedEmployee) {
        throw new Error("Failed to reactivate employee");
      }

      return {
        id: reactivatedEmployee._id,
        firstName: reactivatedEmployee.firstName,
        lastName: reactivatedEmployee.lastName,
        email: reactivatedEmployee.email,
        role: reactivatedEmployee.role,
        active: true,
      };
    } catch (error) {
      throw new Error(`Error reactivating employee: ${error.message}`);
    }
  }

  /**
   * Get all employees including deactivated ones (HR only)
   * @param {string} userId - ID of the requesting user
   * @returns {Promise<Array>} - List of all employees including deactivated
   */
  async getAllEmployeesIncludingDeactivated(userId) {
    try {
      const employees = await Employee.find({ _id: { $ne: userId } })
        .select([
          "firstName",
          "lastName",
          "email",
          "job",
          "role",
          "status",
          "active",
          "deactivatedAt",
          "profilePicture",
          "checkInLocation",
          "createdAt",
        ])
        .sort({ active: -1, createdAt: -1 }); // Active ones first, then by creation date

      if (!employees.length) {
        return [];
      }

      return employees.map((emp) => ({
        id: emp._id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        job: emp.job || "",
        role: emp.role,
        status: emp.status,
        active: emp.active,
        deactivatedAt: emp.deactivatedAt,
        profilePicture: emp.profilePicture,
        checkInLocation: emp.checkInLocation,
        joinDate: emp.createdAt,
      }));
    } catch (error) {
      throw new Error(`Error fetching all employees: ${error.message}`);
    }
  }

  // Modify getEmployees to use the model-level filtering
  async getEmployees(userId) {
    try {
      // No need to explicitly filter by active: true as it's handled by middleware
      const employees = await Employee.find({ _id: { $ne: userId } })
        .select([
          "firstName",
          "lastName",
          "email",
          "job",
          "role",
          "status",
          "profilePicture",
          "checkInLocation",
          "createdAt",
        ])
        .sort({ createdAt: -1 });

      if (!employees.length) {
        return [];
      }

      return this.formatEmployeeList(employees);
    } catch (error) {
      throw new Error(`Error fetching employees: ${error.message}`);
    }
  }

  /**
   * Fetch non-HR employees only
   * @param {string} userId - ID of the requesting user
   * @returns {Promise<Array>} - List of non-HR employees
   */
  async getNonHREmployees(userId) {
    try {
      const employees = await Employee.find({
        _id: { $ne: userId },
        role: "employee",
      })
        .select([
          "firstName",
          "lastName",
          "email",
          "job",
          "role",
          "status",
          "profilePicture",
          "checkInLocation",
          "createdAt",
        ])
        .sort({ createdAt: -1 });

      if (!employees.length) {
        return [];
      }

      return this.formatEmployeeList(employees);
    } catch (error) {
      throw new Error(`Error fetching non-HR employees: ${error.message}`);
    }
  }

  /**
   * Format employee list for frontend consumption
   * @param {Array} employees - Raw employee documents from MongoDB
   * @returns {Array} - Formatted employee objects
   */
  formatEmployeeList(employees) {
    return employees.map((emp) => ({
      id: emp._id,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      job: emp.job || "",
      role: emp.role,
      status: emp.status,
      profilePicture: emp.profilePicture,
      checkInLocation: emp.checkInLocation,
      joinDate: emp.createdAt,
    }));
  }

  /**
   * Get detailed employee profile with stats and activities
   * @param {string} employeeId - ID of the employee
   * @returns {Promise<Object>} - Employee profile with stats and activities
   */
  async getEmployeeProfile(employeeId) {
    try {
      const employee = await Employee.findById(employeeId)
        .populate("tasks")
        .populate("requests") // Changed from leaveRequests to requests
        .populate("issuesReported")
        .select("-password -refreshToken -tokenVersion -otp -otpGeneratedAt");

      if (!employee) {
        throw new Error("Employee not found");
      }

      // Get employee stats
      const [stats, activities, attendance] = await Promise.all([
        this.getEmployeeStats(employeeId),
        this.getRecentActivities(employeeId),
        this.getAttendancePercentage(employeeId),
      ]);

      return {
        profile: {
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          job: employee.job || "",
          role: employee.role,
          status: employee.status,
          checkInLocation:
            employee.checkInLocation &&
            Object.keys(employee.checkInLocation).length > 0
              ? employee.checkInLocation
              : null,
          profilePicture: employee.profilePicture,
          createdAt: employee.createdAt,
        },
        stats: {
          tasksCompleted: stats.completedTasks,
          attendance: attendance,
          leavesTaken: stats.leavesTaken,
        },
        recentActivities: activities,
      };
    } catch (error) {
      throw new Error(`Error fetching employee profile: ${error.message}`);
    }
  }

  async getEmployeeStats(employeeId) {
    try {
      const [completedTasks, leavesTaken] = await Promise.all([
        Task.countDocuments({
          assignedTo: employeeId,
          status: "completed",
        }),
        Request.countDocuments({
          // Changed from LeaveRequest to Request
          employee: employeeId,
          status: "approved",
        }),
      ]);

      return { completedTasks, leavesTaken };
    } catch (error) {
      throw new Error(`Error fetching employee stats: ${error.message}`);
    }
  }

  async getRecentActivities(employeeId) {
    try {
      const [tasks, requests, issues] = await Promise.all([
        // Changed leaves to requests
        Task.find({ assignedTo: employeeId })
          .sort({ updatedAt: -1 })
          .limit(3)
          .select("title status updatedAt"),
        Request.find({ employee: employeeId }) // Changed from LeaveRequest to Request
          .sort({ createdAt: -1 })
          .limit(3)
          .select("type status createdAt"),
        IssueReport.find({ reportedBy: employeeId })
          .sort({ createdAt: -1 })
          .limit(3)
          .select("title status createdAt"),
      ]);

      const activities = [
        ...tasks.map((t) => ({
          id: t._id,
          title: t.title,
          type: "task",
          createdAt: t.updatedAt,
          status: t.status,
        })),
        ...requests.map((r) => ({
          // Changed from leaves to requests
          id: r._id,
          title: `${r.type} Request`, // Changed from "Leave Request" to reflect request type
          type: "request", // Changed from "leave" to "request"
          createdAt: r.createdAt,
          status: r.status,
        })),
        ...issues.map((i) => ({
          id: i._id,
          title: i.title,
          type: "issueReport",
          createdAt: i.createdAt,
          status: i.status,
        })),
      ]
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 5);

      return activities;
    } catch (error) {
      throw new Error(`Error fetching recent activities: ${error.message}`);
    }
  }

  /**
   * Get list of checked-in employees with their locations
   * @returns {Promise<Array>} - List of checked-in employees
   */
  async getCheckedInEmployees() {
    try {
      const employees = await Employee.find({
        status: "checkedIn",
        "checkInLocation.latitude": { $exists: true },
        "checkInLocation.longitude": { $exists: true },
      }).select([
        "firstName",
        "lastName",
        "email",
        "job",
        "status",
        "checkInLocation",
        "updatedAt",
      ]);

      if (!employees.length) {
        return [];
      }

      return employees.map((emp) => ({
        id: emp._id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        email: emp.email,
        job: emp.job || "",
        status: emp.status,
        location: emp.checkInLocation,
        lastUpdate: emp.updatedAt,
      }));
    } catch (error) {
      throw new Error(`Error fetching checked-in employees: ${error.message}`);
    }
  }

  /**
   * Calculate employee attendance percentage
   * @param {string} employeeId - ID of the employee
   * @returns {Promise<number>} - Attendance percentage
   */
  async getAttendancePercentage(employeeId) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const checkIns = await CheckIn.countDocuments({
        employee: employeeId,
        checkInTime: { $gte: thirtyDaysAgo },
      });

      const workingDays = this.calculateWorkingDaysInPast30Days();

      return workingDays > 0 ? Math.round((checkIns / workingDays) * 100) : 0;
    } catch (error) {
      throw new Error(`Error calculating attendance: ${error.message}`);
    }
  }

  /**
   * Calculate number of working days in past 30 days
   * @returns {number} - Number of working days
   */
  calculateWorkingDaysInPast30Days() {
    return [...Array(30)].reduce((count, _, index) => {
      const date = new Date();
      date.setDate(date.getDate() - index);
      const day = date.getDay();
      // Exclude weekends (0 = Sunday, 6 = Saturday)
      return count + (day !== 0 && day !== 6 ? 1 : 0);
    }, 0);
  }

  /**
   * Upload profile picture
   * @param {Object} req - Express request object
   * @returns {Promise<string>} - URL of uploaded file
   */
  uploadProfilePicture(req) {
    return new Promise((resolve, reject) => {
      upload(req, req, async (err) => {
        if (err) {
          console.error("Upload error:", err);
          return reject(err);
        }
        if (!req.file) {
          console.error("No file in request");
          return reject(new Error("No file uploaded"));
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        resolve(fileUrl);
      });
    });
  }

  /**
   * Delete profile picture
   * @param {string} filename - Filename to delete
   * @returns {Promise<void>}
   */
  async deleteProfilePicture(filename) {
    try {
      const filePath = path.join("./uploads", filename);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (error) {
      console.error("Delete profile picture error:", error);
      throw new Error(`Error deleting profile picture: ${error.message}`);
    }
  }

  /**
   * Update employee profile picture
   * @param {string} employeeId - ID of the employee
   * @param {Object} req - Express request object
   * @returns {Promise<Object>} - Updated employee profile
   */
  async updateProfilePicture(employeeId, req) {
    try {
      const employee = await Employee.findById(employeeId);
      if (!employee) {
        throw new Error("Employee not found");
      }

      if (!req.file) {
        throw new Error("No file uploaded");
      }

      const extension = req.file.originalname.split(".").pop() || "jpg";
      const filename = `profile_pictures/${uuidv4()}.${extension}`;

      const bucket = admin.storage().bucket();
      const file = bucket.file(filename);

      await file.save(req.file.buffer, {
        metadata: { contentType: req.file.mimetype },
      });

      await file.makePublic();
      const publicUrl = file.publicUrl();

      // Delete old profile picture if exists
      if (
        employee.profilePicture &&
        employee.profilePicture.includes("profile_pictures/")
      ) {
        try {
          const oldFilename = employee.profilePicture.split("/").pop();
          const oldFile = bucket.file(`profile_pictures/${oldFilename}`);
          await oldFile.delete().catch(() => {});
        } catch (error) {
          console.warn("Could not delete old profile picture:", error.message);
          // Continue even if old file deletion fails
        }
      }

      await Employee.findByIdAndUpdate(
        employeeId,
        { profilePicture: publicUrl },
        { new: true }
      );

      return await this.getEmployeeProfile(employeeId);
    } catch (error) {
      console.error("Error updating profile picture:", error);
      throw new Error(`Error updating profile picture: ${error.message}`);
    }
  }

  /**
   * Get profile picture stream
   * @param {string} filename - Filename to retrieve
   * @returns {Promise<Stream>} - File stream
   */
  async getProfilePicture(filename) {
    try {
      // Check if using GridFS
      if (typeof gfs !== "undefined") {
        const file = await gfs.find({ filename }).toArray();
        if (!file || file.length === 0) {
          throw new Error("No image found");
        }
        return gfs.openDownloadStreamByName(filename);
      } else {
        // Check if using local filesystem
        const filePath = path.join("./uploads", filename);
        if (!fs.existsSync(filePath)) {
          throw new Error("No image found");
        }
        return fs.createReadStream(filePath);
      }
    } catch (error) {
      throw new Error(`Error retrieving profile picture: ${error.message}`);
    }
  }

  /**
   * Update employee job and other profile information
   * @param {string} employeeId - ID of the employee
   * @param {Object} updateData - Data to update (job, etc.)
   * @returns {Promise<Object>} - Updated employee
   */
  async updateEmployeeProfile(employeeId, updateData) {
    try {
      // Allow only specific fields to be updated
      const allowedUpdates = {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        job: updateData.job,
        email: updateData.email,
      };

      // Remove undefined fields
      const filteredUpdates = Object.fromEntries(
        Object.entries(allowedUpdates).filter(([_, v]) => v !== undefined)
      );

      if (Object.keys(filteredUpdates).length === 0) {
        throw new Error("No valid fields to update");
      }

      const employee = await Employee.findByIdAndUpdate(
        employeeId,
        filteredUpdates,
        { new: true, runValidators: true }
      ).select("-password -refreshToken -tokenVersion -otp -otpGeneratedAt");

      if (!employee) {
        throw new Error("Employee not found");
      }

      return employee;
    } catch (error) {
      throw new Error(`Error updating employee profile: ${error.message}`);
    }
  }

  /**
   * Update employee status
   * @param {string} employeeId - ID of the employee
   * @param {string} status - New status
   * @returns {Promise<Object>} - Updated employee
   */
  async updateEmployeeStatus(employeeId, status) {
    try {
      if (!["checkedIn", "checkedOut", "onLeave"].includes(status)) {
        throw new Error("Invalid status value");
      }

      const employee = await Employee.findByIdAndUpdate(
        employeeId,
        { status },
        { new: true }
      ).select("-password -refreshToken -tokenVersion -otp -otpGeneratedAt");

      if (!employee) {
        throw new Error("Employee not found");
      }

      return employee;
    } catch (error) {
      throw new Error(`Error updating employee status: ${error.message}`);
    }
  }
}

export default new EmployeeService();
