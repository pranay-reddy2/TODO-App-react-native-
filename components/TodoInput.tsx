import { createHomeStyles } from "@/assets/styles/home.styles";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/convex/_generated/api";
import useTheme from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";
import CategoryPicker from "./CategoryPicker";
import DatePickerModal from "./DatePickerModel";

type Priority = "low" | "medium" | "high";

const PRIORITY_CONFIG = {
  low: { icon: "leaf" as const, label: "Low" },
  medium: { icon: "alert-circle" as const, label: "Med" },
  high: { icon: "flame" as const, label: "High" },
};

const TodoInput = () => {
  const { colors } = useTheme();
  const styles = createHomeStyles(colors);
  const { user } = useAuth();

  const userId = user?.id ?? user?.email ?? null;

  const addTodo = useMutation(api.todos.addTodo);

  const existingCategories = useQuery(
    api.todos.getUserCategories,
    userId ? { userId } : "skip"
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [category, setCategory] = useState("General");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCategory, setShowCategory] = useState(false);

  const handleAddTodo = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Task title is required");
      return;
    }

    if (!userId) {
      Alert.alert("Error", "Login required");
      return;
    }

    try {
      await addTodo({
        title: title.trim(),
        description: description.trim(),
        dateTime: new Date().toISOString(),
        deadline,
        priority,
        category,
        userId,
      });

      // reset
      setTitle("");
      setDescription("");
      setDeadline("");
      setPriority("medium");
      setCategory("General");
      setIsExpanded(false);
      setShowCategory(false);
    } catch {
      Alert.alert("Error", "Failed to add task");
    }
  };

  return (
    <View style={styles.inputSection}>
      {/* TOP ROW */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <TextInput
          placeholder="Add a new task..."
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            if (text.length > 0) setIsExpanded(true);
          }}
          onFocus={() => setIsExpanded(true)}
          style={[styles.input, { flex: 1 }]}
          placeholderTextColor={colors.textMuted}
        />

        <TouchableOpacity
          onPress={handleAddTodo}
          disabled={!title.trim()}
        >
          <LinearGradient
            colors={
              title.trim()
                ? colors.gradients.success
                : colors.gradients.muted
            }
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* EXPANDED SECTION */}
      {isExpanded && (
        <View style={{ marginTop: 12, gap: 12 }}>
          {/* DESCRIPTION */}
          <TextInput
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            style={[
              styles.input,
              {
                minHeight: 80,
                textAlignVertical: "top", // 🔥 fixes Android
              },
            ]}
            placeholderTextColor={colors.textMuted}
          />

          {/* DATE PICKER */}
          <DatePickerModal
            value={deadline}
            onConfirm={(date) => setDeadline(date)}
            placeholder="Select deadline"
          />

          {/* PRIORITY */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {Object.entries(PRIORITY_CONFIG).map(([p, config]) => (
              <TouchableOpacity key={p} onPress={() => setPriority(p as Priority)}>
                <LinearGradient
                  colors={
                    priority === p
                      ? colors.gradients.primary
                      : colors.gradients.muted
                  }
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <Ionicons name={config.icon} size={12} color="#fff" />
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    {config.label}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>

          {/* CATEGORY BUTTON */}
          <TouchableOpacity onPress={() => setShowCategory(!showCategory)}>
            <LinearGradient
              colors={
                showCategory
                  ? colors.gradients.warning
                  : colors.gradients.muted
              }
              style={{
                padding: 10,
                borderRadius: 10,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Ionicons name="pricetag-outline" size={14} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "600" }}>
                {category}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* CATEGORY PICKER */}
          {showCategory && (
            <View
              style={{
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.backgrounds.input,
              }}
            >
              <CategoryPicker
                value={category}
                onSelect={(cat) => {
                  setCategory(cat);
                  setShowCategory(false);
                }}
                extraCategories={existingCategories ?? []}
              />
            </View>
          )}

          {/* COLLAPSE */}
          <TouchableOpacity
            onPress={() => setIsExpanded(false)}
            style={{ alignSelf: "flex-end" }}
          >
            <Ionicons name="chevron-up" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default TodoInput;