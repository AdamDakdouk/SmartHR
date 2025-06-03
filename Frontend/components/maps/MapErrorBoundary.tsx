// components/maps/MapErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class MapErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: undefined,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Map error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {Platform.select({
              native:
                "Unable to load map. Please check your location settings.",
              default: "Map loading error. Please try again.",
            })}
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 18,
  },
  errorText: {
    fontSize: 16,
    color: "#FF6B6B",
    textAlign: "center",
    padding: 20,
  },
});

export default MapErrorBoundary;
