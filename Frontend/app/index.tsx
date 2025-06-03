import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Link } from "expo-router"; // Import Link from expo-router
import StartScreen from "./start/startScreen";

export default function index() {
  return (
    <>
      <StartScreen />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
    color: "white",
  },
  button: {
    backgroundColor: "#6C63FF",
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "600",
  },
});
