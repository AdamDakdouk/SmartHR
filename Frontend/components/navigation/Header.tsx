// components/common/ScreenHeader.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { router } from "expo-router";
import { useColorScheme } from "@/hooks/useColorScheme"; 
import { Colors } from "@/constants/Colors";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
}) => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={[
          styles.backButton,
          { backgroundColor: themeColors.cardBackground },
        ]}
        onPress={() => router.back()}
      >
        <FontAwesome5 name="arrow-left" size={18} color={themeColors.text} />
      </TouchableOpacity>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: themeColors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: themeColors.icon }]}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.7,
  },
});
