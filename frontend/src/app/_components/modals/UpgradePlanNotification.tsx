"use client";

import React from "react";
import { CheckCircle2, ShieldCheck, X, Zap } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
  title?: string;
  message?: string;
  proBenefits?: string[];
};

const DEFAULT_BENEFITS = [
  "Phân tích AI không giới hạn",
  "Xuất file định dạng cao cấp",
];

export default function UpgradePlanNotification({
  isOpen,
  onClose,
  onUpgrade,
  title = "Giới hạn gói cước",
  message =
    "Bạn đang sử dụng gói Free nên không thể sử dụng chức năng này.\n\nVui lòng nâng cấp để tiếp tục.",
  proBenefits = DEFAULT_BENEFITS,
}: Props) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-scale-up"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-purple-500" />

        <div className="relative px-6 pt-6 pb-5">
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close"
            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="text-amber-600 text-xl font-semibold">🔒</span>
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            <p className="mt-2 text-slate-600 whitespace-pre-line">{message}</p>

            <div className="mt-5 w-full rounded-xl border border-slate-100 bg-slate-50 p-4 text-left">
              <div className="text-xs font-semibold tracking-wide text-slate-500">
                QUYỀN LỢI GÓI PRO:
              </div>
              <div className="mt-3 space-y-2">
                {proBenefits.map((b) => (
                  <div key={b} className="flex items-start gap-2 text-slate-800">
                    <CheckCircle2 size={18} className="mt-0.5 text-emerald-600" />
                    <div className="text-sm">{b}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 w-full">
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onUpgrade?.();
                }}
                className="w-full py-3 rounded-xl text-white font-semibold shadow-md transition-colors bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 flex items-center justify-center gap-2"
              >
                <Zap size={18} /> Nâng cấp ngay
              </button>

              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClose();
                }}
                className="w-full mt-3 py-2.5 text-slate-600 font-medium hover:text-slate-800 transition-colors"
              >
                Để sau
              </button>

              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-400">
                <ShieldCheck size={14} /> Thanh toán an toàn &amp; bảo mật
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
