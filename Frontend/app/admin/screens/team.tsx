import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Modal,
  Alert,
  Switch,
  SectionList,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import {
  getAllEmployees,
  updateEmployeeProfile,
  getAllEmployeesIncludingDeactivated,
  deactivateEmployee,
  reactivateEmployee,
} from "@/api/Employees";
import Toast from "react-native-toast-message";
import {
  ArrowLeft,
  Search,
  Filter,
  X,
  Users,
  User,
  UserCog,
  Briefcase,
  ChevronRight,
  Edit2,
  UserX,
  UserCheck,
  AlertCircle,
  UserPlus,
  MoreVertical,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  job?: string;
  role: string;
  status: "checkedIn" | "checkedOut" | "onLeave";
  profilePicture?: string;
  checkInLocation?: {
    latitude: number;
    longitude: number;
  };
  joinDate: string;
  active?: boolean;
  deactivatedAt?: string;
}

interface EmployeeSection {
  title: string;
  data: Employee[];
}

const TeamManagement = () => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const queryClient = useQueryClient();

  // State variables
  const [searchQuery, setSearchQuery] = useState("");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [jobModalVisible, setJobModalVisible] = useState(false);
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const [actionType, setActionType] = useState<
    "deactivate" | "reactivate" | null
  >(null);
  const [selectedFilters, setSelectedFilters] = useState<{
    role: string[];
    status: string[];
  }>({
    role: [],
    status: [],
  });
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [actionsMenuVisible, setActionsMenuVisible] = useState<string | null>(
    null
  );
  const [jobTitle, setJobTitle] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Fetch employees data
  const {
    data: activeEmployees,
    isLoading: isActiveLoading,
    isError: isActiveError,
    refetch: refetchActive,
  } = useQuery<Employee[]>({
    queryKey: ["employees"],
    queryFn: getAllEmployees,
  });

  // Fetch all employees including deactivated
  const {
    data: allEmployees,
    isLoading: isAllLoading,
    isError: isAllError,
    refetch: refetchAll,
  } = useQuery<Employee[]>({
    queryKey: ["allEmployees"],
    queryFn: getAllEmployeesIncludingDeactivated,
    enabled: showInactiveUsers, // Only fetch when needed
  });

  // Update employee job mutation
  const updateJobMutation = useMutation({
    mutationFn: ({ id, job }: { id: string; job: string }) =>
      updateEmployeeProfile(id, { job }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["allEmployees"] });
      Toast.show({
        type: "success",
        text1: "Job title updated successfully",
      });
      setJobModalVisible(false);
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Failed to update job title",
        text2: error instanceof Error ? error.message : "An error occurred",
      });
    },
  });

  // Deactivate employee mutation
  const deactivateMutation = useMutation({
    mutationFn: (id: string) => deactivateEmployee(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["allEmployees"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });

      Toast.show({
        type: "success",
        text1: "Employee deactivated successfully",
      });
      setConfirmationModalVisible(false);
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Failed to deactivate employee",
        text2: error instanceof Error ? error.message : "An error occurred",
      });
      setConfirmationModalVisible(false);
    },
  });

  // Reactivate employee mutation
  const reactivateMutation = useMutation({
    mutationFn: (id: string) => reactivateEmployee(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["employees"] });
      queryClient.invalidateQueries({ queryKey: ["allEmployees"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });

      Toast.show({
        type: "success",
        text1: "Employee reactivated successfully",
      });
      setConfirmationModalVisible(false);
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Failed to reactivate employee",
        text2: error instanceof Error ? error.message : "An error occurred",
      });
      setConfirmationModalVisible(false);
    },
  });

  // Filter handlers
  const toggleFilter = (type: "role" | "status", value: string) => {
    setSelectedFilters((prev) => {
      const current = [...prev[type]];
      const index = current.indexOf(value);

      if (index === -1) {
        current.push(value);
      } else {
        current.splice(index, 1);
      }

      return {
        ...prev,
        [type]: current,
      };
    });
  };

  const clearFilters = () => {
    setSelectedFilters({
      role: [],
      status: [],
    });
  };

  // Handle job update
  const openJobModal = (employee: Employee) => {
    setSelectedEmployee(employee);
    setJobTitle(employee.job || "");
    setJobModalVisible(true);
  };

  const handleJobUpdate = () => {
    if (!selectedEmployee) return;

    updateJobMutation.mutate({
      id: selectedEmployee.id,
      job: jobTitle,
    });
  };

  // Handle showing actions menu
  const toggleActionsMenu = (employeeId: string | null) => {
    setActionsMenuVisible(
      employeeId === actionsMenuVisible ? null : employeeId
    );
  };

  // Handle employee activation status change
  const confirmDeactivation = (employee: Employee) => {
    console.log("Here");
    setSelectedEmployee(employee);
    setActionType("deactivate");
    setConfirmationModalVisible(true);
    // Close the actions menu
    setActionsMenuVisible(null);
  };

  const confirmReactivation = (employee: Employee) => {
    setSelectedEmployee(employee);
    setActionType("reactivate");
    setConfirmationModalVisible(true);
    // Close the actions menu
    setActionsMenuVisible(null);
  };

  const handleConfirmAction = () => {
    console.log("Here121212");
    if (!selectedEmployee) return;
    if (actionType === "deactivate") {
      deactivateMutation.mutate(selectedEmployee.id);
    } else if (actionType === "reactivate") {
      reactivateMutation.mutate(selectedEmployee.id);
    }
  };

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      refetchActive(),
      showInactiveUsers ? refetchAll() : Promise.resolve(),
    ]).finally(() => setRefreshing(false));
  }, [refetchActive, refetchAll, showInactiveUsers]);

  // Process and organize employees data
  const processEmployeesData = (): EmployeeSection[] => {
    const sections: EmployeeSection[] = [];

    // Filter active employees
    let filteredActiveEmployees = activeEmployees || [];

    if (
      searchQuery ||
      selectedFilters.role.length > 0 ||
      selectedFilters.status.length > 0
    ) {
      filteredActiveEmployees = filteredActiveEmployees.filter((employee) => {
        // Apply search
        const searchMatch =
          searchQuery === "" ||
          `${employee.firstName} ${employee.lastName}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (employee.job &&
            employee.job.toLowerCase().includes(searchQuery.toLowerCase()));

        // Apply role filter
        const roleMatch =
          selectedFilters.role.length === 0 ||
          selectedFilters.role.includes(employee.role);

        // Apply status filter
        const statusMatch =
          selectedFilters.status.length === 0 ||
          selectedFilters.status.includes(employee.status);

        return searchMatch && roleMatch && statusMatch;
      });
    }

    // Add active employees section
    sections.push({
      title: "Active Employees",
      data: filteredActiveEmployees,
    });

    // Add inactive employees if showInactiveUsers is true
    if (showInactiveUsers && allEmployees) {
      let inactiveEmployees = allEmployees.filter(
        (employee) => employee.active === false
      );

      // Apply filters to inactive employees
      if (searchQuery || selectedFilters.role.length > 0) {
        inactiveEmployees = inactiveEmployees.filter((employee) => {
          // Apply search
          const searchMatch =
            searchQuery === "" ||
            `${employee.firstName} ${employee.lastName}`
              .toLowerCase()
              .includes(searchQuery.toLowerCase()) ||
            employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (employee.job &&
              employee.job.toLowerCase().includes(searchQuery.toLowerCase()));

          // Apply role filter
          const roleMatch =
            selectedFilters.role.length === 0 ||
            selectedFilters.role.includes(employee.role);

          return searchMatch && roleMatch;
        });
      }

      if (inactiveEmployees.length > 0) {
        sections.push({
          title: "Deactivated Employees",
          data: inactiveEmployees,
        });
      }
    }

    return sections;
  };

  const employeeSections = processEmployeesData();

  // Navigate to employee profile
  const navigateToProfile = (employeeId: string) => {
    router.push(`/screens/employee-profile/${employeeId}`);
  };

  // Render actions menu
  const renderActionsMenu = (employee: Employee) => {
    if (actionsMenuVisible !== employee.id) return null;

    return (
      <View
        style={[styles.actionsMenu, { backgroundColor: colors.cardBackground }]}
      >
        {employee.active !== false ? (
          <TouchableOpacity
            style={styles.actionMenuItem}
            onPress={() => confirmDeactivation(employee)}
          >
            <UserX size={18} color="#F44336" />
            <Text style={[styles.actionMenuText, { color: "#F44336" }]}>
              Deactivate
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.actionMenuItem}
            onPress={() => confirmReactivation(employee)}
          >
            <UserCheck size={18} color="#4CAF50" />
            <Text style={[styles.actionMenuText, { color: "#4CAF50" }]}>
              Reactivate
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionMenuItem}
          onPress={() => {
            openJobModal(employee);
            setActionsMenuVisible(null);
          }}
        >
          <Edit2 size={18} color={colors.text} />
          <Text style={[styles.actionMenuText, { color: colors.text }]}>
            Edit Job
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render employee item
  const renderEmployeeItem = ({ item }: { item: Employee }) => (
    <View
      style={[
        styles.employeeCard,
        {
          backgroundColor: colors.cardBackground,
          opacity: item.active === false ? 0.7 : 1,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.employeeContent}
        onPress={() => navigateToProfile(item.id)}
      >
        <View style={styles.employeeLeft}>
          {item.profilePicture ? (
            <Image
              source={{ uri: item.profilePicture }}
              style={styles.employeeAvatar}
            />
          ) : (
            <View
              style={[
                styles.employeeAvatarPlaceholder,
                { backgroundColor: `${colors.tint}20` },
              ]}
            >
              <Text style={[styles.avatarText, { color: colors.tint }]}>
                {item.firstName.charAt(0)}
                {item.lastName.charAt(0)}
              </Text>
            </View>
          )}
          <View style={styles.employeeInfo}>
            <Text
              style={[styles.employeeName, { color: colors.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.firstName} {item.lastName}
            </Text>
            <Text
              style={[styles.employeeEmail, { color: colors.icon }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.email}
            </Text>
            <View style={styles.employeeStatus}>
              {item.active === false ? (
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>Deactivated</Text>
                </View>
              ) : (
                <>
                  <View
                    style={[
                      styles.statusDot,
                      {
                        backgroundColor:
                          item.status === "checkedIn"
                            ? "#4CAF50"
                            : item.status === "onLeave"
                            ? "#FFA726"
                            : "#F44336",
                      },
                    ]}
                  />
                  <Text style={[styles.statusText, { color: colors.icon }]}>
                    {item.status === "checkedIn"
                      ? "Available"
                      : item.status === "onLeave"
                      ? "On Leave"
                      : "Away"}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.employeeRight}>
          <View style={styles.jobWrapper}>
            <Briefcase
              size={14}
              color={colors.icon}
              style={{ marginRight: 4, flexShrink: 0 }}
            />
            <Text
              style={[styles.jobTitle, { color: colors.text }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.job || "Not specified"}
            </Text>
          </View>
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[
                styles.actionsButton,
                { backgroundColor: `${colors.tint}15` },
              ]}
              onPress={() => toggleActionsMenu(item.id)}
            >
              <MoreVertical size={16} color={colors.tint} />
            </TouchableOpacity>
            {renderActionsMenu(item)}
            <ChevronRight size={18} color={colors.icon} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  // Render section header
  const renderSectionHeader = ({ section }: { section: EmployeeSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionHeaderText, { color: colors.text }]}>
        {section.title} ({section.data.length})
      </Text>
    </View>
  );

  // Calculate employee stats
  const activeEmployeeCount = activeEmployees?.length || 0;
  const checkedInCount =
    activeEmployees?.filter((e) => e.status === "checkedIn").length || 0;
  const hrCount = activeEmployees?.filter((e) => e.role === "hr").length || 0;
  const inactiveCount =
    allEmployees?.filter((e) => e.active === false).length || 0;

  // List header component
  const ListHeaderComponent = () => (
    <>
      <View style={styles.statsContainer}>
        <View
          style={[styles.statCard, { backgroundColor: colors.cardBackground }]}
        >
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: `${colors.tint}15` },
            ]}
          >
            <Users size={20} color={colors.tint} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {activeEmployeeCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.icon }]}>Active</Text>
        </View>

        <View
          style={[styles.statCard, { backgroundColor: colors.cardBackground }]}
        >
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: `${colors.tint}15` },
            ]}
          >
            <User size={20} color={colors.tint} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {checkedInCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.icon }]}>
            Checked In
          </Text>
        </View>

        <View
          style={[styles.statCard, { backgroundColor: colors.cardBackground }]}
        >
          <View
            style={[
              styles.statIconContainer,
              { backgroundColor: `${colors.tint}15` },
            ]}
          >
            <UserCog size={20} color={colors.tint} />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {hrCount}
          </Text>
          <Text style={[styles.statLabel, { color: colors.icon }]}>
            HR Admin
          </Text>
        </View>
      </View>

      <View style={styles.inactiveToggleContainer}>
        <View style={styles.inactiveToggleInfo}>
          <UserX size={18} color={colors.text} style={{ marginRight: 8 }} />
          <Text style={[styles.inactiveToggleText, { color: colors.text }]}>
            Show Deactivated ({inactiveCount || 0})
          </Text>
        </View>
        <Switch
          value={showInactiveUsers}
          onValueChange={setShowInactiveUsers}
          trackColor={{
            false: `${colors.icon}50`,
            true: `${colors.tint}80`,
          }}
          thumbColor={showInactiveUsers ? colors.tint : colors.cardBackground}
        />
      </View>
    </>
  );

  // Loading state
  if ((isActiveLoading || (showInactiveUsers && isAllLoading)) && !refreshing) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Team Management
          </Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading employees...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (isActiveError || (showInactiveUsers && isAllError)) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Team Management
          </Text>
          <View style={{ width: 22 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            Failed to load employees
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={() => refetchActive()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Team Management
        </Text>
        <View style={{ width: 40 }} /> {/* Empty space for layout balance */}
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View
          style={[styles.searchBar, { backgroundColor: colors.cardBackground }]}
        >
          <Search size={20} color={colors.icon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search employees..."
            placeholderTextColor={colors.icon}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={18} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor:
                selectedFilters.role.length > 0 ||
                selectedFilters.status.length > 0
                  ? colors.tint
                  : colors.cardBackground,
            },
          ]}
          onPress={() => setFilterModalVisible(true)}
        >
          <Filter
            size={20}
            color={
              selectedFilters.role.length > 0 ||
              selectedFilters.status.length > 0
                ? "#FFF"
                : colors.icon
            }
          />
        </TouchableOpacity>
      </View>

      {/* Employee list */}
      <SectionList
        sections={employeeSections}
        keyExtractor={(item) => item.id}
        renderItem={renderEmployeeItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Users size={50} color={`${colors.icon}50`} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No employees found
            </Text>
          </View>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.tint]}
            tintColor={colors.tint}
          />
        }
        stickySectionHeadersEnabled={true}
      />

      {/* Filter Modal */}
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Filter Employees
              </Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <X size={22} color={colors.icon} />
              </TouchableOpacity>
            </View>

            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
                Role
              </Text>
              <View style={styles.filterOptions}>
                {["employee", "hr"].map((role) => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.filterOption,
                      {
                        backgroundColor: selectedFilters.role.includes(role)
                          ? colors.tint
                          : `${colors.tint}15`,
                      },
                    ]}
                    onPress={() => toggleFilter("role", role)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        {
                          color: selectedFilters.role.includes(role)
                            ? "#FFF"
                            : colors.text,
                        },
                      ]}
                    >
                      {role === "hr" ? "HR Admin" : "Employee"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterSection}>
              <Text style={[styles.filterSectionTitle, { color: colors.text }]}>
                Status
              </Text>
              <View style={styles.filterOptions}>
                {[
                  { value: "checkedIn", label: "Available" },
                  { value: "checkedOut", label: "Away" },
                  { value: "onLeave", label: "On Leave" },
                ].map((status) => (
                  <TouchableOpacity
                    key={status.value}
                    style={[
                      styles.filterOption,
                      {
                        backgroundColor: selectedFilters.status.includes(
                          status.value
                        )
                          ? colors.tint
                          : `${colors.tint}15`,
                      },
                    ]}
                    onPress={() => toggleFilter("status", status.value)}
                  >
                    <Text
                      style={[
                        styles.filterOptionText,
                        {
                          color: selectedFilters.status.includes(status.value)
                            ? "#FFF"
                            : colors.text,
                        },
                      ]}
                    >
                      {status.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[
                  styles.clearButton,
                  { borderColor: colors.borderColor || "#E5E5E5" },
                ]}
                onPress={clearFilters}
              >
                <Text style={{ color: colors.text }}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: colors.tint }]}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={{ color: "#FFF" }}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Job Update Modal */}
      <Modal
        visible={jobModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setJobModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Update Job Title
              </Text>
              <TouchableOpacity onPress={() => setJobModalVisible(false)}>
                <X size={22} color={colors.icon} />
              </TouchableOpacity>
            </View>

            {selectedEmployee && (
              <View style={styles.jobModalContent}>
                <Text style={[styles.jobModalSubtitle, { color: colors.text }]}>
                  {selectedEmployee.firstName} {selectedEmployee.lastName}
                </Text>

                <View style={styles.inputContainer}>
                  <Briefcase
                    size={18}
                    color={colors.icon}
                    style={{ marginRight: 8 }}
                  />
                  <TextInput
                    style={[
                      styles.jobInput,
                      {
                        color: colors.text,
                        borderBottomColor: colors.borderColor || "#E5E5E5",
                      },
                    ]}
                    placeholder="Enter job title..."
                    placeholderTextColor={colors.icon}
                    value={jobTitle}
                    onChangeText={setJobTitle}
                  />
                </View>

                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={[
                      styles.clearButton,
                      { borderColor: colors.borderColor || "#E5E5E5" },
                    ]}
                    onPress={() => setJobModalVisible(false)}
                  >
                    <Text style={{ color: colors.text }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.applyButton,
                      {
                        backgroundColor:
                          jobTitle.trim() !== selectedEmployee.job
                            ? colors.tint
                            : `${colors.tint}60`,
                      },
                    ]}
                    onPress={handleJobUpdate}
                    disabled={
                      jobTitle.trim() === selectedEmployee.job ||
                      updateJobMutation.isPending
                    }
                  >
                    {updateJobMutation.isPending ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={{ color: "#FFF" }}>Update</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={confirmationModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            <View style={styles.confirmationContent}>
              <View style={styles.confirmationIcon}>
                <AlertCircle
                  size={40}
                  color={actionType === "deactivate" ? "#F44336" : "#4CAF50"}
                />
              </View>

              <Text style={[styles.confirmationTitle, { color: colors.text }]}>
                {actionType === "deactivate"
                  ? "Deactivate Employee"
                  : "Reactivate Employee"}
              </Text>

              {selectedEmployee && (
                <Text
                  style={[styles.confirmationMessage, { color: colors.text }]}
                >
                  {actionType === "deactivate"
                    ? `Are you sure you want to deactivate ${selectedEmployee.firstName} ${selectedEmployee.lastName}? They will no longer be able to log in.`
                    : `Are you sure you want to reactivate ${selectedEmployee.firstName} ${selectedEmployee.lastName}? They will be able to log in again.`}
                </Text>
              )}

              <View style={styles.confirmationButtons}>
                <TouchableOpacity
                  style={[
                    styles.cancelButton,
                    { borderColor: colors.borderColor || "#E5E5E5" },
                  ]}
                  onPress={() => setConfirmationModalVisible(false)}
                >
                  <Text style={{ color: colors.text }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    {
                      backgroundColor:
                        actionType === "deactivate" ? "#F44336" : "#4CAF50",
                    },
                  ]}
                  onPress={() => handleConfirmAction()}
                >
                  {deactivateMutation.isPending ||
                  reactivateMutation.isPending ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={{ color: "#FFF" }}>
                      {actionType === "deactivate"
                        ? "Deactivate"
                        : "Reactivate"}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Toast />
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
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    width: width / 3 - 22,
    padding: 12,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  sectionHeader: {
    padding: 12,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: "600",
  },
  employeeCard: {
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  employeeContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
  },
  employeeLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  employeeAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  employeeAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 16,
    fontWeight: "600",
  },
  employeeInfo: {
    marginLeft: 12,
    flex: 1,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  employeeEmail: {
    fontSize: 12,
    marginBottom: 4,
    width: "100%",
  },
  employeeStatus: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
  },
  statusBadge: {
    backgroundColor: "#F44336",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
  },
  employeeRight: {
    alignItems: "flex-end",
    justifyContent: "center",
    width: 120,
  },
  jobWrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    width: "100%",
  },
  jobTitle: {
    fontSize: 12,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },
  actionsButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  actionsMenu: {
    position: "absolute",
    right: 30,
    top: -75,
    width: 120,
    borderRadius: 8,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  actionMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 4,
  },
  actionMenuText: {
    marginLeft: 8,
    fontSize: 13,
    fontWeight: "500",
  },
  inactiveToggleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    padding: 12,
    borderRadius: 12,
  },
  inactiveToggleInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  inactiveToggleText: {
    fontSize: 14,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#FFF",
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterOptionText: {
    fontWeight: "500",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    borderWidth: 1,
  },
  applyButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  jobModalContent: {
    paddingTop: 10,
  },
  jobModalSubtitle: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  jobInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  confirmationContent: {
    padding: 16,
    alignItems: "center",
  },
  confirmationIcon: {
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  confirmationMessage: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmationButtons: {
    flexDirection: "row",
    width: "100%",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    borderWidth: 1,
  },
  confirmButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});

export default TeamManagement;
