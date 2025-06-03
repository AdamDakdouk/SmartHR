import TaskService from "../services/Task.service.js";
import CheckInService from "../services/CheckIn.service.js";
class TaskController {
  async createTask(req, res) {
    const { title, description, assignedTo, dueDate, priority } = req.body;

    if (!title || !description || !assignedTo || !dueDate) {
      return res.status(400).json({ message: "All fields are required" });
    }

    try {
      const task = await TaskService.createTask(
        title,
        description,
        assignedTo,
        dueDate,
        req.user.id,
        priority
      );
      return res.status(201).json(task);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async updateTask(req, res) {
    const { id } = req.params;
    const updates = req.body;

    try {
      const task = await TaskService.updateTask(id, updates);
      return res.status(200).json(task);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async softDeleteTask(req, res) {
    const { id } = req.params;

    try {
      const task = await TaskService.softDeleteTask(id, req.user.id);
      return res.status(200).json(task);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getDeletedTasks(req, res) {
    try {
      const tasks = await TaskService.getDeletedTasks();
      return res.status(200).json(tasks);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async restoreTask(req, res) {
    const { id } = req.params;
    console.log(id);
    try {
      const task = await TaskService.restoreTask(id);
      return res.status(200).json(task);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getAllTasks(req, res) {
    try {
      const tasks = await TaskService.getAllTasks();
      return res.status(200).json(tasks);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getMyTasks(req, res) {
    try {
      const tasks = await TaskService.getTasksForEmployee(req.user.id);
      return res.status(200).json(tasks);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async updateTaskStatus(req, res) {
    const { id } = req.params;
    const { status } = req.body;
    console.log(status);
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    try {
      console.log(" ai am hererere");
      const task = await TaskService.updateTaskStatus(id, status, req.user.id);
      return res.status(200).json(task);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async updateTaskProgress(req, res) {
    const { id } = req.params;
    const { progress } = req.body;

    if (progress === undefined || progress < 0 || progress > 100) {
      return res
        .status(400)
        .json({ message: "Valid progress (0-100) is required" });
    }

    try {
      const task = await TaskService.updateTaskProgress(
        id,
        progress,
        req.user.id
      );
      return res.status(200).json(task);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getTasksStats(req, res) {
    try {
      const stats = await TaskService.getTasksStats();
      return res.status(200).json(stats);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getDailySummary(req, res) {
    try {
      const employeeId = req.user.id;

      // Get task stats for the employee
      const tasksStats = await TaskService.getEmployeeTasksStats(employeeId);

      // Get check-in stats for the employee for today
      const checkInStats = await CheckInService.getTodayStats(employeeId);

      return res.status(200).json({
        tasksStats,
        checkInStats,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}

export default new TaskController();
