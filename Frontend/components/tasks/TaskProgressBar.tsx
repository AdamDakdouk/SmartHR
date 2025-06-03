import React from "react";
import { View, StyleSheet } from "react-native";

interface TaskProgressBarProps {
  progress: number;
  themeColors: any;
}

export const TaskProgressBar: React.FC<TaskProgressBarProps> = ({
  progress,
  themeColors,
}) => (
  <View
    style={[
      styles.progressContainer,
      { backgroundColor: `${themeColors.tint}15` },
    ]}
  >
    <View
      style={[
        styles.progressBar,
        {
          width: `${progress}%`,
          backgroundColor: themeColors.tint,
        },
      ]}
    />
  </View>
);

const styles = StyleSheet.create({
  progressContainer: {
    height: 6,
    borderRadius: 3,
    marginVertical: 8,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
  },
});
