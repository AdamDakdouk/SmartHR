// app/admin/_layout.tsx
import { Stack } from "expo-router";
import React from "react";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";

export default function AdminLayout() {
  const colorScheme = useColorScheme();
  const backgroundColor = Colors[colorScheme ?? "light"].background;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="screens" />
    </Stack>
  );
}
