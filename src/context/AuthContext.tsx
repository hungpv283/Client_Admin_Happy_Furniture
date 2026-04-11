"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
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
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<LoginResponse["user"] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = sessionStorage.getItem("hf_token");
    const storedUser = sessionStorage.getItem("hf_user");

    setToken(storedToken);

    if (!storedUser) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      setUser(JSON.parse(storedUser));
    } catch {
      sessionStorage.removeItem("hf_user");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
