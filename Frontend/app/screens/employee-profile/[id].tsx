import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import {
  Mail,
  MapPin,
  FileText,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  ClipboardList,
  AlertCircle,
  RefreshCw,
  UserX,
  ArrowLeft,
  ShieldAlert,
  MessageCircle,
  Phone,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import { format } from "date-fns";
import { AxiosError } from "axios";
import { getEmployeeProfile } from "@/api/Profile";
import ProfileScreenSkeleton from "@/components/ProfileScreenSkeleton";

const { width } = Dimensions.get("window");

// Define route params type
type ProfileRouteParams = {
  id: string;
  name?: string;
};

type ProfileRouteType = RouteProp<{ params: ProfileRouteParams }, "params">;

interface ProfileData {
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

interface ApiErrorResponse {
  message?: string;
  errors?: { [key: string]: string };
}

const UserProfileViewScreen: React.FC = () => {
  const route = useRoute<ProfileRouteType>();
  const navigation = useNavigation();
  const { id: employeeId } = route.params;
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Explicitly determine if the current user is HR
  const isCurrentUserHR = user?.role === "hr";
  console.log("Current user role:", user?.role);
  console.log("Is HR:", isCurrentUserHR);

  // Profile query with error retry options
  const {
    data: profileData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ProfileData, AxiosError<ApiErrorResponse>>({
    queryKey: ["employee-profile", employeeId, forceRefresh],
    queryFn: () => getEmployeeProfile(employeeId),
    enabled: !!employeeId,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    staleTime: 60000,
    gcTime: 300000,
  });

  // Handle manual hard refresh
  const handleHardRefresh = useCallback(() => {
    setForceRefresh((prev) => !prev);
    Toast.show({
      type: "info",
      text1: "Refreshing profile data...",
    });
  }, []);

  // Handle delete user (for HR only)
  const handleDeleteUser = useCallback(() => {
    setShowDeleteModal(true);
  }, []);

  // Confirm delete user action
  const confirmDeleteUser = useCallback(() => {
    // Implement the actual delete API call here
    Alert.alert(
      "Delete User",
      "This feature would delete the user in a real implementation.",
      [{ text: "OK", onPress: () => setShowDeleteModal(false) }]
    );
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    refetch().finally(() => setRefreshing(false));
  }, [refetch]);

  const getActivityIcon = (
    type: ProfileData["recentActivities"][0]["type"]
  ) => {
    switch (type) {
      case "task":
        return <ClipboardList size={20} color={colors.icon} />;
      case "leave":
        return <Calendar size={20} color={colors.icon} />;
      case "issueReport":
      case "issue":
        return <AlertCircle size={20} color={colors.icon} />;
      default:
        return <Clock size={20} color={colors.icon} />;
    }
  };

  const getStatusColor = (status: ProfileData["profile"]["status"]) => {
    switch (status) {
      case "checkedIn":
        return "#4CAF50";
      case "onLeave":
        return "#FFA726";
      case "checkedOut":
        return "#F44336";
      default:
        return colors.icon;
    }
  };

  if (isLoading) {
    return <ProfileScreenSkeleton />;
  }

  if (isError || !profileData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            {error?.response?.data?.message || "Failed to load profile data"}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={handleHardRefresh}
          >
            <RefreshCw size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.retryButtonText}>Reload Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerCirclePattern}>
          {[...Array(8)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.circle,
                {
                  top: Math.random() * 200,
                  left: Math.random() * width,
                  opacity: Math.random() * 0.2,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.profileImageContainer}>
          <Image
            source={{
              uri:
                profileData.profile.profilePicture ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  `${profileData.profile.firstName} ${profileData.profile.lastName}`
                )}&background=random`,
            }}
            style={styles.profileImage}
          />
          {profileData.profile.role === "hr" && (
            <View style={styles.hrBadge}>
              <ShieldAlert size={14} color="#FFF" />
            </View>
          )}
        </View>

        <Text style={styles.name}>
          {profileData.profile.firstName} {profileData.profile.lastName}
        </Text>

        <View style={styles.jobContainer}>
          <Briefcase
            size={16}
            color="rgba(255,255,255,0.9)"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.jobTitle}>
            {profileData.profile.job || profileData.profile.role}
          </Text>
        </View>

        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: getStatusColor(profileData.profile.status) },
            ]}
          />
          <Text style={styles.statusText}>
            {profileData.profile.status === "checkedIn"
              ? "Checked In"
              : profileData.profile.status === "onLeave"
              ? "On Leave"
              : "Checked Out"}
          </Text>
        </View>

        {isCurrentUserHR && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.actionButton}>
              <MessageCircle size={20} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Phone size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}
      >
        {/* Stats Cards - Only visible to HR */}
        {isCurrentUserHR && (
          <View style={styles.statsContainer}>
            {[
              {
                value: profileData.stats.tasksCompleted,
                label: "Tasks Done",
                icon: <ClipboardList size={24} color={colors.tint} />,
              },
              {
                value: `${profileData.stats.attendance}%`,
                label: "Attendance",
                icon: <Calendar size={24} color={colors.tint} />,
              },
              {
                value: profileData.stats.leavesTaken,
                label: "Leaves",
                icon: <FileText size={24} color={colors.tint} />,
              },
            ].map((stat, index) => (
              <View
                key={index}
                style={[
                  styles.statsCard,
                  { backgroundColor: colors.cardBackground },
                ]}
              >
                {stat.icon}
                <Text style={[styles.statValue, { color: colors.text }]}>
                  {stat.value}
                </Text>
                <Text style={[styles.statLabel, { color: colors.icon }]}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Personal Info Section */}
        <View
          style={[styles.section, { backgroundColor: colors.cardBackground }]}
        >
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Personal Information
          </Text>

          <View style={styles.infoGrid}>
            {[
              {
                icon: <Mail size={20} color={colors.icon} />,
                label: "Email",
                value: profileData.profile.email,
              },
              {
                icon: <Briefcase size={20} color={colors.icon} />,
                label: "Job Title",
                value: profileData.profile.job || "Not specified",
              },
              {
                icon: <Building2 size={20} color={colors.icon} />,
                label: "Role",
                value:
                  profileData.profile.role === "hr" ? "HR Admin" : "Employee",
              },
              {
                icon: <Calendar size={20} color={colors.icon} />,
                label: "Joined",
                value: format(
                  new Date(profileData.profile.createdAt),
                  "MMM yyyy"
                ),
              },
              // Location only visible to HR users
              ...(isCurrentUserHR && profileData.profile.checkInLocation
                ? [
                    {
                      icon: <MapPin size={20} color={colors.icon} />,
                      label: "Location",
                      value: `Lat: ${profileData.profile.checkInLocation.latitude}, Lng: ${profileData.profile.checkInLocation.longitude}`,
                    },
                  ]
                : isCurrentUserHR
                ? [
                    {
                      icon: <MapPin size={20} color={colors.icon} />,
                      label: "Location",
                      value: "Not Available",
                    },
                  ]
                : []),
            ].map((item, index) => (
              <View key={index} style={styles.infoItem}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${colors.tint}10` },
                  ]}
                >
                  {item.icon}
                </View>
                <View style={styles.infoContent}>
                  <Text style={[styles.infoLabel, { color: colors.icon }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.infoText, { color: colors.text }]}>
                    {item.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Activity Section - Only visible to HR */}
        {isCurrentUserHR && (
          <View
            style={[styles.section, { backgroundColor: colors.cardBackground }]}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Recent Activity
            </Text>

            {profileData.recentActivities.length === 0 ? (
              <View style={styles.emptyActivities}>
                <Clock size={32} color={`${colors.icon}50`} />
                <Text style={[styles.emptyText, { color: colors.icon }]}>
                  No recent activities
                </Text>
              </View>
            ) : (
              profileData.recentActivities.map((activity, index) => (
                <View
                  key={activity.id}
                  style={[
                    styles.activityItem,
                    index < profileData.recentActivities.length - 1 &&
                      styles.activityBorder,
                  ]}
                >
                  <View
                    style={[
                      styles.activityIcon,
                      { backgroundColor: `${colors.tint}10` },
                    ]}
                  >
                    {getActivityIcon(activity.type)}
                  </View>
                  <View style={styles.activityContent}>
                    <Text
                      style={[styles.activityTitle, { color: colors.text }]}
                    >
                      {activity.title}
                    </Text>
                    <Text style={[styles.activityTime, { color: colors.icon }]}>
                      {format(new Date(activity.createdAt), "MMM dd, yyyy")}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.activityStatus,
                      { backgroundColor: `${colors.tint}15` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.activityStatusText,
                        { color: colors.tint },
                      ]}
                    >
                      {activity.status}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.refreshButton,
            { backgroundColor: colors.cardBackground },
          ]}
          onPress={handleHardRefresh}
        >
          <RefreshCw size={18} color={colors.tint} />
          <Text style={[styles.refreshButtonText, { color: colors.tint }]}>
            Refresh Data
          </Text>
        </TouchableOpacity>

        {/* Delete User Button - Only visible to HR */}
        {isCurrentUserHR && (
          <TouchableOpacity
            style={[
              styles.deleteButton,
              { backgroundColor: colors.cardBackground },
            ]}
            onPress={handleDeleteUser}
          >
            <UserX size={20} color="#FF4B4B" />
            <Text style={styles.deleteText}>Deactivate User</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <UserX size={40} color="#FF4B4B" style={styles.modalIcon} />
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Deactivate User
            </Text>
            <Text style={[styles.modalText, { color: colors.icon }]}>
              Are you sure you want to deactivate{" "}
              {profileData.profile.firstName} {profileData.profile.lastName}?
              This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  { borderColor: colors.borderColor || "#E5E5E5" },
                ]}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text style={{ color: colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmDeleteUser}
              >
                <Text style={{ color: "#FFF" }}>Deactivate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingTop: 0,
    alignItems: "center",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
    zIndex: 1,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  scrollContent: {
    flex: 1,
    marginBottom: 40,
  },
  scrollContentContainer: {
    paddingTop: 32,
    paddingBottom: 24,
  },
  headerCirclePattern: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  circle: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#fff",
  },
  profileImageContainer: {
    marginTop: 30,
    marginBottom: 16,
    position: "relative",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.2)",
  },
  hrBadge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    backgroundColor: "#FF4B4B",
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 4,
  },
  jobContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 16,
    gap: 16,
  },
  actionButton: {
    backgroundColor: "rgba(255,255,255,0.2)",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  section: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: "column",
    gap: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  infoText: {
    fontSize: 15,
    fontWeight: "500",
  },
  emptyActivities: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  activityBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
  },
  activityStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  activityStatusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    margin: 16,
    marginBottom: 0,
    padding: 14,
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
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    margin: 16,
    marginTop: 12,
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
  },
  deleteText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF4B4B",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "90%",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 12,
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    backgroundColor: "#FF4B4B",
  },
});

export default UserProfileViewScreen;
