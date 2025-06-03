// app/admin/screens/_layout.tsx
import { Stack } from "expo-router";
import React from "react";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function ScreensLayout() {
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme ?? "light"].background;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor },
        presentation: "modal",
      }}
    >
      <Stack.Screen name="tasks" />
      <Stack.Screen name="locationTracking" />
      <Stack.Screen name="createTask" />
    </Stack>
  );
}
