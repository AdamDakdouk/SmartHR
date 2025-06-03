import api from "./Api";

// Interface definitions for issues
export interface Issue {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeDepartment?: string;
  description: string;
  status: "open" | "inProgress" | "resolved";
  priority: "low" | "medium" | "high" | "critical";
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

/**
 * Get all issues (HR Only)
 */
export const getAllIssues = async (): Promise<Issue[]> => {
  const response = await api.get("/issues");
  return response.data;
};

/**
 * Report a new issue (Employee)
 */
export const reportIssue = async (
  employeeId: string,
  description: string,
  priority: "low" | "medium" | "high" | "critical" = "high"
): Promise<Issue> => {
  const response = await api.post("/issues", {
    employeeId,
    description,
    priority,
  });
  return response.data;
};

/**
 * Update issue status (HR Only)
 */
export const updateIssueStatus = async (
  issueId: string,
  status: "open" | "inProgress" | "resolved"
): Promise<Issue> => {
  const response = await api.patch(`/issues/${issueId}/status`, {
    status,
  });
  return response.data;
};

/**
 * Resolve an issue (HR Only)
 */
export const resolveIssue = async (issueId: string): Promise<Issue> => {
  const response = await api.patch("/issues/resolve", {
    issueId,
  });
  return response.data;
};

/**
 * Get issue by ID
 */
export const getIssueById = async (issueId: string): Promise<Issue> => {
  const response = await api.get(`/issues/${issueId}`);
  return response.data;
};

/**
 * Get issues by employee ID (for employee to see their own issues)
 */
export const getIssuesByEmployee = async (
  employeeId: string
): Promise<Issue[]> => {
  const response = await api.get(`/issues/employee/${employeeId}`);
  return response.data;
};

export const getOpenIssuesCount = async (): Promise<number> => {
  const response = await api.get("/issues/open/count");
  return response.data.count;
};

/**
 * Get issues by status
 */
export const getIssuesByStatus = async (
  status:
    | "open"
    | "inProgress"
    | "resolved"
    | Array<"open" | "inProgress" | "resolved">
): Promise<Issue[]> => {
  // Convert single status to array for consistent handling
  const statusArray = Array.isArray(status) ? status : [status];

  // Create query string
  const statusQuery = statusArray.map((s) => `status=${s}`).join("&");

  const response = await api.get(`/issues/status?${statusQuery}`);
  return response.data;
};
