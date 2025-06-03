// services/backgroundLocationService.ts
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { monitorLocation, updateLocation } from "@/api/CheckIn";

const BACKGROUND_LOCATION_TASK = "background-location-task";
const BACKGROUND_FETCH_TASK = "background-fetch-task";
const LOCATION_TRACKING_STATUS = "location-tracking-status";

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Define the background location task
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error("Background location task error:", error);
    return;
  }

  if (!data) return;

  // Extract location data
  const { locations } = data as { locations: Location.LocationObject[] };
  const location = locations[0];

  if (location) {
    try {
      // Check if tracking is active
      const isTrackingActive = await AsyncStorage.getItem(
        LOCATION_TRACKING_STATUS
      );

      if (isTrackingActive === "true") {
        // Send location update to server
        const locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        // Update location on server
        await updateLocation(locationData);

        // Monitor location for any significant changes from default location
        const monitorResponse = await monitorLocation(locationData);

        // If employee has moved from default location, send notification
        if (monitorResponse && monitorResponse.locationChanged) {
          await sendLocationChangeNotification(
            monitorResponse.distance,
            monitorResponse.currentLocation
          );
        }
      }
    } catch (err) {
      console.error("Error updating location in background:", err);
    }
  }

  return BackgroundFetch.BackgroundFetchResult.NewData;
});

// Define the background fetch task for periodic checks
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    // Check if tracking is active
    const isTrackingActive = await AsyncStorage.getItem(
      LOCATION_TRACKING_STATUS
    );

    if (isTrackingActive === "true") {
      // Get current location
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status === "granted") {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        // Send location update to server
        const locationData = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        // Update location on server
        await updateLocation(locationData);

        // Monitor location for any significant changes from default location
        const monitorResponse = await monitorLocation(locationData);

        // If employee has moved from default location, send notification
        if (monitorResponse && monitorResponse.locationChanged) {
          await sendLocationChangeNotification(
            monitorResponse.distance,
            monitorResponse.currentLocation
          );
        }
      }
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (err) {
    console.error("Error in background fetch task:", err);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Send a notification when employee location changes
async function sendLocationChangeNotification(
  distance: number,
  location: { latitude: number; longitude: number }
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Employee Location Change",
      body: `An employee has moved ${distance.toFixed(
        2
      )}km from their default location`,
      data: { location },
    },
    trigger: null, // Immediate notification
  });
}

// Start background location tracking
export const startBackgroundLocationTracking = async (): Promise<boolean> => {
  try {
    // Request permissions
    const { status: foregroundStatus } =
      await Location.requestForegroundPermissionsAsync();

    if (foregroundStatus !== "granted") {
      console.log("Foreground location permission denied");
      return false;
    }

    // For background tracking on mobile devices
    if (Platform.OS !== "web") {
      const { status: backgroundStatus } =
        await Location.requestBackgroundPermissionsAsync();

      if (backgroundStatus === "granted") {
        // Start background location updates
        await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5 * 60 * 1000, // 5 minutes
          distanceInterval: 100, // 100 meters
          foregroundService: {
            notificationTitle: "Location Tracking",
            notificationBody: "Your location is being monitored",
            notificationColor: "#4630EB",
          },
        });

        console.log("Background location tracking started");
      } else {
        console.log("Background location permission denied");
      }
    }

    // Register background fetch
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60, // 15 minutes
      stopOnTerminate: false,
      startOnBoot: true,
    });

    // Save tracking status
    await AsyncStorage.setItem(LOCATION_TRACKING_STATUS, "true");

    return true;
  } catch (err) {
    console.error("Error starting background location tracking:", err);
    return false;
  }
};

// Stop background location tracking
export const stopBackgroundLocationTracking = async (): Promise<boolean> => {
  try {
    // Unregister background location task
    if (await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
    }

    // Unregister background fetch task
    if (await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK)) {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    }

    // Save tracking status
    await AsyncStorage.setItem(LOCATION_TRACKING_STATUS, "false");

    return true;
  } catch (err) {
    console.error("Error stopping background location tracking:", err);
    return false;
  }
};

// Check if tracking is active
export const isLocationTrackingActive = async (): Promise<boolean> => {
  try {
    const status = await AsyncStorage.getItem(LOCATION_TRACKING_STATUS);
    return status === "true";
  } catch (err) {
    console.error("Error checking location tracking status:", err);
    return false;
  }
};

// Immediate location check
export const checkLocationNow = async (): Promise<boolean> => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      console.log("Location permission denied");
      return false;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });

    // Send location update to server
    const locationData = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
    };

    // Update location on server
    await updateLocation(locationData);

    // Monitor location for any significant changes from default location
    const monitorResponse = await monitorLocation(locationData);

    // If employee has moved from default location, send notification
    if (monitorResponse && monitorResponse.locationChanged) {
      await sendLocationChangeNotification(
        monitorResponse.distance,
        monitorResponse.currentLocation
      );
    }

    return true;
  } catch (err) {
    console.error("Error checking location now:", err);
    return false;
  }
};

export default {
  startBackgroundLocationTracking,
  stopBackgroundLocationTracking,
  isLocationTrackingActive,
  checkLocationNow,
};
