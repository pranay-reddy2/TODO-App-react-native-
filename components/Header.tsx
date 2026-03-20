import { createHomeStyles } from "@/assets/styles/home.styles";
import { api } from "@/convex/_generated/api";
import useTheme from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";

// Header shows progress for the current authenticated user only
const Header = () => {
  const { colors } = useTheme();
  const homeStyles = createHomeStyles(colors);
  const { user } = useAuth();

  // Filter todos by userId so progress reflects only this user's tasks
  const todos = useQuery(api.todos.getTodos, { userId: user?.email ?? "guest" });

  const completedCount = todos ? todos.filter((todo) => todo.isCompleted).length : 0;
  const totalCount = todos ? todos.length : 0;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <View style={homeStyles.header}>
      <View style={homeStyles.titleContainer}>
        <LinearGradient colors={colors.gradients.primary} style={homeStyles.iconContainer}>
          <Ionicons name="flash-outline" size={28} color="#fff" />
        </LinearGradient>

        <View style={homeStyles.titleTextContainer}>
          <Text style={homeStyles.title}>{greeting} 👋</Text>
          <Text style={homeStyles.subtitle}>
            {totalCount === 0
              ? "No tasks yet — add one!"
              : completedCount === totalCount
              ? "All tasks done! 🎉"
              : `${completedCount} of ${totalCount} tasks done`}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      {totalCount > 0 && (
        <View style={homeStyles.progressContainer}>
          <View style={homeStyles.progressBarContainer}>
            <View style={homeStyles.progressBar}>
              <LinearGradient
                colors={colors.gradients.success}
                style={[homeStyles.progressFill, { width: `${progressPercentage}%` }]}
              />
            </View>
            <Text style={homeStyles.progressText}>{Math.round(progressPercentage)}%</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default Header;