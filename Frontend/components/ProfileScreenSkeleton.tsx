import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions, Animated } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

const { width } = Dimensions.get("window");

const ProfileScreenSkeleton = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Animation value for the shimmer effect
  const shimmerValue = new Animated.Value(0);

  useEffect(() => {
    const startShimmerAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerValue, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startShimmerAnimation();
  }, []);

  const getAnimatedStyle = (width = "100%") => ({
    opacity: shimmerValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.7],
    }),
    width,
  });

  // Skeleton block component
  const SkeletonBlock = ({ style, width: blockWidth }) => (
    <Animated.View
      style={[
        styles.skeletonBlock,
        { backgroundColor: colors.borderColor },
        getAnimatedStyle(blockWidth),
        style,
      ]}
    />
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header Section */}
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientEnd]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Profile Image Skeleton */}
        <View style={styles.profileImageContainer}>
          <SkeletonBlock style={styles.profileImage} width={100} />
        </View>

        {/* Name and Role Skeletons */}
        <SkeletonBlock style={styles.nameSkeleton} width={180} />
        <SkeletonBlock style={styles.roleSkeleton} width={120} />

        {/* Status Skeleton */}
        <SkeletonBlock style={styles.statusSkeleton} width={100} />
      </LinearGradient>

      {/* Stats Cards Skeleton */}
      <View style={styles.statsContainer}>
        {[1, 2, 3].map((_, index) => (
          <View
            key={index}
            style={[
              styles.statsCard,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <SkeletonBlock style={styles.statIconSkeleton} width={24} />
            <SkeletonBlock style={styles.statValueSkeleton} width={40} />
            <SkeletonBlock style={styles.statLabelSkeleton} width={60} />
          </View>
        ))}
      </View>

      {/* Personal Info Section Skeleton */}
      <View
        style={[styles.section, { backgroundColor: colors.cardBackground }]}
      >
        <SkeletonBlock style={styles.sectionTitleSkeleton} width={180} />

        <View style={styles.infoGrid}>
          {[1, 2, 3, 4].map((_, index) => (
            <View key={index} style={styles.infoItem}>
              <SkeletonBlock style={styles.infoIconSkeleton} width={40} />
              <View style={styles.infoContent}>
                <SkeletonBlock style={styles.infoLabelSkeleton} width={80} />
                <SkeletonBlock style={styles.infoValueSkeleton} width={150} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Activity Section Skeleton */}
      <View
        style={[styles.section, { backgroundColor: colors.cardBackground }]}
      >
        <SkeletonBlock style={styles.sectionTitleSkeleton} width={150} />

        {[1, 2, 3].map((_, index) => (
          <View key={index} style={styles.activityItem}>
            <SkeletonBlock style={styles.activityIconSkeleton} width={40} />
            <View style={styles.activityContent}>
              <SkeletonBlock style={styles.activityTitleSkeleton} width={200} />
              <SkeletonBlock style={styles.activityTimeSkeleton} width={120} />
            </View>
            <SkeletonBlock style={styles.activityStatusSkeleton} width={60} />
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    alignItems: "center",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  profileImageContainer: {
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  nameSkeleton: {
    height: 24,
    borderRadius: 12,
    marginBottom: 8,
  },
  roleSkeleton: {
    height: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusSkeleton: {
    height: 32,
    borderRadius: 16,
  },
  skeletonBlock: {
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    gap: 8,
  },
  statIconSkeleton: {
    height: 24,
    borderRadius: 12,
  },
  statValueSkeleton: {
    height: 24,
    borderRadius: 12,
  },
  statLabelSkeleton: {
    height: 12,
    borderRadius: 6,
  },
  section: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  sectionTitleSkeleton: {
    height: 20,
    borderRadius: 10,
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: "column",
    gap: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoIconSkeleton: {
    height: 40,
    borderRadius: 12,
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoLabelSkeleton: {
    height: 12,
    borderRadius: 6,
  },
  infoValueSkeleton: {
    height: 16,
    borderRadius: 8,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  activityIconSkeleton: {
    height: 40,
    borderRadius: 12,
  },
  activityContent: {
    flex: 1,
    gap: 4,
  },
  activityTitleSkeleton: {
    height: 16,
    borderRadius: 8,
  },
  activityTimeSkeleton: {
    height: 12,
    borderRadius: 6,
  },
  activityStatusSkeleton: {
    height: 24,
    borderRadius: 12,
  },
});

export default ProfileScreenSkeleton;
