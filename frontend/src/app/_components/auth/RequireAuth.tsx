"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";

import { BACKEND_URL } from "../../_config/app";
import { clearAccessToken, getAccessToken } from "./token";

type Role = "user" | "admin";

type Props = {
  allow: Role[];
  children: React.ReactNode;
};

export default function RequireAuth({ allow, children }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const checkAuth = React.useCallback(async () => {
    setReady(false);
    setError(null);

    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const res = await fetch(`${BACKEND_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        clearAccessToken();
        router.replace("/login");
        return;
      }

      const me = (await res.json()) as { role: Role };
      if (!allow.includes(me.role)) {
        if (me.role === "admin") {
          router.replace("/admin");
        } else {
          router.replace("/");
        }
        return;
      }

      setReady(true);
    } catch (e: unknown) {
      clearTimeout(timeout);
      const msg = e instanceof Error ? e.message : "Auth check failed";
      setError(msg.includes("abort") ? "Không thể kết nối đến server (timeout)." : msg);
      setReady(false);
    }
  }, [allow, router]);

  React.useEffect(() => {
    checkAuth();
  }, [checkAuth, pathname]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-sm text-rose-600 mb-4">{error}</div>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => checkAuth()}
              className="px-4 py-2 bg-white border rounded text-sm font-medium hover:bg-slate-50"
            >
              Thử lại
            </button>
            <button
              onClick={() => { clearAccessToken(); router.replace('/login'); }}
              className="px-4 py-2 bg-rose-50 text-rose-600 border rounded text-sm font-medium hover:bg-rose-100"
            >
              Đăng nhập lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-sm text-slate-500">Đang kiểm tra đăng nhập…</div>
      </div>
    );
  }

  return <>{children}</>;
}
