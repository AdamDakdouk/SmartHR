// LeaveRequestScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import DateTimePicker from "@react-native-community/datetimepicker";
import { submitLeaveRequest, LeaveType } from "@/api/Requests";
import Toast from "react-native-toast-message";

const LeaveRequestScreen = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const { user } = useAuth();
  const [leaveType, setLeaveType] = useState<LeaveType | "">("");
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [reason, setReason] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const leaveTypes = [
    { id: "sick" as LeaveType, label: "Sick Leave", icon: "hospital" },
    { id: "personal" as LeaveType, label: "Personal Leave", icon: "user" },
    {
      id: "emergency" as LeaveType,
      label: "Emergency Leave",
      icon: "exclamation-circle",
    },
  ];

  const handleSubmit = async () => {
    if (!user || !user.id) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "User information not available",
      });
      return;
    }

    if (!leaveType) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Please select a leave type",
      });
      return;
    }

    if (!reason.trim()) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Please provide a reason for your leave",
      });
      return;
    }

    // Validate dates
    if (startDate > endDate) {
      Toast.show({
        type: "error",
        text1: "Invalid Date Range",
        text2: "End date must be after start date",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      await submitLeaveRequest(
        user.id,
        leaveType,
        startDate.toISOString(),
        endDate.toISOString(),
        reason,
        isUrgent
      );

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Leave request submitted successfully",
      });

      // Wait a moment before navigating back
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error("Error submitting leave request:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2:
          error instanceof Error
            ? error.message
            : "Failed to submit leave request",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || startDate;
    setShowStartPicker(Platform.OS === "ios");
    setStartDate(currentDate);
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || endDate;
    setShowEndPicker(Platform.OS === "ios");
    setEndDate(currentDate);
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <FontAwesome5
              name="arrow-left"
              size={20}
              color={themeColors.text}
            />
          </TouchableOpacity>
          <Text style={[styles.title, { color: themeColors.text }]}>
            Leave Request
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Leave Type
          </Text>
          <View style={styles.leaveTypeContainer}>
            {leaveTypes.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={[
                  styles.leaveTypeCard,
                  {
                    backgroundColor: themeColors.cardBackground,
                    borderColor:
                      leaveType === type.id
                        ? themeColors.tint
                        : themeColors.borderColor,
                  },
                ]}
                onPress={() => setLeaveType(type.id)}
              >
                <FontAwesome5
                  name={type.icon}
                  size={24}
                  color={
                    leaveType === type.id ? themeColors.tint : themeColors.icon
                  }
                />
                <Text
                  style={[
                    styles.leaveTypeText,
                    {
                      color:
                        leaveType === type.id
                          ? themeColors.tint
                          : themeColors.text,
                    },
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Date Range
          </Text>

          {/* Start Date Input */}
          <TouchableOpacity
            style={[
              styles.dateInput,
              { backgroundColor: themeColors.cardBackground },
            ]}
            onPress={() => setShowStartPicker(true)}
          >
            <FontAwesome5 name="calendar" size={20} color={themeColors.icon} />
            <Text style={[styles.dateText, { color: themeColors.text }]}>
              {startDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>

          {/* End Date Input */}
          <TouchableOpacity
            style={[
              styles.dateInput,
              { backgroundColor: themeColors.cardBackground },
            ]}
            onPress={() => setShowEndPicker(true)}
          >
            <FontAwesome5 name="calendar" size={20} color={themeColors.icon} />
            <Text style={[styles.dateText, { color: themeColors.text }]}>
              {endDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>

          {/* Date Pickers */}
          {showStartPicker && (
            <DateTimePicker
              testID="startDatePicker"
              value={startDate}
              mode="date"
              is24Hour={true}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onStartDateChange}
              style={Platform.OS === "ios" ? styles.iosDatePicker : undefined}
            />
          )}

          {showEndPicker && (
            <DateTimePicker
              testID="endDatePicker"
              value={endDate}
              mode="date"
              is24Hour={true}
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onEndDateChange}
              style={Platform.OS === "ios" ? styles.iosDatePicker : undefined}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Reason
          </Text>
          <TextInput
            style={[
              styles.reasonInput,
              {
                backgroundColor: themeColors.cardBackground,
                color: themeColors.text,
                borderColor: themeColors.borderColor,
              },
            ]}
            multiline
            numberOfLines={4}
            placeholder="Enter your reason for leave..."
            placeholderTextColor={themeColors.icon}
            value={reason}
            onChangeText={setReason}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.urgentContainer}>
            <Text style={[styles.urgentText, { color: themeColors.text }]}>
              Mark as Urgent
            </Text>
            <Switch
              value={isUrgent}
              onValueChange={setIsUrgent}
              trackColor={{
                false: `${themeColors.icon}40`,
                true: `${themeColors.tint}80`,
              }}
              thumbColor={isUrgent ? themeColors.tint : themeColors.icon}
            />
          </View>
          {isUrgent && (
            <Text style={[styles.urgentNote, { color: themeColors.icon }]}>
              Marking as urgent will prioritize your request for faster review.
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: themeColors.buttonBackground },
            isSubmitting && { opacity: 0.7 },
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={themeColors.buttonText} />
          ) : (
            <Text
              style={[
                styles.submitButtonText,
                { color: themeColors.buttonText },
              ]}
            >
              Submit Request
            </Text>
          )}
        </TouchableOpacity>
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
    alignItems: "center",
    marginBottom: 24,
  },
  backButton: {
    padding: 8,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  dateText: {
    fontSize: 16,
  },
  iosDatePicker: {
    width: "100%",
    height: 200,
    marginTop: -10,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  leaveTypeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  leaveTypeCard: {
    flex: 1,
    minWidth: "30%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    gap: 8,
  },
  leaveTypeText: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  reasonInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    textAlignVertical: "top",
    height: 120,
  },
  urgentContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  urgentText: {
    fontSize: 16,
    fontWeight: "500",
  },
  urgentNote: {
    fontSize: 12,
    fontStyle: "italic",
  },
  submitButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 32,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default LeaveRequestScreen;
