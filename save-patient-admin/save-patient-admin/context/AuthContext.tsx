"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "../api/client";

// 1. Define the User type structure (adjust fields based on your actual API)
export interface User {
  id: string;
  username: string;
  role?: string;
}

// 2. Define the exact shape of your Auth Context
interface AuthContextType {
  user: User | null;
  checking: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// 3. Initialize the context with null, but enforce the type
const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState<boolean>(true);

useEffect(() => {
  if (typeof window === "undefined") return;

  const token = localStorage.getItem("stp_token");
  const cachedUser = localStorage.getItem("stp_user");
  
  if (!token) {
    // Wrap synchronous updates inside a microtask to avoid cascading render lint errors
    queueMicrotask(() => {
      setChecking(false);
    });
    return;
  }
  
  if (cachedUser) {
    try {
      const parsedUser = JSON.parse(cachedUser);
      queueMicrotask(() => {
        setUser(parsedUser);
      });
    } catch {
      localStorage.removeItem("stp_user");
    }
  }

  api
    .me()
    .then((res: any) => setUser(res.user))
    .catch(() => {
      setUser(null);
      localStorage.removeItem("stp_token");
      localStorage.removeItem("stp_user");
    })
    .finally(() => setChecking(false));
}, []);

  async function login(username, password) {
    const res: any = await api.login(username, password);
    localStorage.setItem("stp_token", res.token);
    localStorage.setItem("stp_user", JSON.stringify(res.user));
    setUser(res.user);
  }

  async function logout() {
    try {
      await api.logout();
    } catch {
      // ignore network errors on logout, clear client state regardless
    }
    localStorage.removeItem("stp_token");
    localStorage.removeItem("stp_user");
    setUser(null);
  }

  return (
    <>
    <AuthContext.Provider value={{ user, checking, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
    </>
  );
}

// 4. Custom hook with built-in null checking for clean TypeScript use
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}