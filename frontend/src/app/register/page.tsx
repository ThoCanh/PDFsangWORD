"use client";
import { useRouter } from "next/navigation";
import AuthPage from "../_components/pages/AuthPage";

export default function Page() {
  const router = useRouter();
  return (
    <AuthPage
      onNavigate={(view) => {
        if (view === "home") router.push("/");
        else router.push("/");
      }}
      onAuthSuccess={(role) => {
        // Admin is handled inside AuthPage (opens new tab + keeps this tab logged out)
        if (role === "user") router.push("/dashboard");
        else router.push("/");
      }}
    />
  );
}
