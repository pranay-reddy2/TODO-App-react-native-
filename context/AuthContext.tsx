/**
 * AuthContext.tsx
 *
 * Manages user authentication using Convex DB as the source of truth.
 *
 * KEY FIX: AuthProvider must NOT use useMutation() — hooks like useMutation
 * require the component to be a *child* of ConvexProvider, but AuthProvider
 * wraps ConvexProvider in _layout.tsx. Instead we use ConvexHttpClient
 * directly to call mutations from outside the React tree.
 *
 * - register: creates user in Convex users table via HTTP client
 * - login: verifies credentials via HTTP client
 * - Session persisted in AsyncStorage (email + id only)
 * - logout: clears local session
 */
import { api } from "@/convex/_generated/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ConvexHttpClient } from "convex/browser";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

// Re-use the same Convex URL from env
const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL!;
// HTTP client — safe to use outside the React/Convex hook tree
const httpClient = new ConvexHttpClient(convexUrl);

export interface User {
  id: string; // Convex user _id as string
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = "convex_user_session";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore persisted session on app start
  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then((data) => {
        if (data) {
          setUser(JSON.parse(data) as User);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  /** Register new user in Convex DB */
  const register = async (email: string, password: string) => {
    const result = await httpClient.mutation(api.users.registerUser, {
      email,
      password,
    });
    const newUser: User = { id: result.id, email: result.email };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(newUser));
    setUser(newUser);
  };

  /** Login — verify credentials against Convex DB */
  const login = async (email: string, password: string) => {
    const result = await httpClient.mutation(api.users.loginUser, {
      email,
      password,
    });
    const loggedInUser: User = { id: result.id, email: result.email };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  /** Logout — clears local session (Convex data stays) */
  const logout = async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
