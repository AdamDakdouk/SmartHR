import React, { useRef, useEffect } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface TaskSkeletonProps {
  themeColors: {
    cardBackground: string;
    icon: string;
    gradientStart: string;
    gradientEnd: string;
  };
}

const TaskSkeleton: React.FC<TaskSkeletonProps> = ({ themeColors }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const SkeletonCard = () => (
    <Animated.View
      style={[
        styles.taskCard,
        {
          backgroundColor: themeColors.cardBackground,
          opacity,
          marginBottom: 16,
        },
      ]}
    >
      <View style={styles.taskHeader}>
        <View style={styles.taskTitleContainer}>
          <View
            style={[
              styles.skeletonText,
              { backgroundColor: themeColors.icon, width: "70%" },
            ]}
          />
          <View
            style={[
              styles.skeletonText,
              { backgroundColor: themeColors.icon, width: "40%", marginTop: 8 },
            ]}
          />
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${themeColors.icon}15` },
          ]}
        >
          <View
            style={[
              styles.skeletonText,
              { backgroundColor: themeColors.icon, width: 60 },
            ]}
          />
        </View>
      </View>
      <View style={styles.progressSection}>
        <View
          style={[
            styles.progressBar,
            { backgroundColor: `${themeColors.icon}15` },
          ]}
        />
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[themeColors.gradientStart, themeColors.gradientEnd]}
        style={styles.statsCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.statsGrid}>
          {[1, 2, 3].map((i) => (
            <React.Fragment key={i}>
              {i > 1 && <View style={styles.statDivider} />}
              <View style={styles.statItem}>
                <Animated.View
                  style={[
                    styles.skeletonStat,
                    { backgroundColor: "rgba(255,255,255,0.3)", opacity },
                  ]}
                />
                <Animated.View
                  style={[
                    styles.skeletonLabel,
                    {
                      backgroundColor: "rgba(255,255,255,0.3)",
                      opacity,
                    },
                  ]}
                />
              </View>
            </React.Fragment>
          ))}
        </View>
      </LinearGradient>

      {[1, 2, 3].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  statsCard: {
    borderRadius: 24,
    marginBottom: 24,
    padding: 24,
  },
  statsGrid: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    padding: 16,
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  skeletonStat: {
    width: 30,
    height: 24,
    borderRadius: 4,
  },
  skeletonLabel: {
    width: 60,
    height: 14,
    borderRadius: 4,
    marginTop: 8,
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  taskCard: {
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  taskTitleContainer: {
    flex: 1,
    marginRight: 12,
  },
  skeletonText: {
    height: 16,
    borderRadius: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  progressSection: {
    gap: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
});

export default TaskSkeleton;
