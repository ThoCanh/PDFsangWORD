"use client";

import { useRouter } from "next/navigation";

import AuthPage from "../_components/pages/AuthPage";

export default function Page() {
  const router = useRouter();

  return (
    <AuthPage
      onNavigate={(view) => {
        if (view === "home") router.replace("/");
        else router.replace("/");
      }}
      onAuthSuccess={(role) => {
        if (role === "admin") router.replace("/admin");
        else router.replace("/dashboard");
      }}
    />
  );
}
