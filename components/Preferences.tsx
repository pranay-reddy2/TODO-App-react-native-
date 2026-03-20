import { createSettingsStyles } from "@/assets/styles/settings.styles";
import useTheme from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Alert, Switch, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";

// Preferences section in Settings — includes dark mode toggle and logout
const Preferences = () => {
  const [isAutoSync, setIsAutoSync] = useState(true);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);

  const { isDarkMode, toggleDarkMode, colors } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const settingsStyles = createSettingsStyles(colors);

  const handleLogout = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/login");
          },
        },
      ]
    );
  };

  return (
    <LinearGradient colors={colors.gradients.surface} style={settingsStyles.section}>
      <Text style={settingsStyles.sectionTitle}>Preferences</Text>

      {/* Logged in as */}
      {user && (
        <View style={[settingsStyles.settingItem, { paddingVertical: 12 }]}>
          <View style={settingsStyles.settingLeft}>
            <LinearGradient colors={colors.gradients.success} style={settingsStyles.settingIcon}>
              <Ionicons name="person-circle-outline" size={18} color="#fff" />
            </LinearGradient>
            <View>
              <Text style={[settingsStyles.settingText, { fontSize: 13 }]}>Logged in as</Text>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: "600" }} numberOfLines={1}>
                {user.email}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* DARK MODE */}
      <View style={settingsStyles.settingItem}>
        <View style={settingsStyles.settingLeft}>
          <LinearGradient colors={colors.gradients.primary} style={settingsStyles.settingIcon}>
            <Ionicons name="moon" size={18} color="#fff" />
          </LinearGradient>
          <Text style={settingsStyles.settingText}>Dark Mode</Text>
        </View>
        <Switch
          value={isDarkMode}
          onValueChange={toggleDarkMode}
          thumbColor={"#fff"}
          trackColor={{ false: colors.border, true: colors.primary }}
          ios_backgroundColor={colors.border}
        />
      </View>

      {/* NOTIFICATIONS */}
      <View style={settingsStyles.settingItem}>
        <View style={settingsStyles.settingLeft}>
          <LinearGradient colors={colors.gradients.warning} style={settingsStyles.settingIcon}>
            <Ionicons name="notifications" size={18} color="#fff" />
          </LinearGradient>
          <Text style={settingsStyles.settingText}>Notifications</Text>
        </View>
        <Switch
          value={isNotificationsEnabled}
          onValueChange={() => setIsNotificationsEnabled(!isNotificationsEnabled)}
          thumbColor={"#fff"}
          trackColor={{ false: colors.border, true: colors.warning }}
          ios_backgroundColor={colors.border}
        />
      </View>

      {/* AUTO-SYNC */}
      <View style={settingsStyles.settingItem}>
        <View style={settingsStyles.settingLeft}>
          <LinearGradient colors={colors.gradients.success} style={settingsStyles.settingIcon}>
            <Ionicons name="sync-outline" size={18} color="#fff" />
          </LinearGradient>
          <Text style={settingsStyles.settingText}>Auto Sync</Text>
        </View>
        <Switch
          value={isAutoSync}
          onValueChange={() => setIsAutoSync(!isAutoSync)}
          thumbColor={"#fff"}
          trackColor={{ false: colors.border, true: colors.success }}
          ios_backgroundColor={colors.border}
        />
      </View>

      {/* LOGOUT */}
      <TouchableOpacity
        style={[settingsStyles.settingItem, { borderBottomWidth: 0 }]}
        onPress={handleLogout}
        activeOpacity={0.7}
      >
        <View style={settingsStyles.settingLeft}>
          <LinearGradient colors={colors.gradients.danger} style={settingsStyles.settingIcon}>
            <Ionicons name="log-out-outline" size={18} color="#fff" />
          </LinearGradient>
          <Text style={[settingsStyles.settingText, { color: colors.danger }]}>Sign Out</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default Preferences;