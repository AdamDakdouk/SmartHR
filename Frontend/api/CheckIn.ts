import api from "./Api";

export interface Location {
  latitude: number;
  longitude: number;
  updatedAt?: string;
}

export interface CheckInResponse {
  id: string;
  checkInTime: string;
  location: Location;
}

export interface CheckInStatus {
  status: "checkedIn" | "checkedOut" | "onLeave";
  currentLocation: Location | null;
  defaultCheckInLocation: Location | null;
  lastCheckIn: string | null;
  checkInSessionLocation: Location | null;
}

export interface CheckInHistory {
  _id: string;
  checkInTime: string;
  checkOutTime: string | null;
  location: Location;
}

export interface TodayDetails {
  checkins: CheckInHistory[];
  totalHours: number;
  currentStatus: CheckInStatus;
  weeklyHours?: number;
}

/**
 * Employee checks in with current location
 */
export const checkIn = async (location: Location): Promise<CheckInResponse> => {
  const response = await api.post("/check-in/check-in", location);
  return response.data;
};

/**
 * Employee checks out
 */
export const checkOut = async (): Promise<any> => {
  const response = await api.post("/check-in/check-out");
  return response.data;
};

/**
 * Get current check-in status
 */
export const getStatus = async (): Promise<CheckInStatus> => {
  const response = await api.get("/check-in/status");
  return response.data;
};

/**
 * Get today's check-in details, including total hours
 */
export const getTodayDetails = async (): Promise<TodayDetails> => {
  const response = await api.get("/check-in/today");

  // Add weekly hours property if not present in backend response
  if (!response.data.weeklyHours) {
    response.data.weeklyHours = (response.data.totalHours * 5) / 7;
  }

  return response.data;
};

/**
 * Update employee's current location when already checked in
 */
export const updateLocation = async (location: Location): Promise<any> => {
  const response = await api.post("/check-in/update-location", location);
  console.log("Location updated:", response);
  return response.data;
};

/**
 * Get check-in history between dates
 */
export const getHistory = async (
  startDate: string,
  endDate: string
): Promise<CheckInHistory[]> => {
  const response = await api.get(
    `/check-in/history?startDate=${startDate}&endDate=${endDate}`
  );
  return response.data;
};

/**
 * Monitor location and check if employee has moved from their default location
 */
export const monitorLocation = async (location: Location): Promise<any> => {
  const response = await api.post("/check-in/monitor-location", location);
  return response.data;
};
