// components/TaskActionMenu.tsx
import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

interface TaskActionMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  onUpdateStatus: (status: string) => void;
  onUpdateProgress: (progress: number) => void;
  onRestore?: () => void; // Add this optional prop
  currentStatus: string;
  currentProgress: number;
  themeColors: any;
}

export const TaskActionMenu: React.FC<TaskActionMenuProps> = ({
  onEdit,
  onDelete,
  onUpdateStatus,
  onUpdateProgress,
  onRestore, // Add this to destructured props
  currentStatus,
  currentProgress,
  themeColors,
}) => {
  const statusOptions = [
    { label: "Pending", value: "pending" },
    { label: "In Progress", value: "in_progress" },
    { label: "Completed", value: "completed" },
  ];

  const progressOptions = [0, 25, 50, 75, 100];
  return (
    <View style={styles.container}>
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: themeColors.tint }]}
          onPress={onEdit}
        >
          <FontAwesome5 name="edit" size={16} color="#fff" />
        </TouchableOpacity>

        {onRestore ? (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: themeColors.tint }]}
            onPress={onRestore}
          >
            <FontAwesome5 name="undo" size={16} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#dc3545" }]}
            onPress={() => onDelete()}
          >
            <FontAwesome5 name="trash" size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.optionsContainer}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Status
          </Text>
          <View style={styles.optionsRow}>
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor:
                      currentStatus === option.value
                        ? themeColors.tint
                        : `${themeColors.tint}15`,
                  },
                ]}
                onPress={() => onUpdateStatus(option.value)}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color:
                        currentStatus === option.value
                          ? "#fff"
                          : themeColors.text,
                    },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Progress
          </Text>
          <View style={styles.optionsRow}>
            {progressOptions.map((progress) => (
              <TouchableOpacity
                key={progress}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor:
                      currentProgress === progress
                        ? themeColors.tint
                        : `${themeColors.tint}15`,
                  },
                ]}
                onPress={() => onUpdateProgress(progress)}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color:
                        currentProgress === progress
                          ? "#fff"
                          : themeColors.text,
                    },
                  ]}
                >
                  {progress}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  optionsContainer: {
    gap: 12,
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  optionText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
