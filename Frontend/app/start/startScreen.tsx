import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { ArrowRight } from "lucide-react-native";

const { width, height } = Dimensions.get("window");

const Welcome: React.FC = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientEnd]}
      style={styles.container}
    >
      {/* Main Card */}
      <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
        {/* Abstract Pattern */}
        <View style={styles.patternContainer}>
          <LinearGradient
            colors={["#8E85FF", "#6C63FF"]}
            style={[styles.circle, styles.circle1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View
            style={[
              styles.circle,
              styles.circle2,
              { backgroundColor: "rgba(108, 99, 255, 0.15)" },
            ]}
          />
          <LinearGradient
            colors={["#A49AFF", "#7E76FF"]}
            style={[styles.circle, styles.circle3]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <View
            style={[
              styles.line,
              styles.line1,
              { backgroundColor: "rgba(142, 133, 255, 0.2)" },
            ]}
          />
          <View
            style={[
              styles.line,
              styles.line2,
              { backgroundColor: "rgba(108, 99, 255, 0.2)" },
            ]}
          />
          <View
            style={[
              styles.line,
              styles.line3,
              { backgroundColor: "rgba(126, 118, 255, 0.2)" },
            ]}
          />
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              Manage your{"\n"}daily tasks
            </Text>
            <Text style={[styles.subtitle, { color: colors.icon }]}>
              HR management application{"\n"}for your company
            </Text>
          </View>

          <Link href="/screens/signup" asChild>
            <TouchableOpacity>
              <LinearGradient
                colors={[colors.gradientStart, colors.gradientEnd]}
                style={styles.button}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>Get Started</Text>
                <ArrowRight size={20} color="#FFF" style={styles.buttonIcon} />
              </LinearGradient>
            </TouchableOpacity>
          </Link>

          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: colors.icon }]}>
              Already have an account?{" "}
            </Text>
            <Link href="/screens/login">
              <Text style={[styles.loginLink, { color: colors.tint }]}>
                Login
              </Text>
            </Link>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  card: {
    width: "100%",
    height: height * 0.75,
    borderRadius: 30,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  patternContainer: {
    height: "45%",
    position: "relative",
    backgroundColor: "#F8F9FC",
  },
  circle: {
    position: "absolute",
    borderRadius: 999,
  },
  circle1: {
    width: 120,
    height: 120,
    top: "10%",
    left: "10%",
    opacity: 0.7,
  },
  circle2: {
    width: 80,
    height: 80,
    top: "30%",
    right: "15%",
  },
  circle3: {
    width: 60,
    height: 60,
    top: "50%",
    left: "30%",
    opacity: 0.5,
  },
  line: {
    position: "absolute",
    height: 2,
  },
  line1: {
    width: 100,
    transform: [{ rotate: "45deg" }],
    top: "20%",
    right: "20%",
  },
  line2: {
    width: 80,
    transform: [{ rotate: "-30deg" }],
    top: "40%",
    left: "15%",
  },
  line3: {
    width: 120,
    transform: [{ rotate: "15deg" }],
    bottom: "20%",
    right: "25%",
  },
  contentContainer: {
    flex: 1,
    padding: 24,
    justifyContent: "space-between",
  },
  textContainer: {
    marginTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 16,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 4,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default Welcome;
