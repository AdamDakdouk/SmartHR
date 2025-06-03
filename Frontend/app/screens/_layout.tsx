// app/screens/_layout.tsx
import { Stack } from "expo-router";

export default function ScreensLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="check-in-out" />
      <Stack.Screen name="tasks" />
      <Stack.Screen name="announcements" />
      <Stack.Screen name="employees" />
      <Stack.Screen name="request" />
      <Stack.Screen name="issue" />
      <Stack.Screen name="login" />
      <Stack.Screen name="employee-profile" />
    </Stack>
  );
}
