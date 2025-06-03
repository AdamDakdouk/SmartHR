import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { ScreenHeader } from "@/components/navigation/Header";
import { useQuery } from "@tanstack/react-query";
import Toast from "react-native-toast-message";
import { getAllAnnouncements } from "@/api/announcements";

interface Announcement {
  _id: string;
  title: string;
  description: string;
  createdBy: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
  sendToAll: boolean;
}

const AnnouncementsScreen = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];

  const {
    data: announcements,
    isLoading,
    isError,
    error,
  } = useQuery<Announcement[]>({
    queryKey: ["announcements"],
    queryFn: getAllAnnouncements,
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes} minutes ago`;
      }
      return `${hours} hours ago`;
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <ScreenHeader title="Announcements" subtitle="Loading..." />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <ScreenHeader
          title="Announcements"
          subtitle="Error loading announcements"
        />
        <View style={styles.errorContainer}>
          <FontAwesome5
            name="exclamation-circle"
            size={48}
            color={themeColors.tint}
          />
          <Text style={[styles.errorText, { color: themeColors.text }]}>
            {error instanceof Error
              ? error.message
              : "Failed to load announcements"}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: themeColors.tint }]}
            onPress={() => window.location.reload()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <ScreenHeader
        title="Announcements"
        subtitle={`${announcements?.length || 0} announcements`}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Featured/Latest Announcement */}
        {announcements && announcements.length > 0 && (
          <LinearGradient
            colors={[themeColors.gradientStart, themeColors.gradientEnd]}
            style={styles.featuredCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.featuredHeader}>
              <View style={styles.latestBadge}>
                <Text style={styles.latestText}>Latest</Text>
              </View>
              <Text style={styles.featuredDate}>
                {formatDate(announcements[0].createdAt)}
              </Text>
            </View>
            <Text style={styles.featuredTitle}>{announcements[0].title}</Text>
            <Text style={styles.featuredDescription}>
              {announcements[0].description}
            </Text>
            <View style={styles.featuredFooter}>
              <FontAwesome5 name="user" size={12} color="#fff" />
              <Text style={styles.featuredAuthor}>
                {announcements[0].createdBy.firstName}{" "}
                {announcements[0].createdBy.lastName}
              </Text>
            </View>
          </LinearGradient>
        )}

        {/* Previous Announcements */}
        <View style={styles.previousContainer}>
          {announcements?.slice(1).map((announcement) => (
            <View
              key={announcement._id}
              style={[
                styles.announcementCard,
                { backgroundColor: themeColors.cardBackground },
              ]}
            >
              <View style={styles.announcementHeader}>
                <View style={styles.announcementTitleContainer}>
                  <Text
                    style={[
                      styles.announcementTitle,
                      { color: themeColors.text },
                    ]}
                  >
                    {announcement.title}
                  </Text>
                  <Text
                    style={[
                      styles.announcementDate,
                      { color: themeColors.icon },
                    ]}
                  >
                    {formatDate(announcement.createdAt)}
                  </Text>
                </View>
              </View>
              <Text
                style={[
                  styles.announcementDescription,
                  { color: themeColors.icon },
                ]}
                numberOfLines={3}
              >
                {announcement.description}
              </Text>
              <View style={styles.announcementFooter}>
                <View style={styles.authorContainer}>
                  <View
                    style={[
                      styles.authorAvatar,
                      { backgroundColor: `${themeColors.tint}15` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.authorInitials,
                        { color: themeColors.tint },
                      ]}
                    >
                      {announcement.createdBy.firstName[0]}
                      {announcement.createdBy.lastName[0]}
                    </Text>
                  </View>
                  <Text
                    style={[styles.authorName, { color: themeColors.text }]}
                  >
                    {announcement.createdBy.firstName}{" "}
                    {announcement.createdBy.lastName}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  featuredCard: {
    margin: 16,
    borderRadius: 24,
    padding: 24,
  },
  featuredHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  latestBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  latestText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  featuredDate: {
    color: "#fff",
    opacity: 0.8,
    fontSize: 14,
  },
  featuredTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 12,
  },
  featuredDescription: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
    marginBottom: 16,
    lineHeight: 24,
  },
  featuredFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  featuredAuthor: {
    color: "#fff",
    marginLeft: 8,
    fontSize: 14,
  },
  previousContainer: {
    padding: 16,
  },
  announcementCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  announcementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  announcementTitleContainer: {
    flex: 1,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  announcementDate: {
    fontSize: 12,
  },
  announcementDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  announcementFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  authorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  authorInitials: {
    fontSize: 12,
    fontWeight: "600",
  },
  authorName: {
    fontSize: 14,
  },
});

export default AnnouncementsScreen;
