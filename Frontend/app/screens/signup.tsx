import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Text,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Formik } from "formik";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Users } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import StepProgressBar from "@/components/Progressbar";
import UserInfoForm from "@/components/signup/UserForm";
import PasswordCreationForm from "@/components/signup/PasswordForm";
import { Colors } from "@/constants/Colors";
import { useMutation } from "@tanstack/react-query";
import { createuser } from "@/api/Auth";
import { Link, router } from "expo-router";
import {
  passwordCreationValidationSchema,
  userInfoValidationSchema,
} from "@/validations/RegisterValidationSchema";
import Toast from "react-native-toast-message";
import { useColorScheme } from "@/hooks/useColorScheme";

const { width, height } = Dimensions.get("window");

const Signup: React.FC = () => {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const totalSteps = 2;
  const [currentStep, setCurrentStep] = useState(1);

  const createUserMutation = useMutation({
    mutationFn: createuser,
    onSuccess: (_, variables) => {
      Toast.show({
        type: "success",
        text1: "Account Created",
        text2: "Please verify your email to continue",
        position: "bottom",
        visibilityTime: 3000,
      });
      router.push(`./otp?email=${variables.email}`);
    },
    onError: (error: any) => {
      Toast.show({
        type: "error",
        text1: "Signup Failed",
        text2:
          error.response?.data?.message || "An error occurred during signup",
        position: "bottom",
        visibilityTime: 4000,
      });
    },
  });

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.imageContainer}>
          <LinearGradient
            colors={[themeColors.gradientStart, themeColors.gradientEnd]}
            style={styles.iconBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Users size={40} color="#FFFFFF" />
          </LinearGradient>
          <Text style={[styles.appName, { color: themeColors.text }]}>
            SmartHR
          </Text>
          <Text style={[styles.appTagline, { color: themeColors.icon }]}>
            Streamline Your Workspace
          </Text>
        </View>

        <View
          style={[
            styles.formWrapper,
            { backgroundColor: themeColors.cardBackground },
          ]}
        >
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: themeColors.text }]}>
              Create Account
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.icon }]}>
              Join our community and start your journey
            </Text>
          </View>

          <StepProgressBar currentStep={currentStep} totalSteps={totalSteps} />

          <Formik
            initialValues={{
              firstName: "",
              lastName: "",
              email: "",
              password: "",
              confirmPassword: "",
            }}
            validationSchema={
              currentStep === 1
                ? userInfoValidationSchema
                : passwordCreationValidationSchema
            }
            onSubmit={(values) => {
              if (currentStep < totalSteps) {
                setCurrentStep((prev) => prev + 1);
              } else {
                createUserMutation.mutate(values);
              }
            }}
          >
            {({
              handleSubmit,
              values,
              errors,
              setFieldValue,
              isValid,
              dirty,
            }) => (
              <View style={styles.formContainer}>
                {currentStep === 1 ? (
                  <UserInfoForm
                    values={values}
                    setFieldValue={setFieldValue}
                    errors={errors}
                  />
                ) : (
                  <PasswordCreationForm
                    values={values}
                    setFieldValue={setFieldValue}
                    errors={errors}
                  />
                )}

                <View style={styles.buttonContainer}>
                  {currentStep > 1 && (
                    <TouchableOpacity
                      style={[
                        styles.button,
                        styles.backBtn,
                        { borderColor: themeColors.borderColor },
                      ]}
                      onPress={() => setCurrentStep((prev) => prev - 1)}
                    >
                      <Text
                        style={[styles.buttonText, { color: themeColors.text }]}
                      >
                        Back
                      </Text>
                    </TouchableOpacity>
                  )}
                  <LinearGradient
                    colors={[
                      themeColors.gradientStart,
                      themeColors.gradientEnd,
                    ]}
                    style={[
                      styles.buttonGradient,
                      {
                        opacity: !isValid || !dirty ? 0.5 : 1,
                        flex: currentStep === 1 ? 1 : 0.48,
                      },
                    ]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <TouchableOpacity
                      style={styles.gradientButton}
                      onPress={() => handleSubmit()}
                      disabled={
                        !isValid || !dirty || createUserMutation.isPending
                      }
                    >
                      {createUserMutation.isPending ? (
                        <ActivityIndicator color={themeColors.buttonText} />
                      ) : (
                        <Text
                          style={[
                            styles.buttonText,
                            { color: themeColors.buttonText },
                          ]}
                        >
                          {currentStep === totalSteps
                            ? "Create Account"
                            : "Next"}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              </View>
            )}
          </Formik>

          <View style={styles.loginLinkContainer}>
            <Text style={[styles.loginText, { color: themeColors.icon }]}>
              Already have an account?{" "}
            </Text>
            <Link href="./login" asChild>
              <TouchableOpacity>
                <Text style={[styles.loginLink, { color: themeColors.tint }]}>
                  Login here
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
      <Toast />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  imageContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingBottom: 40,
  },
  iconBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  appName: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 16,
    fontWeight: "500",
  },
  formWrapper: {
    flex: 1,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 32,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  titleContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  formContainer: {
    marginTop: 24,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 12,
  },
  button: {
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    flex: 0.48,
  },
  buttonGradient: {
    height: 48,
    borderRadius: 24,
  },
  gradientButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backBtn: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  loginLinkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 32,
    marginBottom: 24,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default Signup;
