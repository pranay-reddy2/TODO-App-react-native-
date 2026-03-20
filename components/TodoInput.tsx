/**
 * components/TodoInput.tsx
 *
 * Form to add a new task. Uses DatePickerModal for deadline selection
 * and pulls userId from AuthContext (Convex user ID).
 */
import { createHomeStyles } from "@/assets/styles/home.styles";
import { api } from "@/convex/_generated/api";
import useTheme from "@/hooks/useTheme";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Alert,
  TextInput,
  TouchableOpacity,
  View,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
  // Support both old (email) and new (id) sessions
  const userId = user?.id ?? user?.email ?? null;

  const addTodo = useMutation(api.todos.addTodo);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState(""); // "YYYY-MM-DD" or ""
  const [priority, setPriority] = useState<Priority>("medium");
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAddTodo = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Task title is required");
      return;
    }

    if (!userId) {
      Alert.alert("Error", "You must be logged in to add tasks.");
      return;
    }

    try {
      await addTodo({
        title: title.trim(),
        description: description.trim(),
        dateTime: new Date().toISOString(),
        deadline: deadline,
        priority,
        userId,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setDeadline("");
      setPriority("medium");
      setIsExpanded(false);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to add task";
      Alert.alert("Error", msg);
    }
  };

  return (
    <View style={styles.inputSection}>
      {/* Title row + add button */}
      <View style={styles.inputWrapper}>
        <TextInput
          placeholder="Add a new task..."
          value={title}
          onChangeText={(text) => {
            setTitle(text);
            if (text.length > 0 && !isExpanded) setIsExpanded(true);
          }}
          style={[styles.input, { flex: 1 }]}
          placeholderTextColor={colors.textMuted}
          onFocus={() => setIsExpanded(true)}
          returnKeyType="done"
        />
        <TouchableOpacity
          onPress={handleAddTodo}
          disabled={!title.trim()}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={title.trim() ? colors.gradients.success : colors.gradients.muted}
            style={styles.addButton}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Expanded fields */}
      {isExpanded && (
        <View style={{ gap: 8, marginTop: 8 }}>
          <TextInput
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            style={[styles.input, { minHeight: 44 }]}
            placeholderTextColor={colors.textMuted}
            multiline
          />

          {/* Date picker — replaces plain text input */}
          <DatePickerModal
            value={deadline}
            onConfirm={(date) => setDeadline(date)}
            placeholder="Select deadline date"
            minimumDate={new Date()}
          />

          {/* Priority selector */}
          <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
            <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: "600", marginRight: 4 }}>
              Priority:
            </Text>
            {(Object.entries(PRIORITY_CONFIG) as [Priority, typeof PRIORITY_CONFIG.low][]).map(
              ([p, config]) => (
                <TouchableOpacity key={p} onPress={() => setPriority(p)} activeOpacity={0.7}>
                  <LinearGradient
                    colors={priority === p ? colors.gradients.primary : colors.gradients.muted}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <Ionicons name={config.icon} size={12} color="#fff" />
                    <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600" }}>
                      {config.label}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )
            )}

            {/* Collapse button */}
            <TouchableOpacity
              onPress={() => setIsExpanded(false)}
              style={{ marginLeft: "auto" }}
            >
              <Ionicons name="chevron-up" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default TodoInput;