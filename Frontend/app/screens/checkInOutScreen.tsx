import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useColorScheme } from "@/hooks/useColorScheme";
import { Colors } from "@/constants/Colors";
import { ScreenHeader } from "@/components/navigation/Header";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import {
  checkIn,
  checkOut,
  getStatus,
  getTodayDetails,
  Location,
} from "@/api/CheckIn";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocationTracking } from "@/hooks/useLocationTracking";
import * as ExpoLocation from "expo-location";
import { format } from "date-fns";

const { width } = Dimensions.get("window");

const CheckInOutScreen = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Get current status
  const { data: statusData, isLoading: statusLoading } = useQuery({
    queryKey: ["checkInStatus"],
    queryFn: getStatus,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Get today's details
  const { data: todayDetails, isLoading: detailsLoading } = useQuery({
    queryKey: ["todayDetails"],
    queryFn: getTodayDetails,
    refetchInterval: 30000,
  });

  // Initialize location tracking
  useLocationTracking(statusData?.status === "checkedIn");

  // Update the clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: (location: Location) => checkIn(location),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkInStatus"] });
      queryClient.invalidateQueries({ queryKey: ["todayDetails"] });
      Toast.show({
        type: "success",
        text1: "Checked in successfully",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Failed to check in",
        text2: error.message,
      });
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: checkOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checkInStatus"] });
      queryClient.invalidateQueries({ queryKey: ["todayDetails"] });
      Toast.show({
        type: "success",
        text1: "Checked out successfully",
      });
    },
    onError: (error: Error) => {
      Toast.show({
        type: "error",
        text1: "Failed to check out",
        text2: error.message,
      });
    },
  });

  const handleCheckInOut = async () => {
    if (statusData?.status === "checkedIn") {
      checkOutMutation.mutate();
    } else {
      try {
        const { status } =
          await ExpoLocation.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          Alert.alert(
            "Permission Denied",
            "Location permission is required for check-in"
          );
          return;
        }

        const location = await ExpoLocation.getCurrentPositionAsync({});
        const locationData: Location = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };

        checkInMutation.mutate(locationData);
      } catch (error) {
        Toast.show({
          type: "error",
          text1: "Failed to get location",
          text2: "Please ensure location services are enabled",
        });
      }
    }
  };

  const isLoading =
    statusLoading ||
    detailsLoading ||
    checkInMutation.isPending ||
    checkOutMutation.isPending;

  if (isLoading && !statusData) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        <ScreenHeader title="Check In/Out" subtitle="Loading..." />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={themeColors.tint} />
        </View>
      </SafeAreaView>
    );
  }

  // Format current time as needed (using date-fns)
  const formattedTime = format(currentTime, "h:mm:ss a");
  const formattedDate = format(currentTime, "EEEE, MMMM d, yyyy");

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <ScreenHeader
        title="Check In/Out"
        subtitle={
          statusData?.status === "checkedIn"
            ? "Currently working"
            : "Not checked in"
        }
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.timeContainer}>
          <Text style={[styles.dateText, { color: themeColors.text }]}>
            {formattedDate}
          </Text>
          <Text style={[styles.timeText, { color: themeColors.text }]}>
            {formattedTime}
          </Text>
        </View>

        <LinearGradient
          colors={[themeColors.gradientStart, themeColors.gradientEnd]}
          style={styles.statusCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.statusContent}>
            <Text style={styles.statusLabel}>Current Status</Text>
            <View style={styles.statusIndicator}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor:
                      statusData?.status === "checkedIn"
                        ? "#4CAF50"
                        : "#FF5252",
                  },
                ]}
              />
              <Text style={styles.statusText}>
                {statusData?.status === "checkedIn"
                  ? "Checked In"
                  : "Checked Out"}
              </Text>
            </View>
            {statusData?.lastCheckIn && statusData.status === "checkedIn" && (
              <Text style={styles.lastCheckInText}>
                Since {format(new Date(statusData.lastCheckIn), "h:mm a")}
              </Text>
            )}
          </View>
        </LinearGradient>

        <View style={styles.statsContainer}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: themeColors.cardBackground },
            ]}
          >
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: `${themeColors.tint}15` },
              ]}
            >
              <FontAwesome5 name="clock" size={20} color={themeColors.tint} />
            </View>
            <Text style={[styles.statValue, { color: themeColors.text }]}>
              {todayDetails?.totalHours || "0.0"}h
            </Text>
            <Text style={[styles.statTitle, { color: themeColors.text }]}>
              Today's Hours
            </Text>
            <Text style={[styles.statSubtitle, { color: themeColors.icon }]}>
              Current shift
            </Text>
          </View>

          <View
            style={[
              styles.statCard,
              { backgroundColor: themeColors.cardBackground },
            ]}
          >
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: `${themeColors.tint}15` },
              ]}
            >
              <FontAwesome5
                name="calendar-check"
                size={20}
                color={themeColors.tint}
              />
            </View>
            <Text style={[styles.statValue, { color: themeColors.text }]}>
              {todayDetails?.weeklyHours || "0.0"}h
            </Text>
            <Text style={[styles.statTitle, { color: themeColors.text }]}>
              This Week
            </Text>
            <Text style={[styles.statSubtitle, { color: themeColors.icon }]}>
              Total hours
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.checkButton,
            { backgroundColor: themeColors.buttonBackground },
          ]}
          onPress={handleCheckInOut}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={themeColors.buttonText} />
          ) : (
            <>
              <FontAwesome5
                name={
                  statusData?.status === "checkedIn"
                    ? "sign-out-alt"
                    : "sign-in-alt"
                }
                size={24}
                color={themeColors.buttonText}
              />
              <Text
                style={[styles.buttonText, { color: themeColors.buttonText }]}
              >
                {statusData?.status === "checkedIn" ? "Check Out" : "Check In"}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          Recent Activity
        </Text>

        <View style={styles.historyContainer}>
          {todayDetails?.checkins && todayDetails.checkins.length > 0 ? (
            todayDetails.checkins.map((checkin) => (
              <View
                key={checkin._id}
                style={[
                  styles.historyCard,
                  { backgroundColor: themeColors.cardBackground },
                ]}
              >
                <View style={styles.historyContent}>
                  <View style={styles.historyTimeContainer}>
                    <Text
                      style={[styles.historyTime, { color: themeColors.text }]}
                    >
                      {format(new Date(checkin.checkInTime), "h:mm a")}
                    </Text>
                    <Text
                      style={[styles.historyDate, { color: themeColors.icon }]}
                    >
                      {format(new Date(checkin.checkInTime), "MMM d") ===
                      format(currentTime, "MMM d")
                        ? "Today"
                        : format(new Date(checkin.checkInTime), "MMM d")}
                    </Text>
                  </View>
                  <Text
                    style={[styles.historyAction, { color: themeColors.text }]}
                  >
                    {checkin.checkOutTime ? "Checked Out" : "Checked In"}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View
              style={[
                styles.emptyHistoryCard,
                { backgroundColor: themeColors.cardBackground },
              ]}
            >
              <Text
                style={[styles.emptyHistoryText, { color: themeColors.icon }]}
              >
                No check-in activity today
              </Text>
            </View>
          )}
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
  timeContainer: {
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  dateText: {
    fontSize: 16,
    opacity: 0.8,
  },
  timeText: {
    fontSize: 36,
    fontWeight: "700",
    marginTop: 8,
  },
  statusCard: {
    borderRadius: 24,
    marginHorizontal: 16,
    padding: 24,
    marginBottom: 24,
  },
  statusContent: {
    alignItems: "center",
  },
  statusLabel: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.8,
    marginBottom: 12,
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: 12,
    borderRadius: 16,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  lastCheckInText: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.8,
    marginTop: 8,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  statSubtitle: {
    fontSize: 12,
  },
  checkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  historyContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  historyCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  historyContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyTimeContainer: {
    flex: 1,
  },
  historyTime: {
    fontSize: 16,
    fontWeight: "600",
  },
  historyDate: {
    fontSize: 12,
    marginTop: 4,
  },
  historyAction: {
    fontSize: 14,
    fontWeight: "500",
  },
  emptyHistoryCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.7,
  },
  emptyHistoryText: {
    fontSize: 14,
    fontWeight: "500",
  },
});

export default CheckInOutScreen;
