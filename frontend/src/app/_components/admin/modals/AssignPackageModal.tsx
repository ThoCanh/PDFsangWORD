"use client";

import React from "react";
import { Calendar, CreditCard, Save, X } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
};

export default function AssignPackageModal({ isOpen, onClose, onSave }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-scale-up">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800 flex items-center">
            <CreditCard size={20} className="mr-2 text-indigo-600" /> Gán Gói
            Dịch Vụ
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email Khách hàng
            </label>
            <input
              type="email"
              placeholder="customer@example.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Loại Gói
            </label>
            <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white">
              <option value="pro_monthly">Pro - Tháng (299k)</option>
              <option value="pro_yearly">Pro - Năm (2.990k)</option>
              <option value="enterprise">Enterprise (Liên hệ)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Ngày bắt đầu
              </label>
              <div className="relative">
                <Calendar
                  size={16}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                />
                <input
                  type="date"
                  className="w-full pl-9 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Thời hạn (Tháng)
              </label>
              <input
                type="number"
                defaultValue={12}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Ghi chú (Tùy chọn)
            </label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Lý do nâng cấp thủ công..."
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => {
              onSave();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md transition-colors flex items-center"
          >
            <Save size={16} className="mr-2" /> Lưu thay đổi
          </button>
        </div>
      </div>
    </div>
  );
}
