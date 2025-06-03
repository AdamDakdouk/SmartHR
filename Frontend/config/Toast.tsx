import {
  BaseToast,
  BaseToastProps,
  ErrorToast,
} from "react-native-toast-message";
import { Colors } from "@/constants/Colors";
import { JSX } from "react";

export const toastConfig = {
  success: (props: JSX.IntrinsicAttributes & BaseToastProps) => (
    <BaseToast
      {...props}
      style={{
        borderLeftColor: Colors.light.tint,
        backgroundColor: Colors.light.cardBackground,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: "600",
        color: Colors.light.text,
      }}
      text2Style={{
        fontSize: 14,
        color: Colors.light.icon,
      }}
    />
  ),
  error: (props: JSX.IntrinsicAttributes & BaseToastProps) => (
    <ErrorToast
      {...props}
      style={{
        borderLeftColor: "#FF4B4B",
        backgroundColor: Colors.light.cardBackground,
      }}
      contentContainerStyle={{
        paddingHorizontal: 15,
      }}
      text1Style={{
        fontSize: 16,
        fontWeight: "600",
        color: Colors.light.text,
      }}
      text2Style={{
        fontSize: 14,
        color: Colors.light.icon,
      }}
    />
  ),
};
