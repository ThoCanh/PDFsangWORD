"use client";

import React from "react";
import { ChevronRight } from "lucide-react";
import { TOOL_CONFIG, type ToolKey } from "../../_config/tools";

type Props = {
  onSelectTool: (tool: ToolKey) => void;
};

export default function ToolsPage({ onSelectTool }: Props) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">
          Tất cả công cụ chuyển đổi
        </h2>
        <p className="text-slate-500">
          Bộ công cụ mạnh mẽ xử lý mọi định dạng tài liệu của bạn.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(TOOL_CONFIG).map(([key, config]) => {
          const toolKey = key as ToolKey;
          const Icon = config.icon;

          const badgeClasses =
            toolKey === "pdf-word"
              ? "bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white"
              : toolKey === "jpg-png"
                ? "bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white"
                : "bg-red-100 text-red-600 group-hover:bg-red-600 group-hover:text-white";

          return (
            <div
              key={toolKey}
              onClick={() => onSelectTool(toolKey)}
              className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all cursor-pointer"
            >
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${badgeClasses}`}
              >
                <Icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {config.title}
              </h3>
              <p className="text-slate-500 text-sm mb-4">{config.desc}</p>
              <div className="flex items-center text-sm font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                Sử dụng ngay <ChevronRight size={16} />
              </div>
            </div>
          );
        })}

        <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-300 flex flex-col items-center justify-center text-center opacity-60">
          <div className="w-12 h-12 bg-slate-200 rounded-xl mb-4" />
          <h3 className="text-lg font-semibold text-slate-400">Sắp ra mắt</h3>
          <p className="text-xs text-slate-400 mt-2">Thêm công cụ mới hàng tuần</p>
        </div>
      </div>
    </div>
  );
}
