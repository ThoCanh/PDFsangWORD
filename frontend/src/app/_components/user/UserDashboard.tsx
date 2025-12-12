"use client";

import React from "react";
import { useRouter } from "next/navigation";
import type { ToolKey } from "../../_config/tools";
import HomeConverter from "../converter/HomeConverter";
import UserInfoButton from "../auth/UserInfoButton";
import { useAuth } from "../auth/AuthContext";

export default function UserDashboard() {
  const router = useRouter();
  const [activeTool, setActiveTool] = React.useState<ToolKey>("pdf-word");
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-500">User Dashboard</div>
            <div className="font-bold text-slate-800">DocuFlowAI</div>
          </div>
          <div className="flex items-center gap-3">
            <UserInfoButton />
            <button
              onClick={() => {
                logout();
                router.replace("/login");
              }}
              className="px-3 py-2 text-sm font-medium border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      <HomeConverter activeTool={activeTool} onSelectTool={setActiveTool} />
    </div>
  );
}
