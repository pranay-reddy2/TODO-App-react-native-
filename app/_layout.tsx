/**
 * app/_layout.tsx
 *
 * Root layout — wraps the app with Convex, Auth, and Theme providers.
 * Handles navigation guards (redirect to login if not authenticated).
 */
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { ThemeProvider } from "../hooks/useTheme";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AuthProvider, useAuth } from "../context/AuthContext";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

// Inner component so we have access to AuthContext
function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isLayoutMounted, setIsLayoutMounted] = useState(false);

  useEffect(() => {
    setIsLayoutMounted(true);
  }, []);

  useEffect(() => {
    if (!isLayoutMounted || isLoading) return;

    const inTabsGroup = segments[0] === "(tabs)";
    const inAuthGroup =
      segments[0] === "login" || segments[0] === "register";

    if (!user && inTabsGroup) {
      router.replace("/login");
    } else if (user && inAuthGroup) {
      router.replace("/");
    }
  }, [user, segments, isLayoutMounted, isLoading]);

  // Show loading spinner while restoring session
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}

export default function RootLayout() {
  // AuthProvider uses ConvexHttpClient directly (not hooks),
  // so it can safely wrap ConvexProvider.
  return (
    <AuthProvider>
      <ConvexProvider client={convex}>
        <ThemeProvider>
          <RootLayoutNav />
        </ThemeProvider>
      </ConvexProvider>
    </AuthProvider>
  );
}