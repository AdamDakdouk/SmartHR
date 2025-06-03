// hooks/useLocationTracking.ts
import { useEffect, useRef, useState, useCallback } from "react";
import * as ExpoLocation from "expo-location";
import { Platform } from "react-native";
import { updateLocation, monitorLocation, Location } from "@/api/CheckIn";
import backgroundLocationService from "@/api/backgroundLocationService";

type LocationChangeCallback = (params: {
  locationChanged: boolean;
  distance?: number;
  currentLocation?: Location;
  defaultLocation?: Location;
}) => void;

/**
 * Custom hook for background location tracking when checked in
 * @param isActive Whether location tracking should be active (usually when checked in)
 * @param updateInterval Interval between location updates in milliseconds (default: 5 minutes)
 * @param onLocationChange Optional callback for when location changes significantly from default
 */
export const useLocationTracking = (
  isActive: boolean,
  updateInterval: number = 5 * 60 * 1000,
  onLocationChange?: LocationChangeCallback
) => {
  const locationSubscription = useRef<ExpoLocation.LocationSubscription | null>(
    null
  );
  const updateTimer = useRef<NodeJS.Timeout | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);

  // Function to get current location and send to server
  const updateEmployeeLocation = async (): Promise<void> => {
    try {
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const locationData = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });

      // Create the location object with correct type
      const location: Location = {
        latitude: locationData.coords.latitude,
        longitude: locationData.coords.longitude,
      };

      // Send location update to the server
      await updateLocation(location);

      // Also check if employee has moved from default location
      const monitorResponse = await monitorLocation(location);

      // If location change callback is provided, trigger it
      if (onLocationChange && monitorResponse) {
        onLocationChange(monitorResponse);
      }

      return monitorResponse;
    } catch (error) {
      console.error("Error updating location:", error);
    }
  };

  // Start background tracking service
  const startBackgroundTracking = useCallback(async () => {
    if (!isActive) return false;

    const success =
      await backgroundLocationService.startBackgroundLocationTracking();
    setIsTracking(success);
    return success;
  }, [isActive]);

  // Stop background tracking service
  const stopBackgroundTracking = useCallback(async () => {
    const success =
      await backgroundLocationService.stopBackgroundLocationTracking();
    setIsTracking(false);
    return success;
  }, []);

  // Check tracking status
  const checkTrackingStatus = useCallback(async () => {
    const status = await backgroundLocationService.isLocationTrackingActive();
    setIsTracking(status);
    return status;
  }, []);

  // Set up location tracking when component mounts or isActive changes
  useEffect(() => {
    let mounted = true;

    const setupLocationTracking = async () => {
      if (!isActive) {
        // Stop tracking if not active
        if (isTracking) {
          await stopBackgroundTracking();
        }
        return;
      }

      try {
        // Check if tracking is already active
        const currentStatus = await checkTrackingStatus();

        if (!currentStatus) {
          // Start background tracking if platform supports it
          if (Platform.OS !== "web") {
            await startBackgroundTracking();
          }
        }

        // For all platforms, set up a timer as a fallback
        updateTimer.current = setInterval(
          updateEmployeeLocation,
          updateInterval
        );

        // Setup foreground tracking for immediate feedback
        // Request permissions
        const { status } =
          await ExpoLocation.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          console.log("Location permission denied");
          return;
        }

        // For mobile devices in foreground, set up location updates
        if (Platform.OS !== "web") {
          locationSubscription.current = await ExpoLocation.watchPositionAsync(
            {
              accuracy: ExpoLocation.Accuracy.Balanced,
              timeInterval: updateInterval,
              distanceInterval: 100, // Minimum 100 meters between updates
            },
            async (locationData) => {
              if (!mounted) return;

              try {
                const location: Location = {
                  latitude: locationData.coords.latitude,
                  longitude: locationData.coords.longitude,
                };

                // Send location update to the server
                await updateLocation(location);

                // Also check if employee has moved from default location
                const monitorResponse = await monitorLocation(location);

                // If location change callback is provided, trigger it
                if (onLocationChange && monitorResponse) {
                  onLocationChange(monitorResponse);
                }
              } catch (error) {
                console.error("Error in location watcher:", error);
              }
            }
          );
        }

        // Do an immediate first update
        updateEmployeeLocation();
      } catch (error) {
        console.error("Error setting up location tracking:", error);
      }
    };

    setupLocationTracking();

    // Cleanup
    return () => {
      mounted = false;

      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }

      if (updateTimer.current) {
        clearInterval(updateTimer.current);
        updateTimer.current = null;
      }

      // Don't stop background tracking on component unmount
      // This allows tracking to continue in the background
      // Call stopBackgroundTracking() explicitly when needed
    };
  }, [
    isActive,
    updateInterval,
    isTracking,
    checkTrackingStatus,
    startBackgroundTracking,
  ]);

  return {
    updateLocationNow: updateEmployeeLocation,
    isTracking,
    startTracking: startBackgroundTracking,
    stopTracking: stopBackgroundTracking,
  };
};

export default useLocationTracking;
