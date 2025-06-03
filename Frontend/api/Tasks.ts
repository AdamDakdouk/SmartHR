import api from "./Api";

export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export interface CreateTaskPayload {
  title: string;
  description: string;
  assignedTo: string;
  dueDate: Date;
  priority?: TaskPriority;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  assignedTo?: string;
  dueDate?: Date;
  status?: TaskStatus;
  priority?: TaskPriority;
  progress?: number;
}

export const getTasksForEmployee = async () => {
  const response = await api.get(`/tasks/my-tasks`);
  return response.data;
};

export const updateTask = async (
  taskId: string,
  payload: UpdateTaskPayload
) => {
  const response = await api.put(`/tasks/${taskId}`, payload);
  return response.data;
};

export interface TaskStats {
  statusCounts: {
    pending: number;
    in_progress: number;
    completed: number;
  };
  dueToday: number;
  overdue: number;
}

export interface EmployeeDailySummary {
  tasksStats: TaskStats;
  checkInStats: {
    hoursToday: number;
    isCheckedIn: boolean;
    checkInTime?: string;
  };
}
export const updateTaskStatus = async (dto: {
  taskId: string;
  status: TaskStatus;
}) => {
  // Create a new payload that wraps the status in a JSON object
  const payload = { status: dto.status };
  const response = await api.patch(`/tasks/${dto.taskId}/status`, payload);
  return response.data;
};

export const updateTaskProgress = async (taskId: string, progress: number) => {
  const response = await api.patch(`/tasks/${taskId}/progress`, { progress });
  return response.data;
};

export const createTask = async (payload: CreateTaskPayload) => {
  const response = await api.post("/tasks", payload);
  return response.data;
};

export const deleteTask = async (taskId: string) => {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};

export const restoreTask = async (taskId: string) => {
  const response = await api.post(`/tasks/${taskId}/restore`);
  return response.data;
};

export const getDeletedTasks = async () => {
  const response = await api.get("/tasks/deleted");
  return response.data;
};

export const getTasksStats = async () => {
  const response = await api.get("/tasks/stats");
  return response.data;
};

export const getAllTasks = async () => {
  const response = await api.get("/tasks/all");
  return response.data;
};

export const getEmployeeDailySummary =
  async (): Promise<EmployeeDailySummary> => {
    const response = await api.get("/tasks/daily-summary");
    return response.data;
  };
