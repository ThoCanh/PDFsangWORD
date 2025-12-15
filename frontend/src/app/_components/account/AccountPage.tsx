"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Bell,
  Camera,
  Check,
  CheckCircle,
  CreditCard,
  Download,
  FileText,
  Loader2,
  LogOut,
  Moon,
  Save,
  Settings,
  Shield,
  Trash2,
  User,
  X,
  Globe,
} from "lucide-react";

import { BACKEND_URL } from "../../_config/app";
import { useAuth } from "../auth/AuthContext";
import { getAccessToken } from "../auth/token";

type TabKey = "profile" | "subscription" | "settings";
type SaveStatus = "idle" | "saving";
type ToastType = "success" | "error";

type ToastState = { message: string; type: ToastType } | null;

type ProfileForm = {
  displayName: string;
  jobTitle: string;
  bio: string;
  email: string;
  role: string;
  notifications: boolean;
  twoFactor: boolean;
};

function getInitialsFromEmail(email: string | null) {
  if (!email) return "U";
  const left = email.split("@")[0]?.trim();
  if (!left) return "U";
  return left.charAt(0).toUpperCase();
}

function inferDisplayName(email: string | null) {
  if (!email) return "Người dùng";
  const left = email.split("@")[0]?.trim();
  return left || "Người dùng";
}

function storageKeyFor(email: string | null) {
  return `docuflowai:account:v1:${email ?? "unknown"}`;
}

function Toast({ message, type, onClose }: { message: string; type: ToastType; onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, 3000);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  const styles =
    type === "success"
      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
      : "bg-rose-50 border-rose-200 text-rose-800";

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-bottom-5 fade-in duration-300 ${styles}`}
      role="status"
      aria-live="polite"
    >
      {type === "success" ? (
        <CheckCircle size={18} className="text-emerald-600" />
      ) : (
        <AlertCircle size={18} className="text-rose-600" />
      )}
      <span className="font-medium text-sm">{message}</span>
      <button onClick={onClose} className="ml-1" aria-label="Close toast">
        <X size={16} />
      </button>
    </div>
  );
}

function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-slate-50 p-8 animate-pulse">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 h-96 bg-slate-200 rounded-xl" />
        <div className="flex-1 space-y-6">
          <div className="h-10 w-48 bg-slate-200 rounded" />
          <div className="h-64 bg-slate-200 rounded-xl" />
          <div className="h-48 bg-slate-200 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function ProfileTab({
  formData,
  setFormData,
  isEditing,
  setIsEditing,
  handleSave,
  saveStatus,
}: {
  formData: ProfileForm;
  setFormData: React.Dispatch<React.SetStateAction<ProfileForm>>;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  handleSave: () => void;
  saveStatus: SaveStatus;
}) {
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Hồ sơ cá nhân
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Quản lý thông tin hiển thị và bảo mật.
          </p>
        </div>
        <div className="flex gap-3">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-5 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg shadow-sm hover:bg-slate-50 transition-all"
            >
              Chỉnh sửa
            </button>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-5 py-2 bg-white border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                disabled={saveStatus === "saving"}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 transition-all disabled:opacity-70"
              >
                {saveStatus === "saving" ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                Lưu
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 flex flex-col md:flex-row gap-8 items-start">
          <div className="flex flex-col items-center gap-4 mx-auto md:mx-0">
            <div className="relative group cursor-pointer">
              <div className="h-32 w-32 rounded-full border-4 border-white bg-slate-100 shadow-lg flex items-center justify-center text-4xl font-bold text-slate-400">
                {formData.displayName
                  ? formData.displayName.charAt(0).toUpperCase()
                  : "U"}
              </div>
              {isEditing && (
                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center text-white">
                  <Camera size={24} />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Họ và tên
              </label>
              <input
                type="text"
                name="displayName"
                disabled={!isEditing}
                value={formData.displayName}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-all outline-none ${
                  isEditing
                    ? "border-slate-300 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    : "border-transparent bg-transparent px-0 font-medium"
                }`}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">
                Chức danh
              </label>
              <input
                type="text"
                name="jobTitle"
                disabled={!isEditing}
                value={formData.jobTitle}
                onChange={handleChange}
                placeholder="VD: Content Creator"
                className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-all outline-none ${
                  isEditing
                    ? "border-slate-300 shadow-sm focus:border-blue-500"
                    : "border-transparent bg-transparent px-0"
                }`}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-semibold text-slate-700">
                Email
              </label>
              <input
                type="email"
                disabled
                value={formData.email}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-semibold text-slate-700">
                Vai trò
              </label>
              <input
                type="text"
                disabled
                value={formData.role}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-sm font-semibold text-slate-700">Bio</label>
              <textarea
                name="bio"
                rows={3}
                disabled={!isEditing}
                value={formData.bio}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-all outline-none resize-none ${
                  isEditing
                    ? "border-slate-300 shadow-sm focus:border-blue-500"
                    : "border-transparent bg-transparent px-0"
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Bell size={18} className="text-slate-400" /> Thông báo
          </h3>
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium text-slate-700">Email Marketing</p>
              <p className="text-slate-500 text-xs">Tin tức cập nhật.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="notifications"
                checked={!!formData.notifications}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 space-y-4">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Shield size={18} className="text-slate-400" /> Bảo mật
          </h3>
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium text-slate-700">2FA</p>
              <p className="text-slate-500 text-xs">Xác thực 2 lớp.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="twoFactor"
                checked={!!formData.twoFactor}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function SubscriptionTab() {
  return null;
}

type BillingPlan = {
  id: number;
  name: string;
  price_vnd: number;
  billing_cycle: string;
  doc_limit_per_month: number;
  features: string[];
  notes: string | null;
};

function formatPrice(vnd: number) {
  try {
    return new Intl.NumberFormat("vi-VN").format(vnd) + "đ";
  } catch {
    return String(vnd) + "đ";
  }
}

function formatCycle(cycle: string) {
  const c = (cycle || "").toLowerCase();
  if (c === "month") return "/tháng";
  if (c === "year") return "/năm";
  if (c === "lifetime") return "";
  return c ? `/${cycle}` : "";
}

function isContactPlanName(name: string) {
  const n = (name || "").trim().toLowerCase();
  return n === "liên hệ" || n === "lien he" || n === "lien hệ";
}

function SubscriptionTabDynamic({
  plans,
  planKey,
  loading,
  error,
}: {
  plans: BillingPlan[];
  planKey: string | null;
  loading: boolean;
  error: string | null;
}) {
  const router = useRouter();
  const cards = useMemo(() => {
    const sorted = plans.slice().sort((a, b) => {
      const aContact = isContactPlanName(a.name);
      const bContact = isContactPlanName(b.name);
      if (aContact && !bContact) return 1;
      if (!aContact && bContact) return -1;
      return (a.price_vnd ?? 0) - (b.price_vnd ?? 0);
    });
    return sorted;
  }, [plans]);

  const currentPlanId = useMemo(() => {
    if (planKey && planKey.startsWith("plan:")) {
      const id = Number(planKey.split(":", 2)[1]);
      return Number.isFinite(id) ? id : null;
    }

    if (planKey === "free" || !planKey) {
      const freeCandidate = cards.find((p) => !isContactPlanName(p.name) && (p.price_vnd ?? 0) === 0);
      return freeCandidate ? freeCandidate.id : null;
    }

    return null;
  }, [cards, planKey]);

  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);

  useEffect(() => {
    // Default selection follows the currently active plan.
    setSelectedPlanId(currentPlanId);
  }, [currentPlanId]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Gói đăng ký
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Nâng cấp để mở khóa thêm tính năng.
        </p>
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 text-slate-500">
          Đang tải danh sách gói…
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 text-rose-600">
          {error}
        </div>
      ) : (
        <div className="w-full max-w-4xl mx-auto grid md:grid-cols-2 gap-8">
          {cards.map((plan) => {
            const contact = isContactPlanName(plan.name);
            const isCurrent = currentPlanId != null && plan.id === currentPlanId;
            const isFree = (plan.price_vnd ?? 0) === 0;
            const isPaid = !isFree;
            const isSelected = selectedPlanId != null && plan.id === selectedPlanId;

            const cardClass = isPaid
              ? `bg-slate-900 text-white p-8 rounded-2xl shadow-xl relative overflow-hidden cursor-pointer transition ${
                  isSelected ? "ring-2 ring-blue-400 scale-[1.01]" : ""
                }`
              : `bg-white p-8 rounded-2xl border shadow-sm transition-all hover:shadow-md cursor-pointer ${
                  isSelected
                    ? "border-blue-500 shadow-lg shadow-blue-100 scale-[1.01]"
                    : "border-slate-200"
                }`;

            const titleClass = isPaid
              ? "text-lg font-medium text-blue-200 mb-2"
              : "text-lg font-medium text-slate-700 mb-2";

            const priceClass = isPaid
              ? "text-4xl font-bold mb-6"
              : "text-4xl font-bold text-slate-800 mb-6";

            const priceUnitClass = "text-sm font-normal text-slate-400";

            const okIconClass = isPaid ? "text-blue-400" : "text-green-500";
            const okTextClass = isPaid ? "text-white" : "text-slate-600";

            const buttonClass = isPaid
              ? "w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-900/50"
              : isCurrent
                ? "w-full py-3 border border-slate-300 text-slate-400 font-semibold rounded-xl cursor-not-allowed"
                : "w-full py-3 border border-blue-600 text-blue-600 font-semibold rounded-xl hover:bg-blue-50 active:scale-[0.99] transition duration-150";

            return (
              <div
                key={`plan:${plan.id}`}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedPlanId(plan.id)}
                onKeyDown={(e) => e.key === "Enter" && setSelectedPlanId(plan.id)}
                className={cardClass}
              >
                <div className={titleClass}>{plan.name}</div>
                <div className={priceClass}>
                  {contact ? "Liên hệ" : formatPrice(plan.price_vnd ?? 0)}
                  {contact ? null : (
                    <span className={priceUnitClass}>{formatCycle(plan.billing_cycle)}</span>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  <li className={`flex items-center gap-3 ${okTextClass}`}>
                    <Check size={18} className={okIconClass} /> {plan.doc_limit_per_month ?? 0} tài liệu/tháng
                  </li>

                  {(Array.isArray(plan.features) ? plan.features : []).map((feat) => (
                    <li key={feat} className={`flex items-center gap-3 ${okTextClass}`}>
                      <Check size={18} className={okIconClass} /> {feat}
                    </li>
                  ))}

                  {plan.notes?.trim() ? (
                    <li className={`flex items-center gap-3 ${okTextClass}`}>
                      <Check size={18} className={okIconClass} /> {plan.notes.trim()}
                    </li>
                  ) : null}
                </ul>

                <button
                  className={buttonClass}
                  disabled={isCurrent}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlanId(plan.id);
                    if (!isCurrent) router.push(`/payment/${encodeURIComponent(plan.name)}`);
                  }}
                >
                  {isCurrent ? "Đang sử dụng" : "Nâng cấp ngay"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="font-semibold text-slate-800">Lịch sử thanh toán</h3>
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-500 uppercase bg-slate-50">
              <tr>
                <th className="px-6 py-3">Ngày</th>
                <th className="px-6 py-3">Mô tả</th>
                <th className="px-6 py-3">Số tiền</th>
                <th className="px-6 py-3">Trạng thái</th>
                <th className="px-6 py-3">Hóa đơn</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-white border-b hover:bg-slate-50">
                <td className="px-6 py-4">01/10/2023</td>
                <td className="px-6 py-4 font-medium text-slate-900">
                  DocuFlowAI Pro (Monthly)
                </td>
                <td className="px-6 py-4">199.000đ</td>
                <td className="px-6 py-4">
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-xs">
                    Thành công
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="text-blue-600 hover:text-blue-800" aria-label="Download invoice">
                    <Download size={16} />
                  </button>
                </td>
              </tr>
              <tr className="bg-white">
                <td
                  colSpan={5}
                  className="px-6 py-4 text-center text-slate-400 italic"
                >
                  Không có giao dịch nào khác.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({
  language,
  setLanguage,
  appearance,
  setAppearance,
  exportFormat,
  setExportFormat,
  onDangerAction,
}: {
  language: "vi" | "en";
  setLanguage: (v: "vi" | "en") => void;
  appearance: "light" | "dark" | "system";
  setAppearance: (v: "light" | "dark" | "system") => void;
  exportFormat: "pdf" | "docx";
  setExportFormat: (v: "pdf" | "docx") => void;
  onDangerAction: () => void;
}) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Cài đặt chung
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Tùy chỉnh trải nghiệm DocuFlowAI của bạn.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100">
        <div className="p-6 flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex gap-4">
            <div className="p-2 bg-blue-50 rounded-lg h-fit text-blue-600">
              <Globe size={20} />
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Ngôn ngữ & Khu vực</h3>
              <p className="text-sm text-slate-500 mt-1">
                Chọn ngôn ngữ hiển thị.
              </p>
            </div>
          </div>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "vi" | "en")}
            className="bg-slate-50 border border-slate-300 text-slate-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full sm:w-48 p-2.5 outline-none"
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="p-6 flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex gap-4">
            <div className="p-2 bg-purple-50 rounded-lg h-fit text-purple-600">
              <Moon size={20} />
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Giao diện</h3>
              <p className="text-sm text-slate-500 mt-1">
                Chọn giao diện sáng/tối/hệ thống.
              </p>
            </div>
          </div>
          <div className="flex bg-slate-100 p-1 rounded-lg w-fit h-fit">
            <button
              onClick={() => setAppearance("light")}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                appearance === "light"
                  ? "bg-white text-slate-800 shadow"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Sáng
            </button>
            <button
              onClick={() => setAppearance("dark")}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                appearance === "dark"
                  ? "bg-white text-slate-800 shadow"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Tối
            </button>
            <button
              onClick={() => setAppearance("system")}
              className={`px-3 py-1.5 rounded text-sm font-medium ${
                appearance === "system"
                  ? "bg-white text-slate-800 shadow"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Hệ thống
            </button>
          </div>
        </div>

        <div className="p-6 flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex gap-4">
            <div className="p-2 bg-orange-50 rounded-lg h-fit text-orange-600">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-medium text-slate-900">Định dạng xuất mặc định</h3>
              <p className="text-sm text-slate-500 mt-1">
                Định dạng file khi tải xuống.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="export"
                className="accent-blue-600"
                checked={exportFormat === "pdf"}
                onChange={() => setExportFormat("pdf")}
              />
              PDF
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name="export"
                className="accent-blue-600"
                checked={exportFormat === "docx"}
                onChange={() => setExportFormat("docx")}
              />
              Word (DOCX)
            </label>
          </div>
        </div>
      </div>

      <div className="border border-rose-200 rounded-xl overflow-hidden bg-rose-50/30">
        <div className="p-6">
          <h3 className="text-rose-700 font-bold flex items-center gap-2 mb-2">
            <AlertCircle size={20} /> Khu vực nguy hiểm
          </h3>
          <p className="text-sm text-rose-600 mb-6">
            Các hành động dưới đây không thể hoàn tác. Hãy cẩn thận.
          </p>

          <div className="flex items-center justify-between py-4 border-t border-rose-100">
            <div>
              <h4 className="text-sm font-bold text-slate-800">Xóa tài khoản</h4>
              <p className="text-xs text-slate-500">
                Chức năng này hiện chưa được hỗ trợ trên backend.
              </p>
            </div>
            <button
              onClick={onDangerAction}
              className="px-4 py-2 bg-white border border-rose-200 text-rose-600 text-sm font-medium rounded-lg hover:bg-rose-600 hover:text-white transition-colors flex items-center gap-2"
            >
              <Trash2 size={16} /> Xóa tài khoản
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { email, role, planKey, refresh, logout } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [language, setLanguage] = useState<"vi" | "en">("vi");
  const [appearance, setAppearance] = useState<"light" | "dark" | "system">(
    "system"
  );
  const [exportFormat, setExportFormat] = useState<"pdf" | "docx">("pdf");

  const fallbackDisplayName = useMemo(() => inferDisplayName(email), [email]);
  const storageKey = useMemo(() => storageKeyFor(email), [email]);

  const [formData, setFormData] = useState<ProfileForm>({
    displayName: "",
    jobTitle: "",
    bio: "",
    email: "",
    role: "",
    notifications: true,
    twoFactor: false,
  });

  useEffect(() => {
    refresh();
  }, [refresh]);

  const [billingPlans, setBillingPlans] = useState<BillingPlan[]>([]);
  const [billingPlansLoading, setBillingPlansLoading] = useState(false);
  const [billingPlansError, setBillingPlansError] = useState<string | null>(null);

  const [usageUsed, setUsageUsed] = useState<number>(0);
  const [usageLimit, setUsageLimit] = useState<number>(0);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageLoadedFromServer, setUsageLoadedFromServer] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadPlans() {
      setBillingPlansLoading(true);
      setBillingPlansError(null);
      try {
        const res = await fetch(`${BACKEND_URL}/plans`);
        if (!res.ok) throw new Error(`Không thể tải danh sách gói (${res.status}).`);
        const data = (await res.json()) as unknown;
        const next = Array.isArray(data) ? (data as BillingPlan[]) : [];
        if (!cancelled) setBillingPlans(next);
      } catch (e: unknown) {
        if (!cancelled) setBillingPlansError(e instanceof Error ? e.message : "Không thể tải danh sách gói");
      } finally {
        if (!cancelled) setBillingPlansLoading(false);
      }
    }

    void loadPlans();
    return () => {
      cancelled = true;
    };
  }, []);

  const fallbackDocLimit = useMemo(() => {
    // Use the same plan list shown to the user as a fallback source of truth.
    if (planKey && planKey.startsWith("plan:")) {
      const id = Number(planKey.split(":", 2)[1]);
      if (Number.isFinite(id)) {
        const found = billingPlans.find((p) => p.id === id);
        return typeof found?.doc_limit_per_month === "number" ? found.doc_limit_per_month : 0;
      }
      return 0;
    }

    // Free plan: pick the 0đ, non-contact plan.
    const free = billingPlans
      .slice()
      .sort((a, b) => (a.price_vnd ?? 0) - (b.price_vnd ?? 0))
      .find((p) => !isContactPlanName(p.name) && (p.price_vnd ?? 0) === 0);
    return typeof free?.doc_limit_per_month === "number" ? free.doc_limit_per_month : 0;
  }, [billingPlans, planKey]);

  useEffect(() => {
    // Avoid showing 0/0 before server usage is fetched.
    if (usageLoadedFromServer) return;
    if (fallbackDocLimit > 0) setUsageLimit(fallbackDocLimit);
  }, [fallbackDocLimit, usageLoadedFromServer]);

  useEffect(() => {
    let cancelled = false;

    async function loadUsage() {
      if (!email) return;
      const token = getAccessToken();
      if (!token) return;

      setUsageLoading(true);
      try {
        const res = await fetch(`${BACKEND_URL}/convert/usage`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) return;
        const data = (await res.json()) as unknown;
        const used = typeof (data as any)?.used === "number" ? (data as any).used : 0;
        const limit = typeof (data as any)?.limit === "number" ? (data as any).limit : 0;
        if (!cancelled) {
          setUsageUsed(used);
          setUsageLimit(limit);
          setUsageLoadedFromServer(true);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setUsageLoading(false);
      }
    }

    void loadUsage();
    return () => {
      cancelled = true;
    };
  }, [email, planKey]);

  const usagePercent = useMemo(() => {
    if (!usageLimit || usageLimit <= 0) return 0;
    return Math.min(100, Math.max(0, (usageUsed / usageLimit) * 100));
  }, [usageLimit, usageUsed]);

  const usageBarClass = useMemo(() => {
    if (usagePercent >= 90) return "bg-rose-500";
    if (usagePercent >= 80) return "bg-amber-500";
    return "bg-blue-500";
  }, [usagePercent]);

  const currentPlanLabel = useMemo(() => {
    if (!planKey || planKey === "free") {
      const free = billingPlans
        .slice()
        .sort((a, b) => (a.price_vnd ?? 0) - (b.price_vnd ?? 0))
        .find((p) => !isContactPlanName(p.name) && (p.price_vnd ?? 0) === 0);
      return free?.name || "Free";
    }
    if (planKey.startsWith("plan:")) {
      const id = Number(planKey.split(":", 2)[1]);
      if (!Number.isFinite(id)) return "Không xác định";
      const found = billingPlans.find((p) => p.id === id);
      return found?.name || "Không xác định";
    }
    return "Free";
  }, [billingPlans, planKey]);

  useEffect(() => {
    // Load persisted profile/settings
    if (!email) return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ProfileForm> & {
          language?: "vi" | "en";
          appearance?: "light" | "dark" | "system";
          exportFormat?: "pdf" | "docx";
        };
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.appearance) setAppearance(parsed.appearance);
        if (parsed.exportFormat) setExportFormat(parsed.exportFormat);
        setFormData((prev) => ({
          ...prev,
          ...parsed,
          email,
          role: role ?? prev.role,
        }));
      }
    } catch {
      // ignore
    }
  }, [email, role, storageKey]);

  useEffect(() => {
    // Populate base identity fields
    if (!email) return;
    setFormData((prev) => ({
      ...prev,
      email,
      role: role ?? prev.role,
      displayName: prev.displayName || fallbackDisplayName,
    }));
  }, [email, role, fallbackDisplayName]);

  useEffect(() => {
    // Loading state: wait a moment for /auth/me to fill
    const t = window.setTimeout(() => {
      setLoading(false);
    }, 250);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    // Persist profile/settings changes (only after we have a stable email)
    if (!email) return;
    const payload = {
      ...formData,
      language,
      appearance,
      exportFormat,
    };
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [email, formData, language, appearance, exportFormat, storageKey]);

  const handleSave = () => {
    setSaveStatus("saving");
    window.setTimeout(() => {
      setSaveStatus("idle");
      setIsEditing(false);
      setToast({ message: "Đã lưu thành công!", type: "success" });
    }, 600);
  };

  const onDangerAction = () => {
    const ok = window.confirm(
      "Tính năng xóa tài khoản hiện chưa hỗ trợ. Bạn có muốn đăng xuất không?"
    );
    if (!ok) return;
    logout();
    setToast({ message: "Đã đăng xuất.", type: "success" });
    router.push("/");
  };

  if (loading) return <SkeletonLoader />;

  const avatarLetter = getInitialsFromEmail(email);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 bg-white/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="flex items-center gap-2 cursor-pointer"
            aria-label="Go to home"
          >
            <div className="bg-blue-600 p-1.5 rounded-lg text-white">
              <FileText size={22} />
            </div>
            <span className="font-bold text-xl text-slate-900">DocuFlowAI</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
              {avatarLetter}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-10 flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 flex-shrink-0 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden sticky top-24">
            <div className="p-6 bg-gradient-to-br from-blue-50/50 to-white border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-blue-200">
                  {formData.displayName
                    ? formData.displayName.charAt(0).toUpperCase()
                    : avatarLetter}
                </div>
                <div className="overflow-hidden">
                  <h2 className="font-bold text-slate-900 truncate">
                    {formData.displayName || fallbackDisplayName}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Gói {currentPlanLabel}
                  </p>
                </div>
              </div>
            </div>

            <nav className="p-2 space-y-1">
              {[
                { id: "profile" as const, icon: User, label: "Hồ sơ của tôi" },
                {
                  id: "subscription" as const,
                  icon: CreditCard,
                  label: "Gói đăng ký",
                },
                {
                  id: "settings" as const,
                  icon: Settings,
                  label: "Cài đặt chung",
                },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    activeTab === item.id
                      ? "bg-blue-50 text-blue-700 font-semibold shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <item.icon size={18} /> {item.label}
                </button>
              ))}
              <div className="h-px bg-slate-100 my-2 mx-2" />
              <button
                onClick={() => {
                  logout();
                  setToast({ message: "Đã đăng xuất.", type: "success" });
                  router.push("/");
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
              >
                <LogOut size={18} /> Đăng xuất
              </button>
            </nav>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 sticky top-[380px]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
              Thống kê sử dụng
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">Tài liệu</span>
                  <span className="font-bold">
                    {usageLoading ? "…" : `${usageUsed}/${usageLimit}`}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div
                    className={`${usageBarClass} h-1.5 rounded-full`}
                    style={{ width: `${usagePercent}%` }}
                  />
                </div>
              </div>
            </div>
            {activeTab !== "subscription" && (
              <button
                onClick={() => setActiveTab("subscription")}
                className="w-full mt-4 py-2 border border-blue-200 text-blue-600 text-xs font-bold rounded-lg hover:bg-blue-50 transition-all"
              >
                Nâng cấp Pro
              </button>
            )}
          </div>
        </aside>

        <main className="flex-1">
          {activeTab === "profile" && (
            <ProfileTab
              formData={formData}
              setFormData={setFormData}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              handleSave={handleSave}
              saveStatus={saveStatus}
            />
          )}
          {activeTab === "subscription" && (
            <SubscriptionTabDynamic
              plans={billingPlans}
              planKey={planKey}
              loading={billingPlansLoading}
              error={billingPlansError}
            />
          )}
          {activeTab === "settings" && (
            <SettingsTab
              language={language}
              setLanguage={setLanguage}
              appearance={appearance}
              setAppearance={setAppearance}
              exportFormat={exportFormat}
              setExportFormat={setExportFormat}
              onDangerAction={() => {
                setToast({
                  message: "Chức năng xóa tài khoản chưa hỗ trợ.",
                  type: "error",
                });
                onDangerAction();
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}
