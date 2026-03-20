import { createSettingsStyles } from "@/assets/styles/settings.styles";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";

// ProgressStats — shows task counts for the currently logged-in user
const ProgressStats = () => {
  const { colors } = useTheme();
  const settingsStyles = createSettingsStyles(colors);
  const { user } = useAuth();

  const todos = useQuery(api.todos.getTodos, {
    userId: user?.email ?? "guest",
  });

  const totalTodos = todos ? todos.length : 0;
  const completedTodos = todos
    ? todos.filter((todo) => todo.isCompleted).length
    : 0;
  const activeTodos = totalTodos - completedTodos;
  const highPriorityTodos = todos
    ? todos.filter((t) => t.priority === "high" && !t.isCompleted).length
    : 0;

  const stats = [
    {
      label: "Total Tasks",
      value: totalTodos,
      icon: "list" as const,
      gradient: colors.gradients.primary,
      borderColor: colors.primary,
    },
    {
      label: "Completed",
      value: completedTodos,
      icon: "checkmark-circle" as const,
      gradient: colors.gradients.success,
      borderColor: colors.success,
    },
    {
      label: "Active",
      value: activeTodos,
      icon: "time" as const,
      gradient: colors.gradients.warning,
      borderColor: colors.warning,
    },
    {
      label: "High Priority",
      value: highPriorityTodos,
      icon: "flame" as const,
      gradient: colors.gradients.danger,
      borderColor: colors.danger,
    },
  ];

  return (
    <LinearGradient
      colors={colors.gradients.surface}
      style={settingsStyles.section}
    >
      <Text style={settingsStyles.sectionTitle}>My Progress</Text>

      <View style={settingsStyles.statsContainer}>
        {stats.map((stat) => (
          <LinearGradient
            key={stat.label}
            colors={colors.gradients.background}
            style={[
              settingsStyles.statCard,
              { borderLeftColor: stat.borderColor },
            ]}
          >
            <View style={settingsStyles.statIconContainer}>
              <LinearGradient
                colors={stat.gradient}
                style={settingsStyles.statIcon}
              >
                <Ionicons name={stat.icon} size={20} color="#fff" />
              </LinearGradient>
            </View>
            <View>
              <Text style={settingsStyles.statNumber}>{stat.value}</Text>
              <Text style={settingsStyles.statLabel}>{stat.label}</Text>
            </View>
          </LinearGradient>
        ))}
      </View>
    </LinearGradient>
  );
};

export default ProgressStats;
