// components/maps/Map/Map.native.tsx
import React, { useEffect, useState } from "react";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { StyleSheet, View, Text, Platform } from "react-native";
import { LocationTrackingData, MapBaseProps } from "./Map.types";
import { LEBANON_COORDINATES } from "@/api/location";

const NativeMap: React.FC<MapBaseProps> = ({
  locationData,
  selectedEmployee,
  themeColors,
  mapRef,
  allEmployees,
}) => {
  const [mapRegion, setMapRegion] = useState<Region>({
    ...LEBANON_COORDINATES,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });

  // Calculate distance between two points using Haversine formula (in kilometers)
  const calculateDistance = (
    loc1: { latitude: number; longitude: number },
    loc2: { latitude: number; longitude: number }
  ): number => {
    if (!loc1 || !loc2) return 0;

    // Earth radius in km
    const R = 6371;
    const lat1 = (loc1.latitude * Math.PI) / 180;
    const lat2 = (loc2.latitude * Math.PI) / 180;
    const dLat = ((loc2.latitude - loc1.latitude) * Math.PI) / 180;
    const dLon = ((loc2.longitude - loc1.longitude) * Math.PI) / 180;

    // Use Number() to ensure we're working with number types
    const a =
      Math.sin(Number(dLat) / 2) * Math.sin(Number(dLat) / 2) +
      Math.cos(Number(lat1)) *
        Math.cos(Number(lat2)) *
        Math.sin(Number(dLon) / 2) *
        Math.sin(Number(dLon) / 2);

    const c = 2 * Math.atan2(Math.sqrt(Number(a)), Math.sqrt(1 - Number(a)));
    return R * Number(c);
  };

  // Format time difference
  const formatTimeDiff = (timestamp: string | number | Date): string => {
    if (!timestamp) return "N/A";

    const now = new Date();
    const updatedAt = new Date(timestamp);
    const diffMs = now.getTime() - updatedAt.getTime();

    if (diffMs < 60000) return "Just now";
    if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
    if (diffMs < 86400000) return `${Math.floor(diffMs / 3600000)}h ago`;
    return `${Math.floor(diffMs / 86400000)}d ago`;
  };

  // Handle map region for multiple employees
  useEffect(() => {
    if (selectedEmployee && selectedEmployee.location) {
      // Focus on selected employee
      setMapRegion({
        latitude: selectedEmployee.location.latitude,
        longitude: selectedEmployee.location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    } else if (allEmployees && allEmployees.length > 0) {
      // Calculate bounds for all employees
      let minLat = 90,
        maxLat = -90,
        minLng = 180,
        maxLng = -180;

      allEmployees.forEach((emp) => {
        if (emp && emp.location) {
          minLat = Math.min(minLat, Number(emp.location.latitude));
          maxLat = Math.max(maxLat, Number(emp.location.latitude));
          minLng = Math.min(minLng, Number(emp.location.longitude));
          maxLng = Math.max(maxLng, Number(emp.location.longitude));
        }
      });

      // Add padding
      const paddingFactor = 0.1;
      const latDelta = (maxLat - minLat) * (1 + paddingFactor);
      const lngDelta = (maxLng - minLng) * (1 + paddingFactor);

      if (latDelta > 0 && lngDelta > 0) {
        setMapRegion({
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: Math.max(latDelta, 0.05),
          longitudeDelta: Math.max(lngDelta, 0.05),
        });
      }
    } else if (locationData && locationData.location) {
      // Single location data (backwards compatibility)
      setMapRegion({
        latitude: locationData.location.latitude,
        longitude: locationData.location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  }, [selectedEmployee, allEmployees, locationData]);

  // Render a marker for an employee
  const renderEmployeeMarker = (employee: LocationTrackingData) => {
    if (!employee || !employee.location) return null;

    // Check if employee is away from default location
    const isAway =
      employee.defaultLocation &&
      calculateDistance(employee.location, employee.defaultLocation) > 0.1;

    return (
      <Marker
        key={employee.id}
        coordinate={{
          latitude: employee.location.latitude,
          longitude: employee.location.longitude,
        }}
        title={`${employee.firstName} ${employee.lastName}`}
        description={`${employee.job || ""} • Updated ${formatTimeDiff(
          employee.location.updatedAt || employee.lastUpdate
        )}`}
      >
        <View
          style={[
            styles.markerContainer,
            { backgroundColor: isAway ? "#FF5252" : themeColors.tint },
          ]}
        >
          <View style={styles.markerDot} />
        </View>
      </Marker>
    );
  };

  return (
    <MapView
      ref={mapRef}
      // provider={PROVIDER_GOOGLE} // Uncomment when using Google Maps
      style={styles.map}
      region={mapRegion}
      customMapStyle={[
        {
          elementType: "geometry",
          stylers: [
            {
              color: themeColors.cardBackground,
            },
          ],
        },
        {
          elementType: "labels.text.fill",
          stylers: [
            {
              color: themeColors.text,
            },
          ],
        },
        {
          elementType: "labels.text.stroke",
          stylers: [
            {
              color: themeColors.background,
            },
          ],
        },
      ]}
    >
      {/* Show selected employee */}
      {selectedEmployee && renderEmployeeMarker(selectedEmployee)}

      {/* Show all employees if no specific one is selected */}
      {!selectedEmployee &&
        allEmployees &&
        allEmployees.map(renderEmployeeMarker)}

      {/* Fallback for single location data */}
      {!selectedEmployee &&
        !allEmployees &&
        locationData &&
        renderEmployeeMarker(locationData)}
    </MapView>
  );
};

const styles = StyleSheet.create({
  map: {
    width: "100%",
    height: "100%",
    borderRadius: 18,
  },
  markerContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#fff",
  },
});

export default NativeMap;
