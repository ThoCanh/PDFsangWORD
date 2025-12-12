"use client";

import React from "react";
import { Globe, Key, Save, Settings, ShieldCheck } from "lucide-react";

export default function SettingsView() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <Settings size={20} className="mr-2 text-slate-500" /> Cài đặt chung
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tên hệ thống
            </label>
            <input
              type="text"
              defaultValue="DocuFlowAI Platform"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tên hiển thị cho email
            </label>
            <input
              type="text"
              defaultValue="DocuFlowAI Team"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Domain chính
            </label>
            <div className="relative">
              <Globe
                size={16}
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                defaultValue="https://app.docuflow.ai"
                className="w-full pl-9 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <ShieldCheck size={20} className="mr-2 text-emerald-600" /> Bảo mật &
          Quyền truy cập
        </h3>
        <div className="space-y-4">
          {[
            { label: "Bắt buộc 2FA cho Admin", defaultChecked: true },
            { label: "Giới hạn IP cho trang Admin", defaultChecked: false },
            {
              label: "Tự động khóa tài khoản sau 5 lần sai mật khẩu",
              defaultChecked: true,
            },
            { label: "Ẩn log nhạy cảm trên giao diện", defaultChecked: true },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
            >
              <span className="text-sm text-slate-700">{item.label}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked={item.defaultChecked}
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <Key size={20} className="mr-2 text-amber-600" /> API Keys
        </h3>
        <div className="space-y-3">
          {["PUBLIC_API_KEY", "ADMIN_API_KEY"].map((keyName) => (
            <div
              key={keyName}
              className="p-4 border border-slate-200 rounded-lg bg-slate-50 flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  {keyName}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  ********-****-****-********
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-100">
                  Sao chép
                </button>
                <button className="px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Tạo mới
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold shadow-sm hover:bg-indigo-700 flex items-center gap-2">
          <Save size={16} /> Lưu cấu hình
        </button>
      </div>
    </div>
  );
}
