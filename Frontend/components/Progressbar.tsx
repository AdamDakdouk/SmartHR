// components/StepProgressBar.tsx
import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

const { width } = Dimensions.get("window");

interface StepProgressBarProps {
  currentStep: number;
  totalSteps: number;
}

const StepProgressBar: React.FC<StepProgressBarProps> = ({
  currentStep,
  totalSteps,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const steps = ["Personal Info", "Security"];

  return (
    <View style={styles.container}>
      <View style={styles.stepsContainer}>
        {steps.map((step, index) => {
          const isActive = index + 1 === currentStep;
          const isCompleted = index + 1 < currentStep;

          return (
            <View key={step} style={styles.stepWrapper}>
              <View style={styles.stepIndicatorRow}>
                {index > 0 && (
                  <View
                    style={[
                      styles.line,
                      {
                        backgroundColor: isCompleted
                          ? themeColors.tint
                          : themeColors.borderColor,
                      },
                    ]}
                  />
                )}
                <View
                  style={[
                    styles.stepIndicator,
                    {
                      backgroundColor:
                        isActive || isCompleted
                          ? themeColors.tint
                          : "transparent",
                      borderColor:
                        isActive || isCompleted
                          ? themeColors.tint
                          : themeColors.borderColor,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stepNumber,
                      {
                        color:
                          isActive || isCompleted
                            ? themeColors.buttonText
                            : themeColors.text,
                      },
                    ]}
                  >
                    {index + 1}
                  </Text>
                </View>
                {index < steps.length - 1 && (
                  <View
                    style={[
                      styles.line,
                      {
                        backgroundColor: isCompleted
                          ? themeColors.tint
                          : themeColors.borderColor,
                      },
                    ]}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.stepText,
                  {
                    color: isActive ? themeColors.tint : themeColors.icon,
                  },
                ]}
              >
                {step}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width - 40,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  stepsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  stepWrapper: {
    alignItems: "center",
    flex: 1,
  },
  stepIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
    marginBottom: 8,
  },
  stepIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: "600",
  },
  stepText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  line: {
    height: 2,
    flex: 1,
  },
});

export default StepProgressBar;
