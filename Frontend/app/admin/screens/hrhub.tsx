import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
  Animated,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/navigation/Header";
import { getPendingRequestsCount } from "@/api/Requests";
import { getOpenIssuesCount } from "@/api/Issues";
import { getActiveAnnouncementsCount } from "@/api/announcements";
import { useQuery } from "@tanstack/react-query";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32;

type HRModule = {
  id: string;
  title: string;
  icon: keyof typeof FontAwesome5.glyphMap;
  route: string;
  description: string;
  gradient: string[];
};

const HRHubScreen = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const isFocused = useIsFocused();

  // Use react-query for data fetching with proper caching and refreshing
  const { data: pendingRequests = 0, isLoading: isLoadingRequests } = useQuery({
    queryKey: ["pendingRequestsCount"],
    queryFn: getPendingRequestsCount,
    // Keep the data fresh for 2 minutes only
    staleTime: 2 * 60 * 1000,
  });

  const { data: openIssues = 0, isLoading: isLoadingIssues } = useQuery({
    queryKey: ["openIssuesCount"],
    queryFn: getOpenIssuesCount,
    staleTime: 2 * 60 * 1000,
  });

  const { data: activeAnnouncements = 0, isLoading: isLoadingAnnouncements } =
    useQuery({
      queryKey: ["activeAnnouncementsCount"],
      queryFn: getActiveAnnouncementsCount,
      staleTime: 2 * 60 * 1000,
    });

  // Determine if any data is still loading
  const isLoading =
    isLoadingRequests || isLoadingIssues || isLoadingAnnouncements;

  // Pre-populate stats for better UX
  const stats = {
    pendingRequests,
    openIssues,
    activeAnnouncements,
    // By default we'll keep the "Upcoming Events" hardcoded to 8
    // since we don't have an API for it yet
    upcomingEvents: 8,
  };

  const hrModules: HRModule[] = [
    {
      id: "employee-issues",
      title: "Employee Issues",
      icon: "exclamation-circle",
      route: "/admin/screens/issues",
      description: "View and resolve employee reported issues",
      gradient: [themeColors.gradientStart, themeColors.gradientEnd],
    },
    {
      id: "requests",
      title: "Requests",
      icon: "clipboard-check",
      route: "/admin/screens/requests",
      description: "Manage leave, advance and other requests",
      gradient: [themeColors.gradientStart, themeColors.gradientEnd],
    },
    {
      id: "announcements",
      title: "Announcements",
      icon: "bullhorn",
      route: "/admin/screens/announcements",
      description: "Create and manage company announcements",
      gradient: [themeColors.gradientStart, themeColors.gradientEnd],
    },
    {
      id: "documents",
      title: "Document Center",
      icon: "file-alt",
      route: "/admin/screens/documents",
      description: "Manage company policies and documents",
      gradient: [themeColors.gradientStart, themeColors.gradientEnd],
    },
  ];

  const renderHRModule = (module: HRModule) => (
    <TouchableOpacity
      key={module.id}
      activeOpacity={0.9}
      style={styles.moduleCard}
      onPress={() => router.push(module.route)}
      onPressIn={() =>
        Animated.spring(scaleAnim, {
          toValue: 0.97,
          useNativeDriver: true,
        }).start()
      }
      onPressOut={() =>
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }).start()
      }
    >
      <Animated.View
        style={[styles.moduleCardInner, { transform: [{ scale: scaleAnim }] }]}
      >
        <LinearGradient
          colors={module.gradient}
          style={styles.moduleCardContent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          borderRadius={20}
        >
          <View style={styles.moduleIconContainer}>
            <FontAwesome5 name={module.icon} size={24} color="#ffffff" />
          </View>
          <View style={styles.moduleTextContainer}>
            <Text style={styles.moduleTitle}>{module.title}</Text>
            <Text style={styles.moduleDescription}>{module.description}</Text>
          </View>
          <View style={styles.chevronContainer}>
            <FontAwesome5 name="chevron-right" size={16} color="#ffffff" />
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );

  const renderSummary = () => {
    if (isLoading) {
      return (
        <View
          style={[
            styles.loadingContainer,
            { backgroundColor: themeColors.cardBackground },
          ]}
        >
          <ActivityIndicator size="large" color={themeColors.tint} />
          <Text style={[styles.loadingText, { color: themeColors.text }]}>
            Loading statistics...
          </Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.summaryCard,
          { backgroundColor: themeColors.cardBackground },
        ]}
      >
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <View
              style={[
                styles.summaryIconContainer,
                { backgroundColor: `${themeColors.tint}15` },
              ]}
            >
              <FontAwesome5
                name="clipboard-check"
                size={16}
                color={themeColors.tint}
              />
            </View>
            <View>
              <Text style={[styles.summaryValue, { color: themeColors.text }]}>
                {stats.pendingRequests}
              </Text>
              <Text style={[styles.summaryLabel, { color: themeColors.icon }]}>
                Pending Requests
              </Text>
            </View>
          </View>

          <View style={styles.summaryItem}>
            <View
              style={[
                styles.summaryIconContainer,
                { backgroundColor: `${themeColors.tint}15` },
              ]}
            >
              <FontAwesome5
                name="exclamation-circle"
                size={16}
                color={themeColors.tint}
              />
            </View>
            <View>
              <Text style={[styles.summaryValue, { color: themeColors.text }]}>
                {stats.openIssues}
              </Text>
              <Text style={[styles.summaryLabel, { color: themeColors.icon }]}>
                Open Issues
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <View
              style={[
                styles.summaryIconContainer,
                { backgroundColor: `${themeColors.tint}15` },
              ]}
            >
              <FontAwesome5
                name="bullhorn"
                size={16}
                color={themeColors.tint}
              />
            </View>
            <View>
              <Text style={[styles.summaryValue, { color: themeColors.text }]}>
                {stats.activeAnnouncements}
              </Text>
              <Text style={[styles.summaryLabel, { color: themeColors.icon }]}>
                Active Announcements
              </Text>
            </View>
          </View>

          <View style={styles.summaryItem}>
            <View
              style={[
                styles.summaryIconContainer,
                { backgroundColor: `${themeColors.tint}15` },
              ]}
            >
              <FontAwesome5
                name="calendar-alt"
                size={16}
                color={themeColors.tint}
              />
            </View>
            <View>
              <Text style={[styles.summaryValue, { color: themeColors.text }]}>
                {stats.upcomingEvents}
              </Text>
              <Text style={[styles.summaryLabel, { color: themeColors.icon }]}>
                Upcoming Events
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />
      <ScreenHeader
        title="HR Hub"
        subtitle="Manage Requests, Issues, and Announcements"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Manage HR Activities
        </Text>

        <View style={styles.modulesContainer}>
          {hrModules.map(renderHRModule)}
        </View>

        <View style={styles.summaryContainer}>
          <Text style={[styles.summaryTitle, { color: themeColors.text }]}>
            Quick Summary
          </Text>
          {renderSummary()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  modulesContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  moduleCard: {
    width: CARD_WIDTH,
    marginBottom: 4,
  },
  moduleCardInner: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderRadius: 20,
  },
  moduleCardContent: {
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
  },
  moduleIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  moduleTextContainer: {
    flex: 1,
  },
  moduleTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  moduleDescription: {
    color: "#fff",
    fontSize: 14,
    opacity: 0.9,
  },
  chevronContainer: {
    padding: 8,
  },
  summaryContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  summaryCard: {
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  summaryIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  summaryLabel: {
    fontSize: 12,
  },
  loadingContainer: {
    borderRadius: 20,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
  },
});

export default HRHubScreen;
