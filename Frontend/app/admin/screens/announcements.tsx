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
  Modal,
} from "react-native";
import { router } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { SafeAreaView } from "react-native-safe-area-context";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import Toast from "react-native-toast-message";
import { format, formatDistanceToNow } from "date-fns";
import {
  Announcement,
  getAllAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  updateAnnouncement,
  getActiveAnnouncementsCount,
} from "@/api/announcements";
import { ScreenHeader } from "@/components/navigation/Header";

const AnnouncementsScreen = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sendToAll, setSendToAll] = useState(true);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const queryClient = useQueryClient();

  // Fetch all announcements
  const {
    data: announcements = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Announcement[]>({
    queryKey: ["announcements"],
    queryFn: getAllAnnouncements,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Mutation for creating announcement
  const createAnnouncementMutation = useMutation({
    mutationFn: (data: {
      title: string;
      description: string;
      sendToAll: boolean;
    }) =>
      createAnnouncement(
        data.title,
        data.description,
        user?.id || "",
        data.sendToAll
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      queryClient.invalidateQueries({ queryKey: ["activeAnnouncementsCount"] });
      Toast.show({
        type: "success",
        text1: "Announcement created successfully",
      });
      setShowCreateModal(false);
      resetForm();
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Failed to create announcement",
        text2:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    },
  });

  // Mutation for updating announcement
  const updateAnnouncementMutation = useMutation({
    mutationFn: (data: {
      announcementId: string;
      title: string;
      description: string;
      sendToAll: boolean;
    }) =>
      updateAnnouncement(data.announcementId, {
        title: data.title,
        description: data.description,
        sendToAll: data.sendToAll,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      Toast.show({
        type: "success",
        text1: "Announcement updated successfully",
      });
      setShowEditModal(false);
      resetForm();
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Failed to update announcement",
        text2:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    },
  });

  // Mutation for deleting announcement
  const deleteAnnouncementMutation = useMutation({
    mutationFn: (announcementId: string) => deleteAnnouncement(announcementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["announcements"] });
      queryClient.invalidateQueries({ queryKey: ["activeAnnouncementsCount"] });
      Toast.show({
        type: "success",
        text1: "Announcement deleted successfully",
      });
    },
    onError: (error) => {
      Toast.show({
        type: "error",
        text1: "Failed to delete announcement",
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

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSendToAll(true);
    setSelectedAnnouncement(null);
  };

  const handleCreateAnnouncement = () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert(
        "Required Fields",
        "Please fill in both title and description fields."
      );
      return;
    }

    createAnnouncementMutation.mutate({
      title: title.trim(),
      description: description.trim(),
      sendToAll,
    });
  };

  const handleUpdateAnnouncement = () => {
    if (!selectedAnnouncement) return;

    if (!title.trim() || !description.trim()) {
      Alert.alert(
        "Required Fields",
        "Please fill in both title and description fields."
      );
      return;
    }

    updateAnnouncementMutation.mutate({
      announcementId: selectedAnnouncement._id,
      title: title.trim(),
      description: description.trim(),
      sendToAll,
    });
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setTitle(announcement.title);
    setDescription(announcement.description);
    setSendToAll(announcement.sendToAll);
    setShowEditModal(true);
  };

  const handleDeleteAnnouncement = (announcement: Announcement) => {
    Alert.alert(
      "Delete Announcement",
      `Are you sure you want to delete "${announcement.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteAnnouncementMutation.mutate(announcement._id),
        },
      ]
    );
  };

  const filteredAnnouncements = announcements.filter(
    (announcement) =>
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      announcement.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "PPP"); // Format as "Apr 29, 2025"
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true }); // e.g. "2 days ago"
  };

  const renderAnnouncementCard = (announcement: Announcement) => {
    // Check if the current user is the creator of the announcement
    const isCreator = user?.id === announcement.createdBy;

    return (
      <View
        key={announcement._id}
        style={[
          styles.announcementCard,
          { backgroundColor: themeColors.cardBackground },
        ]}
      >
        <View style={styles.announcementHeader}>
          <Text style={[styles.announcementTitle, { color: themeColors.text }]}>
            {announcement.title}
          </Text>
          <View style={styles.actionButtons}>
            {(isCreator || user?.role === "hr" || user?.role === "admin") && (
              <>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => handleEditAnnouncement(announcement)}
                >
                  <FontAwesome5
                    name="edit"
                    size={16}
                    color={themeColors.tint}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteAnnouncement(announcement)}
                >
                  <FontAwesome5 name="trash-alt" size={16} color="#FF6B6B" />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <Text
          style={[styles.announcementDescription, { color: themeColors.text }]}
        >
          {announcement.description}
        </Text>

        <View style={styles.announcementFooter}>
          <View style={styles.metaContainer}>
            <Text style={[styles.metaText, { color: themeColors.icon }]}>
              Created {getTimeAgo(announcement.createdAt)}
            </Text>
            <Text style={[styles.metaText, { color: themeColors.icon }]}>
              {formatDate(announcement.createdAt)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderCreateAnnouncementModal = () => (
    <Modal
      visible={showCreateModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalContainer}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: themeColors.cardBackground },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              Create Announcement
            </Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <FontAwesome5 name="times" size={20} color={themeColors.icon} />
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <Text style={[styles.fieldLabel, { color: themeColors.text }]}>
              Title*
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: themeColors.text,
                  backgroundColor: `${themeColors.icon}15`,
                },
              ]}
              placeholder="Announcement Title"
              placeholderTextColor={`${themeColors.icon}80`}
              value={title}
              onChangeText={setTitle}
            />

            <Text
              style={[
                styles.fieldLabel,
                { color: themeColors.text, marginTop: 16 },
              ]}
            >
              Description*
            </Text>
            <TextInput
              style={[
                styles.textAreaInput,
                {
                  color: themeColors.text,
                  backgroundColor: `${themeColors.icon}15`,
                },
              ]}
              placeholder="Announcement Description"
              placeholderTextColor={`${themeColors.icon}80`}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              numberOfLines={5}
            />

            <View style={styles.toggleContainer}>
              <Text style={[styles.toggleLabel, { color: themeColors.text }]}>
                Send to all employees
              </Text>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: sendToAll
                      ? themeColors.tint
                      : `${themeColors.icon}30`,
                  },
                ]}
                onPress={() => setSendToAll(!sendToAll)}
              >
                <View
                  style={[
                    styles.toggleCircle,
                    {
                      backgroundColor: themeColors.cardBackground,
                      transform: [
                        {
                          translateX: sendToAll ? 16 : 0,
                        },
                      ],
                    },
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.footerButton,
                styles.cancelButton,
                { borderColor: themeColors.icon },
              ]}
              onPress={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              <Text
                style={[styles.footerButtonText, { color: themeColors.icon }]}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.footerButton,
                styles.createButton,
                { backgroundColor: themeColors.buttonBackground },
              ]}
              onPress={handleCreateAnnouncement}
              disabled={createAnnouncementMutation.isPending}
            >
              {createAnnouncementMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.createButtonText}>Create</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderEditAnnouncementModal = () => (
    <Modal
      visible={showEditModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowEditModal(false)}
    >
      <View style={styles.modalContainer}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: themeColors.cardBackground },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: themeColors.text }]}>
              Edit Announcement
            </Text>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <FontAwesome5 name="times" size={20} color={themeColors.icon} />
            </TouchableOpacity>
          </View>

          <View style={styles.formContainer}>
            <Text style={[styles.fieldLabel, { color: themeColors.text }]}>
              Title*
            </Text>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: themeColors.text,
                  backgroundColor: `${themeColors.icon}15`,
                },
              ]}
              placeholder="Announcement Title"
              placeholderTextColor={`${themeColors.icon}80`}
              value={title}
              onChangeText={setTitle}
            />

            <Text
              style={[
                styles.fieldLabel,
                { color: themeColors.text, marginTop: 16 },
              ]}
            >
              Description*
            </Text>
            <TextInput
              style={[
                styles.textAreaInput,
                {
                  color: themeColors.text,
                  backgroundColor: `${themeColors.icon}15`,
                },
              ]}
              placeholder="Announcement Description"
              placeholderTextColor={`${themeColors.icon}80`}
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              numberOfLines={5}
            />

            <View style={styles.toggleContainer}>
              <Text style={[styles.toggleLabel, { color: themeColors.text }]}>
                Send to all employees
              </Text>
              <TouchableOpacity
                style={[
                  styles.toggleButton,
                  {
                    backgroundColor: sendToAll
                      ? themeColors.tint
                      : `${themeColors.icon}30`,
                  },
                ]}
                onPress={() => setSendToAll(!sendToAll)}
              >
                <View
                  style={[
                    styles.toggleCircle,
                    {
                      backgroundColor: themeColors.cardBackground,
                      transform: [
                        {
                          translateX: sendToAll ? 16 : 0,
                        },
                      ],
                    },
                  ]}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.footerButton,
                styles.cancelButton,
                { borderColor: themeColors.icon },
              ]}
              onPress={() => {
                setShowEditModal(false);
                resetForm();
              }}
            >
              <Text
                style={[styles.footerButtonText, { color: themeColors.icon }]}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.footerButton,
                styles.createButton,
                { backgroundColor: themeColors.buttonBackground },
              ]}
              onPress={handleUpdateAnnouncement}
              disabled={updateAnnouncementMutation.isPending}
            >
              {updateAnnouncementMutation.isPending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.createButtonText}>Update</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />

      <ScreenHeader
        title="Announcements"
        subtitle="Create and manage company announcements"
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
          placeholder="Search announcements..."
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

      {isLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={themeColors.tint} />
          <Text style={[styles.loaderText, { color: themeColors.text }]}>
            Loading announcements...
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
            Failed to load announcements
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
          {filteredAnnouncements.length > 0 ? (
            filteredAnnouncements.map(renderAnnouncementCard)
          ) : (
            <View style={styles.emptyContainer}>
              <FontAwesome5
                name="bullhorn"
                size={50}
                color={`${themeColors.icon}50`}
              />
              <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                No announcements found
              </Text>
              <Text style={[styles.emptyText, { color: themeColors.icon }]}>
                {searchQuery
                  ? "Try adjusting your search"
                  : "Create your first announcement by tapping the button below"}
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      <TouchableOpacity
        style={[
          styles.fabButton,
          { backgroundColor: themeColors.buttonBackground },
        ]}
        onPress={() => setShowCreateModal(true)}
      >
        <FontAwesome5 name="plus" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      {renderCreateAnnouncementModal()}
      {renderEditAnnouncementModal()}
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
  announcementCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  announcementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    alignItems: "center",
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
  },
  editButton: {
    padding: 8,
    marginRight: 4,
  },
  deleteButton: {
    padding: 8,
  },
  announcementDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  announcementFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaContainer: {
    flex: 1,
  },
  metaText: {
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
  fabButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    margin: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  formContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  textInput: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textAreaInput: {
    minHeight: 120,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  toggleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
  },
  toggleLabel: {
    fontSize: 16,
  },
  toggleButton: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerButton: {
    flex: 1,
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    borderWidth: 1,
    marginRight: 8,
  },
  createButton: {
    marginLeft: 8,
  },
  footerButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  createButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default AnnouncementsScreen;
