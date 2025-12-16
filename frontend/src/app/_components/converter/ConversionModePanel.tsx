"use client";

import React, { useEffect, useState } from "react";
import { X, CheckCircle, Bot, Camera } from "lucide-react";

type Mode = "auto" | "ocr" | "tier-a";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (mode: Mode) => void;
  initial?: Mode;
}

export default function ConversionModePanel({ visible, onClose, onSelect, initial }: Props) {
  const [selected, setSelected] = useState<Mode>(initial ?? "auto");
  const [show, setShow] = useState<boolean>(visible);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setShow(visible);
  }, [visible]);

  // Normalize initial selection: if initial is 'tier-a' we show the AUTO option selected (AUTO acts as Tier A)
  useEffect(() => {
    if (!initial) return;
    setSelected(initial === "tier-a" ? "auto" : initial);
  }, [initial]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  function handleSelect(mode: Mode) {
    // Map AUTO selection to Tier A for paid users (AUTO acts as Tier A as requested)
    const effectiveMode = mode === "auto" ? "tier-a" : mode;
    setSelected(mode);
    setToast(effectiveMode === "tier-a" ? "Đã chọn Chế độ chuyển đổi: tier-a" : "Đã chọn Chế độ chuyển PDF(SCAN) sang Word văn bản");
    onSelect(effectiveMode as Mode);
    setTimeout(() => {
      onClose();
    }, 700);
  }

  if (!show) return null;

  return (
    <div className="fixed top-5 right-5 w-full max-w-md z-50 animate-slide-in">
      <div className="bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bot className="text-white" />
            <h3 className="text-white font-semibold text-lg">Chọn chế độ chuyển</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition p-1 hover:bg-white/10 rounded-full">
            <X className="text-xl" />
          </button>
        </div>

        <div className="p-4 space-y-3 bg-white">
          <div onClick={() => handleSelect("auto")} className={`group cursor-pointer relative border ${selected === "auto" ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-200"} rounded-lg p-4 transition-all duration-300 hover:border-blue-500 hover:bg-blue-50 custom-hover`}>
            <span className="absolute top-0 right-0 -mt-2 -mr-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm badge-pulse uppercase">Khuyên dùng</span>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                <Bot />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-base mb-1 group-hover:text-blue-700 transition-colors">Chế độ chuyển đổi: tier-a</h4>
                <p className="text-sm text-gray-600 leading-relaxed">Chế độ này gửi scan gốc để Adobe nhận diện Tiếng Việt, giữ font, layout và con dấu tốt nhất.</p>
              </div>
            </div>
            <div className="absolute bottom-4 right-4 text-blue-600">
              {selected === "auto" ? <CheckCircle className="text-xl" /> : null}
            </div>
          </div>

          <div onClick={() => handleSelect("ocr")} className={`group cursor-pointer relative border ${selected === "ocr" ? "border-purple-500 ring-2 ring-purple-200" : "border-gray-200"} rounded-lg p-4 transition-all duration-300 hover:border-purple-500 hover:bg-purple-50 custom-hover`}>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xl group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                <Camera />
              </div>
              <div>
                <h4 className="font-bold text-gray-800 text-base mb-1 group-hover:text-purple-700 transition-colors">Chế độ chuyển PDF(SCAN) sang Word văn bản</h4>
                <p className="text-sm text-gray-600 leading-relaxed">Chế độ OCR chuyên chuyển PDF dạng ảnh (scan) thành Word dạng văn bản để có thể chỉnh sửa.</p>
              </div>
            </div>
            <div className="absolute bottom-4 right-4 text-purple-600">
              {selected === "ocr" ? <CheckCircle className="text-xl" /> : null}
            </div>
          </div>


        </div>

        <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium hover:bg-gray-200 rounded transition">Đóng</button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-full shadow-xl transition-all duration-300 z-[60] flex items-center gap-3">
          <CheckCircle className="text-green-400" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
