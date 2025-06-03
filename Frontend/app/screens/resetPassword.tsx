import React, { useEffect, useState } from "react";
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
import { useLocalSearchParams, router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { resetPassword, ResetPasswordDTO } from "@/api/Auth";
import Toast from "react-native-toast-message";
import { AxiosError } from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { Lock, ArrowLeft, Eye, EyeOff, KeyRound } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

const resetPasswordSchema = Yup.object().shape({
  newPassword: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    )
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("newPassword")], "Passwords must match")
    .required("Please confirm your password"),
  code: Yup.number()
    .required("Reset code is required")
    .positive("Invalid code")
    .integer("Invalid code"),
});

interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
  code: string;
}

interface ApiErrorResponse {
  message?: string;
  errors?: { [key: string]: string };
}

const ResetPassword: React.FC = () => {
  const { email } = useLocalSearchParams<{ email: string }>();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const resetPasswordMutation = useMutation<
    { success: boolean; message: string },
    AxiosError<ApiErrorResponse>,
    ResetPasswordDTO
  >({
    mutationFn: resetPassword,
    onSuccess: () => {
      Toast.show({
        type: "success",
        text1: "Password Reset Successfully",
        text2: "You can now login with your new password",
        position: "bottom",
        visibilityTime: 3000,
      });
      setTimeout(() => {
        router.replace("./login");
      }, 2000);
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Reset Failed",
        text2: error.response?.data?.message || "Failed to reset password",
        position: "bottom",
        visibilityTime: 4000,
      });
    },
  });

  const formik = useFormik<ResetPasswordFormData>({
    initialValues: {
      newPassword: "",
      confirmPassword: "",
      code: "",
    },
    validationSchema: resetPasswordSchema,
    onSubmit: (values) => {
      resetPasswordMutation.mutate({
        email,
        newPassword: values.newPassword,
        code: values?.code,
      });
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
              Reset Password
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.icon }]}>
              Please enter the code sent to your email{"\n"}and create a new
              password
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <KeyRound
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
                      formik.touched.code && formik.errors.code
                        ? "red"
                        : themeColors.borderColor,
                  },
                ]}
                placeholder="Enter reset code"
                placeholderTextColor={themeColors.icon}
                value={formik.values.code.toString()}
                onChangeText={(text) => formik.setFieldValue("code", text)}
                onBlur={formik.handleBlur("code")}
                editable={!resetPasswordMutation.isPending}
                keyboardType="number-pad"
              />
            </View>
            {formik.touched.code && formik.errors.code && (
              <Text style={[styles.errorText, { color: "red" }]}>
                {formik.errors.code}
              </Text>
            )}

            <View style={styles.inputWrapper}>
              <Lock
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
                      formik.touched.newPassword && formik.errors.newPassword
                        ? "red"
                        : themeColors.borderColor,
                  },
                ]}
                placeholder="Enter new password"
                placeholderTextColor={themeColors.icon}
                value={formik.values.newPassword}
                onChangeText={formik.handleChange("newPassword")}
                onBlur={formik.handleBlur("newPassword")}
                secureTextEntry={!showPassword}
                editable={!resetPasswordMutation.isPending}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff size={20} color={themeColors.icon} />
                ) : (
                  <Eye size={20} color={themeColors.icon} />
                )}
              </TouchableOpacity>
            </View>
            {formik.touched.newPassword && formik.errors.newPassword && (
              <Text style={[styles.errorText, { color: "red" }]}>
                {formik.errors.newPassword}
              </Text>
            )}

            <View style={styles.inputWrapper}>
              <Lock
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
                      formik.touched.confirmPassword &&
                      formik.errors.confirmPassword
                        ? "red"
                        : themeColors.borderColor,
                  },
                ]}
                placeholder="Confirm new password"
                placeholderTextColor={themeColors.icon}
                value={formik.values.confirmPassword}
                onChangeText={formik.handleChange("confirmPassword")}
                onBlur={formik.handleBlur("confirmPassword")}
                secureTextEntry={!showConfirmPassword}
                editable={!resetPasswordMutation.isPending}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color={themeColors.icon} />
                ) : (
                  <Eye size={20} color={themeColors.icon} />
                )}
              </TouchableOpacity>
            </View>
            {formik.touched.confirmPassword &&
              formik.errors.confirmPassword && (
                <Text style={[styles.errorText, { color: "red" }]}>
                  {formik.errors.confirmPassword}
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
                  Reset Password
                </Text>
              )}
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.loginContainer}>
            <Text style={[styles.rememberText, { color: themeColors.text }]}>
              Remember your password?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.replace("./login")}>
              <Text style={[styles.loginLink, { color: themeColors.tint }]}>
                Login
              </Text>
            </TouchableOpacity>
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
    gap: 16,
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
    paddingRight: 48,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  passwordToggle: {
    position: "absolute",
    right: 16,
    zIndex: 1,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  submitButton: {
    borderRadius: 12,
    marginTop: 32,
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

export default ResetPassword;
