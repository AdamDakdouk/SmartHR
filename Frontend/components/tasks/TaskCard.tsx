import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { TaskProgressBar } from "./TaskProgressBar";
import { TaskActionMenu } from "./TaskActionMenu";

interface TaskCardProps {
  task: any;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateStatus: (status: string) => void;
  onUpdateProgress: (progress: number) => void;
  onRestore?: () => void; // Add this optional prop
  themeColors: any;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onDelete,
  onUpdateStatus,
  onUpdateProgress,
  onRestore, // Add this to the destructured props
  themeColors,
}) => {
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: themeColors.cardBackground },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: themeColors.text }]}>
            {task.title}
          </Text>
          <Text style={[styles.subtitle, { color: themeColors.icon }]}>
            Assigned to: {task.assignedTo.firstName} {task.assignedTo.lastName}
          </Text>
        </View>
        <View
          style={[
            styles.priorityBadge,
            { backgroundColor: getPriorityColor(task.priority, themeColors) },
          ]}
        >
          <Text style={styles.priorityText}>{task.priority}</Text>
        </View>
      </View>

      <Text
        style={[styles.description, { color: themeColors.icon }]}
        numberOfLines={2}
      >
        {task.description}
      </Text>

      <TaskProgressBar progress={task.progress} themeColors={themeColors} />

      <View style={styles.footer}>
        <Text style={[styles.dueDate, { color: themeColors.icon }]}>
          Due: {new Date(task.dueDate).toLocaleDateString()}
        </Text>
      </View>

      <TaskActionMenu
        onEdit={onEdit}
        onDelete={() => onDelete()}
        onUpdateStatus={onUpdateStatus}
        onUpdateProgress={onUpdateProgress}
        onRestore={onRestore} // Pass it to the TaskActionMenu
        currentStatus={task.status}
        currentProgress={task.progress}
        themeColors={themeColors}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  dueDate: {
    fontSize: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
});

const getPriorityColor = (priority: string, themeColors: any) => {
  switch (priority) {
    case "high":
      return "#dc3545";
    case "medium":
      return themeColors.tint;
    case "low":
      return "#28a745";
    default:
      return themeColors.icon;
  }
};
