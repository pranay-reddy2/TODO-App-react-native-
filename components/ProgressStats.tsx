/**
 * components/ProgressStats.tsx
 *
 * Shows task stats: total, completed, active, high-priority.
 * Also shows a per-category breakdown of pending tasks.
 */
import { createSettingsStyles } from "@/assets/styles/settings.styles";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import useTheme from "@/hooks/useTheme";
import { getCategoryColor, getCategoryIcon } from "@/components/CategoryPicker";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { Text, View, ScrollView } from "react-native";

const ProgressStats = () => {
  const { colors } = useTheme();
  const s = createSettingsStyles(colors);
  const { user } = useAuth();
  const userId = user?.id ?? user?.email ?? undefined;

  const todos = useQuery(api.todos.getTodos, userId ? { userId } : "skip");
  const all = todos ?? [];
  const total = all.length;
  const completed = all.filter((t) => t.isCompleted).length;
  const active = total - completed;
  const highPriority = all.filter((t) => t.priority === "high" && !t.isCompleted).length;

  // Build per-category breakdown (pending tasks only)
  const categoryMap: Record<string, number> = {};
  all
    .filter((t) => !t.isCompleted)
    .forEach((t) => {
      const cat = t.category ?? "General";
      categoryMap[cat] = (categoryMap[cat] ?? 0) + 1;
    });
  const categoryEntries = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);

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

      {/* Category breakdown */}
      {categoryEntries.length > 0 && (
        <View style={{ marginTop: 20 }}>
          <Text style={[s.sectionTitle, { fontSize: 15, marginBottom: 12 }]}>
            Pending by Category
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
          >
            {categoryEntries.map(([cat, count]) => {
              const catColor = getCategoryColor(cat);
              const catIcon = getCategoryIcon(cat);
              return (
                <View
                  key={cat}
                  style={{
                    alignItems: "center",
                    backgroundColor: catColor + "18",
                    borderRadius: 14,
                    padding: 12,
                    minWidth: 72,
                    borderWidth: 1,
                    borderColor: catColor + "44",
                  }}
                >
                  <Ionicons name={catIcon} size={20} color={catColor} />
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "800",
                      color: catColor,
                      marginTop: 4,
                    }}
                  >
                    {count}
                  </Text>
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "600",
                      color: catColor,
                      marginTop: 2,
                      textAlign: "center",
                    }}
                    numberOfLines={1}
                  >
                    {cat}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}
    </LinearGradient>
  );
};

export default ProgressStats;