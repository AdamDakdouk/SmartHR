import api from "./Api";

// Dashboard statistics interface
export interface DashboardStats {
  employeeStats: {
    total: number;
    active: number;
    checkedIn: number;
    onLeave: number;
    inactive: number;
  };
  taskStats: {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
  };
  jobDistribution: {
    job: string;
    count: number;
  }[];
  recentActivities: {
    id: string;
    name: string;
    status: string;
    updatedAt: string;
  }[];
  recentLeaveRequests: {
    id: string;
    employeeId: string;
    employeeName: string;
    type: string;
    status: string;
    createdAt: string;
  }[];
}

// Attendance statistics interface
export interface AttendanceStats {
  today: {
    count: number;
    percentage: number;
  };
  yesterday: {
    count: number;
    percentage: number;
  };
  week: {
    count: number;
    dailyAverage: number;
    percentage: number;
  };
}

// Employee activation interfaces
export interface EmployeeActivationResponse {
  message: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    active: boolean;
    deactivatedAt?: string;
  };
}

/**
 * Get HR dashboard statistics
 */
export const getHRDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get("/employees/dashboard/stats");
  return response.data;
};

/**
 * Get HR dashboard attendance statistics
 */
export const getAttendanceStats = async (): Promise<AttendanceStats> => {
  const response = await api.get("/employees/dashboard/attendance");
  return response.data;
};
