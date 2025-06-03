// SalaryReviewScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { submitSalaryRequest } from "@/api/Requests";
import Toast from "react-native-toast-message";

const SalaryReviewScreen = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const { user } = useAuth();
  const [currentSalary, setCurrentSalary] = useState("");
  const [requestedSalary, setRequestedSalary] = useState("");
  const [justification, setJustification] = useState("");
  const [achievements, setAchievements] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatSalary = (value: string) => {
    // Remove any non-numeric characters
    const number = value.replace(/[^0-9]/g, "");
    // Format with commas
    return number.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const parseSalary = (formattedValue: string) => {
    return parseInt(formattedValue.replace(/,/g, ""), 10) || 0;
  };

  const handleSubmit = async () => {
    if (!user || !user.id) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "User information not available",
      });
      return;
    }

    if (!currentSalary || !requestedSalary) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Please enter current and requested salary",
      });
      return;
    }

    if (!achievements.trim()) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Please list your recent achievements",
      });
      return;
    }

    if (!justification.trim()) {
      Toast.show({
        type: "error",
        text1: "Missing Information",
        text2: "Please provide justification for your request",
      });
      return;
    }

    // Check if requested salary is higher than current
    const current = parseSalary(currentSalary);
    const requested = parseSalary(requestedSalary);

    if (requested <= current) {
      Toast.show({
        type: "error",
        text1: "Invalid Salary",
        text2: "Requested salary must be higher than current salary",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      await submitSalaryRequest(
        user.id,
        parseSalary(currentSalary),
        parseSalary(requestedSalary),
        achievements,
        justification,
        isUrgent
      );

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Salary review request submitted successfully",
      });

      // Wait a moment before navigating back
      setTimeout(() => {
        router.back();
      }, 1500);
    } catch (error) {
      console.error("Error submitting salary review request:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2:
          error instanceof Error
            ? error.message
            : "Failed to submit salary review request",
      });
    } finally {
      setIsSubmitting(false);
    }
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
            Salary Review
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Current Salary
          </Text>
          <View
            style={[
              styles.salaryInput,
              { backgroundColor: themeColors.cardBackground },
            ]}
          >
            <Text style={[styles.currencySymbol, { color: themeColors.icon }]}>
              $
            </Text>
            <TextInput
              style={[styles.input, { color: themeColors.text }]}
              keyboardType="numeric"
              placeholder="Current annual salary"
              placeholderTextColor={themeColors.icon}
              value={currentSalary}
              onChangeText={(value) => setCurrentSalary(formatSalary(value))}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Requested Salary
          </Text>
          <View
            style={[
              styles.salaryInput,
              { backgroundColor: themeColors.cardBackground },
            ]}
          >
            <Text style={[styles.currencySymbol, { color: themeColors.icon }]}>
              $
            </Text>
            <TextInput
              style={[styles.input, { color: themeColors.text }]}
              keyboardType="numeric"
              placeholder="Requested annual salary"
              placeholderTextColor={themeColors.icon}
              value={requestedSalary}
              onChangeText={(value) => setRequestedSalary(formatSalary(value))}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Recent Achievements
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: themeColors.cardBackground,
                color: themeColors.text,
                borderColor: themeColors.borderColor,
              },
            ]}
            multiline
            numberOfLines={4}
            placeholder="List your key achievements since last review..."
            placeholderTextColor={themeColors.icon}
            value={achievements}
            onChangeText={setAchievements}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Justification
          </Text>
          <TextInput
            style={[
              styles.textArea,
              {
                backgroundColor: themeColors.cardBackground,
                color: themeColors.text,
                borderColor: themeColors.borderColor,
              },
            ]}
            multiline
            numberOfLines={4}
            placeholder="Explain why you're requesting this increase..."
            placeholderTextColor={themeColors.icon}
            value={justification}
            onChangeText={setJustification}
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  salaryInput: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 20,
    marginRight: 8,
  },
  input: {
    flex: 1,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    height: 120,
    textAlignVertical: "top",
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

export default SalaryReviewScreen;
