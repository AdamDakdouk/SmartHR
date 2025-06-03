import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { ScreenHeader } from "@/components/navigation/Header";
import { router } from "expo-router";
import { getTeamMembers } from "@/api/Employees";

const { width } = Dimensions.get("window");

// Define the Employee interface
interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  job?: string;
  role: string;
  status: "checkedIn" | "checkedOut" | "onLeave";
  profilePicture?: string;
  checkInLocation?: {
    latitude: number;
    longitude: number;
  };
  joinDate: string;
}

const EmployeesScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch employees
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getTeamMembers();
      setEmployees(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError("Failed to load team members");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Pull to refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchEmployees();
  }, [fetchEmployees]);

  // Get status color based on employee status
  const getStatusColor = (status: Employee["status"]): string => {
    switch (status) {
      case "checkedIn":
        return "#4CAF50"; // Available (green)
      case "onLeave":
        return "#FFA726"; // On Leave (orange)
      case "checkedOut":
        return themeColors.tint; // Away (blue/theme color)
      default:
        return "#9E9E9E"; // Unknown (gray)
    }
  };

  // Get status text based on employee status
  const getStatusText = (status: Employee["status"]): string => {
    switch (status) {
      case "checkedIn":
        return "Available";
      case "onLeave":
        return "On Leave";
      case "checkedOut":
        return "Away";
      default:
        return "Offline";
    }
  };

  // Filter to get only available (checked in) employees
  const availableEmployees = employees.filter(
    (emp) => emp.status === "checkedIn"
  );

  // Create employee initials for avatar
  const getInitials = (firstName: string, lastName: string): string => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`;
  };

  // Navigate to employee profile
  const navigateToProfile = (employeeId: string) => {
    router.push(`./employee-profile/${employeeId}`);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <ScreenHeader title="Team Members" subtitle="Connect with your team" />

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.tint} />
          <Text style={[styles.loadingText, { color: themeColors.text }]}>
            Loading team members...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: "red" }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: themeColors.tint }]}
            onPress={fetchEmployees}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[themeColors.tint]}
              tintColor={themeColors.tint}
            />
          }
        >
          <LinearGradient
            colors={[themeColors.gradientStart, themeColors.gradientEnd]}
            style={styles.featuredCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.featuredTitle}>Your Team</Text>
            <Text style={styles.featuredSubtitle}>
              {availableEmployees.length} colleague
              {availableEmployees.length !== 1 ? "s" : ""} available
            </Text>
            <View style={styles.onlineIndicators}>
              {availableEmployees.length === 0 ? (
                <View style={styles.noActiveContainer}>
                  <Text style={styles.noActiveText}>
                    No colleagues available right now
                  </Text>
                </View>
              ) : (
                availableEmployees.slice(0, 3).map((emp, index) => (
                  <View
                    key={emp.id}
                    style={[
                      styles.onlineAvatar,
                      {
                        backgroundColor: "rgba(255, 255, 255, 0.2)",
                        marginLeft: index > 0 ? -12 : 0,
                        zIndex: 3 - index,
                      },
                    ]}
                  >
                    <Text style={styles.avatarInitials}>
                      {getInitials(emp.firstName, emp.lastName)}
                    </Text>
                  </View>
                ))
              )}
              {availableEmployees.length > 3 && (
                <View
                  style={[
                    styles.onlineAvatar,
                    {
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      marginLeft: -12,
                      zIndex: 0,
                    },
                  ]}
                >
                  <Text style={styles.avatarInitials}>
                    +{availableEmployees.length - 3}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>

          <View style={styles.employeesList}>
            {employees.length === 0 ? (
              <View style={styles.emptyState}>
                <FontAwesome5
                  name="users"
                  size={48}
                  color={`${themeColors.text}30`}
                />
                <Text
                  style={[styles.emptyStateText, { color: themeColors.text }]}
                >
                  No team members found
                </Text>
              </View>
            ) : (
              employees.map((employee) => (
                <TouchableOpacity
                  key={employee.id}
                  style={[
                    styles.employeeCard,
                    { backgroundColor: themeColors.cardBackground },
                  ]}
                  onPress={() => navigateToProfile(employee.id)}
                >
                  <View style={styles.employeeContent}>
                    {employee.profilePicture ? (
                      <View style={styles.avatarContainerWithImage}>
                        <Image
                          source={{ uri: employee.profilePicture }}
                          style={styles.avatarImage}
                        />
                        <View
                          style={[
                            styles.statusIndicator,
                            {
                              backgroundColor: getStatusColor(employee.status),
                            },
                          ]}
                        />
                      </View>
                    ) : (
                      <View
                        style={[
                          styles.avatarContainer,
                          { backgroundColor: `${themeColors.tint}15` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.avatarText,
                            { color: themeColors.tint },
                          ]}
                        >
                          {getInitials(employee.firstName, employee.lastName)}
                        </Text>
                        <View
                          style={[
                            styles.statusIndicator,
                            {
                              backgroundColor: getStatusColor(employee.status),
                            },
                          ]}
                        />
                      </View>
                    )}
                    <View style={styles.employeeInfo}>
                      <Text
                        style={[
                          styles.employeeName,
                          { color: themeColors.text },
                        ]}
                      >
                        {employee.firstName} {employee.lastName}
                      </Text>
                      <Text
                        style={[
                          styles.employeeRole,
                          { color: themeColors.icon },
                        ]}
                      >
                        {employee.job || "Team Member"}
                      </Text>
                      <View style={styles.statusContainer}>
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor: getStatusColor(employee.status),
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            { color: themeColors.icon },
                          ]}
                        >
                          {getStatusText(employee.status)}
                        </Text>
                      </View>
                    </View>
                    <FontAwesome5
                      name="chevron-right"
                      size={16}
                      color={themeColors.icon}
                    />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  featuredCard: {
    margin: 16,
    borderRadius: 24,
    padding: 24,
  },
  featuredTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  featuredSubtitle: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.8,
  },
  onlineIndicators: {
    flexDirection: "row",
    marginTop: 16,
  },
  noActiveContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 8,
    borderRadius: 16,
  },
  noActiveText: {
    color: "#fff",
    fontSize: 14,
  },
  onlineAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  avatarInitials: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  employeesList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
  },
  employeeCard: {
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  employeeContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarContainerWithImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    position: "relative",
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "600",
  },
  statusIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#fff",
  },
  employeeInfo: {
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  employeeRole: {
    fontSize: 14,
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
  },
});

export default EmployeesScreen;
