/**
 * components/DangerZone.tsx
 *
 * Danger zone section — deletes all todos for the current user.
 * Uses user.id (Convex user _id) instead of user.email.
 */
import { createSettingsStyles } from "@/assets/styles/settings.styles";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { Alert, Text, TouchableOpacity, View } from "react-native";

const DangerZone = () => {
  const { colors } = useTheme();
  const settingsStyles = createSettingsStyles(colors);
  const { user } = useAuth();
  // Support both old (email) and new (id) sessions
  const userId = user?.id ?? user?.email ?? undefined;

  const clearAllTodos = useMutation(api.todos.clearAllTodos);

  const handleResetApp = async () => {
    Alert.alert(
      "Delete All Tasks",
      "⚠️ This will permanently delete ALL your tasks. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete All",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await clearAllTodos({ userId });
              Alert.alert(
                "Cleared",
                `Successfully deleted ${result.deletedCount} task${result.deletedCount === 1 ? "" : "s"}.`,
              );
            } catch (error: unknown) {
              const msg =
                error instanceof Error
                  ? error.message
                  : "Failed to clear tasks";
              console.error("Error deleting todos", error);
              Alert.alert("Error", msg);
            }
          },
        },
      ],
    );
  };

  return (
    <LinearGradient
      colors={colors.gradients.surface}
      style={settingsStyles.section}
    >
      <Text style={settingsStyles.sectionTitleDanger}>Danger Zone</Text>

      <TouchableOpacity
        style={[settingsStyles.actionButton, { borderBottomWidth: 0 }]}
        onPress={handleResetApp}
        activeOpacity={0.7}
      >
        <View style={settingsStyles.actionLeft}>
          <LinearGradient
            colors={colors.gradients.danger}
            style={settingsStyles.actionIcon}
          >
            <Ionicons name="trash" size={18} color="#ffffff" />
          </LinearGradient>
          <Text style={settingsStyles.actionTextDanger}>
            Delete All My Tasks
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </LinearGradient>
  );
};

export default DangerZone;
