import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import OTPTextInput from "react-native-otp-textinput";
import { useMutation } from "@tanstack/react-query";
import { verifyEmail, resendOTP } from "@/api/Auth";
import { Colors } from "@/constants/Colors";
import { useLocalSearchParams, router } from "expo-router";
import Toast from "react-native-toast-message";
import { AxiosError } from "axios";

const { width } = Dimensions.get("window");

interface VerifyEmailResponse {
  message: string;
}

interface ApiError {
  message: string;
}

const OTPVerificationScreen = () => {
  const [otp, setOtp] = useState("");
  const { email } = useLocalSearchParams();
  const [resendDisabled, setResendDisabled] = useState(false);
  const [timer, setTimer] = useState(30);

  const verificationMutation = useMutation<
    VerifyEmailResponse,
    AxiosError<ApiError>,
    void
  >({
    mutationFn: () =>
      verifyEmail({ email: email as string, otp: parseInt(otp, 10) }),
    onSuccess: (data) => {
      Toast.show({
        type: "success",
        text1: "Success!",
        text2: data.message || "Email verified successfully",
        position: "bottom",
        visibilityTime: 3000,
      });
      // Wait for toast to be visible before navigation
      setTimeout(() => {
        router.push("/screens/login");
      }, 1000);
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Verification Failed",
        text2: error.response?.data?.message || "Invalid verification code",
        position: "bottom",
        visibilityTime: 4000,
      });
    },
  });

  const resendMutation = useMutation<any, AxiosError<ApiError>, void>({
    mutationFn: () => resendOTP(email as string),
    onSuccess: () => {
      Toast.show({
        type: "success",
        text1: "Code Resent",
        text2: "A new verification code has been sent to your email",
        position: "bottom",
        visibilityTime: 3000,
      });
      // Start countdown timer
      setResendDisabled(true);
      setTimer(30);
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setResendDisabled(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Resend Failed",
        text2:
          error.response?.data?.message || "Unable to resend verification code",
        position: "bottom",
        visibilityTime: 4000,
      });
    },
  });

  const verifyOTP = () => {
    if (otp.length === 6) {
      verificationMutation.mutate();
    } else {
      Toast.show({
        type: "error",
        text1: "Invalid Code",
        text2: "Please enter a complete 6-digit code",
        position: "bottom",
        visibilityTime: 3000,
      });
    }
  };

  const handleResend = () => {
    if (!resendDisabled) {
      resendMutation.mutate();
    }
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>
            Please enter the verification code sent to:
          </Text>
          <Text style={styles.email}>{email}</Text>

          <View style={styles.otpContainer}>
            <OTPTextInput
              inputCount={6}
              handleTextChange={setOtp}
              tintColor={Colors.light.tint}
              offTintColor={Colors.light.borderColor}
              textInputStyle={styles.otpInput}
              containerStyle={styles.otpContainerStyle}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.verifyButton,
              {
                backgroundColor:
                  otp.length === 6 && !verificationMutation.isPending
                    ? Colors.light.buttonBackground
                    : Colors.light.borderColor,
              },
            ]}
            onPress={verifyOTP}
            disabled={otp.length !== 6 || verificationMutation.isPending}
          >
            {verificationMutation.isPending ? (
              <ActivityIndicator color={Colors.light.buttonText} />
            ) : (
              <Text style={styles.buttonText}>Verify Code</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendContainer}
            onPress={handleResend}
            disabled={resendDisabled || resendMutation.isPending}
          >
            <Text style={styles.resendText}>Didn't receive the code? </Text>
            {resendDisabled ? (
              <Text style={styles.timerText}>Resend in {timer}s</Text>
            ) : (
              <Text
                style={[
                  styles.resendLink,
                  resendMutation.isPending && styles.disabledText,
                ]}
              >
                {resendMutation.isPending ? "Sending..." : "Resend"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
      <Toast />
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.light.background,
  },
  timerText: {
    color: Colors.light.icon,
    fontSize: 14,
    fontWeight: "500",
  },
  disabledText: {
    opacity: 0.5,
  },
  card: {
    backgroundColor: Colors.light.cardBackground,
    borderRadius: 20,
    padding: 24,
    width: width * 0.9,
    alignItems: "center",
    shadowColor: Colors.light.borderColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.light.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.icon,
    textAlign: "center",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: Colors.light.tint,
    fontWeight: "500",
    marginBottom: 24,
  },
  otpContainer: {
    marginVertical: 24,
  },
  otpContainerStyle: {
    width: "100%",
  },
  otpInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.borderColor,
    color: Colors.light.text,
    fontSize: 20,
    height: 50,
    width: 45,
  },
  verifyButton: {
    width: "100%",
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: Colors.light.buttonText,
    fontSize: 16,
    fontWeight: "600",
  },
  resendContainer: {
    flexDirection: "row",
    marginTop: 24,
  },
  resendText: {
    color: Colors.light.icon,
    fontSize: 14,
  },
  resendLink: {
    color: Colors.light.tint,
    fontSize: 14,
    fontWeight: "500",
  },
});

export default OTPVerificationScreen;
