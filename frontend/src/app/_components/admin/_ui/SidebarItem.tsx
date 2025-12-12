"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

type Props = {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
};

export default function SidebarItem({
  icon: Icon,
  label,
  active,
  onClick,
  collapsed,
}: Props) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center w-full p-3 mb-2 rounded-lg transition-colors ${
        active
          ? "bg-indigo-600 text-white shadow-md"
          : "text-slate-400 hover:bg-slate-800 hover:text-white"
      }`}
    >
      <Icon size={20} />
      {!collapsed && (
        <span className="ml-3 font-medium whitespace-nowrap">{label}</span>
      )}
      {active && !collapsed && (
        <ChevronRight size={16} className="ml-auto opacity-70" />
      )}
    </button>
  );
}
