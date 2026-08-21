import { createContext, useContext, useEffect, useRef, useState } from "react";
import { getCurrentUser, loginUser } from "../api";

export interface User {
  id: string;
  username: string;
  role: "learner" | "parent" | "school";
  learner_profile?: {
    display_name: string;
    dob: string;
    xp: number;
    learning_streak: number;
  };
  parent_profile?: {
    display_name: string;
    phone: string;
  };
  school_profile?: {
    school_name: string;
    contact_name: string;
    contact_phone: string;
  };
}

interface AuthContextValue {
  currentUser: User | null;
  isLoading: boolean;
  isDemoMode: boolean;
  login: (token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const demoAutoLoginEnabled = String(import.meta.env.VITE_DEMO_AUTO_LOGIN ?? "").toLowerCase() === "true";
const demoUsername = import.meta.env.VITE_DEMO_USERNAME || "demo";
const demoPassword = import.meta.env.VITE_DEMO_PASSWORD || "1";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(
    localStorage.getItem("signova_demo_mode") === "true"
  );
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("signova_token")
  );
  const demoLoginAttempted = useRef(false);

  const fetchUser = async () => {
    const localToken = localStorage.getItem("signova_token");
    if (!localToken) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const user = await getCurrentUser();
      setCurrentUser(user as User);
    } catch {
      localStorage.removeItem("signova_token");
      localStorage.removeItem("signova_demo_mode");
      setIsDemoMode(false);
      setToken(null);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      const localToken = localStorage.getItem("signova_token");
      if (!localToken && demoAutoLoginEnabled && !demoLoginAttempted.current) {
        demoLoginAttempted.current = true;
        setIsLoading(true);
        try {
          const data = await loginUser(demoUsername, demoPassword);
          localStorage.setItem("signova_token", data.access_token);
          localStorage.setItem("signova_demo_mode", "true");
          setIsDemoMode(true);
          setToken(data.access_token);
        } catch {
          // Fall back to the normal guest experience if the demo account is unavailable.
          localStorage.removeItem("signova_demo_mode");
          setIsDemoMode(false);
          setIsLoading(false);
        }
        return;
      }
      await fetchUser();
    };

    void bootstrap();
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem("signova_token", newToken);
    localStorage.removeItem("signova_demo_mode");
    setIsDemoMode(false);
    demoLoginAttempted.current = true;
    setIsLoading(true);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("signova_token");
    localStorage.removeItem("signova_demo_mode");
    demoLoginAttempted.current = true;
    setIsDemoMode(false);
    setToken(null);
    setCurrentUser(null);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, isDemoMode, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
