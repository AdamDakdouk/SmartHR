import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const Employees = () => {
  // Sample data of employees
  const employees = [
    { id: "1", name: "Alice Johnson", role: "Software Engineer" },
    { id: "2", name: "Bob Smith", role: "Project Manager" },
    { id: "3", name: "Charlie Brown", role: "UI/UX Designer" },
    // Add more employees as needed
  ];

  const renderEmployee = ({ item }) => (
    <TouchableOpacity style={styles.employeeCard}>
      {/* Profile Icon */}
      <View style={styles.iconContainer}>
        <Ionicons name="person-circle-outline" size={50} color="#4A90E2" />
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.employeeName}>{item.name}</Text>
        <Text style={styles.employeeRole}>{item.role}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Employees</Text>
      <FlatList
        data={employees}
        renderItem={renderEmployee}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: 20,
  },
  employeeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  iconContainer: {
    marginRight: 15,
  },
  infoContainer: {
    flex: 1,
  },
  employeeName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  employeeRole: {
    fontSize: 14,
    color: "#666",
  },
});

export default Employees;
