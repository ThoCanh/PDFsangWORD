"use client";

import React from "react";

import AdminDashboard from "../_components/admin/AdminDashboard";
import RequireAuth from "../_components/auth/RequireAuth";
import { getAccessToken, setAccessToken } from "../_components/auth/token";

type AdminAuthTokenMessage = {
  type: "ADMIN_AUTH_TOKEN";
  token: string;
};

function isAdminAuthTokenMessage(data: unknown): data is AdminAuthTokenMessage {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return obj.type === "ADMIN_AUTH_TOKEN" && typeof obj.token === "string";
}

function AdminTokenBootstrap({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = React.useState(() => {
    const token = getAccessToken();
    if (token) return true;
    if (typeof window === "undefined") return false;

    const params = new URLSearchParams(window.location.search);
    const shouldWait = params.get("waitToken") === "1";
    // If opened directly without the flag, don't wait: RequireAuth will redirect to /login.
    return !shouldWait;
  });

  React.useEffect(() => {
    if (ready) return;

    let mounted = true;
    let timeoutId: number | null = null;

    const params = new URLSearchParams(window.location.search);
    const nonce = params.get("nonce") || "";
    const onceKey = nonce ? `admin_auth_token_once:${nonce}` : "";

    const accept = (token: string) => {
      if (!mounted) return;
      if (!token) return;
      setAccessToken(token, "session");
      setReady(true);
    };

    const tryConsumeOnceToken = () => {
      if (!onceKey) return;
      try {
        const token = window.localStorage.getItem(onceKey);
        if (token) {
          window.localStorage.removeItem(onceKey);
          accept(token);
        }
      } catch {}
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data: unknown = event.data;
      if (isAdminAuthTokenMessage(data)) {
        accept(data.token);
      }
    };

    window.addEventListener("message", onMessage);

    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("docuflow_admin_auth");
      bc.onmessage = (ev: MessageEvent) => {
        const data: unknown = (ev as MessageEvent).data;
        if (isAdminAuthTokenMessage(data)) {
          accept(data.token);
        }
      };
    } catch {
      bc = null;
    }

    // First try consuming the one-time token immediately (covers timing issues).
    tryConsumeOnceToken();

    // Poll briefly in case the admin tab loads before the token is written.
    const pollId = window.setInterval(() => {
      tryConsumeOnceToken();
    }, 150);

    // Safety: if token transfer fails (popup blocked, message missed), fall back to RequireAuth.
    timeoutId = window.setTimeout(() => {
      if (!mounted) return;
      setReady(true);
    }, 4000);

    return () => {
      mounted = false;
      if (timeoutId) window.clearTimeout(timeoutId);
      window.clearInterval(pollId);
      window.removeEventListener("message", onMessage);
      try {
        bc?.close();
      } catch {}
    };
  }, [ready]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-sm text-slate-600">
          Đang mở trang Admin…
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function Page() {
  return (
    <AdminTokenBootstrap>
      <RequireAuth allow={["admin"]}>
        <AdminDashboard />
      </RequireAuth>
    </AdminTokenBootstrap>
  );
}

