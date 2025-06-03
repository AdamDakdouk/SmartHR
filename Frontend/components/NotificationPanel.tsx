// components/NotificationPanel.tsx
import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  PanResponder,
  ActivityIndicator,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Modal } from "react-native";
import {
  INotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/api/Notifications";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { AxiosError } from "axios";
import { router } from "expo-router";

const { height } = Dimensions.get("window");
const PANEL_HEIGHT = height * 0.7;

type NotificationPanelProps = {
  visible: boolean;
  onClose: () => void;
  notifications: INotification[];
  isLoading: boolean;
};

const NotificationPanel = ({
  visible,
  onClose,
  notifications,
  isLoading,
}: NotificationPanelProps) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const queryClient = useQueryClient();

  const panY = useRef(new Animated.Value(height)).current;
  const translateY = panY;

  const resetPositionAnim = Animated.timing(panY, {
    toValue: 0,
    duration: 300,
    useNativeDriver: true,
  });

  const closeAnim = Animated.timing(panY, {
    toValue: height,
    duration: 300,
    useNativeDriver: true,
  });

  // Mark single notification as read
  const markReadMutation = useMutation<INotification, AxiosError, string>({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Error",
        text2:
          error.response?.data?.message ||
          "Failed to mark notification as read",
      });
    },
  });

  // Mark all notifications as read
  const markAllReadMutation = useMutation<void, AxiosError>({
    mutationFn: markAllNotificationsAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["unreadCount"] });
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "All notifications marked as read",
      });
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error.response?.data?.message || "Failed to mark all as read",
      });
    },
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => false,
      onPanResponderMove: (_, gestureState) => {
        const newPosition = gestureState.dy;
        if (newPosition > 0) {
          panY.setValue(newPosition);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > PANEL_HEIGHT * 0.3 || gestureState.vy > 0.5) {
          closeAnim.start(() => onClose());
        } else {
          resetPositionAnim.start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      resetPositionAnim.start();
    }
  }, [visible]);

  const getNotificationIcon = (type: INotification["type"]) => {
    switch (type) {
      // Task notifications
      case "TASK_ASSIGNED":
        return "tasks";
      case "TASK_STATUS_UPDATE":
      case "TASK_UPDATE":
      case "TASK_DELETED":
      case "TASK_RESTORED":
        return "clipboard-check";

      // Announcement notifications
      case "ANNOUNCEMENT":
        return "bullhorn";

      // Issue notifications
      case "ISSUE_REPORTED":
        return "exclamation-circle";
      case "ISSUE_STATUS_UPDATE":
        return "check-circle";

      // Leave request notifications
      case "LEAVE_REQUEST_SUBMITTED":
      case "LEAVE_REQUEST_STATUS_UPDATE":
        return "calendar-alt";

      // Vacation request notifications
      case "VACATION_REQUEST_SUBMITTED":
      case "VACATION_REQUEST_STATUS_UPDATE":
        return "umbrella-beach";

      // Salary request notifications
      case "SALARY_REQUEST_SUBMITTED":
      case "SALARY_REQUEST_STATUS_UPDATE":
        return "money-bill-wave";

      // Equipment request notifications
      case "EQUIPMENT_REQUEST_SUBMITTED":
      case "EQUIPMENT_REQUEST_STATUS_UPDATE":
        return "laptop";

      // Other request notifications
      case "OTHER_REQUEST_SUBMITTED":
      case "OTHER_REQUEST_STATUS_UPDATE":
        return "clipboard-list";

      // Check-in notifications
      case "CHECK_IN_SUCCESS":
        return "sign-in-alt";
      case "CHECK_OUT_SUCCESS":
        return "sign-out-alt";
      case "CHECK_IN_REMINDER":
        return "clock";

      // Default
      case "SYSTEM":
      default:
        return "bell";
    }
  };

  const handleNotificationPress = (notification: INotification) => {
    if (!notification.isRead) {
      markReadMutation.mutate(notification._id);
    }

    // Close notification panel
    onClose();

    // For navigation, you can add logic here later when your routes are set up
    console.log(
      "Notification pressed:",
      notification.type,
      notification.relatedId
    );
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.overlayBackground} />
        </TouchableOpacity>

        <Animated.View
          style={[
            styles.container,
            {
              backgroundColor: themeColors.cardBackground,
              transform: [{ translateY: translateY }],
            },
          ]}
        >
          <View {...panResponder.panHandlers}>
            <View style={styles.dragIndicator} />
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={[styles.title, { color: themeColors.text }]}>
                  Notifications
                </Text>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {notifications.filter((n) => !n.isRead).length}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleMarkAllRead}
                style={[
                  styles.markAllButton,
                  {
                    backgroundColor: `${themeColors.tint}15`,
                    opacity: markAllReadMutation.isPending ? 0.5 : 1,
                  },
                ]}
                disabled={markAllReadMutation.isPending}
              >
                {markAllReadMutation.isPending ? (
                  <ActivityIndicator size="small" color={themeColors.tint} />
                ) : (
                  <Text
                    style={[styles.markAllText, { color: themeColors.tint }]}
                  >
                    Mark all as read
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.notificationList}
            bounces={false}
            onScrollEndDrag={({ nativeEvent }) => {
              if (nativeEvent.contentOffset.y < -50) {
                closeAnim.start(() => onClose());
              }
            }}
          >
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={themeColors.tint} />
              </View>
            ) : notifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <FontAwesome5
                  name="bell-slash"
                  size={24}
                  color={themeColors.icon}
                />
                <Text style={[styles.emptyText, { color: themeColors.text }]}>
                  No notifications yet
                </Text>
              </View>
            ) : (
              notifications.map((notification) => (
                <TouchableOpacity
                  key={notification._id}
                  style={[
                    styles.notificationItem,
                    !notification.isRead && styles.unreadNotification,
                  ]}
                  onPress={() => handleNotificationPress(notification)}
                  disabled={markReadMutation.isPending}
                >
                  <View
                    style={[
                      styles.notificationIconContainer,
                      { backgroundColor: `${themeColors.tint}15` },
                    ]}
                  >
                    <FontAwesome5
                      name={getNotificationIcon(notification.type)}
                      size={16}
                      color={themeColors.tint}
                    />
                  </View>
                  <View style={styles.notificationContent}>
                    <Text
                      style={[
                        styles.notificationTitle,
                        { color: themeColors.text },
                        !notification.isRead && styles.unreadText,
                      ]}
                    >
                      {notification.title}
                    </Text>
                    <Text
                      style={[
                        styles.notificationMessage,
                        { color: themeColors.icon },
                      ]}
                      numberOfLines={2}
                    >
                      {notification.message}
                    </Text>
                    <Text
                      style={[
                        styles.notificationTime,
                        { color: themeColors.icon },
                      ]}
                    >
                      {new Date(notification.createdAt).toLocaleTimeString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </Animated.View>
      </View>
      <Toast />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    position: "relative",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlayBackground: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: PANEL_HEIGHT,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: "#DDDDDD",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  badge: {
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  badgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  markAllText: {
    fontSize: 12,
    fontWeight: "600",
  },
  notificationList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  unreadNotification: {
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: "700",
  },
  notificationMessage: {
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 8,
  },
});

export default NotificationPanel;
