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

import { useAuth } from "../auth/AuthContext";

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
  const plans = [
    {
      name: "Starter",
      price: "0đ",
      period: "/tháng",
      features: ["10 Tài liệu/tháng", "AI Credits cơ bản", "Hỗ trợ qua Email"],
      current: true,
    },
    {
      name: "Pro",
      price: "199k",
      period: "/tháng",
      features: [
        "Không giới hạn tài liệu",
        "AI Credits cao cấp",
        "Ưu tiên xử lý",
        "Xuất PDF/Docx",
      ],
      popular: true,
    },
    {
      name: "Business",
      price: "Liên hệ",
      period: "",
      features: ["API Access", "SSO Login", "Quản lý team", "Hỗ trợ 24/7"],
    },
  ];

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-xl border p-6 flex flex-col ${
              plan.popular
                ? "border-blue-500 bg-blue-50/50 shadow-md"
                : "border-slate-200 bg-white shadow-sm"
            }`}
          >
            {plan.popular && (
              <span className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                Phổ biến
              </span>
            )}
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl font-bold text-slate-900">
                  {plan.price}
                </span>
                <span className="text-slate-500 text-sm">{plan.period}</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((feat) => (
                <li key={feat} className="flex items-center gap-2 text-sm text-slate-600">
                  <Check size={16} className="text-emerald-600" /> {feat}
                </li>
              ))}
            </ul>
            <button
              className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all ${
                plan.current
                  ? "bg-slate-100 text-slate-500 cursor-default"
                  : plan.popular
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {plan.current ? "Đang sử dụng" : "Nâng cấp ngay"}
            </button>
          </div>
        ))}
      </div>

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
  const { email, role, refresh, logout } = useAuth();
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
                    Gói Free
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
                  <span className="font-bold">0/50</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full w-[0%]" />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">AI Credits</span>
                  <span className="font-bold">0/1000</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full w-[0%]" />
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
          {activeTab === "subscription" && <SubscriptionTab />}
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
