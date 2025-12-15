"use client";

import React from "react";
import { CheckSquare as CheckSquareIcon, PackagePlus, Save, X } from "lucide-react";

import { BACKEND_URL } from "../../../_config/app";
import { TOOL_CONFIG, type ToolKey } from "../../../_config/tools";
import { getAccessToken } from "../../auth/token";

type PlanForEdit = {
  id: number;
  name: string;
  price_vnd: number;
  billing_cycle: "month" | "year" | "lifetime" | string;
  doc_limit_per_month: number;
  features: string[];
  tools: string[];
  notes: string | null;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  initialPlan?: PlanForEdit | null;
};

const FEATURES = [
  "Công nghệ OCR nâng cao",
  "JPG sang PNG",
  "Word sang PDF",
  "Nhận diện chữ viết tay",
];

const PERMISSIONS = [
  "Tích hợp AI",
  "Tốc độ ưu tiên",
  "Hỗ trợ 24/7",
];

const TOOL_KEYS: ToolKey[] = ["pdf-word", "jpg-png", "word-pdf"];

export default function AddPlanModal({ isOpen, onClose, onSave, initialPlan }: Props) {
  const [name, setName] = React.useState("");
  const [priceVnd, setPriceVnd] = React.useState<string>("");
  const [billingCycle, setBillingCycle] = React.useState<"month" | "year" | "lifetime">(
    "month",
  );
  const [docLimitPerMonth, setDocLimitPerMonth] = React.useState<string>("1000");
  const [notes, setNotes] = React.useState("");
  const [features, setFeatures] = React.useState<string[]>([]);
  const [tools, setTools] = React.useState<ToolKey[]>(TOOL_KEYS);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    if (initialPlan) {
      setName(initialPlan.name ?? "");
      setPriceVnd(String(initialPlan.price_vnd ?? 0));
      const cycle = (initialPlan.billing_cycle || "month") as typeof billingCycle;
      setBillingCycle(cycle === "year" || cycle === "lifetime" ? cycle : "month");
      setDocLimitPerMonth(String(initialPlan.doc_limit_per_month ?? 1000));
      setNotes(initialPlan.notes ?? "");
      setFeatures(Array.isArray(initialPlan.features) ? initialPlan.features : []);
      const rawTools = (initialPlan as unknown as { tools?: unknown }).tools;
      if (Array.isArray(rawTools)) {
        const normalized = rawTools.map((t) => String(t)) as ToolKey[];
        const next = TOOL_KEYS.filter((k) => normalized.includes(k));
        setTools(next);
      } else {
        setTools(TOOL_KEYS);
      }
    } else {
      setName("");
      setPriceVnd("");
      setBillingCycle("month");
      setDocLimitPerMonth("1000");
      setNotes("");
      setFeatures([]);
      setTools(TOOL_KEYS);
    }
    setError(null);
    setSaving(false);
  }, [isOpen, initialPlan?.id]);

  if (!isOpen) return null;

  const toggleFeature = (feature: string) => {
    setFeatures((prev) =>
      prev.includes(feature) ? prev.filter((f) => f !== feature) : [...prev, feature],
    );
  };

  const toggleTool = (tool: ToolKey) => {
    setTools((prev) => (prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]));
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
      const url = initialPlan
        ? `${BACKEND_URL}/admin/plans/${initialPlan.id}`
        : `${BACKEND_URL}/admin/plans`;
      const method = initialPlan ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
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
          tools,
          notes: notes.trim() ? notes.trim() : null,
        }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        setError(msg || (initialPlan ? "Cập nhật gói thất bại." : "Tạo gói thất bại."));
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
            <PackagePlus size={20} className="mr-2 text-indigo-600" />
            {initialPlan ? "Chỉnh sửa gói" : "Tạo Gói Dịch Vụ Mới"}
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
              Chức năng sử dụng của gói
            </label>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3">
              {TOOL_KEYS.map((toolKey) => (
                <label
                  key={toolKey}
                  className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-slate-100 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 accent-indigo-600"
                    checked={tools.includes(toolKey)}
                    onChange={() => toggleTool(toolKey)}
                  />
                  <span className="text-sm text-slate-700">{TOOL_CONFIG[toolKey].title}</span>
                </label>
              ))}
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Số lần sử dụng các chức năng trong tháng sẽ theo “Giới hạn tài liệu/tháng”.
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center">
              <CheckSquareIcon size={16} className="mr-1.5 text-slate-500" />
              Tính năng
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
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Quyền hạn
            </label>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3">
              {PERMISSIONS.map((perm, idx) => (
                <label
                  key={idx}
                  className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-slate-100 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 accent-indigo-600"
                    checked={features.includes(perm)}
                    onChange={() => toggleFeature(perm)}
                  />
                  <span className="text-sm text-slate-700">{perm}</span>
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
            <Save size={16} className="mr-2" />
            {initialPlan ? "Lưu thay đổi" : "Lưu gói mới"}
          </button>
        </div>
      </div>
    </div>
  );
}
