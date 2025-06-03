// api/location.ts
import api from "./Api";

export interface Location {
  latitude: number;
  longitude: number;
  updatedAt?: string;
}

export interface CheckedInEmployee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  job?: string;
  status: string;
  location: Location;
  defaultLocation?: Location;
  lastUpdate: string;
}

export interface LocationTrackingData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  job?: string;
  status: string;
  location: Location;
  defaultLocation?: Location;
  lastUpdate: string;
}

// Default map coordinates for Lebanon
export const LEBANON_COORDINATES = {
  latitude: 33.8547,
  longitude: 35.8623,
  latitudeDelta: 2.5,
  longitudeDelta: 2.5,
};

/**
 * Get all checked-in employees with their locations (HR Only)
 */
export const getCheckedInEmployees = async (): Promise<CheckedInEmployee[]> => {
  const response = await api.get("/employees/checked-in");
  return response.data;
};

/**
 * Track specific employee location (HR Only)
 */
export const trackEmployee = async (
  employeeId: string
): Promise<LocationTrackingData> => {
  const response = await api.get(`/check-in/status?employeeId=${employeeId}`);
  return {
    ...response.data,
    lastUpdate:
      response.data.currentLocation?.updatedAt || new Date().toISOString(),
    location: response.data.currentLocation || null,
  };
};

/**
 * Update current employee's location
 */
export const updateEmployeeLocation = async (
  location: Location
): Promise<void> => {
  const response = await api.post("/check-in/update-location", location);
  return response.data;
};

/**
 * Set default check-in location for an employee (HR Only)
 */
export const setDefaultCheckInLocation = async (
  employeeId: string,
  location: Location
): Promise<void> => {
  const response = await api.post(
    `/check-in/default-location/${employeeId}`,
    location
  );
  return response.data;
};

/**
 * Monitor employee location and check if they've moved significantly from default location
 */
export const monitorLocation = async (location: Location): Promise<void> => {
  const response = await api.post("/check-in/monitor-location", location);
  return response.data;
};

/**
 * Get employee location history between dates (HR Only)
 */
export const getLocationHistory = async (
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<any> => {
  const response = await api.get(
    `/check-in/history?employeeId=${employeeId}&startDate=${startDate}&endDate=${endDate}`
  );
  return response.data;
};
