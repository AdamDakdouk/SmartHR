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
  Image,
} from "react-native";
import { router } from "expo-router";
import { FontAwesome5 } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { SafeAreaView } from "react-native-safe-area-context";
import { format } from "date-fns";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { ScreenHeader } from "@/components/navigation/Header";

// This is a mock screen as we don't have the backend API for documents yet

type DocumentCategory =
  | "policy"
  | "handbook"
  | "form"
  | "contract"
  | "guide"
  | "other";

interface Document {
  id: string;
  title: string;
  category: DocumentCategory;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
  downloadUrl: string;
  thumbnailUrl?: string;
}

const DocumentCenterScreen = () => {
  const colorScheme = useColorScheme();
  const themeColors = Colors[colorScheme ?? "light"];
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    "all" | DocumentCategory
  >("all");
  const [loading, setLoading] = useState(false);

  // Mock data for documents
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "doc1",
      title: "Employee Handbook 2025",
      category: "handbook",
      fileType: "pdf",
      fileSize: 2400000, // in bytes
      uploadedBy: "HR Admin",
      uploadedAt: "2025-03-10T10:00:00",
      description:
        "Complete guide to company policies and procedures for all employees.",
      downloadUrl: "#",
      thumbnailUrl: "",
    },
    {
      id: "doc2",
      title: "Remote Work Policy",
      category: "policy",
      fileType: "pdf",
      fileSize: 890000,
      uploadedBy: "HR Manager",
      uploadedAt: "2025-03-15T14:30:00",
      description: "Guidelines and protocols for remote working arrangements.",
      downloadUrl: "#",
    },
    {
      id: "doc3",
      title: "Expense Reimbursement Form",
      category: "form",
      fileType: "docx",
      fileSize: 450000,
      uploadedBy: "Finance Team",
      uploadedAt: "2025-03-20T09:15:00",
      description: "Form to submit expense reimbursement requests.",
      downloadUrl: "#",
    },
    {
      id: "doc4",
      title: "Standard Employment Contract",
      category: "contract",
      fileType: "pdf",
      fileSize: 1250000,
      uploadedBy: "Legal Department",
      uploadedAt: "2025-02-28T11:45:00",
      description: "Standard contract for full-time employees.",
      downloadUrl: "#",
    },
    {
      id: "doc5",
      title: "IT Security Guidelines",
      category: "guide",
      fileType: "pdf",
      fileSize: 1800000,
      uploadedBy: "IT Department",
      uploadedAt: "2025-04-05T16:20:00",
      description: "Comprehensive guidelines for maintaining IT security.",
      downloadUrl: "#",
    },
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getDocumentIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case "pdf":
        return "file-pdf";
      case "doc":
      case "docx":
        return "file-word";
      case "xls":
      case "xlsx":
        return "file-excel";
      case "ppt":
      case "pptx":
        return "file-powerpoint";
      case "jpg":
      case "jpeg":
      case "png":
        return "file-image";
      default:
        return "file-alt";
    }
  };

  const getDocumentIconColor = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case "pdf":
        return "#FF5252";
      case "doc":
      case "docx":
        return "#4285F4";
      case "xls":
      case "xlsx":
        return "#34A853";
      case "ppt":
      case "pptx":
        return "#FE9900";
      case "jpg":
      case "jpeg":
      case "png":
        return "#9C27B0";
      default:
        return themeColors.icon;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return bytes + " B";
    } else if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + " KB";
    } else if (bytes < 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    } else {
      return (bytes / (1024 * 1024 * 1024)).toFixed(1) + " GB";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy");
  };

  const getCategoryName = (category: DocumentCategory): string => {
    switch (category) {
      case "policy":
        return "Policy";
      case "handbook":
        return "Handbook";
      case "form":
        return "Form";
      case "contract":
        return "Contract";
      case "guide":
        return "Guide";
      case "other":
        return "Other";
      default:
        return category;
    }
  };

  const handleUploadDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          "application/vnd.ms-excel",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const fileInfo = result.assets[0];

      // Here you would normally upload the file to your server
      // For now, we'll mock adding it to our local state

      Alert.prompt(
        "Document Title",
        "Enter a title for this document:",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Upload",
            onPress: (title) => {
              if (!title) {
                Alert.alert("Error", "Please provide a document title");
                return;
              }

              const newDoc: Document = {
                id: `doc${documents.length + 1}`,
                title: title,
                category: "other",
                fileType: fileInfo.name.split(".").pop() || "unknown",
                fileSize: fileInfo.size || 0,
                uploadedBy: "HR Manager",
                uploadedAt: new Date().toISOString(),
                description: "",
                downloadUrl: "#",
              };

              setDocuments([newDoc, ...documents]);

              Alert.alert(
                "Upload Successful",
                `Document "${title}" has been uploaded successfully.`
              );
            },
          },
        ],
        "plain-text"
      );
    } catch (error) {
      Alert.alert("Error", "Failed to upload document");
      console.error(error);
    }
  };

  const handleDownloadDocument = (document: Document) => {
    // In a real app, this would initiate a download
    Alert.alert(
      "Download Document",
      `Downloading "${document.title}" (${formatFileSize(document.fileSize)})`,
      [{ text: "OK" }]
    );
  };

  const handleDeleteDocument = (documentId: string) => {
    Alert.alert(
      "Delete Document",
      "Are you sure you want to delete this document?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setDocuments(documents.filter((doc) => doc.id !== documentId));
            Alert.alert("Success", "Document deleted successfully");
          },
        },
      ]
    );
  };

  const filteredDocuments = documents.filter((document) => {
    const matchesSearch =
      document.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      document.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      document.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      activeCategory === "all" || document.category === activeCategory;

    return matchesSearch && matchesCategory;
  });

  const renderCategoryFilter = (
    categoryName: "all" | DocumentCategory,
    label: string,
    icon: keyof typeof FontAwesome5.glyphMap
  ) => (
    <TouchableOpacity
      style={[
        styles.categoryFilterButton,
        activeCategory === categoryName && {
          backgroundColor: `${themeColors.tint}20`,
          borderColor: themeColors.tint,
        },
      ]}
      onPress={() => setActiveCategory(categoryName)}
    >
      <FontAwesome5
        name={icon}
        size={14}
        color={
          activeCategory === categoryName ? themeColors.tint : themeColors.icon
        }
        style={styles.filterIcon}
      />
      <Text
        style={[
          styles.categoryFilterText,
          {
            color:
              activeCategory === categoryName
                ? themeColors.tint
                : themeColors.icon,
            fontWeight: activeCategory === categoryName ? "600" : "400",
          },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderDocumentCard = (document: Document) => (
    <View
      key={document.id}
      style={[
        styles.documentCard,
        { backgroundColor: themeColors.cardBackground },
      ]}
    >
      <View style={styles.documentHeader}>
        <View style={styles.documentIconContainer}>
          <FontAwesome5
            name={getDocumentIcon(document.fileType)}
            size={24}
            color={getDocumentIconColor(document.fileType)}
          />
        </View>
        <View style={styles.documentTitleContainer}>
          <Text style={[styles.documentTitle, { color: themeColors.text }]}>
            {document.title}
          </Text>
          <View style={styles.documentMeta}>
            <Text
              style={[styles.documentMetaText, { color: themeColors.icon }]}
            >
              {formatFileSize(document.fileSize)} •{" "}
              {document.fileType.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      {document.description && (
        <Text
          style={[styles.documentDescription, { color: themeColors.text }]}
          numberOfLines={2}
        >
          {document.description}
        </Text>
      )}

      <View style={styles.documentFooter}>
        <View style={styles.documentInfoContainer}>
          <Text style={[styles.uploadInfo, { color: themeColors.icon }]}>
            Uploaded by {document.uploadedBy} on{" "}
            {formatDate(document.uploadedAt)}
          </Text>
          <View
            style={[
              styles.categoryBadge,
              { backgroundColor: `${themeColors.tint}15` },
            ]}
          >
            <Text
              style={[styles.categoryBadgeText, { color: themeColors.tint }]}
            >
              {getCategoryName(document.category)}
            </Text>
          </View>
        </View>

        <View style={styles.documentActions}>
          <TouchableOpacity
            style={styles.documentActionButton}
            onPress={() => handleDownloadDocument(document)}
          >
            <FontAwesome5 name="download" size={18} color={themeColors.tint} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.documentActionButton}
            onPress={() => handleDeleteDocument(document.id)}
          >
            <FontAwesome5 name="trash-alt" size={18} color="#FF6B6B" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: themeColors.background }]}
    >
      <StatusBar
        barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
      />

      <ScreenHeader
        title="Document Center"
        subtitle="Manage company policies and documents"
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
          placeholder="Search documents..."
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

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryFiltersContainer}
      >
        {renderCategoryFilter("all", "All", "folder")}
        {renderCategoryFilter("policy", "Policies", "file-contract")}
        {renderCategoryFilter("handbook", "Handbooks", "book")}
        {renderCategoryFilter("form", "Forms", "clipboard")}
        {renderCategoryFilter("contract", "Contracts", "file-signature")}
        {renderCategoryFilter("guide", "Guides", "book-reader")}
        {renderCategoryFilter("other", "Other", "file")}
      </ScrollView>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={themeColors.tint} />
          <Text style={[styles.loaderText, { color: themeColors.text }]}>
            Loading documents...
          </Text>
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
          {filteredDocuments.length > 0 ? (
            <>
              <View style={styles.documentCount}>
                <Text
                  style={[
                    styles.documentCountText,
                    { color: themeColors.icon },
                  ]}
                >
                  Showing {filteredDocuments.length} documents
                </Text>
              </View>
              {filteredDocuments.map(renderDocumentCard)}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <FontAwesome5
                name="file-alt"
                size={50}
                color={`${themeColors.icon}50`}
              />
              <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
                No documents found
              </Text>
              <Text style={[styles.emptyText, { color: themeColors.icon }]}>
                {searchQuery || activeCategory !== "all"
                  ? "Try adjusting your search or filters"
                  : "Upload your first document by tapping the button below"}
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
        onPress={handleUploadDocument}
      >
        <FontAwesome5 name="upload" size={20} color="#FFFFFF" />
      </TouchableOpacity>
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
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    height: 50,
    marginLeft: 8,
    fontSize: 16,
  },
  categoryFiltersContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  categoryFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterIcon: {
    marginRight: 6,
  },
  categoryFilterText: {
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
  documentCount: {
    marginBottom: 8,
  },
  documentCountText: {
    fontSize: 14,
  },
  documentCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  documentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    marginRight: 12,
  },
  documentTitleContainer: {
    flex: 1,
    justifyContent: "center",
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  documentMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  documentMetaText: {
    fontSize: 12,
  },
  documentDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  documentFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  documentInfoContainer: {
    flex: 1,
  },
  uploadInfo: {
    fontSize: 12,
    marginBottom: 4,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: "500",
  },
  documentActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  documentActionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
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
});

export default DocumentCenterScreen;
