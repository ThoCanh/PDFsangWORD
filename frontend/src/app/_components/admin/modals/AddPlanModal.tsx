"use client";

import React from "react";
import { CheckSquare as CheckSquareIcon, PackagePlus, Save, X } from "lucide-react";

import { BACKEND_URL } from "../../../_config/app";
import { getAccessToken } from "../../auth/token";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
};

const FEATURES = [
  "Công nghệ AI OCR nâng cao",
  "Chuyển PDF sang Word/Excel",
  "Trích xuất bảng biểu (Tables)",
  "Nhận diện chữ viết tay",
  "API Key Access",
  "Hỗ trợ ưu tiên 24/7",
];

export default function AddPlanModal({ isOpen, onClose, onSave }: Props) {
  const [name, setName] = React.useState("");
  const [priceVnd, setPriceVnd] = React.useState<string>("");
  const [billingCycle, setBillingCycle] = React.useState<"month" | "year" | "lifetime">(
    "month",
  );
  const [docLimitPerMonth, setDocLimitPerMonth] = React.useState<string>("1000");
  const [notes, setNotes] = React.useState("");
  const [features, setFeatures] = React.useState<string[]>(() => FEATURES.slice(0, 2));
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    setName("");
    setPriceVnd("");
    setBillingCycle("month");
    setDocLimitPerMonth("1000");
    setNotes("");
    setFeatures(FEATURES.slice(0, 2));
    setError(null);
    setSaving(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleFeature = (feature: string) => {
    setFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature],
    );
  };

  const submit = async () => {
    setError(null);

    const token = getAccessToken();
    if (!token) {
      setError("Bạn chưa đăng nhập.");
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Vui lòng nhập tên gói.");
      return;
    }

    const price = priceVnd.trim() === "" ? 0 : Number(priceVnd);
    const limit = Number(docLimitPerMonth);
    if (!Number.isFinite(price) || price < 0) {
      setError("Giá (VNĐ) không hợp lệ.");
      return;
    }
    if (!Number.isFinite(limit) || limit < 0) {
      setError("Giới hạn tài liệu/tháng không hợp lệ.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/admin/plans`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: trimmedName,
          price_vnd: Math.trunc(price),
          billing_cycle: billingCycle,
          doc_limit_per_month: Math.trunc(limit),
          features,
          notes: notes.trim() ? notes.trim() : null,
        }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        setError(msg || "Tạo gói thất bại.");
        return;
      }

      onSave();
      onClose();
    } catch {
      setError("Không thể kết nối backend.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800 flex items-center">
            <PackagePlus size={20} className="mr-2 text-indigo-600" /> Tạo Gói
            Dịch Vụ Mới
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tên Gói
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Pro Plus, Enterprise..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Giá (VNĐ)
              </label>
              <input
                type="number"
                placeholder="500000"
                value={priceVnd}
                onChange={(e) => setPriceVnd(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Chu kỳ
              </label>
              <select
                value={billingCycle}
                onChange={(e) => setBillingCycle(e.target.value as typeof billingCycle)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="month">Tháng</option>
                <option value="year">Năm</option>
                <option value="lifetime">Vĩnh viễn</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Giới hạn tài liệu/tháng
            </label>
            <input
              type="number"
              value={docLimitPerMonth}
              onChange={(e) => setDocLimitPerMonth(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
              <CheckSquareIcon size={16} className="mr-1.5 text-slate-500" />
              Tính năng & Quyền hạn
            </label>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3">
              {FEATURES.map((feature, idx) => (
                <label
                  key={idx}
                  className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-slate-100 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 accent-indigo-600"
                    checked={features.includes(feature)}
                    onChange={() => toggleFeature(feature)}
                  />
                  <span className="text-sm text-slate-700">{feature}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Mô tả khác (Ghi chú)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Nhập thêm ghi chú về gói..."
            />
          </div>

          {error ? (
            <div className="text-sm text-rose-600 font-medium">{error}</div>
          ) : null}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end space-x-3 mt-auto">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            onClick={() => {
              if (!saving) void submit();
            }}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-md transition-colors flex items-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Save size={16} className="mr-2" /> Lưu gói mới
          </button>
        </div>
      </div>
    </div>
  );
}
