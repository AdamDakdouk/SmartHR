// api/notifications.ts
import api from "./Api";

export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_STATUS_UPDATE"
  | "TASK_UPDATE"
  | "TASK_DELETED"
  | "TASK_RESTORED"
  | "ANNOUNCEMENT"
  | "ISSUE_REPORTED"
  | "ISSUE_STATUS_UPDATE"
  | "LEAVE_REQUEST_SUBMITTED"
  | "LEAVE_REQUEST_STATUS_UPDATE"
  | "VACATION_REQUEST_SUBMITTED"
  | "VACATION_REQUEST_STATUS_UPDATE"
  | "SALARY_REQUEST_SUBMITTED"
  | "SALARY_REQUEST_STATUS_UPDATE"
  | "EQUIPMENT_REQUEST_SUBMITTED"
  | "EQUIPMENT_REQUEST_STATUS_UPDATE"
  | "OTHER_REQUEST_SUBMITTED"
  | "OTHER_REQUEST_STATUS_UPDATE"
  | "CHECK_IN_SUCCESS"
  | "CHECK_OUT_SUCCESS"
  | "CHECK_IN_REMINDER"
  | "SYSTEM";

export interface INotification {
  _id: string;
  recipient: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  expiresAt: string;
  relatedId?: string;
  relatedModel?:
    | "Task"
    | "Announcement"
    | "Issue"
    | "LeaveRequest"
    | "Request"
    | "CheckIn";
}

export interface NotificationResponse {
  data: INotification[];
}

export interface UnreadCountResponse {
  data: {
    count: number;
  };
}

export const getNotifications = async (): Promise<NotificationResponse> => {
  const res = await api.get("/notifications");
  return res;
};

export const getUnreadCount = async (): Promise<UnreadCountResponse> => {
  const res = await api.get("/notifications/unread-count");
  return res;
};

export const markNotificationAsRead = async (
  notificationId: string
): Promise<INotification> => {
  const res = await api.patch(`/notifications/${notificationId}/mark-read`);
  return res.data;
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await api.patch("/notifications/mark-all-read");
};
