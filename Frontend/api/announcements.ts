import api from "./Api";

export interface Announcement {
  _id: string;
  title: string;
  description: string;
  createdBy: string;
  sendToAll: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all announcements
 */
export const getAllAnnouncements = async (): Promise<Announcement[]> => {
  const response = await api.get("/announcements");
  return response.data;
};

/**
 * Create a new announcement (HR Only)
 */
export const createAnnouncement = async (
  title: string,
  description: string,
  createdBy: string,
  sendToAll: boolean = true
): Promise<Announcement> => {
  const response = await api.post("/announcements", {
    title,
    description,
    createdBy,
    sendToAll,
  });
  return response.data;
};

/**
 * Delete an announcement (HR Only)
 */
export const deleteAnnouncement = async (
  announcementId: string
): Promise<void> => {
  await api.delete(`/announcements/${announcementId}`);
};

/**
 * Update an announcement (HR Only)
 */
export const updateAnnouncement = async (
  announcementId: string,
  updates: {
    title?: string;
    description?: string;
    sendToAll?: boolean;
  }
): Promise<Announcement> => {
  const response = await api.patch(`/announcements/${announcementId}`, updates);
  return response.data;
};

/**
 * Get announcement by ID
 */
export const getAnnouncementById = async (
  announcementId: string
): Promise<Announcement> => {
  const response = await api.get(`/announcements/${announcementId}`);
  return response.data;
};

export const getActiveAnnouncements = async (): Promise<Announcement[]> => {
  const response = await api.get("/announcements/active");
  return response.data;
};

/**
 * Get count of active announcements
 */
export const getActiveAnnouncementsCount = async (): Promise<number> => {
  const response = await api.get("/announcements/active/count");
  return response.data.count;
};
