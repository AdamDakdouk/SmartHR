import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Keyboard,
  Platform,
  RefreshControl,
  ScrollView,
  Dimensions,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import {
  SearchResult,
  EmployeeSearchResult,
  TaskSearchResult,
  LeaveRequestSearchResult,
  IssueSearchResult,
  AnnouncementSearchResult,
  searchAll,
} from "@/api/search";

type SearchTab =
  | "all"
  | "employees"
  | "tasks"
  | "leaveRequests"
  | "issues"
  | "announcements";
const { width } = Dimensions.get("window");

const SearchScreen = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchTab>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Debounce search query to avoid too many API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchQuery.trim().length >= 3) {
        setDebouncedQuery(searchQuery);
      } else if (searchQuery.trim().length === 0) {
        setDebouncedQuery("");
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Search query using React Query
  const {
    data: searchResults,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<SearchResult>({
    queryKey: ["search", debouncedQuery],
    queryFn: () => searchAll(debouncedQuery),
    enabled: debouncedQuery.length >= 3,
    staleTime: 60000, // 1 minute
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  // Filter results based on active tab
  const getFilteredResults = () => {
    if (!searchResults) return [];

    switch (activeTab) {
      case "employees":
        return searchResults.employees || [];
      case "tasks":
        return searchResults.tasks || [];
      case "leaveRequests":
        return searchResults.leaveRequests || [];
      case "issues":
        return searchResults.issues || [];
      case "announcements":
        return searchResults.announcements || [];
      default:
        return [
          ...(searchResults.employees || []),
          ...(searchResults.tasks || []),
          ...(searchResults.leaveRequests || []),
          ...(searchResults.issues || []),
          ...(searchResults.announcements || []),
        ];
    }
  };

  const filteredResults = getFilteredResults();
  const hasResults = filteredResults.length > 0;

  // Clear search
  const handleClearSearch = () => {
    setSearchQuery("");
    setDebouncedQuery("");
    Keyboard.dismiss();
  };

  // Navigate to employee profile
  const handleEmployeePress = (item: EmployeeSearchResult) => {
    router.push(`/screens/employee-profile/${item.id}`);
  };

  // Render result item based on type
  const renderResultItem = ({ item }: { item: any }) => {
    switch (item.type) {
      case "employee":
        return renderEmployeeItem(item as EmployeeSearchResult);
      case "task":
        return renderTaskItem(item as TaskSearchResult);
      case "leaveRequest":
        return renderLeaveRequestItem(item as LeaveRequestSearchResult);
      case "issue":
        return renderIssueItem(item as IssueSearchResult);
      case "announcement":
        return renderAnnouncementItem(item as AnnouncementSearchResult);
      default:
        return null;
    }
  };

  // Render employee search result - KEEP TOUCHABLE
  const renderEmployeeItem = (item: EmployeeSearchResult) => (
    <TouchableOpacity
      style={[
        styles.resultCard,
        { backgroundColor: themeColors.cardBackground },
      ]}
      onPress={() => handleEmployeePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.resultContent}>
        <View style={styles.avatarContainer}>
          {item.profilePicture ? (
            <Image
              source={{ uri: item.profilePicture }}
              style={styles.avatar}
            />
          ) : (
            <LinearGradient
              colors={[themeColors.gradientStart, themeColors.gradientEnd]}
              style={styles.avatarFallback}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={[styles.avatarText, { color: "#FFFFFF" }]}>
                {item.firstName[0]}
                {item.lastName[0]}
              </Text>
            </LinearGradient>
          )}
        </View>
        <View style={styles.resultTextContent}>
          <Text style={[styles.resultTitle, { color: themeColors.text }]}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={[styles.resultSubtitle, { color: themeColors.icon }]}>
            {item.job || "Employee"}
          </Text>
        </View>
        <View
          style={[
            styles.typeIndicator,
            { backgroundColor: `${themeColors.tint}20` },
          ]}
        >
          <FontAwesome5 name="user" size={14} color={themeColors.tint} />
        </View>
      </View>
    </TouchableOpacity>
  );

  // Render task search result - MAKE NON-TOUCHABLE
  const renderTaskItem = (item: TaskSearchResult) => (
    <View
      style={[
        styles.resultCard,
        { backgroundColor: themeColors.cardBackground },
      ]}
    >
      <View style={styles.resultContent}>
        <View
          style={[
            styles.priorityIndicator,
            {
              backgroundColor:
                item.priority === "high"
                  ? "#FF6B6B"
                  : item.priority === "medium"
                  ? "#FFD166"
                  : "#06D6A0",
            },
          ]}
        />
        <View style={styles.resultTextContent}>
          <Text style={[styles.resultTitle, { color: themeColors.text }]}>
            {item.title}
          </Text>
          <View style={styles.taskDetailRow}>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor:
                    item.status === "completed"
                      ? "#06D6A090"
                      : item.status === "in_progress"
                      ? "#FFD16690"
                      : "#FF6B6B90",
                },
              ]}
            >
              <Text style={styles.statusText}>
                {item.status.replace("_", " ").toUpperCase()}
              </Text>
            </View>
            <Text style={[styles.resultSubtitle, { color: themeColors.icon }]}>
              Due: {new Date(item.dueDate).toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.typeIndicator,
            { backgroundColor: `${themeColors.tint}20` },
          ]}
        >
          <FontAwesome5 name="tasks" size={14} color={themeColors.tint} />
        </View>
      </View>
    </View>
  );

  // Render leave request search result - MAKE NON-TOUCHABLE
  const renderLeaveRequestItem = (item: LeaveRequestSearchResult) => (
    <View
      style={[
        styles.resultCard,
        { backgroundColor: themeColors.cardBackground },
      ]}
    >
      <View style={styles.resultContent}>
        <View
          style={[
            styles.statusIndicator,
            {
              backgroundColor:
                item.status === "approved"
                  ? "#06D6A0"
                  : item.status === "rejected"
                  ? "#FF6B6B"
                  : "#FFD166",
            },
          ]}
        />
        <View style={styles.resultTextContent}>
          <Text style={[styles.resultTitle, { color: themeColors.text }]}>
            Leave Request
          </Text>
          <Text style={[styles.resultSubtitle, { color: themeColors.icon }]}>
            {new Date(item.startDate).toLocaleDateString()} -{" "}
            {new Date(item.endDate).toLocaleDateString()}
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.resultDescription, { color: themeColors.icon }]}
          >
            {item.reason}
          </Text>
        </View>
        <View
          style={[
            styles.typeIndicator,
            { backgroundColor: `${themeColors.tint}20` },
          ]}
        >
          <FontAwesome5
            name="calendar-alt"
            size={14}
            color={themeColors.tint}
          />
        </View>
      </View>
    </View>
  );

  // Render issue search result - MAKE NON-TOUCHABLE
  const renderIssueItem = (item: IssueSearchResult) => (
    <View
      style={[
        styles.resultCard,
        { backgroundColor: themeColors.cardBackground },
      ]}
    >
      <View style={styles.resultContent}>
        <View
          style={[
            styles.priorityIndicator,
            {
              backgroundColor:
                item.priority === "high"
                  ? "#FF6B6B"
                  : item.priority === "medium"
                  ? "#FFD166"
                  : "#06D6A0",
            },
          ]}
        />
        <View style={styles.resultTextContent}>
          <Text style={[styles.resultTitle, { color: themeColors.text }]}>
            {item.title}
          </Text>
          <View style={styles.taskDetailRow}>
            <View
              style={[
                styles.statusPill,
                {
                  backgroundColor:
                    item.status === "resolved"
                      ? "#06D6A090"
                      : item.status === "in_progress"
                      ? "#FFD16690"
                      : "#FF6B6B90",
                },
              ]}
            >
              <Text style={styles.statusText}>
                {item.status.replace("_", " ").toUpperCase()}
              </Text>
            </View>
          </View>
          <Text
            numberOfLines={1}
            style={[styles.resultDescription, { color: themeColors.icon }]}
          >
            {item.description}
          </Text>
        </View>
        <View
          style={[
            styles.typeIndicator,
            { backgroundColor: `${themeColors.tint}20` },
          ]}
        >
          <FontAwesome5
            name="exclamation-circle"
            size={14}
            color={themeColors.tint}
          />
        </View>
      </View>
    </View>
  );

  // Render announcement search result - MAKE NON-TOUCHABLE
  const renderAnnouncementItem = (item: AnnouncementSearchResult) => (
    <View
      style={[
        styles.resultCard,
        { backgroundColor: themeColors.cardBackground },
      ]}
    >
      <View style={styles.resultContent}>
        <View style={styles.resultTextContent}>
          <Text style={[styles.resultTitle, { color: themeColors.text }]}>
            {item.title}
          </Text>
          <Text style={[styles.resultSubtitle, { color: themeColors.icon }]}>
            By: {item.createdBy} •{" "}
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          <Text
            numberOfLines={2}
            style={[styles.resultDescription, { color: themeColors.icon }]}
          >
            {item.description}
          </Text>
        </View>
        <View
          style={[
            styles.typeIndicator,
            { backgroundColor: `${themeColors.tint}20` },
          ]}
        >
          <FontAwesome5 name="bullhorn" size={14} color={themeColors.tint} />
        </View>
      </View>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => {
    if (isLoading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={themeColors.tint} />
          <Text style={[styles.emptyText, { color: themeColors.text }]}>
            Searching...
          </Text>
        </View>
      );
    }

    if (debouncedQuery && debouncedQuery.length >= 3 && !hasResults) {
      return (
        <View style={styles.emptyContainer}>
          <FontAwesome5
            name="search"
            size={50}
            color={`${themeColors.icon}50`}
          />
          <Text style={[styles.emptyText, { color: themeColors.text }]}>
            No results found
          </Text>
          <Text style={[styles.emptySubtext, { color: themeColors.icon }]}>
            Try a different search term or category
          </Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.emptyContainer}>
          <FontAwesome5 name="exclamation-circle" size={50} color="#FF6B6B" />
          <Text style={[styles.emptyText, { color: themeColors.text }]}>
            Something went wrong
          </Text>
          <Text style={[styles.emptySubtext, { color: themeColors.icon }]}>
            Please try again later
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <FontAwesome5 name="search" size={50} color={`${themeColors.icon}50`} />
        <Text style={[styles.emptyText, { color: themeColors.text }]}>
          Search for anything
        </Text>
        <Text style={[styles.emptySubtext, { color: themeColors.icon }]}>
          Find employees, tasks, requests, and more
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={themeColors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: themeColors.text }]}>
          Search
        </Text>
      </View>

      {/* Search input */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: themeColors.cardBackground },
          ]}
        >
          <Ionicons
            name="search"
            size={20}
            color={themeColors.icon}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: themeColors.text }]}
            placeholder="Search employees, tasks, and more..."
            placeholderTextColor={themeColors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={handleClearSearch}
              style={styles.clearButton}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color={themeColors.icon}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
        >
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "all" && {
                backgroundColor: `${themeColors.tint}15`,
              },
            ]}
            onPress={() => setActiveTab("all")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "all" ? themeColors.tint : themeColors.icon,
                },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "employees" && {
                backgroundColor: `${themeColors.tint}15`,
              },
            ]}
            onPress={() => setActiveTab("employees")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "employees"
                      ? themeColors.tint
                      : themeColors.icon,
                },
              ]}
            >
              Employees
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "tasks" && {
                backgroundColor: `${themeColors.tint}15`,
              },
            ]}
            onPress={() => setActiveTab("tasks")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "tasks" ? themeColors.tint : themeColors.icon,
                },
              ]}
            >
              Tasks
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "leaveRequests" && {
                backgroundColor: `${themeColors.tint}15`,
              },
            ]}
            onPress={() => setActiveTab("leaveRequests")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "leaveRequests"
                      ? themeColors.tint
                      : themeColors.icon,
                },
              ]}
            >
              Leave Requests
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "issues" && {
                backgroundColor: `${themeColors.tint}15`,
              },
            ]}
            onPress={() => setActiveTab("issues")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "issues"
                      ? themeColors.tint
                      : themeColors.icon,
                },
              ]}
            >
              Issues
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "announcements" && {
                backgroundColor: `${themeColors.tint}15`,
              },
            ]}
            onPress={() => setActiveTab("announcements")}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === "announcements"
                      ? themeColors.tint
                      : themeColors.icon,
                },
              ]}
            >
              Announcements
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Results */}
      {debouncedQuery.length >= 3 ? (
        <FlatList
          data={filteredResults}
          renderItem={renderResultItem}
          keyExtractor={(item) => `${item.type}-${item.id}`}
          contentContainerStyle={styles.resultsContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[themeColors.tint]}
              tintColor={themeColors.tint}
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmptyState()
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginLeft: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    height: 56,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  tabsContainer: {
    paddingBottom: 16,
  },
  tabs: {
    paddingHorizontal: 16,
    flexDirection: "row",
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  resultsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  resultCard: {
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  resultContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarFallback: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontWeight: "bold",
    fontSize: 18,
  },
  resultTextContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    opacity: 0.8,
  },
  resultDescription: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.6,
  },
  taskDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  priorityIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 16,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 16,
  },
  typeIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
    opacity: 0.7,
  },
});

export default SearchScreen;
