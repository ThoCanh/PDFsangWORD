"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ToolKey } from "../../_config/tools";
import type { SelectedPlan, ViewKey } from "../../_types/app";
import Header from "./Header";
import AboutPage from "../pages/AboutPage";
import AuthPage from "../pages/AuthPage";
import HomePage from "../pages/HomePage";
import PricingPage from "../pages/PricingPage";
import ToolsPage from "../pages/ToolsPage";
import { useAuth } from "../auth/AuthContext";
import { BACKEND_URL } from "../../_config/app";
import { getAccessToken } from "../auth/token";

export default function MainApp() {
  const [view, setView] = useState<ViewKey>("home");
  const [activeTool, setActiveTool] = useState<ToolKey>("pdf-word");
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();

  const navigateTo = (page: ViewKey) => {
    setView(page);
    setIsMobileMenuOpen(false);
    // Keep URL in sync with view for deep-linking
    const path =
      page === "home"
        ? "/"
        : page === "tools"
        ? "/Tools"
        : page === "pricing"
        ? "/upgrade"
        : page === "about"
        ? "/introduce"
        : page === "login"
        ? "/login"
        : "/";
    router.replace(path);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view]);

  // Map URL path to view so non-root routes preserve the same layout
  useEffect(() => {
    const p = (pathname || "/").toLowerCase();
    if (p === "/") setView("home");
    else if (p === "/tools") setView("tools");
    else if (p === "/upgrade") setView("pricing");
    else if (p === "/introduce") setView("about");
    else if (p === "/login" || p === "/register") setView("login");
  }, [pathname]);

  const selectToolAndGoHome = (tool: ToolKey) => {
    setActiveTool(tool);
    navigateTo("home");
  };

  if (view === "login") {
    return <AuthPage onNavigate={navigateTo} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <Header
        view={view}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen((v) => !v)}
        onNavigate={navigateTo}
      />

      {view === "home" && (
        <HomePage activeTool={activeTool} onSelectTool={setActiveTool} />
      )}

      {view === "tools" && (
        <ToolsPage
          onSelectTool={(tool) => {
            setActiveTool(tool);
            navigateTo("home");
          }}
        />
      )}

      {view === "pricing" && (
        <PricingPage
          selectedPlan={selectedPlan}
          onSelectPlan={(plan) => setSelectedPlan(plan)}
          onStartFree={async () => {
            const token = getAccessToken();
            if (!token) {
              router.push("/register");
              return;
            }

            try {
              const res = await fetch(`${BACKEND_URL}/auth/me/plan`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ plan_key: "free" }),
              });
              if (res.ok) auth.refresh();
            } catch {
              // ignore
            }
          }}
        />
      )}

      {view === "about" && <AboutPage onStart={() => navigateTo("home")} />}

      <div className="border-t border-slate-200 mt-12 py-8 text-center text-slate-400 text-sm">
        <div className="flex justify-center gap-4 mb-4">
          <a href="#" className="hover:text-blue-500">
            Điều khoản
          </a>
          <a href="#" className="hover:text-blue-500">
            Bảo mật
          </a>
          <a href="#" className="hover:text-blue-500">
            Liên hệ
          </a>
        </div>
        © 2024 DocuFlowAI. Powered by AI &amp; Python.
      </div>
    </div>
  );
}
