import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { ThemeProvider } from "../hooks/useTheme";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { AuthProvider, useAuth } from "../context/AuthContext";

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!, {
  unsavedChangesWarning: false,
});

// Inner component so we have access to AuthContext
function RootLayoutNav() {
  const { user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // Guard: don't attempt navigation until the root Stack has fully mounted.
  // Calling router.replace() before mount throws:
  //   "Attempted to navigate before mounting the Root Layout component"
  const [isLayoutMounted, setIsLayoutMounted] = useState(false);

  useEffect(() => {
    setIsLayoutMounted(true);
  }, []);

  useEffect(() => {
    if (!isLayoutMounted) return;

    const inTabsGroup = segments[0] === "(tabs)";
    const inAuthGroup = segments[0] === "login" || segments[0] === "register";

    if (!user && inTabsGroup) {
      // Not logged in but trying to access tabs → redirect to login
      router.replace("/login");
    } else if (user && inAuthGroup) {
      // Logged in but on login/register → redirect to app
      router.replace("/");
    }
  }, [user, segments, isLayoutMounted]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <ThemeProvider>
          <RootLayoutNav />
        </ThemeProvider>
      </AuthProvider>
    </ConvexProvider>
  );
}