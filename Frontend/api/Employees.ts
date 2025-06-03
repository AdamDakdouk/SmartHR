import api from "./Api";
import { EmployeeActivationResponse } from "./Dashboard";

// Interface definitions for TypeScript
interface EmployeeProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  job?: string;
  role: string;
  status: "checkedIn" | "checkedOut" | "onLeave";
  profilePicture?: string;
  checkInLocation?: {
    latitude: number;
    longitude: number;
  };
  joinDate: string;
}

interface Location {
  latitude: number;
  longitude: number;
}

interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
  job?: string;
}

/**
 * Fetch all employees (HR Only)
 */
export const getAllEmployees = async (): Promise<EmployeeProfile[]> => {
  const response = await api.get("/employees");
  return response.data;
};

/**
 * Fetch non-HR team members
 */
export const getTeamMembers = async (): Promise<EmployeeProfile[]> => {
  const response = await api.get("/employees/team");
  return response.data;
};

/**
 * Fetch employee profile by ID
 */
export const getEmployeeProfile = async (employeeId: string) => {
  const response = await api.get(`/employees/profile/${employeeId}`);
  return response.data;
};

/**
 * Update employee profile (job, name, etc.)
 * Primarily used by HR to set job titles
 */
export const updateEmployeeProfile = async (
  employeeId: string,
  data: ProfileUpdateData
) => {
  const response = await api.patch(`/employees/profile/${employeeId}`, data);
  return response.data;
};

/**
 * Update profile picture
 */
export const updateProfilePicture = async (
  employeeId: string,
  imageFile: File
) => {
  const formData = new FormData();
  formData.append("image", imageFile);

  const response = await api.put(
    `/employees/profile-picture/${employeeId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

/**
 * Check in employee
 */
export const checkIn = async (employeeId: string, location: Location) => {
  const response = await api.post("/employees/check-in", {
    employeeId,
    location,
  });
  return response.data;
};

/**
 * Check out employee
 */
export const checkOut = async (employeeId: string) => {
  const response = await api.post("/employees/check-out", { employeeId });
  return response.data;
};

/**
 * Update current employee's location
 */
export const updateEmployeeLocation = async (location: Location) => {
  const response = await api.post("/employees/update-location", location);
  return response.data;
};

/**
 * Update employee status
 */
export const updateEmployeeStatus = async (
  employeeId: string,
  status: "checkedIn" | "checkedOut" | "onLeave"
) => {
  const response = await api.patch(`/employees/${employeeId}/status`, {
    status,
  });
  return response.data;
};

/**
 * Get employee statistics
 */
export const getEmployeeStats = async (employeeId: string) => {
  const response = await api.get(`/employees/${employeeId}/stats`);
  return response.data;
};

/**
 * Get employee attendance percentage
 */
export const getEmployeeAttendance = async (employeeId: string) => {
  const response = await api.get(`/employees/${employeeId}/attendance`);
  return response.data;
};

/**
 * Get employee recent activities
 */
export const getEmployeeActivities = async (employeeId: string) => {
  const response = await api.get(`/employees/${employeeId}/activities`);
  return response.data;
};

/**
 * Get checked-in employees (HR Only)
 */
export const getCheckedInEmployees = async () => {
  const response = await api.get("/employees/checked-in");
  return response.data;
};

/**
 * Track specific employee location (HR Only)
 */
export const trackEmployee = async (employeeId: string) => {
  const response = await api.get(`/employees/track/${employeeId}`);
  return response.data;
};

/**
 * Get all employees including deactivated ones (HR Only)
 */
export const getAllEmployeesIncludingDeactivated = async () => {
  const response = await api.get("/employees/all");
  return response.data;
};

/**
 * Deactivate an employee (HR Only)
 */
export const deactivateEmployee = async (
  employeeId: string
): Promise<EmployeeActivationResponse> => {
  const response = await api.post(`/employees/${employeeId}/deactivate`);
  return response.data;
};

/**
 * Reactivate an employee (HR Only)
 */
export const reactivateEmployee = async (
  employeeId: string
): Promise<EmployeeActivationResponse> => {
  const response = await api.post(`/employees/${employeeId}/reactivate`);
  return response.data;
};
