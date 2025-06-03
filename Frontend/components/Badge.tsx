// components/ui/Badge.tsx
import React from "react";
import {
  Text,
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "outline" | "success" | "warning" | "error";
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  style,
  textStyle,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  // Get variant-specific styles
  const getVariantStyles = (): { container: ViewStyle; text: TextStyle } => {
    switch (variant) {
      case "outline":
        return {
          container: {
            backgroundColor: "transparent",
            borderWidth: 1,
            borderColor: themeColors.text,
          },
          text: {
            color: themeColors.text,
          },
        };
      case "success":
        return {
          container: {
            backgroundColor: "#10B981",
          },
          text: {
            color: "#FFFFFF",
          },
        };
      case "warning":
        return {
          container: {
            backgroundColor: "#F59E0B",
          },
          text: {
            color: "#FFFFFF",
          },
        };
      case "error":
        return {
          container: {
            backgroundColor: "#EF4444",
          },
          text: {
            color: "#FFFFFF",
          },
        };
      default:
        return {
          container: {
            backgroundColor: themeColors.tint,
          },
          text: {
            color: "#FFFFFF",
          },
        };
    }
  };

  const variantStyle = getVariantStyles();

  return (
    <View style={[styles.badge, variantStyle.container, style]}>
      <Text style={[styles.text, variantStyle.text, textStyle]}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
  },
});

export default Badge;
