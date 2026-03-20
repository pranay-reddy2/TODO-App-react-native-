import { Stack } from "expo-router";
import { ThemeProvider } from "../hooks/useTheme";
import {ConvexProvider,ConvexReactClient} from "convex/react";
import { AuthProvider } from "../context/AuthContext";
const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL!,{
    unsavedChangesWarning: false,
  })
export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <ThemeProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
          </Stack>
        </ThemeProvider>
      </AuthProvider>
    </ConvexProvider>
  );
}