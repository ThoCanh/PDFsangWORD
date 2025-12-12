"use client";

import React from "react";
import { Shield } from "lucide-react";

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    completed: "bg-green-100 text-green-700 border-green-200",
    processing: "bg-blue-100 text-blue-700 border-blue-200 animate-pulse",
    failed: "bg-red-100 text-red-700 border-red-200",
    pending: "bg-gray-100 text-gray-700 border-gray-200",
    active: "bg-green-100 text-green-700 border-green-200",
    inactive: "bg-gray-100 text-gray-500 border-gray-200",
    banned: "bg-red-100 text-red-700 border-red-200",
    expired: "bg-red-100 text-red-700 border-red-200",
    warning: "bg-yellow-100 text-yellow-700 border-yellow-200",
  };

  const labels: Record<string, string> = {
    completed: "Hoàn tất",
    processing: "Đang xử lý",
    failed: "Lỗi",
    pending: "Chờ xử lý",
    active: "Hoạt động",
    inactive: "Không hoạt động",
    banned: "Đã khóa",
    expired: "Hết hạn",
    warning: "Sắp hết hạn",
  };

  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        styles[status] || styles.pending
      }`}
    >
      {labels[status] || status}
    </span>
  );
}

export function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    Admin: "bg-purple-100 text-purple-700 border-purple-200",
    User: "bg-slate-100 text-slate-700 border-slate-200",
  };

  const cls = styles[role] || styles.User;

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-bold border ${cls} flex items-center w-fit`}
    >
      {role === "Admin" && <Shield size={10} className="mr-1" />}
      {role}
    </span>
  );
}

export function LogLevelBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    INFO: "bg-blue-100 text-blue-700 border-blue-200",
    SUCCESS: "bg-green-100 text-green-700 border-green-200",
    WARN: "bg-yellow-100 text-yellow-700 border-yellow-200",
    ERROR: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded font-mono text-xs font-bold border ${
        styles[level] || "bg-gray-100"
      }`}
    >
      {level}
    </span>
  );
}
