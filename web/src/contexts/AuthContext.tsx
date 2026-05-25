import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentUser } from "../api";

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
  login: (token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("signova_token")
  );

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
      setToken(null);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [token]);

  const login = (newToken: string) => {
    localStorage.setItem("signova_token", newToken);
    setIsLoading(true);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("signova_token");
    setToken(null);
    setCurrentUser(null);
  };

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ currentUser, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
