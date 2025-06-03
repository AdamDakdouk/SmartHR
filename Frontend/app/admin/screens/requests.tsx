import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  TextInput,
  Alert,
  Modal,
  Keyboard,
} from "react-native";
import { router } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllRequests,
  updateRequestStatus,
  Request,
  RequestType,
  RequestStatus,
} from "@/api/Requests";
import { useAuth } from "@/context/AuthContext";
import Toast from "react-native-toast-message";
import { format, formatDistanceToNow } from "date-fns";
import { ScreenHeader } from "@/components/navigation/Header";

const HRRequestsManagementScreen = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<
    "all" | "pending" | "approved" | "rejected"
  >("all");
  const [activeTypeFilter, setActiveTypeFilter] = useState<"all" | RequestType>(
    "all"
  );
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionComments, setActionComments] = useState("");
  const queryClient = useQueryClient();

  // Fetch all requests
  const {
    data: requests = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Request[]>({
    queryKey: ["requests"],
    queryFn: getAllRequests,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation for updating request status
  const updateRequestMutation = useMutation({
    mutationFn: ({
      requestId,
      status,
      comments,
    }: {
      requestId: string;
      status: RequestStatus;
      comments?: string;
    }) => updateRequestStatus(requestId, status, user?.id, comments),
    onSuccess: () => {
      // Invalidate multiple queries to ensure all related data is refreshed
      queryClient.invalidateQueries({ queryKey: ["requests"] });

      // Also invalidate the dashboard stats to update the HRHub screen
      queryClient.invalidateQueries({ queryKey: ["pendingRequestsCount"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });

      Toast.show({
        type: "success",
        text1: "Request status updated successfully",
      });
      setShowActionModal(false);
      setSelectedRequest(null);
      setActionComments("");
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Failed to update request status",
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

  const getRequestTypeIcon = (
    type: RequestType
  ): keyof typeof FontAwesome5.glyphMap => {
    switch (type) {
      case "leave":
        return "calendar-minus";
      case "vacation":
        return "umbrella-beach";
      case "salary":
        return "money-bill-wave";
      case "equipment":
        return "laptop";
      case "other":
        return "clipboard-list";
      default:
        return "clipboard-list";
    }
  };

  const getRequestTypeName = (type: RequestType): string => {
    switch (type) {
      case "leave":
        return "Leave";
      case "vacation":
        return "Vacation";
      case "salary":
        return "Salary Review";
      case "equipment":
        return "Equipment";
      case "other":
        return "Other";
      default:
        return type;
    }
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case "pending":
        return "#FFD93D";
      case "approved":
        return "#6BCB77";
      case "rejected":
        return "#FF6B6B";
      case "cancelled":
        return "#4D96FF";
      default:
        return themeColors.icon;
    }
  };

  const formatDate = (dateString: string, includeTime = false) => {
    try {
      const date = new Date(dateString);
      if (includeTime) {
        return format(date, "MMM d, yyyy 'at' h:mm a");
      }
      return format(date, "MMM d, yyyy");
    } catch (error) {
      return dateString;
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return dateString;
    }
  };

  const handleApproveRequest = (request: Request) => {
    setSelectedRequest(request);
    setActionComments("");
    setShowActionModal(true);
  };

  const handleRejectRequest = (request: Request) => {
    setSelectedRequest(request);
    setActionComments("");
    setShowActionModal(true);
  };

  const confirmAction = (status: RequestStatus) => {
    if (!selectedRequest) return;

    // Dismiss keyboard to prevent UI issues
    Keyboard.dismiss();

    updateRequestMutation.mutate({
      requestId: selectedRequest._id,
      status,
      comments: actionComments,
    });
  };

  const filteredRequests = requests.filter((request) => {
    const matchesSearch =
      (request.employee?.firstName + " " + request.employee?.lastName)
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (request.employee?.department || "")
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesTab = activeTab === "all" || request.status === activeTab;

    const matchesType =
      activeTypeFilter === "all" || request.type === activeTypeFilter;

    return matchesSearch && matchesTab && matchesType;
  });

  // Sort requests - urgent first, then by submitted date
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (a.urgent && !b.urgent) return -1;
    if (!a.urgent && b.urgent) return 1;

    // Then sort by date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const renderTabButton = (
    tabName: "all" | "pending" | "approved" | "rejected",
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

  const renderTypeFilter = (
    typeName: "all" | RequestType,
    label: string,
    icon?: keyof typeof FontAwesome5.glyphMap
  ) => (
    <TouchableOpacity
      style={[
        styles.typeFilterButton,
        activeTypeFilter === typeName && {
          backgroundColor: `${themeColors.tint}20`,
          borderColor: themeColors.tint,
        },
      ]}
      onPress={() => setActiveTypeFilter(typeName)}
    >
      {icon && (
        <FontAwesome5
          name={icon}
          size={12}
          color={
            activeTypeFilter === typeName ? themeColors.tint : themeColors.icon
          }
          style={styles.filterIcon}
        />
      )}
      <Text
        style={[
          styles.typeFilterText,
          {
            color:
              activeTypeFilter === typeName
                ? themeColors.tint
                : themeColors.icon,
            fontWeight: activeTypeFilter === typeName ? "600" : "400",
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderRequestCard = (request: Request) => {
    const employeeName = request.employee
      ? `${request.employee.firstName} ${request.employee.lastName}`
      : "Unknown Employee";
    const employeeDepartment =
      request.employee?.department || "Unknown Department";

    // Generate appropriate title based on request type
    let requestTitle = "";
    switch (request.type) {
      case "leave":
        requestTitle = `Leave Request (${request.leaveType})`;
        break;
      case "vacation":
        requestTitle = `Vacation Request (${request.vacationType})`;
        break;
      case "salary":
        requestTitle = `Salary Review: $${request.currentSalary} → $${request.requestedSalary}`;
        break;
      default:
        requestTitle = `${getRequestTypeName(request.type)} Request`;
    }

    // Generate appropriate details based on request type
    let requestDetails = "";
    let requestDate = "";

    if (request.type === "leave" || request.type === "vacation") {
      if (request.startDate && request.endDate) {
        requestDate = `${formatDate(request.startDate)} to ${formatDate(
          request.endDate
        )}`;
      }
      requestDetails = request.reason || request.notes || "";
    } else if (request.type === "salary") {
      requestDetails = request.justification || "";
    } else {
      requestDetails = request.reason || "";
    }

    return (
      <View
        key={request._id}
        style={[
          styles.requestCard,
          { backgroundColor: themeColors.cardBackground },
        ]}
      >
        <View style={styles.requestHeader}>
          <View style={styles.employeeInfo}>
            <View
              style={[
                styles.avatarContainer,
                { backgroundColor: `${themeColors.tint}15` },
              ]}
            >
              <FontAwesome5 name="user" size={16} color={themeColors.tint} />
            </View>
            <View>
              <Text style={[styles.employeeName, { color: themeColors.text }]}>
                {employeeName}
              </Text>
              <Text
                style={[styles.employeeDepartment, { color: themeColors.icon }]}
              >
                {employeeDepartment}
              </Text>
            </View>
          </View>

          <View style={styles.statusContainer}>
            {request.urgent && (
              <View style={styles.urgentBadge}>
                <FontAwesome5 name="exclamation" size={10} color="#FFFFFF" />
                <Text style={styles.urgentText}>Urgent</Text>
              </View>
            )}
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: `${getStatusColor(request.status)}20` },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: getStatusColor(request.status) },
                ]}
              >
                {request.status.charAt(0).toUpperCase() +
                  request.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.requestTitleContainer}>
          <FontAwesome5
            name={getRequestTypeIcon(request.type)}
            size={16}
            color={themeColors.tint}
            style={styles.requestTypeIcon}
          />
          <Text style={[styles.requestTitle, { color: themeColors.text }]}>
            {requestTitle}
          </Text>
        </View>

        {requestDetails && (
          <Text
            style={[styles.requestDescription, { color: themeColors.icon }]}
            numberOfLines={2}
          >
            {requestDetails}
          </Text>
        )}

        {requestDate && (
          <View style={styles.dateRangeContainer}>
            <Text style={[styles.dateRangeLabel, { color: themeColors.icon }]}>
              Date range:
            </Text>
            <Text style={[styles.dateRangeText, { color: themeColors.text }]}>
              {requestDate}
            </Text>
          </View>
        )}

        <View style={styles.requestFooter}>
          <View style={styles.requestType}>
            <Text style={[styles.requestTypeText, { color: themeColors.icon }]}>
              {getRequestTypeName(request.type)}
            </Text>
            <Text style={[styles.submittedDate, { color: themeColors.icon }]}>
              Submitted {getTimeAgo(request.createdAt)}
            </Text>
          </View>

          {request.status === "pending" && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.approveButton]}
                onPress={() => handleApproveRequest(request)}
              >
                <Text style={styles.actionButtonText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleRejectRequest(request)}
              >
                <Text style={styles.rejectButtonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const ActionModal = () => (
    <Modal
      visible={showActionModal && selectedRequest !== null}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowActionModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => {
          // Only close if tapping outside the modal content
          setShowActionModal(false);
        }}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: themeColors.cardBackground },
          ]}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => {
              // Prevent closing when tapping inside the modal
              e.stopPropagation();
            }}
            style={{ width: "100%" }}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                {(selectedRequest?.type ?? "unknown").charAt(0).toUpperCase() +
                  (selectedRequest?.type ?? "unknown").slice(1)}{" "}
                Request
              </Text>
              <TouchableOpacity onPress={() => setShowActionModal(false)}>
                <FontAwesome5 name="times" size={20} color={themeColors.icon} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: themeColors.text }]}>
              Add your comments (optional):
            </Text>

            <TextInput
              style={[
                styles.commentsInput,
                {
                  backgroundColor: `${themeColors.icon}15`,
                  color: themeColors.text,
                  borderColor: themeColors.borderColor,
                },
              ]}
              multiline
              placeholder="Enter comments for the employee..."
              placeholderTextColor={`${themeColors.icon}80`}
              value={actionComments}
              onChangeText={setActionComments}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowActionModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.approveModalButton]}
                onPress={() => confirmAction("approved")}
                disabled={updateRequestMutation.isPending}
              >
                {updateRequestMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.approveModalButtonText}>Approve</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.rejectModalButton]}
                onPress={() => confirmAction("rejected")}
                disabled={updateRequestMutation.isPending}
              >
                {updateRequestMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.rejectModalButtonText}>Reject</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />

      <ScreenHeader title="HR Requests" subtitle="Manage employee requests" />

      <View
        style={[
          styles.searchContainer,
          { backgroundColor: themeColors.cardBackground },
        ]}
      >
        <FontAwesome5 name="search" size={16} color={themeColors.icon} />
        <TextInput
          style={[styles.searchInput, { color: themeColors.text }]}
          placeholder="Search by employee name or department..."
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

      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {renderTabButton("all", "All")}
          {renderTabButton("pending", "Pending")}
          {renderTabButton("approved", "Approved")}
          {renderTabButton("rejected", "Rejected")}
        </ScrollView>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeFiltersScrollContent}
        >
          {renderTypeFilter("all", "All Types")}
          {renderTypeFilter("leave", "Leave", "calendar-minus")}
          {renderTypeFilter("vacation", "Vacation", "umbrella-beach")}
          {renderTypeFilter("salary", "Salary", "money-bill-wave")}
          {renderTypeFilter("other", "Other", "clipboard-list")}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={themeColors.tint} />
          <Text style={[styles.loaderText, { color: themeColors.text }]}>
            Loading requests...
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
            Failed to load requests
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
          {sortedRequests.length > 0 ? (
            <>
              <View style={styles.requestCount}>
                <Text
                  style={[styles.requestCountText, { color: themeColors.icon }]}
                >
                  Showing {sortedRequests.length} requests
                </Text>
              </View>
              {sortedRequests.map(renderRequestCard)}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <FontAwesome5
                name="clipboard-check"
                size={50}
                color={`${themeColors.icon}50`}
              />
              <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                No requests found
              </Text>
              <Text style={[styles.emptyText, { color: themeColors.icon }]}>
                {searchQuery ||
                activeTab !== "all" ||
                activeTypeFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "All requests have been processed!"}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <ActionModal />
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
  filtersContainer: {
    marginBottom: 16,
  },
  tabsScrollContent: {
    paddingHorizontal: 16,
  },
  typeFiltersScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
  typeFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterIcon: {
    marginRight: 4,
  },
  typeFilterText: {
    fontSize: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
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
  requestCount: {
    marginBottom: 8,
  },
  requestCountText: {
    fontSize: 14,
  },
  requestCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  urgentBadge: {
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  urgentText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 4,
  },
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  employeeInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  employeeName: {
    fontSize: 14,
    fontWeight: "600",
  },
  employeeDepartment: {
    fontSize: 12,
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
  requestTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  requestTypeIcon: {
    marginRight: 8,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  requestDescription: {
    fontSize: 14,
    marginBottom: 12,
  },
  dateRangeContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  dateRangeLabel: {
    fontSize: 12,
    marginRight: 4,
  },
  dateRangeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  requestFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  requestType: {
    flex: 1,
  },
  requestTypeText: {
    fontSize: 12,
    marginBottom: 2,
  },
  submittedDate: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: "row",
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  approveButton: {
    backgroundColor: "#6BCB77",
  },
  rejectButton: {
    backgroundColor: "#FFF",
    borderWidth: 1,
    borderColor: "#FF6B6B",
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  rejectButtonText: {
    color: "#FF6B6B",
    fontSize: 12,
    fontWeight: "600",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContainer: {
    width: "100%",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalSubtitle: {
    fontSize: 16,
    marginBottom: 12,
  },
  commentsInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    minHeight: 120,
    textAlignVertical: "top",
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#F5F5F5",
    marginRight: 8,
  },
  approveModalButton: {
    backgroundColor: "#6BCB77",
    marginHorizontal: 4,
  },
  rejectModalButton: {
    backgroundColor: "#FF6B6B",
    marginLeft: 8,
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "600",
  },
  approveModalButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
  rejectModalButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
});

export default HRRequestsManagementScreen;
