"use client";

import React from "react";
import { FileText } from "lucide-react";

export default function DocumentsView() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center py-20">
      <div className="inline-block p-4 bg-indigo-50 rounded-full mb-4">
        <FileText size={48} className="text-indigo-500" />
      </div>
      <h3 className="text-xl font-bold text-slate-800">Quản lý kho tài liệu</h3>
      <p className="text-slate-500 mt-2 max-w-md mx-auto">
        Chức năng tìm kiếm nâng cao, lọc theo metadata và export báo cáo sẽ hiển
        thị ở đây.
      </p>
      <button className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
        Tải lên tài liệu mới
      </button>
    </div>
  );
}
