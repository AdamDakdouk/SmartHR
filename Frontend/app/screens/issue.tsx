import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { ScreenHeader } from "@/components/navigation/Header";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import api from "@/api/Api";

const ReportIssueScreen = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");

  // Report issue mutation - directly call the API to match the backend expectations
  const reportIssueMutation = useMutation({
    mutationFn: () => {
      if (!user?.id) throw new Error("User not authenticated");

      // Call the API directly to ensure we send the correct parameters
      return api.post("/issues", {
        reportedBy: user.id,
        title: title.trim(),
        description: description.trim(),
        priority: priority,
      });
    },
    onSuccess: () => {
      Toast.show({
        type: "success",
        text1: "Issue reported successfully",
        text2: "Our HR team will review your issue shortly",
      });
      resetForm();
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Failed to report issue",
        text2:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("medium");
  };

  const submitIssue = () => {
    if (!title.trim()) {
      Toast.show({
        type: "error",
        text1: "Title is required",
        text2: "Please provide a title for your issue",
      });
      return;
    }

    if (!description.trim()) {
      Toast.show({
        type: "error",
        text1: "Description is required",
        text2: "Please describe your issue in detail",
      });
      return;
    }

    reportIssueMutation.mutate();
  };

  const renderPriorityButton = (
    value: "low" | "medium" | "high",
    label: string,
    icon: string
  ) => {
    const isSelected = priority === value;
    let bgColor;
    let textColor;

    if (isSelected) {
      // Selected colors based on priority
      switch (value) {
        case "low":
          bgColor = "#4CAF5020";
          textColor = "#4CAF50";
          break;
        case "medium":
          bgColor = "#FF980020";
          textColor = "#FF9800";
          break;
        case "high":
          bgColor = "#F4433620";
          textColor = "#F44336";
          break;
      }
    } else {
      // Unselected colors
      bgColor = colorScheme === "dark" ? "#3A3F5530" : "#E4E7EB50";
      textColor = themeColors.icon;
    }

    return (
      <TouchableOpacity
        style={[styles.priorityButton, { backgroundColor: bgColor }]}
        onPress={() => setPriority(value)}
      >
        <FontAwesome5
          name={icon}
          size={16}
          color={textColor}
          style={styles.priorityIcon}
        />
        <Text style={[styles.priorityButtonText, { color: textColor }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <ScreenHeader
        title="Report Issue"
        subtitle="Let us know if you're having any problems"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidContainer}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formContainer}>
            <Text style={[styles.label, { color: themeColors.text }]}>
              Issue Title
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.cardBackground,
                  color: themeColors.text,
                  borderColor: themeColors.borderColor,
                },
              ]}
              placeholder="Briefly describe the issue"
              placeholderTextColor={themeColors.icon}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={[styles.label, { color: themeColors.text }]}>
              Description
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.descriptionInput,
                {
                  backgroundColor: themeColors.cardBackground,
                  color: themeColors.text,
                  borderColor: themeColors.borderColor,
                },
              ]}
              placeholder="Provide details about the issue"
              placeholderTextColor={themeColors.icon}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
            />

            <Text style={[styles.label, { color: themeColors.text }]}>
              Priority
            </Text>
            <View style={styles.priorityContainer}>
              {renderPriorityButton("low", "Low", "thermometer-empty")}
              {renderPriorityButton("medium", "Medium", "thermometer-half")}
              {renderPriorityButton("high", "High", "thermometer-full")}
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: themeColors.buttonBackground },
              ]}
              onPress={submitIssue}
              disabled={reportIssueMutation.isPending}
            >
              {reportIssueMutation.isPending ? (
                <ActivityIndicator color={themeColors.buttonText} />
              ) : (
                <Text
                  style={[
                    styles.submitButtonText,
                    { color: themeColors.buttonText },
                  ]}
                >
                  Submit Issue
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  formContainer: {
    marginTop: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    fontSize: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  descriptionInput: {
    minHeight: 120,
    paddingTop: 16,
  },
  priorityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  priorityButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  priorityIcon: {
    marginRight: 6,
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
});

export default ReportIssueScreen;
