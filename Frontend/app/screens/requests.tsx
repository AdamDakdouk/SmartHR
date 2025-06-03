import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { router } from "expo-router";
import { ScreenHeader } from "@/components/navigation/Header";
import { useAuth } from "@/context/AuthContext";
import { Request, getEmployeeRequests } from "@/api/Requests";
import { format } from "date-fns";

type RequestTypeItem = {
  title: string;
  icon: keyof typeof FontAwesome5.glyphMap;
  description: string;
  route: string;
};

const RequestsScreen = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const { user } = useAuth();
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestTypes: RequestTypeItem[] = [
    {
      title: "Leave Request",
      icon: "calendar-alt",
      description: "Request time off for personal or sick leave",
      route: "./requestsTabs/leave",
    },
    {
      title: "Vacation Request",
      icon: "umbrella-beach",
      description: "Plan and request your vacation days",
      route: "./requestsTabs/vacation",
    },
    {
      title: "Salary Review",
      icon: "money-bill-wave",
      description: "Submit a salary increase request",
      route: "./requestsTabs/salary",
    },
  ];

  const fetchRequests = async () => {
    if (!user || !user.id) return;

    try {
      const fetchedRequests = await getEmployeeRequests(user.id);
      setRequests(fetchedRequests);
      setError(null);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError("Failed to load your requests. Please try again.");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [user]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchRequests();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "#4CAF50";
      case "pending":
        return "#FFA726";
      case "rejected":
        return "#EF5350";
      case "cancelled":
        return "#2196F3";
      default:
        return themeColors.icon;
    }
  };

  const formatDateString = (dateString: string) => {
    try {
      return format(new Date(dateString), "yyyy-MM-dd");
    } catch (e) {
      return dateString;
    }
  };

  // Calculate stats
  const pendingCount = requests.filter(
    (req) => req.status === "pending"
  ).length;
  const totalCount = requests.length;

  // Get recent requests
  const recentRequests = requests
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 3);

  const getRequestTypeName = (
    type: string,
    leaveType?: string,
    vacationType?: string
  ) => {
    switch (type) {
      case "leave":
        return `Leave Request (${leaveType || "General"})`;
      case "vacation":
        return `Vacation Request (${vacationType || "General"})`;
      case "salary":
        return "Salary Review";
      default:
        return `${type.charAt(0).toUpperCase() + type.slice(1)} Request`;
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <ScreenHeader
        title="Requests"
        subtitle="Select a request type to get started"
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.tint} />
          <Text style={[styles.loadingText, { color: themeColors.text }]}>
            Loading your requests...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <FontAwesome5
            name="exclamation-circle"
            size={50}
            color={themeColors.icon}
          />
          <Text style={[styles.errorText, { color: themeColors.text }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: themeColors.tint }]}
            onPress={fetchRequests}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              colors={[themeColors.tint]}
              tintColor={themeColors.tint}
            />
          }
        >
          <LinearGradient
            colors={[themeColors.gradientStart, themeColors.gradientEnd]}
            style={styles.statsCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.statsContent}>
              <Text style={styles.statsTitle}>Request Overview</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{pendingCount}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{totalCount}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
              </View>
            </View>
          </LinearGradient>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Request Types
            </Text>
            {requestTypes.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.requestCard,
                  { backgroundColor: themeColors.cardBackground },
                ]}
                onPress={() => router.push(item.route as any)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${themeColors.tint}15` },
                  ]}
                >
                  <FontAwesome5
                    name={item.icon}
                    size={24}
                    color={themeColors.tint}
                  />
                </View>
                <View style={styles.requestInfo}>
                  <Text
                    style={[styles.requestTitle, { color: themeColors.text }]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.requestDescription,
                      { color: themeColors.icon },
                    ]}
                  >
                    {item.description}
                  </Text>
                </View>
                <FontAwesome5
                  name="chevron-right"
                  size={16}
                  color={themeColors.icon}
                  style={styles.chevron}
                />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
              Recent Requests
            </Text>
            {recentRequests.length > 0 ? (
              recentRequests.map((request, index) => (
                <View
                  key={index}
                  style={[
                    styles.recentCard,
                    { backgroundColor: themeColors.cardBackground },
                  ]}
                >
                  <View style={styles.recentInfo}>
                    <Text
                      style={[styles.recentTitle, { color: themeColors.text }]}
                    >
                      {getRequestTypeName(
                        request.type,
                        request.leaveType,
                        request.vacationType
                      )}
                    </Text>
                    <Text
                      style={[styles.recentDate, { color: themeColors.icon }]}
                    >
                      {formatDateString(request.createdAt)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: `${getStatusColor(request.status)}15`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(request.status) },
                      ]}
                    >
                      {request.status.charAt(0).toUpperCase() +
                        request.status.slice(1)}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: themeColors.icon }]}>
                  You haven't made any requests yet. Create a new request to get
                  started.
                </Text>
              </View>
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
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  statsCard: {
    borderRadius: 24,
    marginBottom: 24,
    padding: 24,
  },
  statsContent: {
    gap: 16,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    padding: 16,
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  statLabel: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.8,
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 16,
  },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  requestInfo: {
    flex: 1,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  requestDescription: {
    fontSize: 14,
    opacity: 0.7,
  },
  chevron: {
    marginLeft: 12,
  },
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentInfo: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  recentDate: {
    fontSize: 14,
    opacity: 0.7,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyContainer: {
    padding: 24,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 16,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});

export default RequestsScreen;
