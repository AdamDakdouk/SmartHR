// screens/TaskManagement.tsx
import React, { useState } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { ScreenHeader } from "@/components/navigation/Header";
import { TaskCard } from "@/components/tasks/TaskCard";
import CreateTaskForm, { TaskFormValues } from "./createTask";
import {
  createTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  updateTaskProgress,
  getAllTasks,
  getTasksStats,
  getDeletedTasks,
  restoreTask,
} from "@/api/Tasks";
import { getAllEmployees } from "@/api/Employees";

const { width } = Dimensions.get("window");
const STAT_CARD_WIDTH = (width - 48) / 2;

const TaskManagement = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [isModalVisible, setModalVisible] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const queryClient = useQueryClient();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  // Queries
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["taskStats"],
    queryFn: getTasksStats,
  });

  const { data: tasks, isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", { deleted: showDeleted }],
    queryFn: () => (showDeleted ? getDeletedTasks() : getAllTasks()),
  });

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: getAllEmployees,
  });

  // Mutations
  const createTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["taskStats"] });
      setModalVisible(false);
      Toast.show({
        type: "success",
        text1: "Task created successfully",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Failed to create task",
        text2: error.message,
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["taskStats"] });
      setSelectedTask(null);
      Toast.show({
        type: "success",
        text1: "Task updated successfully",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Failed to update task",
        text2: error.message,
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["tasks", { deleted: showDeleted }],
      });
      queryClient.invalidateQueries({ queryKey: "tasks" });

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["taskStats"] });
      Toast.show({
        type: "success",
        text1: "Task deleted successfully",
      });
    },
  });

  const restoreTaskMutation = useMutation({
    mutationFn: restoreTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["taskStats"] });
      Toast.show({
        type: "success",
        text1: "Task restored successfully",
      });
    },
  });

  const handleCreateTask = (values: TaskFormValues) => {
    if (selectedTask) {
      updateTaskMutation.mutate({
        id: selectedTask._id,
        updates: {
          ...values,
          dueDate: new Date(values.dueDate),
        },
      });
    } else {
      createTaskMutation.mutate({
        ...values,
        dueDate: new Date(values.dueDate),
        assignedTo: selectedEmployeeId,
      });
    }
    setModalVisible(false);
    setSelectedTask(null);
  };

  const handleUpdateTask = (taskId: string, updates: any) => {
    updateTaskMutation.mutate({ id: taskId, updates });
  };

  const handleDeleteTask = (taskId: string) => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm(
        "Are you sure you want to delete this task?"
      );
      if (confirmed) {
        deleteTaskMutation.mutate(taskId);
      }
    } else {
      Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: () => deleteTaskMutation.mutate(taskId),
          style: "destructive",
        },
      ]);
    }
  };

  const handleRestoreTask = (taskId: string) => {
    restoreTaskMutation.mutate(taskId);
  };

  const renderStatCard = (
    title: string,
    value: number,
    subtitle: string,
    icon: keyof typeof FontAwesome5.glyphMap,
    key: string
  ) => (
    <View
      key={key}
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
      <Text style={[styles.statValue, { color: themeColors.text }]}>
        {value}
      </Text>
      <Text style={[styles.statTitle, { color: themeColors.text }]}>
        {title}
      </Text>
      <Text style={[styles.statSubtitle, { color: themeColors.icon }]}>
        {subtitle}
      </Text>
    </View>
  );

  if (statsLoading || tasksLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <ScreenHeader title="Task Management" subtitle="Loading..." />
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
      <CreateTaskForm
        isVisible={isModalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedTask(null);
          setSelectedEmployeeId("");
        }}
        onSubmit={handleCreateTask}
        employees={employees}
        themeColors={themeColors}
        initialValues={selectedTask}
        selectedEmployeeId={selectedEmployeeId}
        setSelectedEmployeeId={setSelectedEmployeeId}
      />

      <View style={styles.header}>
        <ScreenHeader
          title="Task Management"
          subtitle={`${stats?.statusCounts?.pending || 0} tasks pending`}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.statsContainer}>
          {[
            {
              key: "total-tasks",
              title: "Total Tasks",
              value:
                (stats?.statusCounts?.pending || 0) +
                (stats?.statusCounts?.in_progress || 0) +
                (stats?.statusCounts?.completed || 0),
              subtitle: `${stats?.dueToday || 0} due today`,
              icon: "tasks",
            },
            {
              key: "in-progress",
              title: "In Progress",
              value: stats?.statusCounts?.in_progress || 0,
              subtitle: "Active tasks",
              icon: "clock",
            },
            {
              key: "completed",
              title: "Completed",
              value: stats?.statusCounts?.completed || 0,
              subtitle: "Successfully done",
              icon: "check-circle",
            },
            {
              key: "overdue",
              title: "Overdue",
              value: stats?.overdue || 0,
              subtitle: "Need attention",
              icon: "exclamation-circle",
            },
          ].map((stat) =>
            renderStatCard(
              stat.title,
              stat.value,
              stat.subtitle,
              stat.icon,
              stat.key
            )
          )}
        </View>

        <TouchableOpacity
          style={[styles.toggleButton, { backgroundColor: themeColors.tint }]}
          onPress={() => setShowDeleted(!showDeleted)}
        >
          <Text style={styles.toggleButtonText}>
            {showDeleted ? "Show Active" : "Show Deleted"}
          </Text>
        </TouchableOpacity>
        {!showDeleted && (
          <LinearGradient
            colors={[themeColors.gradientStart, themeColors.gradientEnd]}
            style={styles.createTaskCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.createTaskContent}>
              <View>
                <Text style={styles.createTaskTitle}>Create New Task</Text>
                <Text style={styles.createTaskSubtitle}>
                  Assign tasks to team members
                </Text>
              </View>
              <TouchableOpacity
                style={styles.createTaskButton}
                onPress={() => setModalVisible(true)}
              >
                <FontAwesome5 name="plus" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        )}

        <View style={styles.tasksContainer}>
          {tasks?.map((task: any) => (
            <TaskCard
              key={task._id}
              task={task}
              onEdit={() => {
                setSelectedTask(task);
                setSelectedEmployeeId(task.assignedTo.id); // Set the dropdown value when editing
                setModalVisible(true);
              }}
              onDelete={() => handleDeleteTask(task._id)}
              onUpdateStatus={(status) =>
                handleUpdateTask(task._id, { status })
              }
              onUpdateProgress={(progress) =>
                handleUpdateTask(task._id, { progress })
              }
              onRestore={
                showDeleted ? () => handleRestoreTask(task._id) : undefined
              }
              themeColors={themeColors}
            />
          ))}
        </View>
      </ScrollView>

      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
    width: "90%",
    maxHeight: 100,
    alignContent: "center",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    textAlign: "center",
  },
  toggleButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  createTaskCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
  },
  createTaskContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  createTaskTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  createTaskSubtitle: {
    color: "#fff",
    opacity: 0.8,
    fontSize: 14,
  },
  createTaskButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  tasksContainer: {
    marginBottom: 24,
  },
});

export default TaskManagement;
