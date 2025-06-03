import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Animated,
  Dimensions,
  ActivityIndicator,
  Alert,
  BackHandler,
  Platform,
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
import { getEmployeeDailySummary, EmployeeDailySummary } from "@/api/Tasks";
import { useQuery } from "@tanstack/react-query";
import { AxiosError } from "axios";
import Toast from "react-native-toast-message";
import { format } from "date-fns";

const { width } = Dimensions.get("window");
const COLUMN_WIDTH = (width - 48) / 2;

type FeatureItem = {
  title: string;
  icon: keyof typeof FontAwesome5.glyphMap;
  route:
    | "/screens/checkInOutScreen"
    | "/screens/tasks"
    | "/screens/announcements"
    | "/screens/employees"
    | "/screens/requests"
    | "/screens/issue";
  description: string;
};

const Home = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  // Add back button handler for Android
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

  const features: FeatureItem[] = [
    {
      title: "Check In/Out",
      icon: "clock",
      route: "/screens/checkInOutScreen",
      description: "Track your work hours",
    },
    {
      title: "Tasks",
      icon: "tasks",
      route: "/screens/tasks",
      description: "Manage your tasks",
    },
    {
      title: "Announcements",
      icon: "bullhorn",
      route: "/screens/announcements",
      description: "Stay updated",
    },
    {
      title: "Employees",
      icon: "users",
      route: "/screens/employees",
      description: "View team members",
    },
    {
      title: "Requests",
      icon: "clipboard-list",
      route: "/screens/requests",
      description: "Manage requests",
    },
    {
      title: "Report Issues",
      icon: "exclamation-circle",
      route: "/screens/issue",
      description: "Submit problems",
    },
  ];

  // Fetch notifications data
  const {
    data: unreadCountData,
    isError: unreadCountError,
    isLoading: unreadCountLoading,
  } = useQuery<UnreadCountResponse, AxiosError>({
    queryKey: ["unreadCount"],
    queryFn: getUnreadCount,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const {
    data: notificationsData,
    isLoading: notificationsLoading,
    isError: notificationsError,
  } = useQuery<NotificationResponse, AxiosError>({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    refetchInterval: 30000,
  });

  // Fetch daily summary data
  const {
    data: dailySummary,
    isLoading: dailySummaryLoading,
    isError: dailySummaryError,
  } = useQuery<EmployeeDailySummary, AxiosError>({
    queryKey: ["dailySummary"],
    queryFn: getEmployeeDailySummary,
    refetchInterval: 120000, // Refresh every 2 minutes
  });

  const notifications = notificationsData?.data || [];
  const unreadCount = unreadCountData?.data.count || 0;

  // Calculate total incomplete tasks (pending + in_progress)
  const totalIncompleteTasks = dailySummary
    ? dailySummary.tasksStats.statusCounts.pending +
      dailySummary.tasksStats.statusCounts.in_progress
    : 0;

  // Calculate completed tasks
  const completedTasks = dailySummary
    ? dailySummary.tasksStats.statusCounts.completed
    : 0;

  // Format the task ratio for display
  const taskRatio = `${completedTasks}/${
    totalIncompleteTasks + completedTasks
  }`;

  // Get due today tasks count
  const dueToday = dailySummary ? dailySummary.tasksStats.dueToday : 0;

  // Get today's work hours
  const hoursToday = dailySummary?.checkInStats?.hoursToday || 0;

  const renderFeature = ({ item }: { item: FeatureItem }) => (
    <TouchableOpacity
      style={[
        styles.featureButton,
        { backgroundColor: themeColors.cardBackground },
      ]}
      onPress={() => router.push(item.route)}
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
      <Animated.View
        style={[styles.featureContent, { transform: [{ scale: scaleAnim }] }]}
      >
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${themeColors.tint}15` },
          ]}
        >
          <FontAwesome5 name={item.icon} size={24} color={themeColors.tint} />
        </View>
        <Text style={[styles.featureTitle, { color: themeColors.text }]}>
          {item.title}
        </Text>
        <Text style={[styles.featureDescription, { color: themeColors.icon }]}>
          {item.description}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );

  // Render the daily summary hero section
  const renderDailySummary = () => {
    if (dailySummaryLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading summary...</Text>
        </View>
      );
    }

    if (dailySummaryError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.heroTitle}>Daily Summary</Text>
          <Text style={styles.heroSubtitle}>Could not load data</Text>
        </View>
      );
    }

    return (
      <View style={styles.heroContent}>
        <View style={styles.heroTextContainer}>
          <Text style={styles.heroTitle}>Daily Summary</Text>
          <Text style={styles.heroSubtitle}>
            {dueToday > 0
              ? `You have ${dueToday} task${
                  dueToday !== 1 ? "s" : ""
                } due today`
              : "No tasks due today"}
          </Text>
        </View>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{hoursToday.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Hours</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{taskRatio}</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>
        </View>
      </View>
    );
  };

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
          <TouchableOpacity
            style={[
              styles.iconButton,
              { backgroundColor: themeColors.cardBackground },
            ]}
            onPress={() => router.push("/screens/search")}
          >
            <Ionicons
              name="search-outline"
              size={22}
              color={themeColors.icon}
            />
          </TouchableOpacity>
        </View>
      </View>

      <LinearGradient
        colors={[themeColors.gradientStart, themeColors.gradientEnd]}
        style={styles.heroBanner}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {renderDailySummary()}
      </LinearGradient>

      <FlatList
        data={features}
        renderItem={renderFeature}
        keyExtractor={(item) => item.title}
        numColumns={2}
        contentContainerStyle={styles.featuresContainer}
        showsVerticalScrollIndicator={false}
      />

      <NotificationPanel
        visible={showNotifications}
        onClose={() => setShowNotifications(false)}
        notifications={notifications}
        isLoading={notificationsLoading}
      />
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
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
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  heroBanner: {
    borderRadius: 24,
    marginBottom: 24,
    padding: 24,
  },
  heroContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.8,
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
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
  featuresContainer: {
    gap: 16,
    paddingBottom: 16,
  },
  featureButton: {
    flex: 1,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    width: COLUMN_WIDTH,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  featureContent: {
    padding: 20,
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  featureDescription: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.7,
  },
  notificationBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    color: "#fff",
    marginTop: 8,
    fontSize: 16,
  },
  errorContainer: {
    justifyContent: "center",
    padding: 20,
  },
});

export default Home;
