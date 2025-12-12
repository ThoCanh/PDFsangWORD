"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { BACKEND_URL } from "../../_config/app";

type AuthContextType = {
  email: string | null;
  role: string | null;
  refresh: () => void;
  setAuth: (token: string | null) => void;
};

const AuthContext = createContext<AuthContextType>({
  email: null,
  role: null,
  refresh: () => {},
  setAuth: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  // Refresh user info from token
  const refresh = React.useCallback(() => {
    const token = window.localStorage.getItem("access_token");
    if (!token) {
      setEmail(null);
      setRole(null);
      return;
    }
    fetch(`${BACKEND_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.email) {
          setEmail(data.email);
          setRole(data.role);
        } else {
          setEmail(null);
          setRole(null);
        }
      });
  }, []);

  // Set token and refresh
  const setAuth = React.useCallback((token: string | null) => {
    if (token) {
      window.localStorage.setItem("access_token", token);
    } else {
      window.localStorage.removeItem("access_token");
    }
    refresh();
  }, [refresh]);

  useEffect(() => {
    refresh();
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ email, role, refresh, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
}
