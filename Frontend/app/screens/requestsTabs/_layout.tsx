// app/screens/requests/_layout.tsx
import { Stack } from "expo-router";

export default function RequestsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="leave" />
      <Stack.Screen name="vacation" />
      <Stack.Screen name="salary" />
    </Stack>
  );
}
