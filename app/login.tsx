import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import useTheme from "@/hooks/useTheme";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function login() {
  const router = useRouter();
  const { colors } = useTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Fill all fields");
      return;
    }

    const stored = await AsyncStorage.getItem(`user_${email}`);

    if (!stored) {
      Alert.alert("Error", "User not found");
      return;
    }

    const user = JSON.parse(stored);

    if (user.password !== password) {
      Alert.alert("Error", "Wrong password");
      return;
    }

    await AsyncStorage.setItem("user", JSON.stringify({ email }));

    router.replace("/");
  };

  return (
    <LinearGradient colors={colors.gradients.background} style={styles.container}>
      <View style={styles.box}>
        <Text style={[styles.title, { color: colors.text }]}>
          Welcome Back 👋
        </Text>

        <TextInput
          placeholder="Email"
          placeholderTextColor={colors.textMuted}
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          value={email}
          onChangeText={setEmail}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity onPress={handleLogin}>
          <LinearGradient colors={colors.gradients.primary} style={styles.button}>
            <Text style={styles.btnText}>Sign In</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/register")}>
          <Text style={{ color: colors.primary, marginTop: 20 }}>
            Don't have an account? Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center" },
  box: { padding: 24 },
  title: { fontSize: 30, fontWeight: "700", marginBottom: 20 },
  input: {
    borderWidth: 2,
    borderRadius: 14,
    padding: 14,
    marginBottom: 15,
  },
  button: {
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});