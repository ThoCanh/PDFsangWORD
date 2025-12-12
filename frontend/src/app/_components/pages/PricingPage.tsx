"use client";

import React from "react";
import { Check, Sparkles, X } from "lucide-react";
import type { SelectedPlan } from "../../_types/app";

type Props = {
  selectedPlan: SelectedPlan;
  onSelectPlan: (plan: Exclude<SelectedPlan, null>) => void;
  onStartFree: () => void;
};

export default function PricingPage({
  selectedPlan,
  onSelectPlan,
  onStartFree,
}: Props) {
  return (
    <div className="max-w-5xl mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-800 mb-4">
          Bảng giá linh hoạt
        </h2>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Chọn gói phù hợp với nhu cầu của bạn. Bắt đầu miễn phí và nâng cấp khi
          bạn cần nhiều tính năng hơn.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectPlan("basic")}
          onKeyDown={(e) => e.key === "Enter" && onSelectPlan("basic")}
          className={`bg-white p-8 rounded-2xl border shadow-sm transition-all hover:shadow-md cursor-pointer ${
            selectedPlan === "basic"
              ? "border-blue-500 shadow-lg shadow-blue-100 scale-[1.01]"
              : "border-slate-200"
          }`}
        >
          <div className="text-lg font-medium text-slate-500 mb-2">Cơ bản</div>
          <div className="text-4xl font-bold text-slate-800 mb-6">
            0đ<span className="text-sm font-normal text-slate-400">/tháng</span>
          </div>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3 text-slate-600">
              <Check size={18} className="text-green-500" /> 3 tài liệu mỗi ngày
            </li>
            <li className="flex items-center gap-3 text-slate-600">
              <Check size={18} className="text-green-500" /> Giới hạn 5MB/file
            </li>
            <li className="flex items-center gap-3 text-slate-600">
              <Check size={18} className="text-green-500" /> Chuyển đổi cơ bản
            </li>
            <li className="flex items-center gap-3 text-slate-400">
              <X size={18} /> Không có Gemini AI
            </li>
          </ul>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectPlan("basic");
              onStartFree();
            }}
            className="w-full py-3 border border-blue-600 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 active:scale-[0.99] transition duration-150"
          >
            Bắt đầu miễn phí
          </button>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => onSelectPlan("pro")}
          onKeyDown={(e) => e.key === "Enter" && onSelectPlan("pro")}
          className={`bg-slate-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden transform md:-translate-y-4 cursor-pointer transition ${
            selectedPlan === "pro" ? "ring-2 ring-blue-400 scale-[1.01]" : ""
          }`}
        >
          <div className="absolute top-0 right-0 bg-blue-500 text-xs font-bold px-3 py-1 rounded-bl-xl">
            PHỔ BIẾN NHẤT
          </div>
          <div className="text-lg font-medium text-blue-200 mb-2">
            Chuyên nghiệp
          </div>
          <div className="text-4xl font-bold mb-6">
            99k<span className="text-sm font-normal text-slate-400">/tháng</span>
          </div>
          <ul className="space-y-4 mb-8">
            <li className="flex items-center gap-3">
              <Check size={18} className="text-blue-400" /> Không giới hạn tài
              liệu
            </li>
            <li className="flex items-center gap-3">
              <Check size={18} className="text-blue-400" /> File lên tới 100MB
            </li>
            <li className="flex items-center gap-3">
              <Check size={18} className="text-blue-400" /> Tốc độ ưu tiên
            </li>
            <li className="flex items-center gap-3">
              <Sparkles size={18} className="text-yellow-400" />
              <strong>Tích hợp Gemini AI</strong>
            </li>
          </ul>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectPlan("pro");
            }}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-900/50"
          >
            Nâng cấp ngay
          </button>
        </div>
      </div>
    </div>
  );
}
