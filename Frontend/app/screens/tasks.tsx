import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Animated,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { ScreenHeader } from "@/components/navigation/Header";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import Toast from "react-native-toast-message";
import { AxiosError } from "axios";
import {
  getTasksForEmployee,
  updateTaskStatus,
  updateTaskProgress,
  updateTask,
  TaskStatus,
} from "@/api/Tasks";
import TaskSkeleton from "@/components/TasksSkeletonLoading";
import { FontAwesome5 } from "@expo/vector-icons";

interface Task {
  _id: string;
  title: string;
  status: TaskStatus;
  progress: number;
  dueDate?: string;
  assignedTo: string;
}

interface ApiErrorResponse {
  message?: string;
  errors?: { [key: string]: string };
}

const { width } = Dimensions.get("window");

const Tasks: React.FC = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [refreshing, setRefreshing] = useState(false);
  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [progressValue, setProgressValue] = useState("0");

  // Optimized fetch tasks query
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: () => getTasksForEmployee(),
    select: (data) =>
      data.map((task: Task) => ({
        ...task,
        progress: task.progress || getProgressByStatus(task.status),
      })),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    queryClient
      .invalidateQueries({ queryKey: ["tasks", user?.id] })
      .then(() => setRefreshing(false));
  }, [user?.id]);

  const getProgressByStatus = (status: TaskStatus): number => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return 100;
      case TaskStatus.IN_PROGRESS:
        return 60;
      case TaskStatus.PENDING:
        return 0;
      default:
        return 0;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.COMPLETED:
        return "#4CAF50";
      case TaskStatus.IN_PROGRESS:
        return themeColors.tint;
      case TaskStatus.PENDING:
        return "#FFA726";
      default:
        return themeColors.icon;
    }
  };

  const formatStatus = (status: TaskStatus): string => {
    switch (status) {
      case TaskStatus.IN_PROGRESS:
        return "In Progress";
      case TaskStatus.COMPLETED:
        return "Completed";
      case TaskStatus.PENDING:
        return "Pending";
      default:
        return status;
    }
  };

  const updateTaskMutation = useMutation<
    Task,
    AxiosError<ApiErrorResponse>,
    { taskId: string; status: TaskStatus }
  >({
    mutationFn: ({ taskId, status }) => {
      // Using the updated API function that properly formats the request
      return updateTaskStatus({ taskId, status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setStatusModalVisible(false);
      Toast.show({
        type: "success",
        text1: "Task status updated successfully",
        position: "bottom",
        visibilityTime: 3000,
      });
    },
    onError: (error) => {
      console.error("Status update error:", error);
      Toast.show({
        type: "error",
        text1: "Failed to update task status",
        text2: error.response?.data?.message || "Something went wrong",
        position: "bottom",
        visibilityTime: 4000,
      });
    },
  });

  // Add progress update mutation
  const updateProgressMutation = useMutation<
    Task,
    AxiosError<ApiErrorResponse>,
    { taskId: string; progress: number; currentStatus: TaskStatus }
  >({
    mutationFn: async ({ taskId, progress, currentStatus }) => {
      // First update the progress
      const result = await updateTaskProgress(taskId, progress);

      // If status is pending and progress is updated, automatically change status to in_progress
      if (currentStatus === TaskStatus.PENDING && progress > 0) {
        await updateTaskStatus({
          taskId,
          status: TaskStatus.IN_PROGRESS,
        });
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setProgressModalVisible(false);
      setSelectedTask(null);
      Toast.show({
        type: "success",
        text1: "Progress updated successfully",
        position: "bottom",
        visibilityTime: 3000,
      });
    },
    onError: (error) => {
      console.error("Progress update error:", error);
      Toast.show({
        type: "error",
        text1: "Failed to update progress",
        text2: error.response?.data?.message || "Something went wrong",
        position: "bottom",
        visibilityTime: 4000,
      });
    },
  });

  const openStatusModal = (task: Task) => {
    setSelectedTask(task);
    setStatusModalVisible(true);
  };

  const openProgressModal = (task: Task) => {
    setSelectedTask(task);
    setProgressValue(task.progress.toString());
    setProgressModalVisible(true);
  };

  const handleStatusUpdate = (status: TaskStatus) => {
    if (!selectedTask) return;

    updateTaskMutation.mutate({
      taskId: selectedTask._id,
      status,
    });
  };

  const handleProgressUpdate = () => {
    if (!selectedTask) return;

    const progress = parseInt(progressValue);
    if (isNaN(progress) || progress < 0 || progress > 100) {
      Toast.show({
        type: "error",
        text1: "Invalid progress value",
        text2: "Progress must be between 0 and 100",
        position: "bottom",
        visibilityTime: 3000,
      });
      return;
    }

    updateProgressMutation.mutate({
      taskId: selectedTask._id,
      progress,
      currentStatus: selectedTask.status,
    });
  };

  const renderTask = ({ item }: { item: Task }) => (
    <Animated.View style={styles.taskCardContainer}>
      <View
        style={[
          styles.taskCard,
          { backgroundColor: themeColors.cardBackground },
        ]}
      >
        <View style={styles.taskHeader}>
          <View style={styles.taskTitleContainer}>
            <Text style={[styles.taskTitle, { color: themeColors.text }]}>
              {item.title}
            </Text>
            <Text style={[styles.dueDate, { color: themeColors.icon }]}>
              {item.dueDate}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => openStatusModal(item)}
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(item.status)}15` },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {formatStatus(item.status)}
            </Text>
            <FontAwesome5
              name="chevron-down"
              size={10}
              color={getStatusColor(item.status)}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.progressSection}>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: `${themeColors.tint}15` },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${item.progress}%`,
                  backgroundColor: getStatusColor(item.status),
                },
              ]}
            />
          </View>
          <View style={styles.progressTextContainer}>
            <Text style={[styles.progressText, { color: themeColors.icon }]}>
              {item.progress}% Complete
            </Text>
            <TouchableOpacity
              style={styles.updateProgressButton}
              onPress={() => openProgressModal(item)}
            >
              <FontAwesome5 name="edit" size={14} color={themeColors.tint} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  // Progress Update Modal
  const renderProgressModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={progressModalVisible}
      onRequestClose={() => setProgressModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: themeColors.cardBackground },
          ]}
        >
          <Text style={[styles.modalTitle, { color: themeColors.text }]}>
            Update Progress
          </Text>

          {selectedTask && (
            <Text style={[styles.taskName, { color: themeColors.text }]}>
              {selectedTask.title}
            </Text>
          )}

          <View style={styles.progressInputContainer}>
            <TextInput
              style={[
                styles.progressInput,
                {
                  color: themeColors.text,
                  borderColor: themeColors.borderColor || "#ccc",
                },
              ]}
              value={progressValue}
              onChangeText={setProgressValue}
              keyboardType="numeric"
              placeholder="Enter progress (0-100)"
              placeholderTextColor={themeColors.icon}
            />
            <Text style={[styles.percentSign, { color: themeColors.icon }]}>
              %
            </Text>
          </View>

          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setProgressModalVisible(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.updateButton,
                { backgroundColor: themeColors.tint },
              ]}
              onPress={handleProgressUpdate}
              disabled={updateProgressMutation.isPending}
            >
              {updateProgressMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Update</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Status Update Modal
  const renderStatusModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={statusModalVisible}
      onRequestClose={() => setStatusModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: themeColors.cardBackground },
          ]}
        >
          <Text style={[styles.modalTitle, { color: themeColors.text }]}>
            Update Status
          </Text>

          {selectedTask && (
            <Text style={[styles.taskName, { color: themeColors.text }]}>
              {selectedTask.title}
            </Text>
          )}

          <View style={styles.statusOptions}>
            {[
              TaskStatus.PENDING,
              TaskStatus.IN_PROGRESS,
              TaskStatus.COMPLETED,
            ].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusOption,
                  {
                    backgroundColor:
                      selectedTask?.status === status
                        ? `${getStatusColor(status)}30`
                        : "transparent",
                    borderColor: getStatusColor(status),
                  },
                ]}
                onPress={() => handleStatusUpdate(status)}
              >
                <View
                  style={[
                    styles.statusOptionDot,
                    {
                      backgroundColor: getStatusColor(status),
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.statusOptionText,
                    { color: getStatusColor(status) },
                  ]}
                >
                  {formatStatus(status)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.closeButton, { backgroundColor: "#E0E0E0" }]}
            onPress={() => setStatusModalVisible(false)}
          >
            <Text style={[styles.closeButtonText, { color: "#333" }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (isLoading) {
    return (
      <SafeAreaView
        style={[{ flex: 1, backgroundColor: themeColors.background }]}
      >
        <ScreenHeader title="My Tasks" subtitle="Loading your tasks..." />
        <TaskSkeleton themeColors={themeColors} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <ScreenHeader
        title="My Tasks"
        subtitle={`You have ${
          tasks.filter(
            (t: { status: TaskStatus }) => t.status !== TaskStatus.COMPLETED
          ).length
        } tasks remaining`}
      />

      <LinearGradient
        colors={[themeColors.gradientStart, themeColors.gradientEnd]}
        style={styles.statsCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {
                tasks.filter(
                  (t: { status: TaskStatus }) =>
                    t.status === TaskStatus.COMPLETED
                ).length
              }
            </Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {
                tasks.filter(
                  (t: { status: TaskStatus }) =>
                    t.status === TaskStatus.IN_PROGRESS
                ).length
              }
            </Text>
            <Text style={styles.statLabel}>In Progress</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {
                tasks.filter(
                  (t: { status: TaskStatus }) => t.status === TaskStatus.PENDING
                ).length
              }
            </Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
      </LinearGradient>

      <FlatList
        data={tasks}
        renderItem={renderTask}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.taskList}
        showsVerticalScrollIndicator={false}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />

      {renderProgressModal()}
      {renderStatusModal()}
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    opacity: 0.8,
  },
  statsCard: {
    borderRadius: 24,
    marginBottom: 24,
    padding: 24,
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
  taskList: {
    paddingBottom: 80,
  },
  taskCardContainer: {
    marginBottom: 16,
  },
  taskCard: {
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  taskTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  dueDate: {
    fontSize: 14,
    opacity: 0.7,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    marginRight: 4,
  },
  progressSection: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressText: {
    fontSize: 12,
  },
  updateProgressButton: {
    padding: 6,
  },
  addButtonContainer: {
    position: "absolute",
    bottom: 24,
    right: 24,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  // Progress Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: width * 0.8,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  taskName: {
    fontSize: 16,
    marginBottom: 16,
    textAlign: "center",
  },
  progressInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  progressInput: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  percentSign: {
    fontSize: 16,
    marginLeft: 8,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: "#E0E0E0",
  },
  updateButton: {
    backgroundColor: "#2196F3",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  // Status Modal styles
  statusOptions: {
    marginBottom: 20,
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  statusOptionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  statusOptionText: {
    fontSize: 16,
    fontWeight: "500",
  },
  closeButton: {
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Tasks;
