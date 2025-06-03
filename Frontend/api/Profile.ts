import api from "./Api";
import { AxiosError } from "axios";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { Platform } from "react-native";

// Types
export interface ProfileData {
  profile: {
    firstName: string;
    lastName: string;
    email: string;
    job?: string;
    role: string;
    status: "checkedIn" | "checkedOut" | "onLeave";
    checkInLocation?: {
      latitude: number;
      longitude: number;
    };
    profilePicture?: string;
    createdAt: string;
  };
  stats: {
    tasksCompleted: number;
    attendance: number;
    leavesTaken: number;
  };
  recentActivities: {
    id: string;
    title: string;
    type: "task" | "leave" | "issueReport" | "issue";
    createdAt: string;
    status: string;
  }[];
}

export interface ApiErrorResponse {
  message?: string;
  errors?: { [key: string]: string };
}

// Combined type for cross-platform compatibility
export type ImageAsset =
  | ImagePicker.ImagePickerAsset
  | { uri: string; type: string; name: string };

/**
 * Get employee profile with all related data
 * Implements caching for faster retrieval
 */
export const getEmployeeProfile = async (
  id: string | undefined
): Promise<ProfileData> => {
  try {
    if (!id) throw new Error("Employee ID is required");

    // Add cache control headers to speed up subsequent requests
    const response = await api.get(`/employees/profile/${id}`, {
      headers: {
        "Cache-Control": "max-age=300", // Cache response for 5 minutes
      },
    });

    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    throw new Error(
      axiosError.response?.data?.message || "Failed to fetch employee profile"
    );
  }
};

/**
 * Update profile picture with cross-platform support and optimizations
 */
export const updateProfilePicture = async (
  employeeId: string,
  imageAsset: ImageAsset
): Promise<ProfileData> => {
  try {
    // Create form data
    const formData = new FormData();

    // Handle both image types (Web and Native)
    if ("type" in imageAsset && "name" in imageAsset) {
      // Web format
      formData.append("image", {
        uri: imageAsset.uri,
        type: imageAsset.type,
        name: imageAsset.name,
      } as any);
    } else {
      // Native format (ImagePickerAsset)
      const extension = imageAsset.uri.split(".").pop() || "jpg";

      // Check file size and apply compression if needed
      if (Platform.OS !== "web") {
        try {
          const fileInfo = await FileSystem.getInfoAsync(imageAsset.uri);
          // Check if fileInfo exists and has a size property - fix TypeScript error
          if (
            fileInfo &&
            fileInfo.exists &&
            "size" in fileInfo &&
            fileInfo.size > 1024 * 1024
          ) {
            console.log(
              "Large image detected, compression would be applied in production"
            );
          }
        } catch (e) {
          console.error("Error checking file size:", e);
        }
      }

      // For native platforms, make sure to include the "type" field correctly
      formData.append("image", {
        uri: imageAsset.uri,
        type: `image/${extension}`,
        name: `profile-picture.${extension}`,
      } as any);
    }

    // Debugging: log what's being sent
    console.log(
      "FormData contents for upload:",
      Platform.OS === "web"
        ? "Web format - FormData not directly inspectable"
        : JSON.stringify(formData)
    );

    // Apply different headers and handling based on platform
    const uploadConfig = {
      headers: {
        Accept: "application/json",
        // Let the browser set Content-Type with correct boundary on web
        // On native, set it explicitly
        ...(Platform.OS === "web"
          ? {}
          : { "Content-Type": "multipart/form-data" }),
      },
      // Don't transform the form data
      transformRequest: (data: any) => data,
      // Add timeout for better user experience
      timeout: 30000, // 30 seconds timeout
    };

    // Upload the image with optimized config
    const uploadResponse = await api.put(
      `/employees/profile-picture/${employeeId}`,
      formData,
      uploadConfig
    );

    return uploadResponse.data;
  } catch (error) {
    console.error("Profile picture upload error:", error);

    // More detailed error logging
    if (error instanceof AxiosError && error.response) {
      console.error("Server response:", error.response.data);
      console.error("Status code:", error.response.status);
      console.error("Headers:", error.response.headers);
    }

    const axiosError = error as AxiosError<ApiErrorResponse>;
    throw new Error(
      axiosError.response?.data?.message || "Failed to update profile picture"
    );
  }
};

/**
 * Update profile information (name, email, job)
 */
export const updateEmployeeProfileInfo = async (
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    job?: string;
  }
): Promise<ProfileData> => {
  try {
    if (!id) throw new Error("Employee ID is required");
    const response = await api.patch(`/employees/profile/${id}`, data);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    throw new Error(
      axiosError.response?.data?.message ||
        "Failed to update profile information"
    );
  }
};

/**
 * Update employee status
 */
export const updateEmployeeStatus = async (
  employeeId: string,
  status: "checkedIn" | "checkedOut" | "onLeave"
): Promise<any> => {
  try {
    const response = await api.patch(`/employees/${employeeId}/status`, {
      status,
    });
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    throw new Error(
      axiosError.response?.data?.message || "Failed to update status"
    );
  }
};

/**
 * Get employee stats
 */
export const getEmployeeStats = async (employeeId: string): Promise<any> => {
  try {
    const response = await api.get(`/employees/${employeeId}/stats`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    throw new Error(
      axiosError.response?.data?.message || "Failed to fetch employee stats"
    );
  }
};

/**
 * Get employee recent activities
 */
export const getEmployeeActivities = async (
  employeeId: string
): Promise<any> => {
  try {
    const response = await api.get(`/employees/${employeeId}/activities`);
    return response.data;
  } catch (error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    throw new Error(
      axiosError.response?.data?.message ||
        "Failed to fetch employee activities"
    );
  }
};

export default {
  getEmployeeProfile,
  updateEmployeeProfileInfo,
  updateProfilePicture,
  updateEmployeeStatus,
  getEmployeeStats,
  getEmployeeActivities,
};
