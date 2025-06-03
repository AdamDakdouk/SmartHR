import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFormik } from "formik";
import * as Yup from "yup";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Link, router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { AxiosError } from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { Mail, ArrowLeft } from "lucide-react-native";
import { sendPasswordResetCode } from "@/api/Auth";

const { width, height } = Dimensions.get("window");

// Validation schema
const forgotPasswordSchema = Yup.object().shape({
  email: Yup.string()
    .email("Please enter a valid email")
    .required("Email is required"),
});

// API interface
interface ForgotPasswordDTO {
  email: string;
}

interface ApiErrorResponse {
  message?: string;
  errors?: { [key: string]: string };
}

const ForgotPassword: React.FC = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const resetPasswordMutation = useMutation<
    { success: boolean; message: string },
    AxiosError<ApiErrorResponse>,
    string
  >({
    mutationFn: sendPasswordResetCode,
    onSuccess: (data) => {
      Toast.show({
        type: "success",
        text1: "Reset Code Sent",
        text2: "Please check your email for the reset code",
        position: "bottom",
        visibilityTime: 3000,
      });
      // Navigate to reset password screen with email
      setTimeout(() => {
        router.push({
          pathname: "./resetPassword",
          params: { email: formik.values.email },
        });
      }, 2000);
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Request Failed",
        text2: error.response?.data?.message || "Failed to send reset code",
        position: "bottom",
        visibilityTime: 4000,
      });
    },
  });

  const formik = useFormik<ForgotPasswordDTO>({
    initialValues: {
      email: "",
    },
    validationSchema: forgotPasswordSchema,
    onSubmit: (values) => {
      resetPasswordMutation.mutate(values.email);
    },
  });

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <View style={styles.headerContainer}>
        <LinearGradient
          colors={[themeColors.gradientStart, themeColors.gradientEnd]}
          style={styles.headerPattern}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.circlePattern}>
            {[...Array(8)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.circle,
                  {
                    top: Math.random() * 200,
                    left: Math.random() * width,
                    opacity: Math.random() * 0.5 + 0.1,
                  },
                ]}
              />
            ))}
          </View>
        </LinearGradient>
      </View>

      <View
        style={[
          styles.formContainer,
          { backgroundColor: themeColors.cardBackground },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={themeColors.text} />
        </TouchableOpacity>

        <View style={styles.contentContainer}>
          <View style={styles.headerContent}>
            <Text style={[styles.title, { color: themeColors.text }]}>
              Forgot Password?
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.icon }]}>
              Don't worry! It happens. Please enter the email{"\n"}associated
              with your account.
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Mail
                size={20}
                color={themeColors.icon}
                style={styles.inputIcon}
              />
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: themeColors.cardBackground,
                    color: themeColors.text,
                    borderColor:
                      formik.touched.email && formik.errors.email
                        ? "red"
                        : themeColors.borderColor,
                  },
                ]}
                placeholder="Enter your email"
                placeholderTextColor={themeColors.icon}
                value={formik.values.email}
                onChangeText={formik.handleChange("email")}
                onBlur={formik.handleBlur("email")}
                editable={!resetPasswordMutation.isPending}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            {formik.touched.email && formik.errors.email && (
              <Text style={[styles.errorText, { color: "red" }]}>
                {formik.errors.email}
              </Text>
            )}
          </View>

          <LinearGradient
            colors={[themeColors.gradientStart, themeColors.gradientEnd]}
            style={[
              styles.submitButton,
              {
                opacity:
                  resetPasswordMutation.isPending || !formik.isValid ? 0.7 : 1,
              },
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <TouchableOpacity
              style={styles.submitButtonContent}
              onPress={() => formik.handleSubmit()}
              disabled={resetPasswordMutation.isPending || !formik.isValid}
            >
              {resetPasswordMutation.isPending ? (
                <ActivityIndicator color={themeColors.buttonText} />
              ) : (
                <Text
                  style={[
                    styles.submitButtonText,
                    { color: themeColors.buttonText },
                  ]}
                >
                  Send Reset Link
                </Text>
              )}
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.loginContainer}>
            <Text style={[styles.rememberText, { color: themeColors.text }]}>
              Remember your password?{" "}
            </Text>
            <Link href="./login" asChild>
              <TouchableOpacity>
                <Text style={[styles.loginLink, { color: themeColors.tint }]}>
                  Login
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </View>
      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    height: height * 0.3,
  },
  headerPattern: {
    height: "100%",
    overflow: "hidden",
  },
  circlePattern: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  circle: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  formContainer: {
    flex: 1,
    marginTop: -40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    marginTop: 12,
  },
  contentContainer: {
    flex: 1,
    marginTop: 20,
  },
  headerContent: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  inputIcon: {
    position: "absolute",
    left: 16,
    zIndex: 1,
  },
  input: {
    flex: 1,
    padding: 16,
    paddingLeft: 48,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  submitButton: {
    borderRadius: 12,
    marginTop: 8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  submitButtonContent: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  rememberText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default ForgotPassword;
