/**
 * app/(tabs)/index.tsx
 *
 * Main todo list screen.
 * - Uses Convex user ID (not email) as userId for proper DB linking
 * - Fixed delete: awaits mutation and shows correct error
 * - Edit mode includes DatePickerModal for deadline
 * - Filter tabs: All / Active / Done
 * - Category filter: filter tasks by category tag
 * - Category badge shown on each task card
 */
import { createHomeStyles } from "@/assets/styles/home.styles";
import EmptyState from "@/components/EmptyState";
import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import TodoInput from "@/components/TodoInput";
import DatePickerModal from "@/components/DatePickerModel";
import CategoryPicker, {
  getCategoryColor,
  getCategoryIcon,
} from "@/components/CategoryPicker";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import useTheme from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Alert,
  FlatList,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Todo = Doc<"todos">;

// Priority badge colors
const PRIORITY_COLORS: Record<string, string> = {
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#10b981",
};

const PRIORITY_ICONS: Record<string, "flame" | "alert-circle" | "leaf"> = {
  high: "flame",
  medium: "alert-circle",
  low: "leaf",
};

export default function Index() {
  const { colors } = useTheme();
  const styles = createHomeStyles(colors);
  const { user } = useAuth();

  // Support both old sessions (userId=email) and new sessions (userId=id)
  const userId = user?.id ?? user?.email ?? undefined;

  // Status filter state
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  // Category filter state
  const [activeCategory, setActiveCategory] = useState<string>("all");

  // Fetch todos with optional category filter applied server-side
  const todos = useQuery(
    api.todos.getTodos,
    userId
      ? {
          userId,
          category: activeCategory !== "all" ? activeCategory : undefined,
        }
      : "skip"
  );

  // Fetch all unique categories for this user
  const userCategories = useQuery(
    api.todos.getUserCategories,
    userId ? { userId } : "skip"
  );

  const toggleTodo = useMutation(api.todos.toggleTodo);
  const deleteTodo = useMutation(api.todos.deleteTodo);
  const updateTodo = useMutation(api.todos.updateTodo);

  // Edit states
  const [editingId, setEditingId] = useState<Id<"todos"> | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editPriority, setEditPriority] = useState("medium");
  const [editCategory, setEditCategory] = useState("General");
  const [showEditCategory, setShowEditCategory] = useState(false);

  // All todos (unfiltered) for tab badge counts — must be called before any early return
  const allTodos = useQuery(
    api.todos.getTodos,
    userId ? { userId } : "skip"
  ) ?? [];

  if (!todos) return <LoadingSpinner />;

  // Apply status filter on client side (category filter is server-side)
  const filteredTodos = todos.filter((t) => {
    if (filter === "active") return !t.isCompleted;
    if (filter === "completed") return t.isCompleted;
    return true;
  });

  // TOGGLE
  const handleToggleTodo = async (id: Id<"todos">) => {
    try {
      await toggleTodo({ id });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to update task";
      Alert.alert("Error", msg);
    }
  };

  // DELETE — properly awaits and shows errors
  const handleDeleteTodo = (id: Id<"todos">) => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteTodo({ id });
          } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : "Failed to delete task";
            Alert.alert("Error", msg);
          }
        },
      },
    ]);
  };

  // START EDITING
  const handleEditTodo = (todo: Todo) => {
    setEditingId(todo._id);
    setEditTitle(todo.title);
    setEditDescription(todo.description);
    setEditDeadline(todo.deadline);
    setEditPriority(todo.priority);
    setEditCategory(todo.category ?? "General");
    setShowEditCategory(false);
  };

  // SAVE EDIT
  const handleSaveEdit = async () => {
    if (!editingId) return;
    if (!editTitle.trim()) {
      Alert.alert("Error", "Title cannot be empty");
      return;
    }
    try {
      await updateTodo({
        id: editingId,
        title: editTitle,
        description: editDescription,
        deadline: editDeadline,
        priority: editPriority,
        category: editCategory,
        dateTime: new Date().toISOString(),
      });
      setEditingId(null);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to update task";
      Alert.alert("Error", msg);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setShowEditCategory(false);
  };

  // Format deadline for display
  const formatDeadline = (deadline: string) => {
    if (!deadline) return null;
    try {
      const date = new Date(deadline + "T00:00:00");
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil(
        (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, color: colors.danger };
      if (diffDays === 0) return { label: "Due today", color: colors.warning };
      if (diffDays === 1) return { label: "Due tomorrow", color: colors.warning };
      return { label: `Due in ${diffDays}d`, color: colors.textMuted };
    } catch {
      return { label: deadline, color: colors.textMuted };
    }
  };

  // RENDER ITEM
  const renderItem = ({ item }: { item: Todo }) => {
    const isEditing = editingId === item._id;
    const deadlineInfo = formatDeadline(item.deadline);
    const priorityColor = PRIORITY_COLORS[item.priority] ?? colors.textMuted;
    const priorityIcon = PRIORITY_ICONS[item.priority] ?? "alert-circle";
    const catColor = getCategoryColor(item.category ?? "General");
    const catIcon = getCategoryIcon(item.category ?? "General");

    return (
      <View style={styles.todoItemWrapper}>
        <LinearGradient
          colors={colors.gradients.surface}
          style={[
            styles.todoItem,
            item.isCompleted && { opacity: 0.75 },
          ]}
        >
          {/* CHECKBOX */}
          <TouchableOpacity
            onPress={() => handleToggleTodo(item._id)}
            style={{ marginRight: 14, marginTop: 2 }}
          >
            <LinearGradient
              colors={
                item.isCompleted
                  ? colors.gradients.success
                  : colors.gradients.muted
              }
              style={styles.checkboxInner}
            >
              {item.isCompleted && (
                <Ionicons name="checkmark" size={18} color="#fff" />
              )}
            </LinearGradient>
          </TouchableOpacity>

          {isEditing ? (
            // ─── EDIT MODE ───────────────────────────────────────────────
            <View style={styles.editContainer}>
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Title"
                placeholderTextColor={colors.textMuted}
                style={styles.editInput}
              />
              <TextInput
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Description"
                placeholderTextColor={colors.textMuted}
                style={styles.editInput}
                multiline
              />

              {/* Date picker in edit mode */}
              <View style={{ marginBottom: 12 }}>
                <DatePickerModal
                  value={editDeadline}
                  onConfirm={(date) => setEditDeadline(date)}
                  placeholder="Select deadline date"
                />
              </View>

              {/* Priority selector */}
              <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                {(["low", "medium", "high"] as const).map((p) => (
                  <TouchableOpacity key={p} onPress={() => setEditPriority(p)}>
                    <LinearGradient
                      colors={editPriority === p ? colors.gradients.primary : colors.gradients.muted}
                      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 }}
                    >
                      <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600", textTransform: "capitalize" }}>{p}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Category selector in edit mode */}
              <TouchableOpacity
                onPress={() => setShowEditCategory((v) => !v)}
                style={{ marginBottom: 10 }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: catColor,
                    backgroundColor: catColor + "15",
                    alignSelf: "flex-start",
                  }}
                >
                  <Ionicons name={catIcon} size={13} color={catColor} />
                  <Text style={{ fontSize: 12, fontWeight: "600", color: catColor }}>
                    {editCategory}
                  </Text>
                  <Ionicons
                    name={showEditCategory ? "chevron-up" : "chevron-down"}
                    size={12}
                    color={catColor}
                  />
                </View>
              </TouchableOpacity>

              {showEditCategory && (
                <View style={{ marginBottom: 12 }}>
                  <CategoryPicker
                    value={editCategory}
                    onSelect={(cat) => {
                      setEditCategory(cat);
                      setShowEditCategory(false);
                    }}
                    extraCategories={userCategories ?? []}
                  />
                </View>
              )}

              <View style={styles.editButtons}>
                <TouchableOpacity onPress={handleSaveEdit}>
                  <LinearGradient colors={colors.gradients.success} style={styles.editButton}>
                    <Ionicons name="checkmark" size={14} color="#fff" />
                    <Text style={styles.editButtonText}>Save</Text>
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCancelEdit}>
                  <LinearGradient colors={colors.gradients.muted} style={styles.editButton}>
                    <Ionicons name="close" size={14} color="#fff" />
                    <Text style={styles.editButtonText}>Cancel</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // ─── VIEW MODE ───────────────────────────────────────────────
            <View style={styles.todoTextContainer}>
              {/* Title */}
              <Text
                style={[
                  styles.todoText,
                  item.isCompleted && {
                    textDecorationLine: "line-through",
                    opacity: 0.5,
                  },
                ]}
                numberOfLines={2}
              >
                {item.title}
              </Text>

              {/* Description */}
              {item.description ? (
                <Text
                  style={{ color: colors.textMuted, fontSize: 13, marginBottom: 6 }}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
              ) : null}

              {/* Meta row: category + priority + deadline */}
              <View style={{ flexDirection: "row", gap: 6, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                {/* Category badge */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: catColor + "18",
                    paddingHorizontal: 7,
                    paddingVertical: 3,
                    borderRadius: 8,
                    gap: 3,
                  }}
                >
                  <Ionicons name={catIcon} size={10} color={catColor} />
                  <Text style={{ color: catColor, fontSize: 10, fontWeight: "700" }}>
                    {item.category ?? "General"}
                  </Text>
                </View>

                {/* Priority badge */}
                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: priorityColor + "22",
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                  gap: 4,
                }}>
                  <Ionicons name={priorityIcon} size={11} color={priorityColor} />
                  <Text style={{ color: priorityColor, fontSize: 11, fontWeight: "700", textTransform: "capitalize" }}>
                    {item.priority}
                  </Text>
                </View>

                {/* Deadline badge */}
                {deadlineInfo && (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                    <Ionicons name="calendar-outline" size={11} color={deadlineInfo.color} />
                    <Text style={{ color: deadlineInfo.color, fontSize: 11, fontWeight: "600" }}>
                      {deadlineInfo.label}
                    </Text>
                  </View>
                )}
              </View>

              {/* Action buttons */}
              <View style={styles.todoActions}>
                <TouchableOpacity onPress={() => handleEditTodo(item)}>
                  <LinearGradient colors={colors.gradients.warning} style={styles.actionButton}>
                    <Ionicons name="pencil" size={13} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteTodo(item._id)}>
                  <LinearGradient colors={colors.gradients.danger} style={styles.actionButton}>
                    <Ionicons name="trash" size={13} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </LinearGradient>
      </View>
    );
  };

  // Status filter tabs
  const filterTabs: { key: "all" | "active" | "completed"; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "completed", label: "Done" },
  ];

  return (
    <LinearGradient colors={colors.gradients.background} style={styles.container}>
      <StatusBar barStyle={colors.statusBarStyle} />

      <SafeAreaView style={styles.safeArea}>
        <Header />
        <TodoInput />

        {/* Status filter tabs */}
        <View style={{ flexDirection: "row", paddingHorizontal: 24, gap: 8, marginBottom: 6 }}>
          {filterTabs.map((tab) => {
            const isActive = filter === tab.key;
            const count =
              tab.key === "all"
                ? allTodos.length
                : tab.key === "active"
                ? allTodos.filter((t) => !t.isCompleted).length
                : allTodos.filter((t) => t.isCompleted).length;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setFilter(tab.key)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={isActive ? colors.gradients.primary : colors.gradients.muted}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 20,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>{tab.label}</Text>
                  <View style={{ backgroundColor: "rgba(255,255,255,0.3)", borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 }}>
                    <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{count}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Category filter row */}
        {userCategories && userCategories.length > 0 && (
          <View style={{ paddingHorizontal: 24, marginBottom: 8 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6, paddingVertical: 2 }}
            >
              {/* "All categories" chip */}
              <TouchableOpacity
                onPress={() => setActiveCategory("all")}
                activeOpacity={0.7}
              >
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                    borderRadius: 20,
                    backgroundColor:
                      activeCategory === "all"
                        ? colors.primary + "22"
                        : colors.border + "44",
                    borderWidth: 1,
                    borderColor:
                      activeCategory === "all" ? colors.primary : colors.border,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Ionicons
                    name="apps-outline"
                    size={11}
                    color={activeCategory === "all" ? colors.primary : colors.textMuted}
                  />
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "700",
                      color: activeCategory === "all" ? colors.primary : colors.textMuted,
                    }}
                  >
                    All
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Per-category chips */}
              {userCategories.map((cat) => {
                const catColor = getCategoryColor(cat);
                const catIcon = getCategoryIcon(cat);
                const isActive = activeCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setActiveCategory(isActive ? "all" : cat)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        borderRadius: 20,
                        backgroundColor: isActive ? catColor + "22" : colors.border + "44",
                        borderWidth: 1,
                        borderColor: isActive ? catColor : colors.border,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <Ionicons
                        name={catIcon}
                        size={11}
                        color={isActive ? catColor : colors.textMuted}
                      />
                      <Text
                        style={{
                          fontSize: 11,
                          fontWeight: "700",
                          color: isActive ? catColor : colors.textMuted,
                        }}
                      >
                        {cat}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <FlatList
          data={filteredTodos}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={<EmptyState />}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}