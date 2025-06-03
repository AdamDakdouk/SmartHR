import React, { useState, useEffect } from "react";
import { Formik } from "formik";
import * as Yup from "yup";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  Modal,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
} from "react-native";

const { width, height } = Dimensions.get("window");

interface ThemeColors {
  text: string;
  background: string;
  cardBackground: string;
  tint: string;
  icon: string;
  buttonBackground: string;
  buttonText: string;
  borderColor: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface TaskFormValues {
  title: string;
  description: string;
  assignedTo: string;
  dueDate: Date;
  priority: "low" | "medium" | "high";
  progress?: number;
  status?: "pending" | "in_progress" | "completed";
}

export interface CreateTaskFormProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => void;
  employees: Employee[];
  themeColors: ThemeColors;
  setSelectedEmployeeId: React.Dispatch<React.SetStateAction<string>>;
  selectedEmployeeId: string;
  initialValues?: TaskFormValues | null;
}
type TaskStatus = "pending" | "in_progress" | "completed";

const TaskSchema = Yup.object().shape({
  title: Yup.string()
    .min(3, "Title too short")
    .max(50, "Title too long")
    .required("Title is required"),
  description: Yup.string()
    .min(10, "Description too short")
    .max(500, "Description too long")
    .required("Description is required"),
  assignedTo: Yup.string().required("Please select an employee"),
  dueDate: Yup.date()
    .min(new Date(), "Due date cannot be in the past")
    .required("Due date is required"),
  priority: Yup.string()
    .oneOf(["low", "medium", "high"], "Invalid priority")
    .required("Priority is required"),
  progress: Yup.number()
    .min(0, "Progress cannot be negative")
    .max(100, "Progress cannot exceed 100")
    .optional(),
  status: Yup.string()
    .oneOf(["pending", "in_progress", "completed"], "Invalid status")
    .optional(),
});

const CreateTaskForm: React.FC<CreateTaskFormProps> = ({
  isVisible,
  onClose,
  onSubmit,
  employees,
  themeColors,
  initialValues,
  setSelectedEmployeeId,
  selectedEmployeeId,
}) => {
  const [employeeDropdownOpen, setEmployeeDropdownOpen] = useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dropdownStatusValue, setDropdownStatusValue] =
    useState<TaskStatus>("pending");
  const [selectedPriority, setSelectedPriority] = useState<
    "low" | "medium" | "high"
  >("medium");
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus>("pending");

  const defaultValues: TaskFormValues = {
    title: "",
    description: "",
    assignedTo: "",
    dueDate: new Date(),
    priority: "medium",
    progress: 0,
    status: "pending",
  };

  const priorityOptions = [
    { label: "High", value: "high" },
    { label: "Medium", value: "medium" },
    { label: "Low", value: "low" },
  ];

  const statusOptions: { label: string; value: TaskStatus }[] = [
    { label: "Pending", value: "pending" },
    { label: "In Progress", value: "in_progress" },
    { label: "Completed", value: "completed" },
  ];

  const formatDateForInput = (date: Date | null | undefined): string => {
    if (!date || isNaN(date.getTime())) {
      return "";
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    // Fixed template string:
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (
    event: any,
    date?: Date,
    setFieldValue?: (field: string, value: any) => void
  ) => {
    if (Platform.OS === "android" || Platform.OS === "web") {
      setShowDatePicker(false);
    }

    if (date && !isNaN(date.getTime())) {
      const newDate = new Date(date);
      // Setting the time to 23:59:59 if needed
      newDate.setHours(23, 59, 59, 999);
      setSelectedDate(newDate);
      if (setFieldValue) {
        setFieldValue("dueDate", newDate);
      }
    }
  };

  useEffect(() => {
    if (initialValues) {
      setSelectedEmployeeId(initialValues.assignedTo);
      // Remove: setSelectedPriority(initialValues.priority);
      setSelectedStatus(initialValues.status || "pending");
    }
  }, [initialValues]);

  const renderDateInput = (
    values: TaskFormValues,
    setFieldValue: (field: string, value: any) => void
  ) => {
    if (Platform.OS === "web") {
      return (
        <View style={styles.webDateContainer}>
          <View style={styles.webDateInputWrapper}>
            <input
              type="date"
              style={{
                width: "100%",
                height: 48,
                padding: "0 40px 0 16px",
                borderRadius: 12,
                backgroundColor: themeColors.background,
                color: themeColors.text,
                border: `1px solid ${themeColors.borderColor}`,
                fontFamily: "System",
                fontSize: 16,
                appearance: "none",
                WebkitAppearance: "none",
              }}
              value={formatDateForInput(values.dueDate)}
              onChange={(e) => {
                try {
                  const newDate = new Date(e.target.value);
                  if (!isNaN(newDate.getTime())) {
                    newDate.setHours(23, 59, 59, 999);
                    setSelectedDate(newDate);
                    setFieldValue("dueDate", newDate);
                  }
                } catch (error) {
                  console.error("Invalid date input:", error);
                }
              }}
              min={formatDateForInput(new Date())}
            />
            <View style={styles.calendarIconWeb}>
              <FontAwesome5
                name="calendar-alt"
                size={16}
                color={themeColors.icon}
              />
            </View>
          </View>
        </View>
      );
    }

    return (
      <>
        <TouchableOpacity
          style={[
            styles.datePickerButton,
            {
              backgroundColor: themeColors.background,
              borderColor: themeColors.borderColor,
            },
          ]}
          onPress={() => setShowDatePicker(true)}
        >
          <FontAwesome5
            name="calendar-alt"
            size={16}
            color={themeColors.icon}
          />
          <Text style={[styles.dateText, { color: themeColors.text }]}>
            {values.dueDate && !isNaN(values.dueDate.getTime())
              ? values.dueDate.toLocaleDateString()
              : "Select date"}
          </Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            minimumDate={new Date()}
            onChange={(event, date) =>
              handleDateChange(event, date, setFieldValue)
            }
            style={styles.datePicker}
            textColor={themeColors.text}
            themeVariant={themeColors.background === "#000" ? "dark" : "light"}
          />
        )}
      </>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        >
          <View
            style={[
              styles.modalContent,
              { backgroundColor: themeColors.cardBackground },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: themeColors.text }]}>
                {initialValues ? "Edit Task" : "Create New Task"}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <FontAwesome5 name="times" size={20} color={themeColors.icon} />
              </TouchableOpacity>
            </View>

            <Formik
              initialValues={
                initialValues
                  ? {
                      ...initialValues,
                      dueDate: new Date(initialValues.dueDate),
                    }
                  : defaultValues
              }
              validationSchema={TaskSchema}
              onSubmit={onSubmit}
              enableReinitialize={!!initialValues}
            >
              {({
                handleChange,
                handleBlur,
                handleSubmit,
                setFieldValue,
                values,
                errors,
                touched,
                isValid,
                dirty,
              }) => (
                <ScrollView
                  contentContainerStyle={styles.formContentContainer}
                  keyboardShouldPersistTaps="handled"
                  keyboardDismissMode="on-drag"
                  contentInsetAdjustmentBehavior="automatic"
                >
                  <View style={styles.inputGroup}>
                    <Text
                      style={[styles.inputLabel, { color: themeColors.text }]}
                    >
                      Title
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: themeColors.background,
                          color: themeColors.text,
                          borderColor:
                            touched.title && errors.title
                              ? "#FF4444"
                              : themeColors.borderColor,
                        },
                      ]}
                      placeholder="Enter task title"
                      placeholderTextColor={themeColors.icon}
                      value={values.title}
                      onChangeText={handleChange("title")}
                      onBlur={handleBlur("title")}
                    />
                    {touched.title && errors.title && (
                      <Text style={styles.errorText}>{errors.title}</Text>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text
                      style={[styles.inputLabel, { color: themeColors.text }]}
                    >
                      Description
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.textArea,
                        {
                          backgroundColor: themeColors.background,
                          color: themeColors.text,
                          borderColor:
                            touched.description && errors.description
                              ? "#FF4444"
                              : themeColors.borderColor,
                        },
                      ]}
                      placeholder="Enter task description"
                      placeholderTextColor={themeColors.icon}
                      multiline
                      numberOfLines={4}
                      value={values.description}
                      onChangeText={handleChange("description")}
                      onBlur={handleBlur("description")}
                    />
                    {touched.description && errors.description && (
                      <Text style={styles.errorText}>{errors.description}</Text>
                    )}
                  </View>

                  <View style={[styles.inputGroup, { zIndex: 3000 }]}>
                    <Text
                      style={[styles.inputLabel, { color: themeColors.text }]}
                    >
                      Priority
                    </Text>
                    <DropDownPicker
                      open={priorityDropdownOpen}
                      setOpen={setPriorityDropdownOpen}
                      value={selectedPriority}
                      setValue={(newValue) => {
                        // Check if newValue is a function (an updater function)
                        const valueToSet =
                          typeof newValue === "function"
                            ? newValue(selectedPriority)
                            : newValue;
                        console.log("New priority value:", valueToSet);
                        setSelectedPriority(valueToSet);
                        setFieldValue("priority", valueToSet);
                      }}
                      items={priorityOptions}
                      style={[
                        styles.dropdown,
                        {
                          backgroundColor: themeColors.background,
                          borderColor:
                            touched.priority && errors.priority
                              ? "#FF4444"
                              : themeColors.borderColor,
                        },
                      ]}
                      textStyle={{ color: themeColors.text }}
                      dropDownContainerStyle={{
                        backgroundColor: themeColors.background,
                        borderColor: themeColors.borderColor,
                        zIndex: 9999,
                        elevation: 9999,
                      }}
                      listItemContainerStyle={{ zIndex: 9999 }}
                      placeholder="Select Priority"
                      listMode="SCROLLVIEW"
                      scrollViewProps={{ nestedScrollEnabled: true }}
                    />
                  </View>

                  {initialValues && (
                    <View style={[styles.inputGroup, { zIndex: 2000 }]}>
                      <Text
                        style={[styles.inputLabel, { color: themeColors.text }]}
                      >
                        Status
                      </Text>
                      <DropDownPicker<TaskStatus>
                        open={statusDropdownOpen}
                        setOpen={setStatusDropdownOpen}
                        value={dropdownStatusValue}
                        setValue={setDropdownStatusValue}
                        onChangeValue={(val: TaskStatus | null) => {
                          if (val) {
                            setSelectedStatus(val);
                            setFieldValue("status", val);
                            if (val === "completed")
                              setFieldValue("progress", 100);
                            if (val === "pending") setFieldValue("progress", 0);
                          }
                        }}
                        items={statusOptions}
                        style={[
                          styles.dropdown,
                          { backgroundColor: themeColors.background },
                        ]}
                        textStyle={{ color: themeColors.text }}
                        dropDownContainerStyle={{
                          backgroundColor: themeColors.background,
                          borderColor: themeColors.borderColor,
                        }}
                        placeholder="Select Status"
                      />
                    </View>
                  )}

                  {initialValues && (
                    <View style={styles.inputGroup}>
                      <Text
                        style={[styles.inputLabel, { color: themeColors.text }]}
                      >
                        Progress ({values.progress}%)
                      </Text>
                      <View style={styles.progressContainer}>
                        <View
                          style={[
                            styles.progressBar,
                            {
                              width: `${values.progress || 0}%`,
                              backgroundColor: themeColors.tint,
                            },
                          ]}
                        />
                      </View>
                      <View style={styles.progressButtons}>
                        {[0, 25, 50, 75, 100].map((progress) => (
                          <TouchableOpacity
                            key={progress}
                            style={[
                              styles.progressButton,
                              {
                                backgroundColor:
                                  values.progress === progress
                                    ? themeColors.tint
                                    : `${themeColors.tint}15`,
                              },
                            ]}
                            onPress={() => setFieldValue("progress", progress)}
                          >
                            <Text
                              style={[
                                styles.progressButtonText,
                                {
                                  color:
                                    values.progress === progress
                                      ? "#fff"
                                      : themeColors.text,
                                },
                              ]}
                            >
                              {progress}%
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  <View style={[styles.inputGroup, { zIndex: 1000 }]}>
                    <Text
                      style={[styles.inputLabel, { color: themeColors.text }]}
                    >
                      Assign To
                    </Text>
                    <DropDownPicker
                      open={employeeDropdownOpen}
                      setOpen={setEmployeeDropdownOpen}
                      value={selectedEmployeeId}
                      setValue={(val) => {
                        if (val) {
                          setSelectedEmployeeId(val);
                          setFieldValue("assignedTo", val);
                        }
                      }}
                      items={employees.map((emp) => ({
                        label: `${emp.firstName} ${emp.lastName}`,
                        value: emp.id,
                      }))}
                      style={[
                        styles.dropdown,
                        {
                          backgroundColor: themeColors.background,
                          borderColor:
                            touched.assignedTo && errors.assignedTo
                              ? "#FF4444"
                              : themeColors.borderColor,
                        },
                      ]}
                      textStyle={{ color: themeColors.text }}
                      dropDownContainerStyle={{
                        backgroundColor: themeColors.background,
                        borderColor: themeColors.borderColor,
                        zIndex: 9999,
                        elevation: 9999,
                      }}
                      listItemContainerStyle={{
                        zIndex: 9999,
                      }}
                      placeholder="Select Employee"
                      listMode="SCROLLVIEW"
                      scrollViewProps={{
                        nestedScrollEnabled: true,
                      }}
                    />
                    {touched.assignedTo && errors.assignedTo && (
                      <Text style={styles.errorText}>{errors.assignedTo}</Text>
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text
                      style={[styles.inputLabel, { color: themeColors.text }]}
                    >
                      Due Date
                    </Text>
                    {renderDateInput(values, setFieldValue)}
                    {touched.dueDate && errors.dueDate && (
                      <Text style={styles.errorText}>{errors.dueDate}</Text>
                    )}
                  </View>

                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={onClose}
                    >
                      <Text
                        style={[styles.buttonText, { color: themeColors.text }]}
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.modalButton,
                        {
                          backgroundColor:
                            isValid && dirty
                              ? themeColors.buttonBackground
                              : themeColors.icon,
                        },
                      ]}
                      onPress={() => handleSubmit()}
                      disabled={!isValid || !dirty}
                    >
                      <Text
                        style={[
                          styles.buttonText,
                          { color: themeColors.buttonText },
                        ]}
                      >
                        {initialValues ? "Update Task" : "Create Task"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              )}
            </Formik>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  keyboardAvoidingView: {
    flex: 1,
    // We remove 'justifyContent' or 'alignItems' if we want the modal pinned to top
    // but if you want it centered, keep them:
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    // Make width responsive
    width: Platform.OS === "ios" ? "90%" : Math.min(width - 48, 600),
    // Removed the fixed maxHeight: 700
    maxHeight: height * 0.8,
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    backgroundColor: "blue",
  },
  formContentContainer: {
    padding: 20,
    // flexGrow: 1 is set in-line where ScrollView is used
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  textArea: {
    height: 120,
    paddingTop: 12,
    paddingBottom: 12,
    textAlignVertical: "top",
  },
  dropdown: {
    height: 48,
    borderRadius: 12,
  },
  webDateContainer: {
    width: "100%",
    position: "relative",
  },
  webDateInputWrapper: {
    width: "100%",
    position: "relative",
  },
  calendarIconWeb: {
    position: "absolute",
    right: 16,
    top: "50%",
    transform: [{ translateY: -8 }],
    pointerEvents: "none",
  },
  datePickerButton: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dateText: {
    fontSize: 14,
  },
  errorText: {
    color: "#FF4444",
    fontSize: 12,
    marginTop: 4,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  datePicker: {
    backgroundColor: "transparent",
  },
  webListMode: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: 12,
    marginTop: 4,
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressContainer: {
    height: 6,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBar: {
    height: "100%",
    borderRadius: 3,
  },
  progressButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  progressButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
  },
  progressButtonText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default CreateTaskForm;
