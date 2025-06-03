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
import { loginValidationSchema } from "@/validations/loginValidationSchema";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Link, router } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { login, LoginDTO, LoginResponse } from "@/api/Auth";
import Toast from "react-native-toast-message";
import { AxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import { Lock, Mail } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

export interface ApiErrorResponse {
  message?: string;
  errors?: { [key: string]: string };
}

type EmployeeRole = "employee" | "hr";
const Login: React.FC = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const { setUser } = useAuth();

  const handleRoleBasedNavigation = (role: EmployeeRole) => {
    if (role === "hr") {
      router.push("/admin");
    } else {
      router.push("/(tabs)");
    }
  };

  const loginMutation = useMutation<
    LoginResponse,
    AxiosError<ApiErrorResponse>,
    LoginDTO
  >({
    mutationFn: login,
    onSuccess: (data) => {
      const { employee } = data.data;
      setUser({ ...employee, id: employee._id });
      Toast.show({
        type: "success",  
        text1: "Welcome back!",
        text2: `Hello, ${data?.data.employee.firstName}!`,
        position: "bottom",
        visibilityTime: 3000,
      });

      setTimeout(() => {
        handleRoleBasedNavigation(employee.role as EmployeeRole);
      }, 1000);
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2: error.response?.data?.message || "Invalid credentials",
        position: "bottom",
        visibilityTime: 4000,
      });
    },
  });
  
  const formik = useFormik<LoginDTO>({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: loginValidationSchema,
    onSubmit: (values) => {
      loginMutation.mutate(values);
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
        <Text style={[styles.title, { color: themeColors.text }]}>
          Welcome Back
        </Text>
        <Text style={[styles.subtitle, { color: themeColors.icon }]}>
          Sign in to continue managing your work
        </Text>

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <Mail size={20} color={themeColors.icon} style={styles.inputIcon} />
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
              placeholder="Email"
              placeholderTextColor={themeColors.icon}
              value={formik.values.email}
              onChangeText={formik.handleChange("email")}
              onBlur={formik.handleBlur("email")}
              editable={!loginMutation.isPending}
              autoCapitalize="none"
            />
          </View>
          {formik.touched.email && formik.errors.email && (
            <Text style={[styles.errorText, { color: "red" }]}>
              {formik.errors.email}
            </Text>
          )}

          <View style={styles.inputWrapper}>
            <Lock size={20} color={themeColors.icon} style={styles.inputIcon} />
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: themeColors.cardBackground,
                  color: themeColors.text,
                  borderColor:
                    formik.touched.password && formik.errors.password
                      ? "red"
                      : themeColors.borderColor,
                },
              ]}
              placeholder="Password"
              placeholderTextColor={themeColors.icon}
              value={formik.values.password}
              onChangeText={formik.handleChange("password")}
              secureTextEntry
              onBlur={formik.handleBlur("password")}
              editable={!loginMutation.isPending}
            />
          </View>
          {formik.touched.password && formik.errors.password && (
            <Text style={[styles.errorText, { color: "red" }]}>
              {formik.errors.password}
            </Text>
          )}

          <Link href="./forgotPassword" asChild>
            <TouchableOpacity style={styles.forgotPasswordContainer}>
              <Text
                style={[styles.forgotPassword, { color: themeColors.tint }]}
              >
                Forgot your password?
              </Text>
            </TouchableOpacity>
          </Link>

          <LinearGradient
            colors={[themeColors.gradientStart, themeColors.gradientEnd]}
            style={[
              styles.loginButton,
              {
                opacity: loginMutation.isPending || !formik.isValid ? 0.7 : 1,
              },
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <TouchableOpacity
              style={styles.loginButtonContent}
              onPress={() => formik.handleSubmit()}
              disabled={loginMutation.isPending || !formik.isValid}
            >
              {loginMutation.isPending ? (
                <ActivityIndicator color={themeColors.buttonText} />
              ) : (
                <Text
                  style={[
                    styles.loginButtonText,
                    { color: themeColors.buttonText },
                  ]}
                >
                  Sign in
                </Text>
              )}
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.signUpContainer}>
            <Text style={[styles.descriptionText, { color: themeColors.text }]}>
              Don't have an account?{" "}
            </Text>
            <Link href="./signup" asChild>
              <TouchableOpacity>
                <Text style={[styles.signUpText, { color: themeColors.tint }]}>
                  Sign Up
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
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
  },
  formContainer: {
    flex: 1,
    marginTop: -40,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    padding: 24,
    paddingTop: 40,
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
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginBottom: 24,
  },
  forgotPassword: {
    fontSize: 14,
    fontWeight: "600",
  },
  loginButton: {
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
  loginButtonContent: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  signUpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  signUpText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  descriptionText: {
    fontSize: 14,
  },
  errorText: {
    fontSize: 12,
    marginTop: -12,
    marginLeft: 4,
  },
});

export default Login;
