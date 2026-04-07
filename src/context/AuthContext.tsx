"use client";
import React, { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import type { LoginResponse } from "@/lib/api";

interface AuthContextType {
  user: LoginResponse["user"] | null;
  token: string | null;
  login: (data: LoginResponse) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? sessionStorage.getItem("hf_token") : null
  );
  const [user, setUser] = useState<LoginResponse["user"] | null>(() => {
    if (typeof window === "undefined") return null;
    const stored = sessionStorage.getItem("hf_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading] = useState(false);
  const router = useRouter();

  const login = (data: LoginResponse) => {
    sessionStorage.setItem("hf_token", data.token);
    sessionStorage.setItem("hf_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    router.push("/");
  };

  const logout = () => {
    sessionStorage.removeItem("hf_token");
    sessionStorage.removeItem("hf_user");
    setToken(null);
    setUser(null);
    router.push("/signin");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
