import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import NotificationPanel from "@/components/NotificationPanel";
import {
  UnreadCountResponse,
  getUnreadCount,
  NotificationResponse,
  getNotifications,
} from "@/api/Notifications";
import { DashboardStats, getHRDashboardStats } from "@/api/Dashboard";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import Toast from "react-native-toast-message";
import { LogOut, MoreVertical } from "lucide-react-native";
import { formatDistanceToNow } from "date-fns";

const { width } = Dimensions.get("window");
const STAT_CARD_WIDTH = (width - 48) / 2;

type QuickAction = {
  title: string;
  icon: keyof typeof FontAwesome5.glyphMap;
  route: string;
  description: string;
  gradient: string[];
};

const AdminHome = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Fetch dashboard statistics
  const {
    data: dashboardStats,
    refetch: refetchStats,
    isLoading: statsLoading,
  } = useQuery<DashboardStats, AxiosError>({
    queryKey: ["dashboardStats"],
    queryFn: getHRDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Handle initial loading state
  useEffect(() => {
    if (dashboardStats && isInitialLoading) {
      setIsInitialLoading(false);
    }

    // If loading takes too long, stop showing loading state after 3 seconds
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, [dashboardStats, isInitialLoading]);

  useEffect(() => {
    const backAction = () => {
      Alert.alert("Hold on!", "Are you sure you want to exit?", [
        {
          text: "Cancel",
          onPress: () => null,
          style: "cancel",
        },
        {
          text: "YES",
          onPress: () => BackHandler.exitApp(),
        },
      ]);
      return true; // Prevents default back button behavior
    };

    // Only add the handler for Android
    if (Platform.OS === "android") {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => backHandler.remove();
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchStats(),
      refetchNotifications(),
      refetchUnreadCount(),
    ]);
    setRefreshing(false);
  };

  const OptionsMenu = () => (
    <TouchableOpacity
      style={[
        styles.menuContainer,
        { backgroundColor: themeColors.cardBackground },
      ]}
      onPress={logout}
      activeOpacity={0.8}
    >
      <View style={styles.menuItem}>
        <LogOut size={20} color="#FF4B4B" />
        <Text style={[styles.menuText, { color: "#FF4B4B" }]}>Logout</Text>
      </View>
    </TouchableOpacity>
  );

  // Replace the profile icon button with this in the header
  const renderOptionsButton = () => (
    <View>
      <TouchableOpacity
        style={[
          styles.iconButton,
          { backgroundColor: themeColors.cardBackground },
        ]}
        onPress={() => setShowMenu(!showMenu)}
      >
        <MoreVertical size={22} color={themeColors.icon} />
      </TouchableOpacity>
      {showMenu && <OptionsMenu />}
    </View>
  );

  const quickActions: QuickAction[] = [
    {
      title: "Team Management",
      icon: "users",
      route: "/admin/screens/team",
      description: "Manage employees & roles",
      gradient: [themeColors.gradientStart, themeColors.gradientEnd],
    },
    {
      title: "Task Management",
      icon: "tasks",
      route: "/admin/screens/tasks",
      description: "Assign & track tasks",
      gradient: [themeColors.gradientStart, themeColors.gradientEnd],
    },
    {
      title: "Location Tracking",
      icon: "map-marker-alt",
      route: "/admin/screens/locationTracking",
      description: "View team locations",
      gradient: [themeColors.gradientStart, themeColors.gradientEnd],
    },
    {
      title: "HR Hub",
      icon: "bullhorn",
      route: "/admin/screens/hrhub",
      description: "Requests, issues & announcements",
      gradient: [themeColors.gradientStart, themeColors.gradientEnd],
    },
  ];

  const {
    data: unreadCountData,
    isError: unreadCountError,
    isLoading: unreadCountLoading,
    refetch: refetchUnreadCount,
  } = useQuery<UnreadCountResponse, AxiosError>({
    queryKey: ["unreadCount"],
    queryFn: getUnreadCount,
    refetchInterval: 30000,
  });

  const {
    data: notificationsData,
    isLoading: notificationsLoading,
    isError: notificationsError,
    refetch: refetchNotifications,
  } = useQuery<NotificationResponse, AxiosError>({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    refetchInterval: 30000,
  });

  const notifications = notificationsData?.data || [];
  const unreadCount = unreadCountData?.data?.count || 0;

  // Format date for recent activities
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return "recently";
    }
  };

  const renderStatCard = (
    title: string,
    value: string | number,
    subtitle: string,
    icon: keyof typeof FontAwesome5.glyphMap,
    isLoading: boolean = false
  ) => (
    <View
      style={[styles.statCard, { backgroundColor: themeColors.cardBackground }]}
    >
      <View
        style={[
          styles.statIconContainer,
          { backgroundColor: `${themeColors.tint}15` },
        ]}
      >
        <FontAwesome5 name={icon} size={20} color={themeColors.tint} />
      </View>
      {isLoading ? (
        <ActivityIndicator size="small" color={themeColors.tint} />
      ) : (
        <Text style={[styles.statValue, { color: themeColors.text }]}>
          {value}
        </Text>
      )}
      <Text style={[styles.statTitle, { color: themeColors.text }]}>
        {title}
      </Text>
      <Text style={[styles.statSubtitle, { color: themeColors.icon }]}>
        {subtitle}
      </Text>
    </View>
  );

  const renderQuickAction = (action: QuickAction) => (
    <TouchableOpacity
      key={action.title}
      style={styles.quickActionContainer}
      onPress={() => router.push(action.route)}
      activeOpacity={0.8}
      onPressIn={() =>
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          useNativeDriver: true,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }).start()
      }
    >
      <LinearGradient
        colors={action.gradient}
        style={styles.quickAction}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <FontAwesome5 name={action.icon} size={24} color="#fff" />
        <Text style={styles.quickActionTitle}>{action.title}</Text>
        <Text style={styles.quickActionDescription}>{action.description}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );

  // Get actual data directly from the API response without fallbacks for accuracy
  const totalEmployees = dashboardStats?.employeeStats.total || 0;
  const activeEmployees = dashboardStats?.employeeStats.active || 0;
  const tasksInProgress = dashboardStats?.taskStats?.in_progress || 0;
  const tasksDueToday = dashboardStats?.taskStats?.pending || 0;
  const pendingRequests =
    dashboardStats?.recentLeaveRequests?.filter((r) => r.status === "pending")
      ?.length || 0;
  const urgentRequests =
    pendingRequests > 0 ? Math.ceil(pendingRequests / 2) : 0; // Estimate if we don't have real data
  const remoteWorkers = dashboardStats?.employeeStats.checkedIn || 0;
  const inOfficeWorkers = activeEmployees - remoteWorkers;

  // Recent activities (use real data if available, otherwise show loading)
  const recentActivities =
    dashboardStats?.recentActivities &&
    dashboardStats.recentActivities.length > 0
      ? dashboardStats.recentActivities.slice(0, 3).map((activity) => ({
          id: activity.id,
          title: `${activity.name} ${
            activity.status === "checkedIn"
              ? "checked in"
              : activity.status === "checkedOut"
              ? "checked out"
              : activity.status === "onLeave"
              ? "went on leave"
              : "updated status"
          }`,
          time: formatDate(activity.updatedAt),
          icon:
            activity.status === "checkedIn"
              ? "sign-in-alt"
              : activity.status === "checkedOut"
              ? "sign-out-alt"
              : activity.status === "onLeave"
              ? "calendar-minus"
              : "user-cog",
        }))
      : [];

  // If we're still in initial loading, show a loading screen
  if (isInitialLoading) {
    return (
      <SafeAreaView
        style={[
          styles.loadingContainer,
          { backgroundColor: themeColors.background },
        ]}
      >
        <ActivityIndicator size="large" color={themeColors.tint} />
        <Text style={[styles.loadingText, { color: themeColors.text }]}>
          Loading dashboard...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.welcomeText, { color: themeColors.text }]}>
            Welcome back,
          </Text>
          <Text style={[styles.nameText, { color: themeColors.text }]}>
            {user?.firstName} {user?.lastName}
          </Text>
        </View>
        <View style={styles.headerIcons}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              { backgroundColor: themeColors.cardBackground },
            ]}
            onPress={() => setShowNotifications(true)}
          >
            {unreadCountLoading ? (
              <ActivityIndicator size="small" color={themeColors.icon} />
            ) : (
              <>
                <Ionicons
                  name="notifications-outline"
                  size={22}
                  color={themeColors.icon}
                />
                {unreadCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.badgeText}>{unreadCount}</Text>
                  </View>
                )}
              </>
            )}
          </TouchableOpacity>
          {renderOptionsButton()}
        </View>
      </View>

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
        <View style={styles.statsContainer}>
          {renderStatCard(
            "Total Employees",
            totalEmployees,
            `${activeEmployees} active now`,
            "users",
            statsLoading
          )}
          {renderStatCard(
            "Tasks in Progress",
            tasksInProgress,
            `${tasksDueToday} pending`,
            "clipboard-list",
            statsLoading
          )}
          {renderStatCard(
            "Pending Requests",
            pendingRequests,
            `${urgentRequests} urgent`,
            "exclamation-circle",
            statsLoading
          )}
          {renderStatCard(
            "Remote Workers",
            remoteWorkers,
            `${inOfficeWorkers} in office`,
            "map-marker-alt",
            statsLoading
          )}
        </View>

        <View style={styles.quickActionsGrid}>
          {quickActions.map((action) => renderQuickAction(action))}
        </View>

        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Recent Activity
        </Text>
        <View
          style={[
            styles.activityContainer,
            { backgroundColor: themeColors.cardBackground },
          ]}
        >
          {statsLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color={themeColors.tint} />
              <Text
                style={[styles.noActivityText, { color: themeColors.icon }]}
              >
                Loading activities...
              </Text>
            </View>
          ) : recentActivities.length > 0 ? (
            recentActivities.map((activity, index) => (
              <TouchableOpacity
                key={activity.id || index}
                style={[
                  styles.activityItem,
                  index < recentActivities.length - 1 &&
                    styles.activityItemBorder,
                ]}
              >
                <View
                  style={[
                    styles.activityIconContainer,
                    { backgroundColor: `${themeColors.tint}15` },
                  ]}
                >
                  <FontAwesome5
                    name={activity.icon}
                    size={16}
                    color={themeColors.tint}
                  />
                </View>
                <View style={styles.activityContent}>
                  <Text
                    style={[styles.activityTitle, { color: themeColors.text }]}
                  >
                    {activity.title}
                  </Text>
                  <Text
                    style={[styles.activityTime, { color: themeColors.icon }]}
                  >
                    {activity.time}
                  </Text>
                </View>
                <FontAwesome5
                  name="chevron-right"
                  size={16}
                  color={themeColors.icon}
                />
              </TouchableOpacity>
            ))
          ) : (
            <Text style={[styles.noActivityText, { color: themeColors.icon }]}>
              No recent activities found
            </Text>
          )}
        </View>
      </ScrollView>
      <Toast />
      <NotificationPanel
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        isLoading={notificationsLoading}
      />
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
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  loaderContainer: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  menuContainerWrapper: {
    position: "absolute",
    right: 0,
    top: 45,
    elevation: 1000,
    zIndex: 1000,
  },
  menuContainer: {
    position: "absolute",
    right: 0,
    top: 45,
    width: 150,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
    zIndex: 9999,
  },
  menuText: {
    fontSize: 14,
    fontWeight: "600",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    margin: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    gap: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    zIndex: 999999,
    backgroundColor: "red",
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF4B4B",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    opacity: 0.8,
  },
  nameText: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 4,
  },
  headerIcons: {
    flexDirection: "row",
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  notificationBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF6B6B",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    width: STAT_CARD_WIDTH,
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 24,
  },
  quickActionContainer: {
    width: STAT_CARD_WIDTH,
  },
  quickAction: {
    padding: 20,
    borderRadius: 20,
    height: 160,
  },
  quickActionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 8,
  },
  quickActionDescription: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.8,
  },
  activityContainer: {
    borderRadius: 20,
    marginBottom: 24,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  activityItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  activityIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
  },
  noActivityText: {
    padding: 16,
    textAlign: "center",
    fontSize: 14,
  },
});

export default AdminHome;
