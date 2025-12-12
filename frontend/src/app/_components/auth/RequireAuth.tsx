"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";

import { BACKEND_URL } from "../../_config/app";

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

  React.useEffect(() => {
    let cancelled = false;

    async function check() {
      setReady(false);
      setError(null);

      const token = window.localStorage.getItem("access_token");
      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const res = await fetch(`${BACKEND_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          window.localStorage.removeItem("access_token");
          router.replace("/login");
          return;
        }

        const me = (await res.json()) as { role: Role };
        if (!allow.includes(me.role)) {
          if (me.role === "admin") {
            router.replace("/admin");
          } else {
            router.replace("/dashboard");
          }
          return;
        }

        if (!cancelled) setReady(true);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Auth check failed");
          setReady(false);
        }
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [allow, router, pathname]);

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-sm text-rose-600">{error}</div>
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
