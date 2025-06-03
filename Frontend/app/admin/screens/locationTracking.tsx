// screens/LocationTracking.tsx
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { getCheckedInEmployees, trackEmployee } from "@/api/location";
import { ScreenHeader } from "@/components/navigation/Header";
import Map from "@/components/maps/Map";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import { format } from "date-fns";

const { width } = Dimensions.get("window");

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
  email?: string;
  job?: string;
  status: string;
  location: Location;
  defaultLocation?: Location;
  lastUpdate: string;
}

const LocationTracking: React.FC = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [selectedEmployee, setSelectedEmployee] =
    useState<CheckedInEmployee | null>(null);
  const [filterAwayOnly, setFilterAwayOnly] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const mapRef = useRef<any>(null);
  const queryClient = useQueryClient();

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch checked-in employees
  const {
    data: employees = [],
    isLoading,
    refetch: refetchEmployees,
  } = useQuery({
    queryKey: ["checkedInEmployees"],
    queryFn: getCheckedInEmployees,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Track selected employee
  const { data: locationData, isLoading: trackingLoading } = useQuery({
    queryKey: ["trackEmployee", selectedEmployee?.id],
    queryFn: () =>
      selectedEmployee ? trackEmployee(selectedEmployee.id) : undefined,
    enabled: !!selectedEmployee,
    refetchInterval: selectedEmployee ? 10000 : false,
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

    // Use Number to ensure we're working with number types
    const a =
      Math.sin(Number(dLat) / 2) * Math.sin(Number(dLat) / 2) +
      Math.cos(Number(lat1)) *
        Math.cos(Number(lat2)) *
        Math.sin(Number(dLon) / 2) *
        Math.sin(Number(dLon) / 2);

    const c = 2 * Math.atan2(Math.sqrt(Number(a)), Math.sqrt(1 - Number(a)));
    return R * Number(c);
  };

  // Format last update time
  const formatLastUpdate = (date: string): string => {
    const now = new Date();
    const updateTime = new Date(date);
    const diff = now.getTime() - updateTime.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes === 1) return "1 minute ago";
    if (minutes < 60) return `${minutes} minutes ago`;
    if (minutes < 120) return "1 hour ago";
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hours ago`;
    return updateTime.toLocaleDateString();
  };

  // Handle setting default location
  const handleSetDefaultLocation = async (employee: CheckedInEmployee) => {
    if (!employee.location) return;

    try {
      // Call your API to set default location
      const response = await fetch(
        `/api/check-in/default-location/${employee.id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            latitude: employee.location.latitude,
            longitude: employee.location.longitude,
          }),
        }
      );

      if (response.ok) {
        Toast.show({
          type: "success",
          text1: "Default location updated",
          text2: `Set for ${employee.firstName} ${employee.lastName}`,
        });

        // Refresh data
        queryClient.invalidateQueries({ queryKey: ["checkedInEmployees"] });
      } else {
        throw new Error("Failed to update default location");
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error updating default location",
        text2: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // Filter employees who are away from their default location
  const awayEmployees = employees.filter((emp) => {
    if (!emp.defaultLocation || !emp.location) return false;

    const distance = calculateDistance(emp.location, emp.defaultLocation);
    return distance > 0.1; // More than 100 meters
  });

  // Apply filter if enabled
  const displayedEmployees = filterAwayOnly ? awayEmployees : employees;

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <ScreenHeader
          title="Location Tracking"
          subtitle="Loading employees..."
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <ScreenHeader
        title="Location Tracking"
        subtitle={`${employees.length} employees checked in`}
      />

      <View style={styles.timeContainer}>
        <Text style={[styles.dateText, { color: themeColors.text }]}>
          {format(currentTime, "EEEE, MMMM d, yyyy")}
        </Text>
        <Text style={[styles.timeText, { color: themeColors.text }]}>
          {format(currentTime, "h:mm:ss a")}
        </Text>
      </View>

      <View style={styles.content}>
        {/* Map Section */}
        <View style={styles.mapContainer}>
          <LinearGradient
            colors={[themeColors.gradientStart, themeColors.gradientEnd]}
            style={styles.mapGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Map
              locationData={locationData}
              selectedEmployee={selectedEmployee}
              allEmployees={!selectedEmployee ? displayedEmployees : undefined}
              themeColors={themeColors}
              mapRef={mapRef}
            />
          </LinearGradient>
        </View>

        {/* Employees List */}
        <View
          style={[
            styles.listContainer,
            { backgroundColor: themeColors.cardBackground },
          ]}
        >
          <View style={styles.listHeader}>
            <Text style={[styles.listTitle, { color: themeColors.text }]}>
              {filterAwayOnly ? "Away Employees" : "Active Employees"}
            </Text>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[
                  styles.filterButton,
                  filterAwayOnly && {
                    backgroundColor: themeColors.tint,
                  },
                ]}
                onPress={() => setFilterAwayOnly(!filterAwayOnly)}
              >
                <FontAwesome5
                  name="filter"
                  size={12}
                  color={filterAwayOnly ? "#fff" : themeColors.text}
                />
                <Text
                  style={[
                    styles.filterText,
                    { color: filterAwayOnly ? "#fff" : themeColors.text },
                  ]}
                >
                  Away
                </Text>
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor: filterAwayOnly
                        ? "#fff"
                        : themeColors.tint,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      { color: filterAwayOnly ? themeColors.tint : "#fff" },
                    ]}
                  >
                    {awayEmployees.length}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.refreshButton,
                  { backgroundColor: `${themeColors.tint}15` },
                ]}
                onPress={() => refetchEmployees()}
              >
                <FontAwesome5
                  name="sync-alt"
                  size={14}
                  color={themeColors.tint}
                />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {displayedEmployees.length > 0 ? (
              displayedEmployees.map((employee) => {
                // Check if employee is away from default location
                const isAway =
                  employee.defaultLocation &&
                  employee.location &&
                  calculateDistance(
                    employee.location,
                    employee.defaultLocation
                  ) > 0.1;

                return (
                  <TouchableOpacity
                    key={employee.id}
                    style={[
                      styles.employeeCard,
                      { backgroundColor: themeColors.background },
                      selectedEmployee?.id === employee.id &&
                        styles.selectedCard,
                      selectedEmployee?.id === employee.id && {
                        borderColor: themeColors.tint,
                      },
                      isAway && styles.awayCard,
                    ]}
                    onPress={() =>
                      setSelectedEmployee(
                        selectedEmployee?.id === employee.id ? null : employee
                      )
                    }
                  >
                    <View style={styles.employeeInfo}>
                      <LinearGradient
                        colors={[
                          isAway ? "#FF5252" : themeColors.gradientStart,
                          isAway ? "#FF8A80" : themeColors.gradientEnd,
                        ]}
                        style={styles.avatarContainer}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.avatarText}>
                          {employee.firstName[0]}
                          {employee.lastName[0]}
                        </Text>
                      </LinearGradient>
                      <View style={styles.employeeDetails}>
                        <Text
                          style={[
                            styles.employeeName,
                            { color: themeColors.text },
                          ]}
                        >
                          {employee.firstName} {employee.lastName}
                        </Text>

                        {isAway && (
                          <Text style={styles.awayText}>
                            Away from default location
                          </Text>
                        )}

                        <Text
                          style={[
                            styles.lastUpdate,
                            { color: themeColors.icon },
                          ]}
                        >
                          Last update: {formatLastUpdate(employee.lastUpdate)}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.actionButtons}>
                      {selectedEmployee?.id === employee.id && (
                        <TouchableOpacity
                          style={[
                            styles.defaultLocationButton,
                            { backgroundColor: `${themeColors.tint}15` },
                          ]}
                          onPress={() => handleSetDefaultLocation(employee)}
                        >
                          <FontAwesome5
                            name="map-pin"
                            size={12}
                            color={themeColors.tint}
                          />
                          <Text
                            style={[
                              styles.defaultLocationText,
                              { color: themeColors.tint },
                            ]}
                          >
                            Set Default
                          </Text>
                        </TouchableOpacity>
                      )}

                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              selectedEmployee?.id === employee.id
                                ? themeColors.tint
                                : `${themeColors.tint}15`,
                          },
                        ]}
                      >
                        <FontAwesome5
                          name="map-marker-alt"
                          size={12}
                          color={
                            selectedEmployee?.id === employee.id
                              ? "#fff"
                              : themeColors.tint
                          }
                        />
                        <Text
                          style={[
                            styles.statusText,
                            {
                              color:
                                selectedEmployee?.id === employee.id
                                  ? "#fff"
                                  : themeColors.tint,
                            },
                          ]}
                        >
                          {selectedEmployee?.id === employee.id
                            ? "Tracking"
                            : "Track"}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <FontAwesome5
                  name="user-clock"
                  size={48}
                  color={themeColors.icon}
                  style={styles.emptyIcon}
                />
                <Text style={[styles.emptyText, { color: themeColors.text }]}>
                  {filterAwayOnly
                    ? "No employees are away from their default location"
                    : "No employees are currently checked in"}
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  timeContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    opacity: 0.8,
  },
  timeText: {
    fontSize: 24,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mapContainer: {
    height: 300,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 16,
  },
  mapGradient: {
    height: "100%",
    padding: 2,
    borderRadius: 20,
  },
  listContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  filterText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
    marginRight: 4,
  },
  countBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  countText: {
    fontSize: 10,
    fontWeight: "700",
  },
  refreshButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  employeeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  selectedCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  awayCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#FF5252",
  },
  employeeInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  employeeDetails: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  awayText: {
    fontSize: 12,
    color: "#FF5252",
    fontWeight: "500",
    marginBottom: 2,
  },
  lastUpdate: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  defaultLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  defaultLocationText: {
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 4,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  emptyState: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.7,
  },
});

export default LocationTracking;
