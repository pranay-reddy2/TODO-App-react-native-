import { createSettingsStyles } from "@/assets/styles/settings.styles";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View } from "react-native";

const ProgressStats = () => {
  const { colors } = useTheme();
  const s = createSettingsStyles(colors);
  const { user } = useAuth();
  const userId = user?.email ?? undefined;

  const todos = useQuery(api.todos.getTodos, userId ? { userId } : "skip");
  const all = todos ?? [];
  const total = all.length;
  const completed = all.filter((t) => t.isCompleted).length;
  const active = total - completed;
  const highPriority = all.filter((t) => t.priority === "high" && !t.isCompleted).length;

  const stats = [
    { label: "Total Tasks", value: total, icon: "list" as const, gradient: colors.gradients.primary, border: colors.primary },
    { label: "Completed", value: completed, icon: "checkmark-circle" as const, gradient: colors.gradients.success, border: colors.success },
    { label: "Active", value: active, icon: "time" as const, gradient: colors.gradients.warning, border: colors.warning },
    { label: "High Priority", value: highPriority, icon: "flame" as const, gradient: colors.gradients.danger, border: colors.danger },
  ];

  return (
    <LinearGradient colors={colors.gradients.surface} style={s.section}>
      <Text style={s.sectionTitle}>My Progress</Text>
      <View style={s.statsContainer}>
        {stats.map((stat) => (
          <LinearGradient key={stat.label} colors={colors.gradients.background}
            style={[s.statCard, { borderLeftColor: stat.border }]}>
            <View style={s.statIconContainer}>
              <LinearGradient colors={stat.gradient} style={s.statIcon}>
                <Ionicons name={stat.icon} size={20} color="#fff" />
              </LinearGradient>
            </View>
            <View>
              <Text style={s.statNumber}>{stat.value}</Text>
              <Text style={s.statLabel}>{stat.label}</Text>
            </View>
          </LinearGradient>
        ))}
      </View>
    </LinearGradient>
  );
};

export default ProgressStats;