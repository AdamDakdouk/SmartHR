import EmployeeService from "../services/Employee.service.js";
import HRDashboardService from "../services/HRDashboard.service.js";
/**
 * Employee Controller
 * Handles HTTP requests related to employees
 */
class EmployeeController {
  /**
   * Get all employees (HR only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getEmployees(req, res) {
    try {
      const requestingUserId = req.user.id;
      const employees = await EmployeeService.getEmployees(requestingUserId);
      return res.status(200).json(employees);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get all non-HR employees (Team members)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getNonHREmployees(req, res) {
    try {
      const requestingUserId = req.user.id;
      const employees = await EmployeeService.getNonHREmployees(
        requestingUserId
      );
      return res.status(200).json(employees);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get detailed employee profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getEmployeeProfile(req, res) {
    try {
      const employee = await EmployeeService.getEmployeeProfile(req.params.id);
      return res.status(200).json(employee);
    } catch (error) {
      return res.status(404).json({ message: error.message });
    }
  }

  /**
   * Update employee profile information
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateEmployeeProfile(req, res) {
    try {
      const { id } = req.params;
      const { firstName, lastName, email, job } = req.body;

      // Require at least one field to update
      if (!firstName && !lastName && !email && !job) {
        return res.status(400).json({
          message:
            "At least one field (firstName, lastName, email, job) is required",
        });
      }

      const employee = await EmployeeService.updateEmployeeProfile(id, {
        firstName,
        lastName,
        email,
        job,
      });

      return res.status(200).json(employee);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Check in employee
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async checkIn(req, res) {
    const { employeeId, location } = req.body;

    if (!employeeId || !location) {
      return res.status(400).json({
        message: "Employee ID and location are required",
      });
    }

    try {
      const checkIn = await EmployeeService.checkIn(employeeId, location);
      return res.status(200).json(checkIn);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Check out employee
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async checkOut(req, res) {
    const { employeeId } = req.body;

    if (!employeeId) {
      return res.status(400).json({ message: "Employee ID is required" });
    }

    try {
      const checkOut = await EmployeeService.checkOut(employeeId);
      return res.status(200).json(checkOut);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Upload profile picture
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async uploadProfilePicture(req, res) {
    try {
      const pictureUrl = await EmployeeService.uploadProfilePicture(req);
      return res.status(200).json({ url: pictureUrl });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Update profile picture
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateProfilePicture(req, res) {
    try {
      const { id } = req.params;

      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      const updatedProfile = await EmployeeService.updateProfilePicture(
        id,
        req
      );
      return res.status(200).json(updatedProfile);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get profile picture
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getProfilePicture(req, res) {
    try {
      const stream = await EmployeeService.getProfilePicture(
        req.params.filename
      );
      stream.pipe(res);
    } catch (error) {
      return res.status(404).json({ message: error.message });
    }
  }

  /**
   * Update employee status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateEmployeeStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }

      const employee = await EmployeeService.updateEmployeeStatus(id, status);
      return res.status(200).json(employee);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Update check-in location
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateCheckInLocation(req, res) {
    try {
      const { id } = req.params;
      const { location } = req.body;

      if (!location || !location.latitude || !location.longitude) {
        return res.status(400).json({ message: "Valid location is required" });
      }

      const employee = await EmployeeService.updateCheckInLocation(
        id,
        location
      );
      return res.status(200).json(employee);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get all checked-in employees
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getCheckedInEmployees(req, res) {
    try {
      const checkedInEmployees = await EmployeeService.getCheckedInEmployees();
      return res.status(200).json(checkedInEmployees);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Update employee location
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async updateEmployeeLocation(req, res) {
    try {
      const { latitude, longitude } = req.body;
      const employeeId = req.user.id;

      if (!latitude || !longitude) {
        return res.status(400).json({
          message: "Latitude and longitude are required",
        });
      }

      const updatedEmployee = await EmployeeService.updateEmployeeLocation(
        employeeId,
        { latitude, longitude }
      );
      return res.status(200).json(updatedEmployee);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Track employee location
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async trackEmployee(req, res) {
    try {
      const { id } = req.params;
      const employeeLocation = await EmployeeService.getEmployeeLocation(id);
      return res.status(200).json(employeeLocation);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get employee stats
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getEmployeeStats(req, res) {
    try {
      const { id } = req.params;
      const stats = await EmployeeService.getEmployeeStats(id);
      return res.status(200).json(stats);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get employee recent activities
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getRecentActivities(req, res) {
    try {
      const { id } = req.params;
      const activities = await EmployeeService.getRecentActivities(id);
      return res.status(200).json(activities);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get employee attendance percentage
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAttendancePercentage(req, res) {
    try {
      const { id } = req.params;
      const attendance = await EmployeeService.getAttendancePercentage(id);
      return res.status(200).json({ attendance });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get all employees including deactivated ones (HR only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllEmployeesIncludingDeactivated(req, res) {
    try {
      const requestingUserId = req.user.id;
      const employees =
        await EmployeeService.getAllEmployeesIncludingDeactivated(
          requestingUserId
        );
      return res.status(200).json(employees);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Deactivate an employee
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async deactivateEmployee(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Employee ID is required" });
      }

      const result = await EmployeeService.deactivateEmployee(id);
      return res.status(200).json({
        message: "Employee deactivated successfully",
        employee: result,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Reactivate an employee
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async reactivateEmployee(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ message: "Employee ID is required" });
      }

      const result = await EmployeeService.reactivateEmployee(id);
      return res.status(200).json({
        message: "Employee reactivated successfully",
        employee: result,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
  /**
   * Get HR dashboard statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getHRDashboardStats(req, res) {
    try {
      const dashboardStats = await HRDashboardService.getHRDashboardStats();
      return res.status(200).json(dashboardStats);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  /**
   * Get attendance statistics for the HR dashboard
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAttendanceStats(req, res) {
    try {
      const attendanceStats = await HRDashboardService.getAttendanceStats();
      return res.status(200).json(attendanceStats);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default new EmployeeController();
