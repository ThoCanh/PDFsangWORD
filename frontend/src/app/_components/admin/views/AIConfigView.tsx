"use client";

import React from "react";
import { Bot } from "lucide-react";

export default function AIConfigView() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <Bot size={20} className="mr-2 text-purple-600" /> Cấu hình Mô hình AI
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              OCR Engine
            </label>
            <select className="w-full border-slate-200 rounded-lg p-2.5 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none">
              <option>Tesseract 5.0 (Standard)</option>
              <option>Google Cloud Vision API</option>
              <option>AWS Textract</option>
              <option>DocuFlow Pro (Self-hosted)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ngưỡng chính xác (Confidence Threshold)
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min={0}
                max={100}
                defaultValue={75}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm font-bold text-slate-700 w-10">75%</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Các trường dưới ngưỡng này sẽ bị đánh dấu để review thủ công.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Pipeline Xử lý</h3>
        <div className="space-y-3">
          {[
            "Tiền xử lý ảnh (Deskew, Denoise)",
            "Phân loại tài liệu tự động",
            "Trích xuất Key-Value Pair",
            "Kiểm tra quy tắc nghiệp vụ",
            "Lưu trữ & Indexing",
          ].map((step, idx) => (
            <div
              key={step}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100"
            >
              <div className="flex items-center">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold mr-3">
                  {idx + 1}
                </div>
                <span className="text-slate-700 font-medium">{step}</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600" />
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
