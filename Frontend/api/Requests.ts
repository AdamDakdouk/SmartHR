// api/Requests.ts
import api from "./Api";

export type RequestType =
  | "leave"
  | "vacation"
  | "salary"
  | "equipment"
  | "other";
export type RequestStatus = "pending" | "approved" | "rejected" | "cancelled";
export type LeaveType = "sick" | "personal" | "emergency";
export type VacationType = "annual" | "unpaid";

export interface Request {
  _id: string;
  employee: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    department?: string;
    profilePicture?: string;
  };
  type: RequestType;
  status: RequestStatus;

  // Common fields
  startDate?: string;
  endDate?: string;
  reason?: string;

  // For vacation requests
  destination?: string;
  vacationType?: VacationType;

  // For leave requests
  leaveType?: LeaveType;

  // For salary requests
  currentSalary?: number;
  requestedSalary?: number;
  achievements?: string;
  justification?: string;

  // For additional information
  notes?: string;

  // For tracking review
  reviewedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  reviewedAt?: string;
  comments?: string;

  // For urgent flagging
  urgent: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Create a new request
 */
export const createRequest = async (
  employeeId: string,
  requestData: {
    type: RequestType;
    startDate?: string;
    endDate?: string;
    reason?: string;
    destination?: string;
    vacationType?: VacationType;
    leaveType?: LeaveType;
    currentSalary?: number;
    requestedSalary?: number;
    achievements?: string;
    justification?: string;
    notes?: string;
    urgent?: boolean;
  }
): Promise<Request> => {
  const response = await api.post("/requests", {
    employeeId,
    ...requestData,
  });
  return response.data;
};

/**
 * Get all requests (HR only)
 */
export const getAllRequests = async (): Promise<Request[]> => {
  const response = await api.get("/requests");
  return response.data;
};

/**
 * Get requests by type (HR only)
 */
export const getRequestsByType = async (
  type: RequestType
): Promise<Request[]> => {
  const response = await api.get(`/requests/type/${type}`);
  return response.data;
};

/**
 * Get requests for a specific employee
 */
export const getEmployeeRequests = async (
  employeeId: string
): Promise<Request[]> => {
  const response = await api.get(`/requests/employee/${employeeId}`);
  return response.data;
};

/**
 * Get requests of a specific type for a specific employee
 */
export const getEmployeeRequestsByType = async (
  employeeId: string,
  type: RequestType
): Promise<Request[]> => {
  const response = await api.get(
    `/requests/employee/${employeeId}/type/${type}`
  );
  return response.data;
};

/**
 * Get a specific request by ID
 */
export const getRequestById = async (requestId: string): Promise<Request> => {
  const response = await api.get(`/requests/${requestId}`);
  return response.data;
};

/**
 * Update request status (HR only)
 */
export const updateRequestStatus = async (
  requestId: string,
  status: RequestStatus,
  reviewerId?: string,
  comments?: string
): Promise<Request> => {
  const response = await api.patch("/requests/status", {
    requestId,
    status,
    reviewerId,
    comments,
  });
  return response.data;
};

/**
 * Get count of pending requests (dashboard stats)
 */
export const getPendingRequestsCount = async (): Promise<number> => {
  const response = await api.get("/requests/pending/count");
  return response.data.count;
};

// Helper functions for specific request types

/**
 * Submit a leave request
 */
export const submitLeaveRequest = async (
  employeeId: string,
  leaveType: LeaveType,
  startDate: string,
  endDate: string,
  reason: string,
  urgent: boolean = false
): Promise<Request> => {
  return createRequest(employeeId, {
    type: "leave",
    leaveType,
    startDate,
    endDate,
    reason,
    urgent,
  });
};

/**
 * Submit a vacation request
 */
export const submitVacationRequest = async (
  employeeId: string,
  vacationType: VacationType,
  startDate: string,
  endDate: string,
  destination?: string,
  notes?: string,
  urgent: boolean = false
): Promise<Request> => {
  return createRequest(employeeId, {
    type: "vacation",
    vacationType,
    startDate,
    endDate,
    destination,
    notes,
    urgent,
  });
};

/**
 * Submit a salary review request
 */
export const submitSalaryRequest = async (
  employeeId: string,
  currentSalary: number,
  requestedSalary: number,
  achievements: string,
  justification: string,
  urgent: boolean = false
): Promise<Request> => {
  return createRequest(employeeId, {
    type: "salary",
    currentSalary,
    requestedSalary,
    achievements,
    justification,
    urgent,
  });
};
