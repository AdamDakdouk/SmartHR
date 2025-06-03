import React, { useState, useCallback, useEffect, useMemo } from "react";
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
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  Mail,
  MapPin,
  FileText,
  Briefcase,
  Building2,
  Calendar,
  Clock,
  Upload,
  ClipboardList,
  AlertCircle,
  LogOut,
  RefreshCw,
  Camera,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { format } from "date-fns";
import { AxiosError } from "axios";
import {
  getEmployeeProfile,
  updateProfilePicture,
  updateEmployeeProfileInfo,
} from "@/api/Profile";
import ProfileScreenSkeleton from "@/components/ProfileScreenSkeleton";
import { BlurView } from "expo-blur";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");
const PROFILE_CACHE_KEY = "profile_image_cache";

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

// Define our own FileInfo interface with required properties
interface EnhancedFileInfo {
  exists: boolean;
  uri: string;
  size?: number;
  isDirectory?: boolean;
  modificationTime?: number;
  md5?: string;
}

// Combined type that works for both platforms
type ImageAsset =
  | ImagePicker.ImagePickerAsset
  | { uri: string; type: string; name: string };

const ProfileScreen: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [forceRefresh, setForceRefresh] = useState(false);
  const [cachedImageUri, setCachedImageUri] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  // Load cached image on component mount
  useEffect(() => {
    const loadCachedImage = async () => {
      try {
        const cachedUri = await AsyncStorage.getItem(
          `${PROFILE_CACHE_KEY}_${user?.id}`
        );
        if (cachedUri) {
          setCachedImageUri(cachedUri);
        }
      } catch (error) {
        console.log("Error loading cached image:", error);
      }
    };

    loadCachedImage();
  }, [user?.id]);

  // Fixed Profile query with correct type annotations for onSuccess
  const {
    data: profileData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<ProfileData, AxiosError<ApiErrorResponse>, ProfileData>({
    queryKey: ["profile", user?.id, forceRefresh],
    queryFn: () => getEmployeeProfile(user?.id),
    enabled: !!user?.id,
    retry: 3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
    staleTime: 60000,
    gcTime: 300000,
  });

  // Handle caching profile picture when data changes
  useEffect(() => {
    const cacheProfilePicture = async () => {
      if (profileData?.profile?.profilePicture && user?.id) {
        try {
          await AsyncStorage.setItem(
            `${PROFILE_CACHE_KEY}_${user.id}`,
            profileData.profile.profilePicture
          );
        } catch (e) {
          console.log("Error caching profile image:", e);
        }
      }
    };

    cacheProfilePicture();
  }, [profileData?.profile?.profilePicture, user?.id]);

  // Handle manual hard refresh
  const handleHardRefresh = useCallback(() => {
    setForceRefresh((prev) => !prev);
    setRetryCount(retryCount + 1);
    Toast.show({
      type: "info",
      text1: "Refreshing profile data...",
    });
  }, [retryCount]);

  // Get optimized image picker options based on platform
  const getImagePickerOptions =
    useCallback((): ImagePicker.ImagePickerOptions => {
      const baseOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1] as [number, number],
        quality: 0.6, // Reduced quality for faster uploads
      };

      // Add platform-specific options
      if (Platform.OS === "web") {
        return {
          ...baseOptions,
          exif: false, // Reduces data size on web
        };
      } else {
        return {
          ...baseOptions,
          // Mobile-specific optimizations
          allowsMultipleSelection: false,
        };
      }
    }, []);

  // Prepare image for upload based on platform
  const prepareImageForUpload = async (
    result: ImagePicker.ImagePickerResult
  ): Promise<ImageAsset | null> => {
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];

    if (Platform.OS === "web") {
      // Web handling
      // Get file extension
      const uriParts = asset.uri.split(".");
      const fileType = uriParts[uriParts.length - 1];

      // Create a proper structure for web upload
      return {
        uri: asset.uri,
        type: `image/${fileType}`,
        name: `profile-picture.${fileType}`,
      };
    } else {
      // For mobile, check file size and resize if needed
      try {
        // Fixed using the enhanced FileInfo type
        const fileInfo = (await FileSystem.getInfoAsync(
          asset.uri
        )) as EnhancedFileInfo;

        // If file is too large (> 1MB), resize it
        if (fileInfo.size && fileInfo.size > 1024 * 1024) {
          // We're just simulating compression here
          // In a real app, you'd use a library like react-native-image-manipulator
          console.log("File is large, would compress in real implementation");
        }

        return asset;
      } catch (error) {
        console.error("Error preparing image:", error);
        return asset; // Fallback to original asset
      }
    }
  };

  // Update profile picture mutation
  const updatePictureMutation = useMutation<
    { profile: ProfileData["profile"] },
    AxiosError<ApiErrorResponse>,
    ImageAsset
  >({
    mutationFn: (imageAsset) => {
      if (!user?.id) throw new Error("User ID is required");
      return updateProfilePicture(user.id, imageAsset);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });

      // Cache the new profile picture URL
      if (data?.profile?.profilePicture && user?.id) {
        AsyncStorage.setItem(
          `${PROFILE_CACHE_KEY}_${user.id}`,
          data.profile.profilePicture
        );
        setCachedImageUri(data.profile.profilePicture);
      }

      Toast.show({
        type: "success",
        text1: "Profile picture updated successfully",
      });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      Toast.show({
        type: "error",
        text1: "Failed to update profile picture",
        text2: error.response?.data?.message || "Something went wrong",
      });
    },
  });

  const handleImagePick = async () => {
    try {
      // Show feedback that button was pressed
      Toast.show({
        type: "info",
        text1: "Opening gallery...",
        position: "bottom",
        visibilityTime: 1000,
      });

      // Request permissions based on platform
      if (Platform.OS !== "web") {
        const { status } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "Sorry, we need camera roll permission to upload images."
          );
          return;
        }
      }

      // Launch image picker with optimized options
      const result = await ImagePicker.launchImageLibraryAsync(
        getImagePickerOptions()
      );

      // Prepare the image for upload (resize/compress if needed)
      const preparedImage = await prepareImageForUpload(result);

      if (preparedImage) {
        // Set local optimistic update for faster UI feedback
        if ("uri" in preparedImage) {
          setCachedImageUri(preparedImage.uri);
        }

        // Trigger the mutation
        updatePictureMutation.mutate(preparedImage);
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to pick image",
        text2:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

  // Handle platform-specific camera access
  const handleCameraCapture = async () => {
    try {
      // Show feedback that button was pressed
      Toast.show({
        type: "info",
        text1: "Opening camera...",
        position: "bottom",
        visibilityTime: 1000,
      });

      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "Sorry, we need camera permission to take photos."
          );
          return;
        }

        const result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.6,
        });

        const preparedImage = await prepareImageForUpload(result);

        if (preparedImage) {
          if ("uri" in preparedImage) {
            setCachedImageUri(preparedImage.uri);
          }
          updatePictureMutation.mutate(preparedImage);
        }
      } else {
        Alert.alert(
          "Not Supported",
          "Camera capture is not supported in web browser"
        );
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to capture image",
        text2:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  };

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

  // Memoized profile image uri to prevent unnecessary re-renders
  const profileImageUri = useMemo(() => {
    // Use cached image if available and no new data
    if (
      cachedImageUri &&
      (!profileData || !profileData.profile.profilePicture)
    ) {
      return cachedImageUri;
    }

    // Otherwise use the latest from API data
    if (profileData?.profile?.profilePicture) {
      return profileData.profile.profilePicture;
    }

    // Fallback to generated avatar
    if (profileData?.profile) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(
        `${profileData.profile.firstName} ${profileData.profile.lastName}`
      )}&background=random`;
    }

    return null;
  }, [profileData, cachedImageUri]);

  // Reset image loading state when image uri changes
  useEffect(() => {
    if (profileImageUri) {
      setImageLoading(true);
    }
  }, [profileImageUri]);

  if (isLoading) {
    return <ProfileScreenSkeleton />;
  }

  if (isError || !profileData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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

        <View style={styles.profileContainer}>
          <View style={styles.profileImageContainer}>
            {/* Low resolution placeholder while loading */}
            {imageLoading && profileImageUri && (
              <Image
                source={{
                  uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    `${profileData.profile.firstName} ${profileData.profile.lastName}`
                  )}&background=random&size=50`,
                }}
                style={[styles.profileImage, { position: "absolute" }]}
                blurRadius={Platform.OS === "ios" ? 15 : 5}
              />
            )}

            {/* High resolution main image */}
            {profileImageUri && (
              <Image
                source={{ uri: profileImageUri }}
                style={styles.profileImage}
                onLoadStart={() => setImageLoading(true)}
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
                // Add caching props for better performance
                fadeDuration={300}
              />
            )}

            {/* Show loading indicator while uploading */}
            {updatePictureMutation.isPending && (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator size="large" color="#FFF" />
              </View>
            )}

            {/* Image action buttons - improved positioning and styling */}
            <View style={styles.imageActions}>
              <TouchableOpacity
                style={styles.cameraButton}
                onPress={handleImagePick}
                disabled={updatePictureMutation.isPending}
                activeOpacity={0.7}
              >
                <Upload size={18} color="#FFF" />
              </TouchableOpacity>

              {Platform.OS !== "web" && (
                <TouchableOpacity
                  style={styles.cameraButton}
                  onPress={handleCameraCapture}
                  disabled={updatePictureMutation.isPending}
                  activeOpacity={0.7}
                >
                  <Camera size={18} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
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
        {/* Stats Cards */}
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
                value: profileData.profile.role,
              },
              {
                icon: <Calendar size={20} color={colors.icon} />,
                label: "Joined",
                value: format(
                  new Date(profileData.profile.createdAt),
                  "MMM yyyy"
                ),
              },
              ...(profileData.profile.checkInLocation
                ? [
                    {
                      icon: <MapPin size={20} color={colors.icon} />,
                      label: "Location",
                      value: `Lat: ${profileData.profile.checkInLocation.latitude.toFixed(
                        2
                      )}, Lng: ${profileData.profile.checkInLocation.longitude.toFixed(
                        2
                      )}`,
                    },
                  ]
                : [
                    {
                      icon: <MapPin size={20} color={colors.icon} />,
                      label: "Location",
                      value: "Not Available",
                    },
                  ]),
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

        {/* Recent Activity Section */}
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
                  <Text style={[styles.activityTitle, { color: colors.text }]}>
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
                    style={[styles.activityStatusText, { color: colors.tint }]}
                  >
                    {activity.status}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

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

        <TouchableOpacity
          style={[
            styles.logoutButton,
            { backgroundColor: colors.cardBackground },
          ]}
          onPress={logout}
        >
          <LogOut size={20} color="#FF4B4B" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  header: {
    padding: 24,
    alignItems: "center",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: "hidden",
    zIndex: 1,
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
  profileContainer: {
    alignItems: "center",
    marginBottom: 8,
  },
  profileImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 22, // Added extra space for the buttons below
    alignItems: "center",
    justifyContent: "center",
  },
  imageActions: {
    position: "absolute",
    bottom: -35,
    right:0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  cameraButton: {
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 8,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    marginHorizontal: 4,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    transform: [{ scale: 0.95 }],
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.2)",
  },
  imageLoadingOverlay: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
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
  role: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 16,
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
  logoutButton: {
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
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF4B4B",
  },
});
export default ProfileScreen;
