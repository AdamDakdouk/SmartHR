import api from "./Api";

export interface SearchResult {
  employees: EmployeeSearchResult[];
  tasks: TaskSearchResult[];
  leaveRequests: LeaveRequestSearchResult[];
  issues: IssueSearchResult[];
  announcements: AnnouncementSearchResult[];
}

export interface EmployeeSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  job?: string;
  profilePicture?: string;
  type: "employee";
}

export interface TaskSearchResult {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate: string;
  assignedTo: string;
  type: "task";
}

export interface LeaveRequestSearchResult {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: "pending" | "approved" | "rejected";
  type: "leaveRequest";
}

export interface IssueSearchResult {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "resolved";
  priority: "low" | "medium" | "high";
  reportedBy: string;
  createdAt: string;
  type: "issue";
}

export interface AnnouncementSearchResult {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: string;
  type: "announcement";
}

/**
 * Global search across all entities
 */
export const searchAll = async (query: string): Promise<SearchResult> => {
  const response = await api.get("/search", { params: { query } });
  return response.data;
};

/**
 * Search by entity type
 */
export const searchByType = async (
  type: "employees" | "tasks" | "leaveRequests" | "issues" | "announcements",
  query: string
): Promise<any[]> => {
  const response = await api.get(`/search/type/${type}`, { params: { query } });
  return response.data;
};
