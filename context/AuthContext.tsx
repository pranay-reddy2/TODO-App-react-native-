import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface User {
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("user").then((data) => {
      if (data) setUser(JSON.parse(data));
    });
  }, []);

  const login = async (email: string, password: string) => {
    // simple validation (no backend)
    const stored = await AsyncStorage.getItem(`user_${email}`);

    if (!stored) throw new Error("User not found");

    const parsed = JSON.parse(stored);
    if (parsed.password !== password) throw new Error("Wrong password");

    await AsyncStorage.setItem("user", JSON.stringify({ email }));
    setUser({ email });
  };

  const register = async (email: string, password: string) => {
    const exists = await AsyncStorage.getItem(`user_${email}`);
    if (exists) throw new Error("User already exists");

    await AsyncStorage.setItem(
      `user_${email}`,
      JSON.stringify({ email, password }),
    );

    await AsyncStorage.setItem("user", JSON.stringify({ email }));
    setUser({ email });
  };

  const logout = async () => {
    await AsyncStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
