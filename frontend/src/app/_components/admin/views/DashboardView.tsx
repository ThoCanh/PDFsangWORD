"use client";

import React from "react";
import { Activity, Cpu, Database, FileText, MoreVertical } from "lucide-react";
import { MOCK_STATS, RECENT_DOCS, SYSTEM_LOGS } from "../_data/mock";
import ConfidenceBar from "../_ui/ConfidenceBar";
import { StatusBadge } from "../_ui/Badges";

export default function DashboardView() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {MOCK_STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-500">
                    {stat.label}
                  </p>
                  <h3 className="text-2xl font-bold text-slate-800 mt-2">
                    {stat.value}
                  </h3>
                </div>
                <div className={`p-3 rounded-lg ${stat.bg}`}>
                  <Icon className={stat.color} size={24} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span
                  className={
                    stat.change.startsWith("+") ? "text-green-600" : "text-red-600"
                  }
                >
                  {stat.change}
                </span>
                <span className="text-slate-400 ml-2">so với tháng trước</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Tài liệu gần đây</h3>
            <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
              Xem tất cả
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                    Tên file
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                    Loại
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                    Trạng thái
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase">
                    Độ tin cậy
                  </th>
                  <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">
                    Hành động
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {RECENT_DOCS.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center">
                        <FileText size={16} className="text-slate-400 mr-2" />
                        <span className="text-sm font-medium text-slate-700">
                          {doc.name}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 ml-6">
                        {doc.id} • {doc.date}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">{doc.type}</td>
                    <td className="p-4">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="p-4">
                      {doc.status === "completed" ? (
                        <ConfidenceBar value={doc.confidence} />
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button className="p-1 hover:bg-slate-200 rounded text-slate-500">
                        <MoreVertical size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col h-full">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="font-bold text-slate-800">Trạng thái hệ thống</h3>
            <Activity size={18} className="text-slate-400" />
          </div>

          <div className="p-6 grid grid-cols-2 gap-4 border-b border-slate-100">
            <div className="bg-slate-50 p-3 rounded-lg text-center">
              <div className="flex items-center justify-center mb-1 text-slate-500 text-xs uppercase font-bold">
                <Cpu size={12} className="mr-1" /> CPU Usage
              </div>
              <div className="text-xl font-bold text-slate-700">42%</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg text-center">
              <div className="flex items-center justify-center mb-1 text-slate-500 text-xs uppercase font-bold">
                <Database size={12} className="mr-1" /> RAM Usage
              </div>
              <div className="text-xl font-bold text-slate-700">2.4GB</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[300px]">
            {SYSTEM_LOGS.map((log) => (
              <div
                key={`${log.time}-${log.level}`}
                className="flex items-start text-xs border-l-2 pl-3 py-1"
                style={{
                  borderColor:
                    log.level === "ERROR"
                      ? "#ef4444"
                      : log.level === "WARN"
                        ? "#eab308"
                        : log.level === "SUCCESS"
                          ? "#22c55e"
                          : "#3b82f6",
                }}
              >
                <div className="min-w-[60px] text-slate-400 font-mono">
                  {log.time}
                </div>
                <div className="text-slate-600 ml-2">{log.message}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
