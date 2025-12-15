"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { BACKEND_URL } from "../../_config/app";
import { clearAccessToken, getAccessToken, setAccessToken } from "./token";

type AuthContextType = {
  email: string | null;
  role: string | null;
  planKey: string | null;
  refresh: () => void;
  setAuth: (token: string | null) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType>({
  email: null,
  role: null,
  planKey: null,
  refresh: () => {},
  setAuth: () => {},
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [planKey, setPlanKey] = useState<string | null>(null);

  // Refresh user info from token
  const refresh = React.useCallback(() => {
    const token = getAccessToken();
    if (!token) {
      setEmail(null);
      setRole(null);
      setPlanKey(null);
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
          setPlanKey(typeof data.plan_key === "string" ? data.plan_key : null);
        } else {
          setEmail(null);
          setRole(null);
          setPlanKey(null);
        }
      });
  }, []);

  // Set token and refresh
  const setAuth = React.useCallback((token: string | null) => {
    if (token) {
      setAccessToken(token, "local");
    } else {
      clearAccessToken();
    }
    refresh();
  }, [refresh]);

  const logout = React.useCallback(() => {
    clearAccessToken();
    setEmail(null);
    setRole(null);
    setPlanKey(null);
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
    };
  }, [refresh]);

  return (
    <AuthContext.Provider value={{ email, role, planKey, refresh, setAuth, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
