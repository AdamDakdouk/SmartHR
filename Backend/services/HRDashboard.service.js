import Employee from "../models/Employee.js";
import Task from "../models/Task.js";
import Request from "../models/Request.js"; // Updated import
import CheckIn from "../models/CheckingSchema.js";

/**
 * HR Dashboard Service
 * Handles all business logic related to HR dashboard
 */
class HRDashboardService {
  /**
   * Get comprehensive HR dashboard statistics
   * @returns {Promise<Object>} - Dashboard statistics
   */
  async getHRDashboardStats() {
    try {
      // Get employee statistics
      const [
        totalEmployees,
        activeEmployees,
        checkedInEmployees,
        onLeaveEmployees,
      ] = await Promise.all([
        Employee.countDocuments({}), // All employees (including inactive)
        Employee.countDocuments({ active: true }), // Only active employees
        Employee.countDocuments({ status: "checkedIn", active: true }),
        Employee.countDocuments({ status: "onLeave", active: true }),
      ]);

      // Get job distribution (only for active employees)
      const jobDistribution = await Employee.aggregate([
        {
          $match: {
            active: true,
            job: { $exists: true, $ne: "" },
          },
        },
        {
          $group: {
            _id: "$job",
            count: { $sum: 1 },
          },
        },
        {
          $sort: {
            count: -1,
          },
        },
      ]);

      // Get recent employee activities (status changes, etc.)
      const recentActivities = await Employee.find()
        .sort({ updatedAt: -1 })
        .limit(5)
        .select("firstName lastName status updatedAt");

      // Get recent requests (formerly leave requests)
      const recentRequests = await Request.find() // Changed from recentLeaveRequests to recentRequests
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("employee", "firstName lastName")
        .select("type status createdAt employee");

      // Get task statistics
      const taskStats = await Task.aggregate([
        {
          $match: {
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      // Process task stats into a more usable format
      const taskCounts = {
        total: 0,
        pending: 0,
        in_progress: 0,
        completed: 0,
      };

      taskStats.forEach((stat) => {
        if (stat._id === "pending") taskCounts.pending = stat.count;
        if (stat._id === "in_progress") taskCounts.in_progress = stat.count;
        if (stat._id === "completed") taskCounts.completed = stat.count;
        taskCounts.total += stat.count;
      });

      // Format the results
      return {
        employeeStats: {
          total: totalEmployees,
          active: activeEmployees,
          checkedIn: checkedInEmployees,
          onLeave: onLeaveEmployees,
          inactive: totalEmployees - activeEmployees,
        },
        taskStats: taskCounts,
        jobDistribution: jobDistribution.map((item) => ({
          job: item._id,
          count: item.count,
        })),
        recentActivities: recentActivities.map((emp) => ({
          id: emp._id,
          name: `${emp.firstName} ${emp.lastName}`,
          status: emp.status,
          updatedAt: emp.updatedAt,
        })),
        recentRequests: recentRequests.map((request) => ({
          // Changed from recentLeaveRequests to recentRequests
          id: request._id,
          employeeId: request.employee?._id,
          employeeName: request.employee
            ? `${request.employee.firstName} ${request.employee.lastName}`
            : "Unknown Employee",
          type: request.type,
          status: request.status,
          createdAt: request.createdAt,
        })),
      };
    } catch (error) {
      throw new Error(`Error fetching dashboard stats: ${error.message}`);
    }
  }

  /**
   * Get attendance statistics for HR dashboard
   * @returns {Promise<Object>} - Attendance statistics
   */
  async getAttendanceStats() {
    try {
      // Get start of today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get start of yesterday
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      // Get start of last week
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);

      // Get check-ins for various time periods
      const [todayCheckIns, yesterdayCheckIns, weekCheckIns] =
        await Promise.all([
          CheckIn.countDocuments({
            checkInTime: { $gte: today },
          }),
          CheckIn.countDocuments({
            checkInTime: { $gte: yesterday, $lt: today },
          }),
          CheckIn.countDocuments({
            checkInTime: { $gte: lastWeek },
          }),
        ]);

      // Get employee count for percentage calculations
      const activeEmployees = await Employee.countDocuments({ active: true });

      return {
        today: {
          count: todayCheckIns,
          percentage:
            activeEmployees > 0
              ? Math.round((todayCheckIns / activeEmployees) * 100)
              : 0,
        },
        yesterday: {
          count: yesterdayCheckIns,
          percentage:
            activeEmployees > 0
              ? Math.round((yesterdayCheckIns / activeEmployees) * 100)
              : 0,
        },
        week: {
          count: weekCheckIns,
          dailyAverage: Math.round(weekCheckIns / 7),
          percentage:
            activeEmployees > 0
              ? Math.round((weekCheckIns / (activeEmployees * 7)) * 100)
              : 0,
        },
      };
    } catch (error) {
      throw new Error(`Error fetching attendance stats: ${error.message}`);
    }
  }
}

export default new HRDashboardService();
