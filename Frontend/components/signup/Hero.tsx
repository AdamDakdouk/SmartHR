// components/signup/HeroSection.tsx
import { View, StyleSheet, Dimensions } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

const { width, height } = Dimensions.get("window");

export const HeroSection = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  return (
    <View style={[styles.heroContainer, { backgroundColor: themeColors.tint }]}>
      <MaterialCommunityIcons
        name="office-building-cog"
        size={120}
        color={themeColors.buttonText}
        style={styles.heroIcon}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  heroContainer: {
    height: height * 0.3,
    width: width,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: 0,
  },
  heroIcon: {
    opacity: 0.9,
  },
});
