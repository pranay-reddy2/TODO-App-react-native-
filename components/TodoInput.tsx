import { createHomeStyles } from "@/assets/styles/home.styles";
import { api } from "@/convex/_generated/api";
import useTheme from "@/hooks/useTheme";
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
import AsyncStorage from "@react-native-async-storage/async-storage";

const TodoInput = () => {
  const { colors } = useTheme();
  const styles = createHomeStyles(colors);

  const addTodo = useMutation(api.todos.addTodo);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("medium");

  const handleAddTodo = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Title is required");
      return;
    }

    const userData = await AsyncStorage.getItem("user");
    const user = userData ? JSON.parse(userData) : null;

    try {
      await addTodo({
        title,
        description,
        dateTime: new Date().toISOString(),
        deadline,
        priority,
        userId: user?.email || "guest",
      });

      setTitle("");
      setDescription("");
      setDeadline("");
      setPriority("medium");
    } catch (error) {
      Alert.alert("Error", "Failed to add task");
    }
  };

  return (
    <View style={styles.inputSection}>
      <TextInput
        placeholder="Title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        placeholderTextColor={colors.textMuted}
      />

      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
        placeholderTextColor={colors.textMuted}
      />

      <TextInput
        placeholder="Deadline (YYYY-MM-DD)"
        value={deadline}
        onChangeText={setDeadline}
        style={styles.input}
        placeholderTextColor={colors.textMuted}
      />

      {/* Priority Buttons */}
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 10 }}>
        {["low", "medium", "high"].map((p) => (
          <TouchableOpacity key={p} onPress={() => setPriority(p)}>
            <LinearGradient
              colors={
                priority === p
                  ? colors.gradients.primary
                  : colors.gradients.muted
              }
              style={{
                padding: 10,
                borderRadius: 10,
              }}
            >
              <Text style={{ color: "#fff" }}>{p}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity onPress={handleAddTodo}>
        <LinearGradient colors={colors.gradients.success} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

export default TodoInput;