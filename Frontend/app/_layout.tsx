// app/_layout.tsx
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
  useNavigationContainerRef,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-reanimated";
import { BackHandler, Alert, Platform } from "react-native";
import { useRouter, usePathname, useNavigation } from "expo-router";

import { useColorScheme } from "@/hooks/useColorScheme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toastConfig } from "@/config/Toast";
import Toast from "react-native-toast-message";
import { AuthProvider } from "@/context/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 30, // Consider data fresh for 30 seconds
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
  },
});

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const pathname = usePathname();
  const navigationRef = useNavigationContainerRef();

  // Function to check if we're on a main screen where back should trigger exit confirmation
  const isMainScreen = (path: string) => {
    return (
      path === "/" ||
      path === "/index" ||
      path === "/(tabs)" ||
      path === "/(tabs)/index" ||
      path === "/(tabs)/calendar" ||
      path === "/(tabs)/chatbot" ||
      path === "/(tabs)/profile"
    );
  };

  const showExitConfirmation = () => {
    Alert.alert("Hold on!", "Are you sure you want to exit?", [
      {
        text: "Cancel",
        onPress: () => null,
        style: "cancel",
      },
      {
        text: "YES",
        onPress: () => BackHandler.exitApp(),
      },
    ]);
    return true; // Prevents default back button behavior
  };

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  // Handle hardware back button (Android)
  useEffect(() => {
    const backAction = () => {
      if (isMainScreen(pathname)) {
        return showExitConfirmation();
      }

      // For other screens, let the default back navigation work
      return false;
    };

    // Only add the handler for Android
    if (Platform.OS === "android") {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        backAction
      );

      return () => backHandler.remove();
    }
  }, [pathname]);

  if (!loaded) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider
          value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
        >
          <Stack
            screenOptions={{
              headerShown: false,
              // Disable the gesture on iOS for certain screens
              gestureEnabled: !isMainScreen(pathname),
              // Custom behavior for when a user hits the edge of the stack
              gestureResponseDistance: {
                start: 50, // Reduce the responsive area to avoid accidental swipes
              },
            }}
          >
            <Stack.Screen
              name="(tabs)"
              options={{
                // Disable gesture for tabs specifically
                gestureEnabled: false,
              }}
            />
            <Stack.Screen name="screens" />
            <Stack.Screen name="admin" />
            <Stack.Screen
              name="index"
              options={{
                // Disable gesture for login screen
                gestureEnabled: false,
              }}
            />
            <Stack.Screen name="+not-found" options={{ headerShown: true }} />
          </Stack>
          <Toast config={toastConfig} />
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
