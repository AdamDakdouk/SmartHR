import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  TextInput,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllIssues,
  resolveIssue,
  updateIssueStatus,
  Issue,
} from "@/api/Issues";
import Toast from "react-native-toast-message";
import { ScreenHeader } from "@/components/navigation/Header";

const EmployeeIssuesScreen = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "all" | "open" | "inProgress" | "resolved"
  >("all");
  const queryClient = useQueryClient();

  // Fetch all issues
  const {
    data: issues = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Issue[]>({
    queryKey: ["issues"],
    queryFn: getAllIssues,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation for updating issue status
  const updateIssueMutation = useMutation({
    mutationFn: ({
      issueId,
      status,
    }: {
      issueId: string;
      status: "open" | "inProgress" | "resolved";
    }) => updateIssueStatus(issueId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      Toast.show({
        type: "success",
        text1: "Issue status updated successfully",
      });
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Failed to update issue status",
        text2:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    },
  });

  // Mutation for resolving issues
  const resolveIssueMutation = useMutation({
    mutationFn: (issueId: string) => resolveIssue(issueId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["issues"] });
      Toast.show({
        type: "success",
        text1: "Issue resolved successfully",
      });
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Failed to resolve issue",
        text2:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "low":
        return "#4CAF50";
      case "medium":
        return "#FF9800";
      case "high":
        return "#F44336";
      case "critical":
        return "#9C27B0";
      default:
        return themeColors.tint;
    }
  };

  const getStatusColor = (status: "open" | "inProgress" | "resolved") => {
    switch (status) {
      case "open":
        return "#FF6B6B";
      case "inProgress":
        return "#FFD93D";
      case "resolved":
        return "#6BCB77";
      default:
        return themeColors.icon;
    }
  };

  const getStatusText = (status: "open" | "inProgress" | "resolved") => {
    switch (status) {
      case "open":
        return "Open";
      case "inProgress":
        return "In Progress";
      case "resolved":
        return "Resolved";
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  const handleStatusChange = (
    issue: Issue,
    newStatus: "open" | "inProgress" | "resolved"
  ) => {
    if (newStatus === "resolved") {
      Alert.alert(
        "Resolve Issue",
        "Are you sure you want to mark this issue as resolved?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Resolve",
            onPress: () => resolveIssueMutation.mutate(issue.id),
          },
        ]
      );
    } else {
      updateIssueMutation.mutate({ issueId: issue.id, status: newStatus });
    }
  };

  const filteredIssues = issues.filter((issue) => {
    const matchesSearch =
      issue.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.employeeName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      issue.employeeDepartment
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === "all" || issue.status === activeTab;

    return matchesSearch && matchesTab;
  });

  const renderTabButton = (
    tabName: "all" | "open" | "inProgress" | "resolved",
    label: string
  ) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tabName && {
          backgroundColor: `${themeColors.tint}20`,
          borderColor: themeColors.tint,
        },
      ]}
      onPress={() => setActiveTab(tabName)}
    >
      <Text
        style={[
          styles.tabButtonText,
          {
            color: activeTab === tabName ? themeColors.tint : themeColors.icon,
            fontWeight: activeTab === tabName ? "600" : "400",
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderIssueCard = (issue: Issue) => (
    <TouchableOpacity
      key={issue.id}
      style={[
        styles.issueCard,
        { backgroundColor: themeColors.cardBackground },
      ]}
      onPress={() => {
        // // Navigate to issue details screen - to be implemented
        // router.push(`/admin/screens/issues/${issue.id}`);
      }}
    >
      <View style={styles.issueHeader}>
        <View
          style={[
            styles.priorityIndicator,
            { backgroundColor: getPriorityColor(issue.priority) },
          ]}
        />
        <Text style={[styles.issueTitle, { color: themeColors.text }]}>
          Issue from {issue.employeeName}
        </Text>
      </View>

      <Text
        style={[styles.issueDescription, { color: themeColors.icon }]}
        numberOfLines={2}
      >
        {issue.description}
      </Text>

      <View style={styles.issueInfoContainer}>
        <View style={styles.issueInfo}>
          <FontAwesome5
            name="user"
            size={12}
            color={themeColors.icon}
            style={styles.infoIcon}
          />
          <Text style={[styles.infoText, { color: themeColors.icon }]}>
            {issue.employeeName}
          </Text>
        </View>

        {issue.employeeDepartment && (
          <View style={styles.issueInfo}>
            <FontAwesome5
              name="building"
              size={12}
              color={themeColors.icon}
              style={styles.infoIcon}
            />
            <Text style={[styles.infoText, { color: themeColors.icon }]}>
              {issue.employeeDepartment}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.issueFooter}>
        <View style={styles.statusSection}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${getStatusColor(issue.status)}20` },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(issue.status) },
              ]}
            >
              {getStatusText(issue.status)}
            </Text>
          </View>

          {issue.status !== "resolved" && (
            <View style={styles.statusActions}>
              {issue.status === "open" && (
                <TouchableOpacity
                  style={[
                    styles.statusActionButton,
                    { backgroundColor: `${getStatusColor("inProgress")}20` },
                  ]}
                  onPress={() => handleStatusChange(issue, "inProgress")}
                >
                  <Text
                    style={[
                      styles.statusActionText,
                      { color: getStatusColor("inProgress") },
                    ]}
                  >
                    Start
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.statusActionButton,
                  { backgroundColor: `${getStatusColor("resolved")}20` },
                ]}
                onPress={() => handleStatusChange(issue, "resolved")}
              >
                <Text
                  style={[
                    styles.statusActionText,
                    { color: getStatusColor("resolved") },
                  ]}
                >
                  Resolve
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={[styles.dateText, { color: themeColors.icon }]}>
          {formatDate(issue.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />

      <ScreenHeader
        title="Employee Issues"
        subtitle="View and manage employee reported issues"
      />

      <View
        style={[
          styles.searchContainer,
          { backgroundColor: themeColors.cardBackground },
        ]}
      >
        <FontAwesome5 name="search" size={16} color={themeColors.icon} />
        <TextInput
          style={[styles.searchInput, { color: themeColors.text }]}
          placeholder="Search issues..."
          placeholderTextColor={themeColors.icon}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <FontAwesome5 name="times" size={16} color={themeColors.icon} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabsContainer}>
        {renderTabButton("all", "All")}
        {renderTabButton("open", "Open")}
        {renderTabButton("inProgress", "In Progress")}
        {renderTabButton("resolved", "Resolved")}
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={themeColors.tint} />
          <Text style={[styles.loaderText, { color: themeColors.text }]}>
            Loading issues...
          </Text>
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <FontAwesome5
            name="exclamation-circle"
            size={50}
            color={themeColors.icon}
          />
          <Text style={[styles.errorText, { color: themeColors.text }]}>
            Failed to load issues
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: themeColors.tint }]}
            onPress={() => refetch()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[themeColors.tint]}
              tintColor={themeColors.tint}
            />
          }
        >
          {filteredIssues.length > 0 ? (
            <>
              <View style={styles.issueCount}>
                <Text
                  style={[styles.issueCountText, { color: themeColors.icon }]}
                >
                  Showing {filteredIssues.length} issues
                </Text>
              </View>
              {filteredIssues.map(renderIssueCard)}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <FontAwesome5
                name="clipboard-check"
                size={50}
                color={`${themeColors.icon}50`}
              />
              <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                No issues found
              </Text>
              <Text style={[styles.emptyText, { color: themeColors.icon }]}>
                {searchQuery
                  ? "Try adjusting your search or filters"
                  : "All issues have been resolved!"}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 12,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 50,
    marginLeft: 8,
    fontSize: 16,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  tabButtonText: {
    fontSize: 14,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  issueCount: {
    marginBottom: 8,
  },
  issueCountText: {
    fontSize: 14,
  },
  issueCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  issueHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  priorityIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
    marginRight: 8,
  },
  issueTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  issueDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  issueInfoContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  issueInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  infoIcon: {
    marginRight: 4,
  },
  infoText: {
    fontSize: 12,
  },
  issueFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusActions: {
    flexDirection: "row",
    marginLeft: 8,
  },
  statusActionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 4,
  },
  statusActionText: {
    fontSize: 11,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});

export default EmployeeIssuesScreen;
