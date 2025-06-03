// services/Task.service.js
import Task from "../models/Task.js";
import Employee from "../models/Employee.js";
import NotificationService from "./Notification.service.js";
import mongoose from "mongoose";

class TaskService {
  async createTask(
    title,
    description,
    assignedTo,
    dueDate,
    createdBy,
    priority = "medium"
  ) {
    try {
      const task = await Task.create({
        title,
        description,
        assignedTo,
        dueDate,
        createdBy,
        priority,
        status: "pending",
        progress: 0,
      });

      const [assignedEmployee, creatorEmployee] = await Promise.all([
        Employee.findById(assignedTo),
        Employee.findById(createdBy),
      ]);

      await NotificationService.createNotificationWithHR({
        employeeId: assignedTo,
        title: "New Task Assigned",
        message: `You have been assigned a new task: ${title}\nDue Date: ${new Date(
          dueDate
        ).toLocaleDateString()}`,
        hrTitle: "New Task Created",
        hrMessage: `${creatorEmployee.firstName} ${
          creatorEmployee.lastName
        } assigned a task to ${assignedEmployee.firstName} ${
          assignedEmployee.lastName
        }\nTask: ${title}\nDue Date: ${new Date(dueDate).toLocaleDateString()}`,
        type: "TASK_ASSIGNED",
        relatedId: task._id,
        relatedModel: "Task",
      });

      return await task.populate(["assignedTo", "createdBy"]);
    } catch (error) {
      throw new Error("Error creating task: " + error.message);
    }
  }

  async updateTask(taskId, updates) {
    try {
      // Validate updates
      if (
        updates.progress !== undefined &&
        (updates.progress < 0 || updates.progress > 100)
      ) {
        throw new Error("Progress must be between 0 and 100");
      }

      const task = await Task.findById(taskId).populate([
        "assignedTo",
        "createdBy",
      ]);
      if (!task) {
        throw new Error("Task not found");
      }

      // Track what changed for notifications
      const changes = [];
      if (updates.title && updates.title !== task.title) changes.push("title");
      if (updates.description && updates.description !== task.description)
        changes.push("description");
      if (
        updates.dueDate &&
        new Date(updates.dueDate).getTime() !== new Date(task.dueDate).getTime()
      )
        changes.push("dueDate");
      if (updates.priority && updates.priority !== task.priority)
        changes.push("priority");
      if (
        updates.assignedTo &&
        updates.assignedTo !== task.assignedTo.toString()
      )
        changes.push("assignedTo");

      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        { ...updates },
        { new: true }
      ).populate(["assignedTo", "createdBy"]);

      // Handle notifications for different types of updates
      const notifications = [];

      if (changes.includes("assignedTo")) {
        const newAssignee = await Employee.findById(updates.assignedTo);
        notifications.push(
          NotificationService.createNotificationWithHR({
            employeeId: updates.assignedTo,
            title: "Task Reassigned",
            message: `You have been assigned to the task: ${
              updatedTask.title
            }\nDue Date: ${new Date(updatedTask.dueDate).toLocaleDateString()}`,
            hrTitle: "Task Reassignment",
            hrMessage: `Task "${updatedTask.title}" has been reassigned to ${newAssignee.firstName} ${newAssignee.lastName}`,
            type: "TASK_ASSIGNED",
            relatedId: taskId,
            relatedModel: "Task",
          })
        );
      }

      if (changes.length > 0 && !changes.includes("assignedTo")) {
        notifications.push(
          NotificationService.createNotification({
            recipientId: updatedTask.assignedTo._id,
            title: "Task Updated",
            message: `The following was updated in your task "${
              updatedTask.title
            }": ${changes.join(", ")}`,
            type: "TASK_UPDATE",
            relatedId: taskId,
            relatedModel: "Task",
          })
        );
      }

      await Promise.all(notifications);

      return updatedTask;
    } catch (error) {
      throw new Error("Error updating task: " + error.message);
    }
  }

  async getTasksForEmployee(employeeId) {
    try {
      const tasks = await Task.find({ assignedTo: employeeId })
        .populate(["assignedTo", "createdBy"])
        .sort({ dueDate: 1 });
      return tasks;
    } catch (error) {
      throw new Error("Error fetching tasks for employee: " + error.message);
    }
  }

  async updateTaskStatus(taskId, status, employeeId) {
    try {
      if (!["pending", "in_progress", "completed"].includes(status)) {
        throw new Error("Invalid status value");
      }

      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error("Task not found");
      }

      // Only assignee can update status
      if (task.assignedTo.toString() !== employeeId) {
        throw new Error("Unauthorized to update this task's status");
      }

      const updates = {
        status,
        progress: status === "completed" ? 100 : task.progress,
      };

      const updatedTask = await Task.findByIdAndUpdate(taskId, updates, {
        new: true,
      }).populate(["assignedTo", "createdBy"]);

      const statusMessages = {
        pending: "put on hold",
        in_progress: "started working on",
        completed: "completed",
      };

      await NotificationService.createNotificationWithHR({
        employeeId: updatedTask.createdBy._id,
        title: "Task Status Updated",
        message: `${updatedTask.assignedTo.firstName} ${updatedTask.assignedTo.lastName} has ${statusMessages[status]} the task: ${updatedTask.title}`,
        hrTitle: "Task Status Change",
        hrMessage: `${updatedTask.assignedTo.firstName} ${updatedTask.assignedTo.lastName} has ${statusMessages[status]} the task: ${updatedTask.title}`,
        type: "TASK_STATUS_UPDATE",
        relatedId: taskId,
        relatedModel: "Task",
      });

      return updatedTask;
    } catch (error) {
      throw new Error("Error updating task status: " + error.message);
    }
  }

  async updateTaskProgress(taskId, progress, employeeId) {
    try {
      if (progress < 0 || progress > 100) {
        throw new Error("Progress must be between 0 and 100");
      }

      const task = await Task.findById(taskId);
      if (!task) {
        throw new Error("Task not found");
      }

      // Only assignee can update progress
      if (task.assignedTo.toString() !== employeeId) {
        throw new Error("Unauthorized to update this task's progress");
      }

      const updates = {
        progress,
        status: progress === 100 ? "completed" : task.status,
      };

      const updatedTask = await Task.findByIdAndUpdate(taskId, updates, {
        new: true,
      }).populate(["assignedTo", "createdBy"]);

      await NotificationService.createNotification({
        recipientId: updatedTask.createdBy._id,
        title: "Task Progress Updated",
        message: `${updatedTask.assignedTo.firstName} ${updatedTask.assignedTo.lastName} has updated the progress of task "${updatedTask.title}" to ${progress}%`,
        type: "TASK_UPDATE",
        relatedId: taskId,
        relatedModel: "Task",
      });

      return updatedTask;
    } catch (error) {
      throw new Error("Error updating task progress: " + error.message);
    }
  }

  async softDeleteTask(taskId, deletedBy) {
    try {
      const task = await Task.findByIdAndUpdate(
        taskId,
        {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy,
        },
        { new: true }
      ).populate(["assignedTo", "createdBy", "deletedBy"]);

      if (!task) {
        throw new Error("Task not found");
      }

      await NotificationService.createNotificationWithHR({
        employeeId: task.assignedTo._id,
        title: "Task Deleted",
        message: `The task "${task.title}" has been deleted`,
        hrTitle: "Task Deleted",
        hrMessage: `Task "${task.title}" assigned to ${task.assignedTo.firstName} ${task.assignedTo.lastName} has been deleted by ${task.deletedBy.firstName} ${task.deletedBy.lastName}`,
        type: "TASK_DELETED",
        relatedId: taskId,
        relatedModel: "Task",
      });

      return task;
    } catch (error) {
      throw new Error("Error deleting task: " + error.message);
    }
  }

  async restoreTask(taskId) {
    try {
      // Find the task directly using the model to bypass the middleware
      // The Model.collection.findOne approach bypasses Mongoose middleware
      const taskExists = await Task.collection.findOne({
        _id: new mongoose.Types.ObjectId(taskId),
        isDeleted: true,
      });

      if (!taskExists) {
        throw new Error("Deleted task not found");
      }

      // Bypass the middleware by using the updateOne method on the collection
      await Task.collection.updateOne(
        { _id: new mongoose.Types.ObjectId(taskId) },
        {
          $set: {
            isDeleted: false,
            deletedAt: null,
            deletedBy: null,
          },
        }
      );

      // Now fetch the updated task
      const task = await Task.findById(taskId).populate([
        "assignedTo",
        "createdBy",
      ]);

      if (!task) {
        throw new Error("Failed to retrieve updated task");
      }

      await NotificationService.createNotificationWithHR({
        employeeId: task.assignedTo._id,
        title: "Task Restored",
        message: `The task "${task.title}" has been restored`,
        hrTitle: "Task Restored",
        hrMessage: `Task "${task.title}" assigned to ${task.assignedTo.firstName} ${task.assignedTo.lastName} has been restored`,
        type: "TASK_RESTORED",
        relatedId: taskId,
        relatedModel: "Task",
      });

      return task;
    } catch (error) {
      throw new Error("Error restoring task: " + error.message);
    }
  }

  async getDeletedTasks() {
    try {
      return await Task.find({ isDeleted: true })
        .populate({
          path: "assignedTo",
          select: "_id firstName lastName email role",
        })
        .populate({
          path: "createdBy",
          select: "firstName lastName email role",
        })
        .populate({
          path: "deletedBy",
          select: "firstName lastName email role",
        })
        .sort({ deletedAt: -1 });
    } catch (error) {
      throw new Error("Error fetching deleted tasks: " + error.message);
    }
  }

  // Existing methods with updated isDeleted filter
  async getAllTasks() {
    try {
      return await Task.find().populate(["assignedTo", "createdBy"]);
    } catch (error) {
      throw new Error("Error fetching all tasks: " + error.message);
    }
  }

  async getTasksStats() {
    try {
      const [statusCounts, tasksToday, overdueTasks] = await Promise.all([
        Task.aggregate([
          { $match: { isDeleted: false } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]),
        Task.countDocuments({
          isDeleted: false,
          dueDate: {
            $gte: new Date(new Date().setHours(0, 0, 0, 0)),
            $lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        }),
        Task.countDocuments({
          isDeleted: false,
          dueDate: { $lt: new Date() },
          status: { $ne: "completed" },
        }),
      ]);

      const formattedStatusCounts = {
        pending: 0,
        in_progress: 0,
        completed: 0,
      };

      statusCounts.forEach(({ _id, count }) => {
        formattedStatusCounts[_id] = count;
      });

      return {
        statusCounts: formattedStatusCounts,
        dueToday: tasksToday,
        overdue: overdueTasks,
      };
    } catch (error) {
      throw new Error("Error getting tasks stats: " + error.message);
    }
  }

  async getEmployeeTasksStats(employeeId) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const [statusCounts, tasksToday, overdueTasks] = await Promise.all([
        Task.aggregate([
          {
            $match: {
              assignedTo: new mongoose.Types.ObjectId(employeeId),
              isDeleted: false,
            },
          },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ]),
        Task.countDocuments({
          assignedTo: employeeId,
          isDeleted: false,
          dueDate: {
            $gte: today,
            $lt: tomorrow,
          },
          status: { $ne: "completed" },
        }),
        Task.countDocuments({
          assignedTo: employeeId,
          isDeleted: false,
          dueDate: { $lt: today },
          status: { $ne: "completed" },
        }),
      ]);

      const formattedStatusCounts = {
        pending: 0,
        in_progress: 0,
        completed: 0,
      };

      statusCounts.forEach(({ _id, count }) => {
        if (_id in formattedStatusCounts) {
          formattedStatusCounts[_id] = count;
        }
      });

      return {
        statusCounts: formattedStatusCounts,
        dueToday: tasksToday,
        overdue: overdueTasks,
      };
    } catch (error) {
      throw new Error("Error getting employee tasks stats: " + error.message);
    }
  }
}

export default new TaskService();
