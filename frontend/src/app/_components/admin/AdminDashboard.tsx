"use client";

import React from "react";
import {
  Bell,
  Bot,
  CreditCard,
  FileText,
  LayoutDashboard,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Terminal,
  Users,
} from "lucide-react";

import GlobalStyles from "./_ui/GlobalStyles";
import SidebarItem from "./_ui/SidebarItem";

import DashboardView from "./views/DashboardView";
import UsersView from "./views/UsersView";
import ProPlanView from "./views/ProPlanView";
import DocumentsView from "./views/DocumentsView";
import SystemLogsView from "./views/SystemLogsView";
import AIConfigView from "./views/AIConfigView";
import SettingsView from "./views/SettingsView";

import AddUserModal from "./modals/AddUserModal";
import AddPlanModal from "./modals/AddPlanModal";
import AssignPackageModal from "./modals/AssignPackageModal";

import type { UserRow } from "./_data/mock";

type ViewKey =
  | "dashboard"
  | "users"
  | "plans"
  | "documents"
  | "logs"
  | "ai"
  | "settings";

const VIEW_TITLES: Record<ViewKey, string> = {
  dashboard: "Admin Dashboard",
  users: "Quản lý người dùng",
  plans: "Gói Pro",
  documents: "Kho tài liệu",
  logs: "System Logs",
  ai: "AI Configuration",
  settings: "Settings",
};

export default function AdminDashboard() {
  const [activeView, setActiveView] = React.useState<ViewKey>("dashboard");
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const [isAddUserOpen, setIsAddUserOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<UserRow | null>(null);
  const [isAddPlanOpen, setIsAddPlanOpen] = React.useState(false);
  const [isAssignPackageOpen, setIsAssignPackageOpen] = React.useState(false);

  const navItems: Array<{ key: ViewKey; label: string; icon: any }> = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "users", label: "Users", icon: Users },
    { key: "plans", label: "Gói Pro", icon: CreditCard },
    { key: "documents", label: "Tài liệu", icon: FileText },
    { key: "logs", label: "Logs", icon: Terminal },
    { key: "ai", label: "AI Config", icon: Bot },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  const title = VIEW_TITLES[activeView];

  return (
    <div className="min-h-screen bg-slate-100 flex">
      <GlobalStyles />

      {mobileOpen && (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 bg-slate-900 text-white flex flex-col transition-all duration-200 ${
          collapsed ? "w-20" : "w-72"
        } ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center font-bold">
              D
            </div>
            {!collapsed && (
              <div>
                <div className="font-bold">DocuFlowAI</div>
                <div className="text-xs text-slate-400">Admin Panel</div>
              </div>
            )}
          </div>

          <button
            onClick={() => setCollapsed((v) => !v)}
            className="hidden md:inline-flex p-2 rounded-lg hover:bg-slate-800 text-slate-300"
            aria-label="Toggle collapse"
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <nav className="p-4 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <SidebarItem
              key={item.key}
              icon={item.icon}
              label={item.label}
              active={activeView === item.key}
              onClick={() => {
                setActiveView(item.key);
                setMobileOpen(false);
              }}
              collapsed={collapsed}
            />
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-400">
          {!collapsed ? "© 2025 DocuFlowAI" : "©"}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="px-4 md:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <button
                className="md:hidden p-2 rounded-lg hover:bg-slate-100"
                onClick={() => setMobileOpen(true)}
                aria-label="Open sidebar"
              >
                <Menu size={18} className="text-slate-700" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg md:text-xl font-bold text-slate-800 truncate">
                  {title}
                </h1>
                <div className="text-xs text-slate-500">
                  Theo dõi hệ thống & vận hành
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                aria-label="Notifications"
              >
                <Bell size={18} />
              </button>
              <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold">
                A
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 md:p-8">
          {activeView === "dashboard" && <DashboardView />}

          {activeView === "users" && (
            <UsersView
              onAddUser={() => {
                setEditingUser(null);
                setIsAddUserOpen(true);
              }}
              onEditUser={(u) => {
                setEditingUser(u);
                setIsAddUserOpen(true);
              }}
            />
          )}

          {activeView === "plans" && (
            <ProPlanView
              onAddPlan={() => setIsAddPlanOpen(true)}
              onAssignPackage={() => setIsAssignPackageOpen(true)}
            />
          )}

          {activeView === "documents" && <DocumentsView />}
          {activeView === "logs" && <SystemLogsView />}
          {activeView === "ai" && <AIConfigView />}
          {activeView === "settings" && <SettingsView />}
        </main>
      </div>

      <AddUserModal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onSave={() => {
          // demo UI only
        }}
        initialData={
          editingUser
            ? {
                name: editingUser.name,
                email: editingUser.email,
                role: editingUser.role,
                status: editingUser.status,
              }
            : null
        }
      />

      <AddPlanModal
        isOpen={isAddPlanOpen}
        onClose={() => setIsAddPlanOpen(false)}
        onSave={() => {
          // demo UI only
        }}
      />

      <AssignPackageModal
        isOpen={isAssignPackageOpen}
        onClose={() => setIsAssignPackageOpen(false)}
        onSave={() => {
          // demo UI only
        }}
      />
    </div>
  );
}
