import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: "Secure Notes" }} />
      <Stack.Screen name="note/[id]" options={{ title: "Note" }} />
      <Stack.Screen name="setting" options={{ title: "Settings" }} />
      <Stack.Screen name="benchmark" options={{ title: "Benchmark" }} />
    </Stack>
  );
}
