import { createHomeStyles } from "@/assets/styles/home.styles";
import EmptyState from "@/components/EmptyState";
import Header from "@/components/Header";
import LoadingSpinner from "@/components/LoadingSpinner";
import TodoInput from "@/components/TodoInput";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import useTheme from "@/hooks/useTheme";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Todo = Doc<"todos">;

export default function Index() {
  const { colors } = useTheme();
  const styles = createHomeStyles(colors);

  const todos = useQuery(api.todos.getTodos);
  const toggleTodo = useMutation(api.todos.toggleTodo);
  const deleteTodo = useMutation(api.todos.deleteTodo);
  const updateTodo = useMutation(api.todos.updateTodo);

  // EDIT STATES
  const [editingId, setEditingId] = useState<Id<"todos"> | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editPriority, setEditPriority] = useState("medium");

  if (!todos) return <LoadingSpinner />;

  // TOGGLE
  const handleToggleTodo = async (id: Id<"todos">) => {
    try {
      await toggleTodo({ id });
    } catch {
      Alert.alert("Error", "Failed to toggle");
    }
  };

  // DELETE
  const handleDeleteTodo = (id: Id<"todos">) => {
    Alert.alert("Delete", "Delete this todo?", [
      { text: "Cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => await deleteTodo({ id }),
      },
    ]);
  };

  // EDIT START
  const handleEditTodo = (todo: Todo) => {
    setEditingId(todo._id);
    setEditTitle(todo.title);
    setEditDescription(todo.description);
    setEditDeadline(todo.deadline);
    setEditPriority(todo.priority);
  };

  // SAVE EDIT
  const handleSaveEdit = async () => {
    if (!editingId) return;

    try {
      await updateTodo({
        id: editingId,
        title: editTitle,
        description: editDescription,
        deadline: editDeadline,
        priority: editPriority,
      });

      setEditingId(null);
    } catch {
      Alert.alert("Error", "Update failed");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  // RENDER ITEM
  const renderItem = ({ item }: { item: Todo }) => {
    const isEditing = editingId === item._id;

    return (
      <View style={styles.todoItemWrapper}>
        <LinearGradient
          colors={colors.gradients.surface}
          style={styles.todoItem}
        >
          {/* CHECKBOX */}
          <TouchableOpacity onPress={() => handleToggleTodo(item._id)}>
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
            // EDIT MODE
            <View style={styles.editContainer}>
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                placeholder="Title"
                style={styles.editInput}
              />

              <TextInput
                value={editDescription}
                onChangeText={setEditDescription}
                placeholder="Description"
                style={styles.editInput}
              />

              <TextInput
                value={editDeadline}
                onChangeText={setEditDeadline}
                placeholder="Deadline"
                style={styles.editInput}
              />

              {/* PRIORITY */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                {["low", "medium", "high"].map((p) => (
                  <TouchableOpacity key={p} onPress={() => setEditPriority(p)}>
                    <LinearGradient
                      colors={
                        editPriority === p
                          ? colors.gradients.primary
                          : colors.gradients.muted
                      }
                      style={{ padding: 8, borderRadius: 10 }}
                    >
                      <Text style={{ color: "#fff" }}>{p}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.editButtons}>
                <TouchableOpacity onPress={handleSaveEdit}>
                  <LinearGradient
                    colors={colors.gradients.success}
                    style={styles.editButton}
                  >
                    <Text style={styles.editButtonText}>Save</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleCancelEdit}>
                  <LinearGradient
                    colors={colors.gradients.muted}
                    style={styles.editButton}
                  >
                    <Text style={styles.editButtonText}>Cancel</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // VIEW MODE
            <View style={styles.todoTextContainer}>
              <Text
                style={[
                  styles.todoText,
                  item.isCompleted && {
                    textDecorationLine: "line-through",
                    opacity: 0.6,
                  },
                ]}
              >
                {item.title}
              </Text>

              <Text style={{ color: colors.textMuted }}>
                {item.description}
              </Text>

              <Text style={{ color: colors.warning }}>
                Deadline: {item.deadline}
              </Text>

              <Text style={{ color: colors.primary }}>
                Priority: {item.priority}
              </Text>

              <View style={styles.todoActions}>
                <TouchableOpacity onPress={() => handleEditTodo(item)}>
                  <LinearGradient
                    colors={colors.gradients.warning}
                    style={styles.actionButton}
                  >
                    <Ionicons name="pencil" size={14} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleDeleteTodo(item._id)}
                >
                  <LinearGradient
                    colors={colors.gradients.danger}
                    style={styles.actionButton}
                  >
                    <Ionicons name="trash" size={14} color="#fff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </LinearGradient>
      </View>
    );
  };

  return (
    <LinearGradient colors={colors.gradients.background} style={styles.container}>
      <StatusBar barStyle={colors.statusBarStyle} />

      <SafeAreaView style={styles.safeArea}>
        <Header />
        <TodoInput />

        <FlatList
          data={todos}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={<EmptyState />}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}